<?php

namespace Tests\Feature;

use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Expedition;
use App\Models\Order;
use App\Models\Product;
use App\Models\ShippingAddress;
use App\Models\User;
use App\Models\Warehouse;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CheckoutApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Checkout menulis stok via InventoryService (D1) sehingga butuh gudang.
        Warehouse::create([
            'code' => 'GDG-CHK-01',
            'name' => 'Gudang Checkout',
            'address' => 'Jl. Checkout',
            'city' => 'Jakarta',
            'province' => 'DKI Jakarta',
            'is_primary' => true,
            'is_active' => true,
        ]);
    }

    public function test_can_checkout_with_explicit_items_and_decrements_stock(): void
    {
        $user = User::factory()->create();
        $product = Product::factory()->create([
            'name' => 'Kemeja Casual',
            'price' => 150000,
            'stock' => 10,
        ]);
        $expedition = Expedition::factory()->create([
            'name' => 'J&T Express',
            'service' => 'Reguler',
            'cost' => 12000,
        ]);

        $payload = [
            'items' => [
                [
                    'product_id' => $product->id,
                    'quantity' => 2,
                    'notes' => 'Ukuran L warna putih',
                ],
            ],
            'recipient_name' => 'Budi Santoso',
            'phone' => '08123456789',
            'full_address' => 'Jl. Merdeka No. 45',
            'province' => 'DKI Jakarta',
            'city' => 'Jakarta Selatan',
            'district' => 'Tebet',
            'postal_code' => '12810',
            'expedition_id' => $expedition->id,
            'payment_method' => 'midtrans',
            'payment_channel' => 'bca_va',
            'insurance_cost' => 1000,
            'service_fee' => 1000,
        ];

        $response = $this->actingAs($user)->postJson('/api/checkout', $payload);

        $response->assertCreated()
            ->assertJsonPath('data.address.recipient_name', 'Budi Santoso')
            ->assertJsonPath('data.totals.subtotal', 300000)
            ->assertJsonPath('data.totals.shipping_cost', 24000)
            ->assertJsonPath('data.totals.grand_total', 326000)
            ->assertJsonCount(1, 'data.items')
            ->assertJsonPath('data.items.0.product_name', 'Kemeja Casual')
            ->assertJsonPath('data.items.0.quantity', 2);

        // Verify stock decremented
        $this->assertEquals(8, $product->fresh()->stock);

        // Verify order in database
        $this->assertDatabaseHas('orders', [
            'user_id' => $user->id,
            'recipient_name' => 'Budi Santoso',
            'grand_total' => 326000,
        ]);
    }

    public function test_checkout_writes_authoritative_inventory_balance_and_mutation(): void
    {
        $user = User::factory()->create();
        $product = Product::factory()->create([
            'name' => 'Kaos Tusko Authoritative',
            'price' => 100000,
            'stock' => 10,
        ]);
        $expedition = Expedition::factory()->create([
            'name' => 'JNE',
            'service' => 'Reguler',
            'cost' => 10000,
        ]);

        $response = $this->actingAs($user)->postJson('/api/checkout', [
            'items' => [
                ['product_id' => $product->id, 'quantity' => 3],
            ],
            'recipient_name' => 'Test Authoritative',
            'phone' => '08123456789',
            'full_address' => 'Jl. Authoritative No. 1',
            'expedition_id' => $expedition->id,
            'payment_method' => 'manual_transfer',
        ]);

        $response->assertCreated();
        $orderNumber = $response->json('data.order_number');

        $warehouseId = Warehouse::where('is_primary', true)->value('id');

        // D1 (T12.6): saldo otoritatif inventory_balances + mutasi + agregat sinkron.
        $this->assertDatabaseHas('inventory_balances', [
            'warehouse_id' => $warehouseId,
            'product_id' => $product->id,
            'product_variant_id' => null,
            'on_hand_stock' => 7,
            'available_stock' => 7,
        ]);

        $this->assertSame(7, (int) $product->fresh()->stock);

        $this->assertDatabaseHas('stock_mutations', [
            'product_id' => $product->id,
            'type' => 'out',
            'quantity' => 3,
            'reference_type' => 'order',
            'reference_id' => $orderNumber,
        ]);
    }

    public function test_checkout_fails_if_product_stock_is_insufficient(): void
    {
        $user = User::factory()->create();
        $product = Product::factory()->create([
            'name' => 'Sepatu Sneakers',
            'stock' => 2,
        ]);

        $payload = [
            'items' => [
                [
                    'product_id' => $product->id,
                    'quantity' => 5, // exceeds stock of 2
                ],
            ],
            'recipient_name' => 'Andi',
            'phone' => '0811223344',
            'full_address' => 'Jl. Sudirman',
            'expedition_name' => 'JNE',
            'expedition_service' => 'REG',
            'shipping_cost' => 10000,
        ];

        $response = $this->actingAs($user)->postJson('/api/checkout', $payload);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['items']);

        // Stock must remain unchanged
        $this->assertEquals(2, $product->fresh()->stock);
    }

    public function test_can_checkout_from_active_cart(): void
    {
        $user = User::factory()->create();
        $cart = Cart::factory()->create(['user_id' => $user->id]);
        $product = Product::factory()->create([
            'name' => 'Tas Ransel',
            'price' => 200000,
            'stock' => 5,
        ]);

        CartItem::factory()->create([
            'cart_id' => $cart->id,
            'product_id' => $product->id,
            'quantity' => 1,
        ]);

        $payload = [
            'recipient_name' => 'Rina Gunawan',
            'phone' => '0855667788',
            'full_address' => 'Jl. Melati No. 10',
            'expedition_name' => 'SiCepat',
            'expedition_service' => 'GOKIL',
            'shipping_cost' => 20000,
            'payment_method' => 'manual_transfer',
            'payment_channel' => 'manual_bca',
        ];

        $response = $this->actingAs($user)->postJson('/api/checkout', $payload);

        $response->assertCreated()
            ->assertJsonPath('data.totals.subtotal', 200000)
            ->assertJsonPath('data.payment_method', 'manual_transfer');

        // Cart items must be cleared
        $this->assertDatabaseMissing('cart_items', [
            'cart_id' => $cart->id,
            'product_id' => $product->id,
        ]);

        // Product stock decremented
        $this->assertEquals(4, $product->fresh()->stock);
    }

    public function test_checkout_persists_expedition_service_id(): void
    {
        $user = User::factory()->create();
        $product = Product::factory()->create(['price' => 90000, 'stock' => 5]);
        $expedition = Expedition::factory()->create([
            'name' => 'JNE Express',
            'service' => 'Express',
            'cost' => 10000,
        ]);
        $service = \App\Models\ExpeditionService::create([
            'expedition_id' => $expedition->id,
            'service_code' => 'REG',
            'service_name' => 'Reguler',
            'etd_days' => '2-3',
            'base_rate' => 11000,
            'per_kg_rate' => 0,
            'is_active' => true,
        ]);

        $payload = [
            'items' => [
                ['product_id' => $product->id, 'quantity' => 1],
            ],
            'recipient_name' => 'Penerima Layanan',
            'phone' => '081200000002',
            'full_address' => 'Jl. Layanan No. 1',
            'expedition_service_id' => $service->id,
            'payment_method' => 'manual_transfer',
            'payment_channel' => 'manual_bca',
        ];

        $this->actingAs($user)->postJson('/api/checkout', $payload)->assertCreated();

        $this->assertDatabaseHas('orders', [
            'user_id' => $user->id,
            'expedition_id' => $expedition->id,
            'expedition_service_id' => $service->id,
            'expedition_name' => 'JNE Express',
        ]);
    }

    public function test_checkout_resolves_user_from_bearer_token(): void
    {
        // Membuktikan checkout mengenali token Bearer Sanctum (bukan hanya sesi web),
        // sehingga order tersimpan pada user yang benar.
        $user = User::factory()->create();
        $token = $user->createToken('checkout_test')->plainTextToken;
        $product = Product::factory()->create([
            'name' => 'Botol Minum',
            'price' => 90000,
            'stock' => 4,
        ]);

        $payload = [
            'items' => [
                ['product_id' => $product->id, 'quantity' => 1],
            ],
            'recipient_name' => 'Dewi Lestari',
            'phone' => '081399887766',
            'full_address' => 'Jl. Anggrek No. 2',
            'expedition_name' => 'JNE',
            'expedition_service' => 'REG',
            'shipping_cost' => 15000,
            'payment_method' => 'manual_transfer',
            'payment_channel' => 'manual_bca',
        ];

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/checkout', $payload);

        $response->assertCreated();

        $this->assertDatabaseHas('orders', [
            'user_id' => $user->id,
            'recipient_name' => 'Dewi Lestari',
        ]);
    }

    public function test_can_checkout_using_saved_shipping_address(): void
    {
        $user = User::factory()->create();
        $address = ShippingAddress::factory()->create([
            'user_id' => $user->id,
            'recipient_name' => 'Siti Rahma',
            'phone' => '0899887766',
            'full_address' => 'Komplek Griya Indah Blok B2',
            'city' => 'Bandung',
        ]);

        $product = Product::factory()->create(['price' => 50000, 'stock' => 10]);

        $payload = [
            'items' => [
                ['product_id' => $product->id, 'quantity' => 1],
            ],
            'shipping_address_id' => $address->id,
            'expedition_name' => 'J&T Express',
            'expedition_service' => 'EZ',
            'shipping_cost' => 15000,
        ];

        $response = $this->actingAs($user)->postJson('/api/checkout', $payload);

        $response->assertCreated()
            ->assertJsonPath('data.address.recipient_name', 'Siti Rahma')
            ->assertJsonPath('data.address.city', 'Bandung');
    }

    public function test_can_retrieve_order_by_number_or_id(): void
    {
        $user = User::factory()->create();
        $order = Order::factory()->create([
            'user_id' => $user->id,
            'order_number' => 'INV/20260907/TK/998877',
        ]);

        $response = $this->actingAs($user)->getJson("/api/orders/{$order->order_number}");

        $response->assertOk()
            ->assertJsonPath('data.order_number', 'INV/20260907/TK/998877');

        $responseById = $this->actingAs($user)->getJson("/api/orders/{$order->id}");
        $responseById->assertOk()
            ->assertJsonPath('data.id', $order->id);
    }

    public function test_can_list_orders_for_user(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();

        Order::factory()->count(3)->create(['user_id' => $user->id]);
        Order::factory()->count(2)->create(['user_id' => $otherUser->id]);

        $response = $this->actingAs($user)->getJson('/api/orders');

        $response->assertOk()
            ->assertJsonCount(3, 'data')
            ->assertJsonPath('meta.total', 3);
    }
}
