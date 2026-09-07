<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Category;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GenerateShippingReceiptApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_generate_shipping_receipt_with_auto_generated_tracking_number(): void
    {
        $category = Category::create([
            'name' => 'Elektronik',
            'slug' => 'elektronik',
        ]);

        $product = Product::create([
            'category_id' => $category->id,
            'name' => 'Keyboard Mechanical Tusko',
            'slug' => 'keyboard-mechanical-tusko',
            'price' => 250000,
            'stock' => 10,
            'stock_minimum' => 2,
            'active' => true,
        ]);

        $order = Order::create([
            'order_number' => 'INV/20260908/TK/112233',
            'recipient_name' => 'Budi Pratama',
            'phone' => '081298765432',
            'full_address' => 'Jl. Merdeka No. 10',
            'city' => 'Surabaya',
            'province' => 'Jawa Timur',
            'postal_code' => '60111',
            'expedition_name' => 'JNE',
            'expedition_service' => 'REG',
            'expedition_etd' => '2-3 hari',
            'subtotal' => 250000,
            'shipping_cost' => 18000,
            'grand_total' => 268000,
            'status' => 'processing',
            'payment_status' => 'paid',
        ]);

        OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $product->id,
            'product_name' => $product->name,
            'quantity' => 1,
            'product_price' => 250000,
            'subtotal' => 250000,
        ]);

        $response = $this->postJson("/api/orders/{$order->id}/generate-receipt", [
            'auto_ship' => true,
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('message', 'Resi pengiriman berhasil dibuat.')
            ->assertJsonStructure([
                'message',
                'data' => [
                    'order',
                    'receipt' => [
                        'order_id',
                        'order_number',
                        'tracking_number',
                        'barcode_data',
                        'sort_code',
                        'expedition' => ['name', 'service', 'etd'],
                        'sender' => ['store_name', 'phone', 'address', 'city'],
                        'recipient' => ['name', 'phone', 'address', 'city', 'postal_code'],
                        'package_info' => ['total_weight_kg', 'total_items', 'shipping_cost'],
                        'items',
                    ],
                ],
            ]);

        $trackingNumber = $response->json('data.receipt.tracking_number');
        $this->assertNotEmpty($trackingNumber);
        $this->assertStringStartsWith('JNE-', $trackingNumber);

        // Assert database updated
        $order->refresh();
        $this->assertEquals($trackingNumber, $order->tracking_number);
        $this->assertEquals('shipped', $order->status);
        $this->assertNotNull($order->shipped_at);
    }

    public function test_can_generate_receipt_with_custom_tracking_number_by_order_number(): void
    {
        $order = Order::create([
            'order_number' => 'INV/20260908/TK/445566',
            'recipient_name' => 'Siti Aisyah',
            'phone' => '085712345678',
            'full_address' => 'Jl. Diponegoro 12',
            'city' => 'Bandung',
            'expedition_name' => 'SiCepat',
            'expedition_service' => 'BEST',
            'subtotal' => 150000,
            'shipping_cost' => 12000,
            'grand_total' => 162000,
            'status' => 'processing',
            'payment_status' => 'paid',
        ]);

        $customResi = '004998811223344';

        $response = $this->postJson("/api/orders/{$order->order_number}/generate-receipt", [
            'tracking_number' => $customResi,
            'shipper_name' => 'Tusko Warehouse Bandung',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.receipt.tracking_number', $customResi)
            ->assertJsonPath('data.receipt.sender.store_name', 'Tusko Warehouse Bandung')
            ->assertJsonPath('data.receipt.sort_code', 'BAN');

        $order->refresh();
        $this->assertEquals($customResi, $order->tracking_number);
    }

    public function test_can_fetch_existing_receipt(): void
    {
        $order = Order::create([
            'order_number' => 'INV/20260908/TK/778899',
            'tracking_number' => 'JNT-20260908-XYZ999',
            'recipient_name' => 'Dewi Sartika',
            'phone' => '087811223344',
            'full_address' => 'Jl. Asia Afrika No. 8',
            'city' => 'Bandung',
            'expedition_name' => 'J&T Express',
            'expedition_service' => 'EZ',
            'subtotal' => 100000,
            'shipping_cost' => 10000,
            'grand_total' => 110000,
            'status' => 'shipped',
            'payment_status' => 'paid',
        ]);

        $response = $this->getJson("/api/orders/{$order->id}/receipt");

        $response->assertStatus(200)
            ->assertJsonPath('data.receipt.tracking_number', 'JNT-20260908-XYZ999')
            ->assertJsonPath('data.receipt.expedition.name', 'J&T Express');
    }

    public function test_returns_404_when_order_not_found(): void
    {
        $response = $this->postJson('/api/orders/NON-EXISTENT-ORDER/generate-receipt');
        $response->assertStatus(404);
    }
}
