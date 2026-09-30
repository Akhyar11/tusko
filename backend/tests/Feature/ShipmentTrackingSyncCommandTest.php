<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\Shipment;
use App\Models\ShipmentTracking;
use App\Services\IntegrationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/**
 * T30.3 — Command `shipments:sync-tracking`.
 */
class ShipmentTrackingSyncCommandTest extends TestCase
{
    use RefreshDatabase;

    private function configureBiteship(): void
    {
        $integrations = app(IntegrationService::class);
        $integrations->set('shipping.provider', 'biteship', 'shipping');
        $integrations->set('shipping.biteship_base_url', 'https://api.biteship.test', 'shipping');
        $integrations->set('shipping.biteship_api_key', 'biteship_test_key', 'shipping', true);
    }

    public function test_command_syncs_active_biteship_shipments(): void
    {
        $this->configureBiteship();

        $order = Order::factory()->shipped()->create();
        $shipment = Shipment::create([
            'order_id' => $order->id,
            'provider' => 'biteship',
            'provider_order_id' => 'bsh-cmd-1',
            'waybill_number' => 'JNE-CMD-1',
            'courier_company' => 'jne',
            'status' => 'in_transit',
        ]);

        Http::fake([
            'https://api.biteship.test/v1/trackings/bsh-cmd-1' => Http::response([
                'success' => true,
                'status' => 'delivered',
                'history' => [
                    ['note' => 'Paket diterima', 'updated_at' => '2026-09-29T09:00:00+07:00'],
                ],
            ], 200),
        ]);

        $this->artisan('shipments:sync-tracking')->assertExitCode(0);

        $this->assertSame('delivered', $shipment->fresh()->provider_status);
        $this->assertSame(1, ShipmentTracking::where('shipment_id', $shipment->id)->count());
    }

    public function test_command_runs_without_biteship_shipments(): void
    {
        $this->artisan('shipments:sync-tracking')->assertExitCode(0);
    }
}
