<?php

namespace Tests\Feature;

use App\Models\Expedition;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\User;
use App\Models\Warehouse;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * T28.1 — Checkout Server-Authoritative (harga & subtotal).
 *
 * Membuktikan server menghitung ULANG `product_price` & `subtotal` dari DB
 * (harga produk/varian) dan MENGABAIKAN total nilai harga apa pun yang
 * dikirim oleh client (anti-tampering).
 */
class CheckoutTamperingTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Warehouse::create([
            'code' => 'GDG-TMP-01',
            'name' => 'Gudang Tampering',
            'address' => 'Jl. Tampering',
            'city' => 'Jakarta',
            'province' => 'DKI Jakarta',
            'is_primary' => true,
            'is_active' => true,
        ]);
    }

    public function test_client_supplied_item_price_and_subtotal_are_ignored(): void
    {
        $user = User::factory()->create();
        $product = Product::factory()->create([
            'name' => 'Jaket Tusko',
            'price' => 150000,
            'stock' => 10,
        ]);

        $response = $this->actingAs($user)->postJson('/api/checkout', [
            'items' => [
                [
                    'product_id' => $product->id,
                    'quantity' => 2,
                    // Nilai palsu dari client — wajib diabaikan total.
                    'product_price' => 1,
                    'price' => 1,
                    'subtotal' => 2,
                ],
            ],
            'recipient_name' => 'Pembeli Jujur',
            'phone' => '081200000001',
            'full_address' => 'Jl. Kejujuran No. 1',
            'expedition_name' => 'JNE',
            'expedition_service' => 'REG',
            'payment_method' => 'manual_transfer',
            'payment_channel' => 'manual_bca',
            'service_fee' => 0,
        ]);

        // Subtotal & harga satuan dihitung server dari DB: 150000 * 2 = 300000.
        $response->assertCreated()
            ->assertJsonPath('data.totals.subtotal', 300000)
            ->assertJsonPath('data.totals.grand_total', 300000)
            ->assertJsonPath('data.items.0.product_price', 150000)
            ->assertJsonPath('data.items.0.subtotal', 300000)
            ->assertJsonPath('data.items.0.quantity', 2);

        $orderNumber = $response->json('data.order_number');

        $this->assertDatabaseHas('orders', [
            'order_number' => $orderNumber,
            'subtotal' => 300000,
            'grand_total' => 300000,
        ]);

        $this->assertDatabaseHas('order_items', [
            'product_id' => $product->id,
            'product_price' => 150000,
            'quantity' => 2,
            'subtotal' => 300000,
        ]);
    }

    public function test_variant_price_from_database_is_used_and_client_price_ignored(): void
    {
        $user = User::factory()->create();
        $product = Product::factory()->create([
            'name' => 'Sepatu Lari Tusko',
            'price' => 200000,
            'stock' => 20,
        ]);
        $variant = ProductVariant::create([
            'product_id' => $product->id,
            'sku' => 'TSK-TMP-SHOE-42',
            'variant_name' => 'Hitam / 42',
            'price' => 175000,
            'weight_grams' => 800,
            'stock' => 5,
            'is_active' => true,
        ]);

        $response = $this->actingAs($user)->postJson('/api/checkout', [
            'items' => [
                [
                    'product_id' => $product->id,
                    'product_variant_id' => $variant->id,
                    'quantity' => 1,
                    // Harga palsu (jauh di bawah harga varian asli) — diabaikan.
                    'product_price' => 1000,
                    'subtotal' => 1000,
                ],
            ],
            'recipient_name' => 'Pembeli Varian',
            'phone' => '081200000002',
            'full_address' => 'Jl. Varian No. 2',
            'expedition_name' => 'SiCepat',
            'expedition_service' => 'REG',
            'payment_method' => 'manual_transfer',
            'payment_channel' => 'manual_bca',
            'service_fee' => 0,
        ]);

        // Harga otoritatif = harga varian dari DB (175000), bukan harga client.
        $response->assertCreated()
            ->assertJsonPath('data.totals.subtotal', 175000)
            ->assertJsonPath('data.items.0.product_price', 175000)
            ->assertJsonPath('data.items.0.subtotal', 175000);

        $this->assertDatabaseHas('order_items', [
            'product_id' => $product->id,
            'product_variant_id' => $variant->id,
            'product_price' => 175000,
            'quantity' => 1,
            'subtotal' => 175000,
        ]);

        // Stok varian otoritatif berkurang dari 5 -> 4.
        $this->assertSame(4, (int) $variant->fresh()->stock);
    }

    public function test_variant_from_another_product_is_rejected(): void
    {
        $user = User::factory()->create();
        $productA = Product::factory()->create(['name' => 'Produk A', 'price' => 100000, 'stock' => 5]);
        $productB = Product::factory()->create(['name' => 'Produk B', 'price' => 100000, 'stock' => 5]);
        $variantB = ProductVariant::create([
            'product_id' => $productB->id,
            'sku' => 'TSK-TMP-B-01',
            'variant_name' => 'Varian B',
            'price' => 120000,
            'stock' => 5,
            'is_active' => true,
        ]);

        $response = $this->actingAs($user)->postJson('/api/checkout', [
            'items' => [
                [
                    'product_id' => $productA->id,
                    'product_variant_id' => $variantB->id,
                    'quantity' => 1,
                ],
            ],
            'recipient_name' => 'Pembeli Curiga',
            'phone' => '081200000003',
            'full_address' => 'Jl. Curiga No. 3',
            'expedition_name' => 'J&T',
            'expedition_service' => 'EZ',
            'payment_method' => 'manual_transfer',
            'payment_channel' => 'manual_bca',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['items']);

        $this->assertDatabaseCount('orders', 0);
    }

    public function test_forwarded_item_price_does_not_alter_order_level_amounts(): void
    {
        $user = User::factory()->create();
        $product = Product::factory()->create([
            'name' => 'Botol Sport',
            'price' => 90000,
            'stock' => 10,
        ]);
        $expedition = Expedition::factory()->create([
            'name' => 'JNE',
            'service' => 'REG',
            'cost' => 10000,
            'is_free' => true,
        ]);

        $response = $this->actingAs($user)->postJson('/api/checkout', [
            'items' => [
                [
                    'product_id' => $product->id,
                    'quantity' => 3,
                    'product_price' => 0,
                    'subtotal' => 0,
                ],
            ],
            'recipient_name' => 'Pembeli Netral',
            'phone' => '081200000004',
            'full_address' => 'Jl. Netral No. 4',
            'expedition_id' => $expedition->id,
            'payment_method' => 'manual_transfer',
            'payment_channel' => 'manual_bca',
            'service_fee' => 0,
        ]);

        // 90000 * 3 = 270000; ongkir gratis; tanpa biaya tambahan.
        $response->assertCreated()
            ->assertJsonPath('data.totals.subtotal', 270000)
            ->assertJsonPath('data.totals.shipping_cost', 0)
            ->assertJsonPath('data.totals.grand_total', 270000);
    }
}
