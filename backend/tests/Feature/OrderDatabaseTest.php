<?php

namespace Tests\Feature;

use App\Models\Expedition;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ShippingAddress;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrderDatabaseTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_create_order_with_items(): void
    {
        $user = User::factory()->create();
        $address = ShippingAddress::factory()->create(['user_id' => $user->id]);
        $expedition = Expedition::factory()->create();
        $product = Product::factory()->create(['price' => 50000]);

        $order = Order::create([
            'order_number' => Order::generateOrderNumber(),
            'user_id' => $user->id,
            'status' => 'pending',
            'payment_status' => 'pending',
            'payment_method' => 'midtrans',
            'payment_channel' => 'bca_va',
            'va_number' => '88081234567890',
            'shipping_address_id' => $address->id,
            'recipient_name' => $address->recipient_name,
            'phone' => $address->phone,
            'phone_number' => $address->phone,
            'full_address' => $address->full_address,
            'province' => $address->province,
            'city' => $address->city,
            'district' => $address->district,
            'postal_code' => $address->postal_code,
            'expedition_id' => $expedition->id,
            'expedition_name' => $expedition->name,
            'expedition_service' => $expedition->service,
            'expedition_etd' => $expedition->etd,
            'subtotal' => 100000,
            'shipping_cost' => 15000,
            'insurance_cost' => 1000,
            'service_fee' => 1000,
            'discount_amount' => 5000,
            'grand_total' => 112000,
            'total_weight' => 1.5,
        ]);

        $item = OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $product->id,
            'product_name' => $product->name,
            'product_slug' => $product->slug,
            'product_image' => 'https://via.placeholder.com/150',
            'product_price' => 50000,
            'product_weight' => 0.5,
            'quantity' => 2,
            'subtotal' => 100000,
        ]);

        $this->assertDatabaseHas('orders', [
            'id' => $order->id,
            'order_number' => $order->order_number,
            'grand_total' => 112000,
        ]);

        $this->assertDatabaseHas('order_items', [
            'id' => $item->id,
            'order_id' => $order->id,
            'product_id' => $product->id,
            'quantity' => 2,
        ]);

        $this->assertCount(1, $order->items);
        $this->assertEquals($user->id, $order->user->id);
        $this->assertEquals($address->id, $order->shippingAddress->id);
        $this->assertEquals($expedition->id, $order->expedition->id);
        $this->assertEquals($order->id, $item->order->id);
        $this->assertEquals($product->id, $item->product->id);
    }

    public function test_order_number_must_be_unique(): void
    {
        $order1 = Order::factory()->create(['order_number' => 'INV-TEST-001']);

        $this->expectException(QueryException::class);

        Order::factory()->create(['order_number' => 'INV-TEST-001']);
    }

    public function test_order_status_transition_methods(): void
    {
        $order = Order::factory()->create([
            'status' => 'pending',
            'payment_status' => 'pending',
        ]);

        // Mark as paid
        $order->markAsPaid('bca_va', 'midtrans-12345');
        $this->assertEquals('processing', $order->fresh()->status);
        $this->assertEquals('paid', $order->fresh()->payment_status);
        $this->assertNotNull($order->fresh()->paid_at);
        $this->assertEquals('midtrans-12345', $order->fresh()->midtrans_transaction_id);

        // Mark as shipped
        $order->markAsShipped('JT99887766');
        $this->assertEquals('shipped', $order->fresh()->status);
        $this->assertEquals('JT99887766', $order->fresh()->tracking_number);
        $this->assertNotNull($order->fresh()->shipped_at);

        // Mark as completed
        $order->markAsCompleted();
        $this->assertEquals('completed', $order->fresh()->status);
        $this->assertNotNull($order->fresh()->completed_at);
    }

    public function test_deleting_order_cascades_to_order_items(): void
    {
        $order = Order::factory()->create();
        $item = OrderItem::factory()->create(['order_id' => $order->id]);

        $this->assertDatabaseHas('order_items', ['id' => $item->id]);

        $order->delete();

        $this->assertDatabaseMissing('orders', ['id' => $order->id]);
        $this->assertDatabaseMissing('order_items', ['id' => $item->id]);
    }
}
