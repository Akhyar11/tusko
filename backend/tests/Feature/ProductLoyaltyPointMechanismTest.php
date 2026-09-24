<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Expedition;
use App\Models\LoyaltyPointsLedger;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ShippingAddress;
use App\Models\User;
use App\Models\Warehouse;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductLoyaltyPointMechanismTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected User $customer;
    protected Category $category;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->create([
            'email' => 'admin@tusko.id',
            'role' => 'admin',
        ]);

        $this->customer = User::factory()->create([
            'email' => 'buyer@tusko.id',
            'role' => 'customer',
            'points' => 0,
        ]);

        $this->category = Category::create([
            'name' => 'Running Gear',
            'slug' => 'running-gear',
        ]);

        Warehouse::create([
            'code' => 'GDG-CHK-LOY',
            'name' => 'Gudang Checkout Loyalty',
            'address' => 'Jl. Checkout',
            'city' => 'Jakarta',
            'province' => 'DKI Jakarta',
            'is_primary' => true,
            'is_active' => true,
        ]);
    }

    public function test_can_create_product_with_manual_fixed_points(): void
    {
        $payload = [
            'name' => 'Tusko Speed Tank',
            'category_id' => $this->category->id,
            'price' => 150000,
            'point_type' => 'manual',
            'point_value' => 75,
            'stock' => 20,
        ];

        $response = $this->actingAs($this->admin)->postJson('/api/products', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('data.point_type', 'manual')
            ->assertJsonPath('data.point_value', 75)
            ->assertJsonPath('data.reward_points', 75);

        $this->assertDatabaseHas('products', [
            'name' => 'Tusko Speed Tank',
            'point_type' => 'manual',
            'point_value' => 75.00,
        ]);
    }

    public function test_can_create_product_with_percentage_points_from_selling_price(): void
    {
        $payload = [
            'name' => 'Tusko Carbon Shoes',
            'category_id' => $this->category->id,
            'price' => 1000000, // Rp 1.000.000
            'point_type' => 'percentage',
            'point_value' => 2.5, // 2.5% = 25.000 poin
            'stock' => 10,
        ];

        $response = $this->actingAs($this->admin)->postJson('/api/products', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('data.point_type', 'percentage')
            ->assertJsonPath('data.point_value', 2.5)
            ->assertJsonPath('data.reward_points', 25000);

        $this->assertDatabaseHas('products', [
            'name' => 'Tusko Carbon Shoes',
            'point_type' => 'percentage',
            'point_value' => 2.50,
        ]);
    }

    public function test_can_update_product_points_mechanism(): void
    {
        $product = Product::create([
            'category_id' => $this->category->id,
            'name' => 'Tusko Compression Sleeves',
            'slug' => 'tusko-compression-sleeves',
            'price' => 200000,
            'point_type' => 'manual',
            'point_value' => 50,
            'stock' => 30,
        ]);

        $updatePayload = [
            'price' => 200000,
            'point_type' => 'percentage',
            'point_value' => 5.0, // 5% of 200.000 = 10.000 points
        ];

        $response = $this->actingAs($this->admin)->putJson("/api/products/{$product->id}", $updatePayload);

        $response->assertStatus(200)
            ->assertJsonPath('data.point_type', 'percentage')
            ->assertJsonPath('data.reward_points', 10000);
        $this->assertEquals(5.0, (float) $response->json('data.point_value'));

        $product->refresh();
        $this->assertEquals('percentage', $product->point_type);
        $this->assertEquals(5.00, (float) $product->point_value);
        $this->assertEquals(10000, $product->reward_points);
    }

    public function test_checkout_calculates_loyalty_points_for_order_items_and_order(): void
    {
        $expedition = Expedition::create([
            'name' => 'JNE Express',
            'code' => 'jne',
            'service' => 'REG',
            'category' => 'Reguler',
            'etd' => '2-3 hari',
            'base_cost' => 10000,
            'cost' => 10000,
            'is_active' => true,
        ]);

        $address = ShippingAddress::create([
            'user_id' => $this->customer->id,
            'recipient_name' => 'Buyer Tusko',
            'phone' => '081234567890',
            'full_address' => 'Jl. Senayan Atletik No. 10',
            'province' => 'DKI Jakarta',
            'city' => 'Jakarta Pusat',
            'district' => 'Tanah Abang',
            'postal_code' => '10270',
            'is_default' => true,
        ]);

        // Product 1: Manual 50 pts, qty 2 -> 100 pts
        $prodManual = Product::create([
            'category_id' => $this->category->id,
            'name' => 'Tusko Cap',
            'slug' => 'tusko-cap',
            'price' => 100000,
            'point_type' => 'manual',
            'point_value' => 50,
            'stock' => 10,
        ]);

        // Product 2: Percentage 2% of Rp 200.000 = 4.000 pts, qty 1 -> 4.000 pts
        $prodPercent = Product::create([
            'category_id' => $this->category->id,
            'name' => 'Tusko Singlet Pro',
            'slug' => 'tusko-singlet-pro',
            'price' => 200000,
            'point_type' => 'percentage',
            'point_value' => 2.0,
            'stock' => 10,
        ]);

        $checkoutPayload = [
            'shipping_address_id' => $address->id,
            'expedition_id' => $expedition->id,
            'payment_method' => 'midtrans',
            'payment_channel' => 'bca_va',
            'items' => [
                ['product_id' => $prodManual->id, 'quantity' => 2],
                ['product_id' => $prodPercent->id, 'quantity' => 1],
            ],
        ];

        $response = $this->actingAs($this->customer)->postJson('/api/checkout', $checkoutPayload);

        $response->assertStatus(201);
        $orderId = $response->json('data.id');

        $order = Order::with('items')->find($orderId);
        $this->assertNotNull($order);
        // Total points earned: 100 + 4000 = 4100
        $this->assertEquals(4100, $order->loyalty_points_earned);

        $itemManual = $order->items->firstWhere('product_id', $prodManual->id);
        $this->assertEquals(100, $itemManual->points_earned);

        $itemPercent = $order->items->firstWhere('product_id', $prodPercent->id);
        $this->assertEquals(4000, $itemPercent->points_earned);
    }

    public function test_loyalty_points_credited_to_user_when_order_is_paid(): void
    {
        $order = Order::create([
            'order_number' => 'TSK-ORD-TEST-POINTS',
            'user_id' => $this->customer->id,
            'status' => 'pending',
            'payment_status' => 'pending',
            'payment_method' => 'manual_transfer',
            'subtotal' => 300000,
            'shipping_cost' => 10000,
            'grand_total' => 310000,
            'loyalty_points_earned' => 2500,
            'expedition_name' => 'JNE Express',
            'expedition_service' => 'REG',
            'recipient_name' => 'Buyer Tusko',
            'phone' => '081234567890',
            'full_address' => 'Jl. Senayan Atletik No. 10',
            'province' => 'DKI Jakarta',
            'city' => 'Jakarta Pusat',
            'district' => 'Tanah Abang',
            'postal_code' => '10270',
        ]);

        $this->assertEquals(0, $this->customer->fresh()->points);

        // Update payment status to paid (triggers OrderObserver)
        $order->update(['payment_status' => 'paid', 'status' => 'processing']);

        // User points should be incremented
        $this->assertEquals(2500, $this->customer->fresh()->points);

        // Ledger should record the transaction
        $this->assertDatabaseHas('loyalty_points_ledger', [
            'user_id' => $this->customer->id,
            'type' => 'earned',
            'points' => 2500,
            'reference_type' => 'order',
            'reference_id' => 'TSK-ORD-TEST-POINTS',
        ]);
    }
}
