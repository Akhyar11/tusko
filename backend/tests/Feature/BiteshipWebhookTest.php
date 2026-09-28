<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\Shipment;
use App\Models\ShippingWebhookEvent;
use App\Services\IntegrationService;
use Database\Seeders\MasterReferenceSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BiteshipWebhookTest extends TestCase
{
    use RefreshDatabase;

    private function configureBiteship(bool $withSignature = false): void
    {
        $integrations = app(IntegrationService::class);
        $integrations->set('shipping.provider', 'biteship', 'shipping');
        $integrations->set('shipping.biteship_base_url', 'https://api.biteship.test', 'shipping');
        $integrations->set('shipping.biteship_api_key', 'biteship_test_key', 'shipping', true);

        if ($withSignature) {
            $integrations->set('shipping.biteship_webhook_signature_key', 'X-Biteship-Signature', 'shipping');
            $integrations->set('shipping.biteship_webhook_signature_secret', 'rahasia-webhook', 'shipping', true);
        }
    }

    private function makeShipment(): Shipment
    {
        $order = Order::factory()->paid()->create(['status' => 'processing', 'payment_status' => 'paid']);

        return Shipment::create([
            'order_id' => $order->id,
            'provider' => 'biteship',
            'provider_order_id' => 'bsh_order_123',
            'courier_company' => 'jne',
            'waybill_number' => 'RESI/TEMP/001',
            'status' => 'manifested',
        ]);
    }

    private function statusPayload(string $status = 'picked'): array
    {
        return [
            'event' => 'order.status',
            'order_id' => 'bsh_order_123',
            'status' => $status,
            'courier_waybill_id' => 'JNE-123',
            'courier_tracking_id' => 'TRK-123',
            'courier_company' => 'jne',
            'courier_type' => 'reg',
            'courier_link' => 'https://track.test/JNE-123',
        ];
    }

    public function test_rejects_invalid_signature(): void
    {
        $this->configureBiteship(true);
        $this->makeShipment();

        $this->postJson('/api/webhooks/biteship', $this->statusPayload())
            ->assertStatus(403)
            ->assertJsonPath('message', 'Signature webhook tidak valid.');
    }

    public function test_accepts_valid_signature(): void
    {
        $this->configureBiteship(true);
        $this->makeShipment();

        $this->withHeaders(['X-Biteship-Signature' => 'rahasia-webhook'])
            ->postJson('/api/webhooks/biteship', $this->statusPayload())
            ->assertStatus(200)
            ->assertJsonPath('status', 'ok');
    }

    public function test_status_webhook_updates_shipment_and_advances_order(): void
    {
        $this->seed(MasterReferenceSeeder::class);
        $this->configureBiteship();
        $shipment = $this->makeShipment();

        $this->postJson('/api/webhooks/biteship', $this->statusPayload('picked'))
            ->assertStatus(200)
            ->assertJsonPath('status', 'ok');

        $shipment->refresh();
        $this->assertSame('picked', $shipment->provider_status);
        $this->assertSame('picked_up', $shipment->status);
        $this->assertSame('JNE-123', $shipment->provider_waybill_id);
        $this->assertSame('https://track.test/JNE-123', $shipment->provider_tracking_url);
        $this->assertDatabaseHas('shipment_trackings', ['shipment_id' => $shipment->id]);

        $this->assertSame('shipped', $shipment->order->fresh()->status);
        $this->assertDatabaseHas('order_status_histories', [
            'order_id' => $shipment->order_id,
            'status_code' => 'shipped',
            'actor_type' => 'system',
        ]);
    }

    public function test_waybill_webhook_updates_tracking_number(): void
    {
        $this->configureBiteship();
        $shipment = $this->makeShipment();

        $this->postJson('/api/webhooks/biteship', [
            'event' => 'order.waybill_id',
            'order_id' => 'bsh_order_123',
            'courier_waybill_id' => 'JNE-REAL-777',
            'courier_tracking_id' => 'TRK-777',
        ])->assertStatus(200);

        $shipment->refresh();
        $this->assertSame('JNE-REAL-777', $shipment->provider_waybill_id);
        $this->assertSame('JNE-REAL-777', $shipment->order->fresh()->tracking_number);
    }

    public function test_webhook_is_idempotent(): void
    {
        $this->seed(MasterReferenceSeeder::class);
        $this->configureBiteship();
        $this->makeShipment();

        $payload = $this->statusPayload('picked');

        $this->postJson('/api/webhooks/biteship', $payload)->assertStatus(200)->assertJsonPath('status', 'ok');
        $this->postJson('/api/webhooks/biteship', $payload)->assertStatus(200)->assertJsonPath('duplicate', true);

        $this->assertSame(1, ShippingWebhookEvent::count());
    }

    public function test_unknown_event_rejected_with_422(): void
    {
        $this->configureBiteship();

        $this->postJson('/api/webhooks/biteship', ['event' => 'order.unknown', 'order_id' => 'bsh_order_123'])
            ->assertStatus(422);

        $this->assertDatabaseHas('shipping_webhook_events', [
            'event' => 'order.unknown',
            'status' => 'ignored',
        ]);
    }
}
