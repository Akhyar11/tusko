<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\Shipment;
use App\Models\ShipmentTracking;
use App\Models\User;
use App\Services\BiteshipTrackingService;
use App\Services\IntegrationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class BiteshipTrackingSyncTest extends TestCase
{
    use RefreshDatabase;

    private function configureBiteship(): void
    {
        $integrations = app(IntegrationService::class);
        $integrations->set('shipping.provider', 'biteship', 'shipping');
        $integrations->set('shipping.biteship_base_url', 'https://api.biteship.test', 'shipping');
        $integrations->set('shipping.biteship_api_key', 'biteship_test_key', 'shipping', true);
    }

    private function makeShipment(User $user): Shipment
    {
        $order = Order::factory()->shipped()->create(['user_id' => $user->id]);
        $order->forceFill(['tracking_number' => 'JNE-999'])->save();

        return Shipment::create([
            'order_id' => $order->id,
            'provider' => 'biteship',
            'provider_order_id' => 'bsh_order_123',
            'provider_waybill_id' => 'JNE-999',
            'courier_company' => 'jne',
            'waybill_number' => 'JNE-999',
            'status' => 'manifested',
        ]);
    }

    private function fakeTracking(): void
    {
        Http::fake([
            'https://api.biteship.test/v1/trackings/bsh_order_123' => Http::response([
                'success' => true,
                'status' => 'in_transit',
                'history' => [
                    ['note' => 'Paket diterima di gudang asal', 'updated_at' => '2026-09-27T10:00:00+07:00', 'city' => 'Jakarta'],
                    ['note' => 'Paket dalam perjalanan', 'updated_at' => '2026-09-27T15:00:00+07:00', 'city' => 'Bandung'],
                ],
            ], 200),
        ]);
    }

    public function test_syncs_tracking_history_idempotently(): void
    {
        $this->configureBiteship();
        $this->fakeTracking();

        $user = User::factory()->create(['role' => 'customer', 'is_active' => true]);
        $shipment = $this->makeShipment($user);

        $service = app(BiteshipTrackingService::class);

        $this->assertSame(2, $service->syncShipment($shipment));
        $this->assertSame(2, ShipmentTracking::where('shipment_id', $shipment->id)->count());

        // Idempoten: tidak menambah duplikat.
        $this->assertSame(0, $service->syncShipment($shipment->fresh()));
        $this->assertSame(2, ShipmentTracking::where('shipment_id', $shipment->id)->count());

        $shipment->refresh();
        $this->assertSame('in_transit', $shipment->provider_status);
        $this->assertSame('in_transit', $shipment->status);
    }

    public function test_delivered_status_sets_delivered_time(): void
    {
        $this->configureBiteship();

        Http::fake([
            'https://api.biteship.test/v1/trackings/bsh_order_123' => Http::response([
                'success' => true,
                'status' => 'delivered',
                'history' => [['note' => 'Paket diterima', 'updated_at' => '2026-09-28T09:00:00+07:00']],
            ], 200),
        ]);

        $user = User::factory()->create(['role' => 'customer', 'is_active' => true]);
        $shipment = $this->makeShipment($user);

        app(BiteshipTrackingService::class)->syncShipment($shipment);

        $shipment->refresh();
        $this->assertSame('delivered', $shipment->status);
        $this->assertNotNull($shipment->delivered_time);
    }

    public function test_owner_can_fetch_tracking_endpoint(): void
    {
        $this->configureBiteship();
        $this->fakeTracking();

        $user = User::factory()->create(['role' => 'customer', 'is_active' => true]);
        Sanctum::actingAs($user);
        $shipment = $this->makeShipment($user);

        $this->getJson("/api/orders/{$shipment->order_id}/tracking")
            ->assertStatus(200)
            ->assertJsonPath('data.provider', 'biteship')
            ->assertJsonPath('data.provider_status', 'in_transit')
            ->assertJsonCount(2, 'data.history');
    }

    public function test_other_user_cannot_fetch_tracking(): void
    {
        $this->configureBiteship();
        Http::fake();

        $owner = User::factory()->create(['role' => 'customer', 'is_active' => true]);
        $shipment = $this->makeShipment($owner);

        Sanctum::actingAs(User::factory()->create(['role' => 'customer', 'is_active' => true]));

        $this->getJson("/api/orders/{$shipment->order_id}/tracking")->assertStatus(403);
    }
}
