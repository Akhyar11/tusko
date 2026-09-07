<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\StockMutation;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrderStockIntegrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_checkout_automatically_decrements_product_stock_and_records_mutation(): void
    {
        $category = Category::create(['name' => 'Jersey', 'slug' => 'jersey']);

        $product = Product::create([
            'category_id' => $category->id,
            'name' => 'Tusko Matchday Jersey 2026',
            'slug' => 'tusko-matchday-jersey-2026',
            'sku' => 'TSK-JRS-2026',
            'price' => 250000,
            'stock' => 10,
            'stock_minimum' => 3,
        ]);

        $payload = [
            'recipient_name' => 'Akhyar Ramadan',
            'phone' => '081234567890',
            'full_address' => 'Jl. Merdeka No. 45 Jakarta Pusat',
            'province' => 'DKI Jakarta',
            'city' => 'Jakarta Pusat',
            'district' => 'Gambir',
            'postal_code' => '10110',
            'expedition_name' => 'J&T Express',
            'expedition_service' => 'EZ (Reguler)',
            'shipping_cost' => 15000,
            'payment_method' => 'manual_transfer',
            'items' => [
                [
                    'product_id' => $product->id,
                    'quantity' => 2,
                ],
            ],
        ];

        $response = $this->postJson('/api/checkout', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('data.items.0.product_id', $product->id)
            ->assertJsonPath('data.items.0.quantity', 2);

        $product->refresh();
        // Stok harus berkurang dari 10 menjadi 8
        $this->assertEquals(8, $product->stock);

        // Mutasi stok harus tercatat
        $orderNumber = $response->json('data.order_number');
        $this->assertDatabaseHas('stock_mutations', [
            'product_id' => $product->id,
            'type' => 'out',
            'quantity' => 2,
            'stock_before' => 10,
            'stock_after' => 8,
            'reference_type' => 'order',
            'reference_id' => $orderNumber,
        ]);
    }

    public function test_checkout_fails_if_stock_insufficient(): void
    {
        $category = Category::create(['name' => 'Sepatu', 'slug' => 'sepatu']);

        $product = Product::create([
            'category_id' => $category->id,
            'name' => 'Running Shoes Limited Edition',
            'slug' => 'running-shoes-limited-edition',
            'sku' => 'TSK-SH-LTD',
            'price' => 1500000,
            'stock' => 3,
            'stock_minimum' => 1,
        ]);

        $payload = [
            'recipient_name' => 'Budi Santoso',
            'phone' => '081234567891',
            'full_address' => 'Jl. Pahlawan Surabaya',
            'expedition_name' => 'SiCepat',
            'expedition_service' => 'BEST',
            'shipping_cost' => 20000,
            'payment_method' => 'manual_transfer',
            'items' => [
                [
                    'product_id' => $product->id,
                    'quantity' => 5, // Stok cuma 3, coba beli 5
                ],
            ],
        ];

        $response = $this->postJson('/api/checkout', $payload);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['items']);

        $product->refresh();
        $this->assertEquals(3, $product->stock);
        $this->assertEquals(0, StockMutation::where('product_id', $product->id)->count());
    }

    public function test_cancelling_order_restores_product_stock_and_records_mutation(): void
    {
        $category = Category::create(['name' => 'Apparel', 'slug' => 'apparel']);

        $product = Product::create([
            'category_id' => $category->id,
            'name' => 'Tusko Training Pants',
            'slug' => 'tusko-training-pants',
            'sku' => 'TSK-PNT-01',
            'price' => 150000,
            'stock' => 10, // Awal 10
        ]);

        // 1. Checkout beli 3 -> sisa stok 7
        $checkoutResponse = $this->postJson('/api/checkout', [
            'recipient_name' => 'Citra Dewi',
            'phone' => '081234567892',
            'full_address' => 'Jl. Dago Bandung',
            'expedition_name' => 'JNE',
            'expedition_service' => 'REG',
            'shipping_cost' => 10000,
            'payment_method' => 'manual_transfer',
            'items' => [
                ['product_id' => $product->id, 'quantity' => 3],
            ],
        ]);

        $checkoutResponse->assertStatus(201);
        $orderId = $checkoutResponse->json('data.id');
        $orderNumber = $checkoutResponse->json('data.order_number');

        $product->refresh();
        $this->assertEquals(7, $product->stock);

        // 2. Batalkan pesanan via API
        $cancelResponse = $this->patchJson("/api/orders/{$orderId}/status", [
            'status' => 'cancelled',
            'cancellation_reason' => 'Pelanggan membatalkan pesanan',
        ]);

        $cancelResponse->assertStatus(200);

        // Stok produk harus pulih kembali menjadi 10
        $product->refresh();
        $this->assertEquals(10, $product->stock);

        // Mutasi pengembalian stok harus tercatat
        $this->assertDatabaseHas('stock_mutations', [
            'product_id' => $product->id,
            'type' => 'in',
            'quantity' => 3,
            'stock_before' => 7,
            'stock_after' => 10,
            'reference_type' => 'order_cancelled',
            'reference_id' => $orderNumber,
        ]);
    }
}
