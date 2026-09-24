<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\Shipment;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ShipmentPickupApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_booking_pickup_creates_shipment_with_waybill(): void
    {
        $order = Order::factory()->paid()->create();

        $response = $this->postJson("/api/orders/{$order->order_number}/book-pickup");

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.status', 'manifested')
            ->assertJsonPath('data.order_number', $order->order_number);

        $waybill = $response->json('data.waybill_number');
        $this->assertNotNull($waybill);
        $this->assertMatchesRegularExpression('/^RESI\/' . now()->format('dmY') . '\/\d{3,}$/', $waybill);

        $shipment = Shipment::where('order_id', $order->id)->firstOrFail();
        $this->assertSame($waybill, $shipment->waybill_number);
        $this->assertSame('manifested', $shipment->status);
        $this->assertNotNull($shipment->pickup_time);

        $this->assertSame($waybill, $order->fresh()->tracking_number);
    }

    public function test_booking_pickup_is_idempotent(): void
    {
        $order = Order::factory()->paid()->create();

        $first = $this->postJson("/api/orders/{$order->order_number}/book-pickup")->json('data.waybill_number');
        $second = $this->postJson("/api/orders/{$order->order_number}/book-pickup")->json('data.waybill_number');

        $this->assertSame($first, $second);
        $this->assertSame(1, Shipment::where('order_id', $order->id)->count());
    }

    public function test_booking_pickup_rejected_for_pending_order(): void
    {
        $order = Order::factory()->create(['status' => 'pending']);

        $this->postJson("/api/orders/{$order->order_number}/book-pickup")
            ->assertStatus(422);

        $this->assertSame(0, Shipment::where('order_id', $order->id)->count());
    }
}
