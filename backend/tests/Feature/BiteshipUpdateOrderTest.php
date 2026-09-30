<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\Shipment;
use App\Models\User;
use App\Services\BiteshipOrderService;
use App\Services\IntegrationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * T40.16 — Update order Biteship (ubah alamat/kurir sebelum dijemput).
 */
class BiteshipUpdateOrderTest extends TestCase
{
    use RefreshDatabase;

    private function configureBiteship(): void
    {
        $integrations = app(IntegrationService::class);
        $integrations->set('shipping.provider', 'biteship', 'shipping');
        $integrations->set('shipping.biteship_base_url', 'https://api.biteship.test', 'shipping');
        $integrations->set('shipping.biteship_api_key', 'biteship_test_key', 'shipping', true);
    }

    private function makeOrderWithShipment(string $providerStatus = 'confirmed'): array
    {
        $order = Order::factory()->create(['status' => 'processing', 'payment_status' => 'paid']);

        $shipment = Shipment::create([
            'order_id' => $order->id,
            'provider' => 'biteship',
            'provider_order_id' => 'bsh_upd_1',
            'provider_status' => $providerStatus,
            'waybill_number' => 'RESI-UPD-1',
            'status' => 'manifested',
        ]);

        return [$order, $shipment];
    }

    public function test_updates_biteship_order_via_endpoint(): void
    {
        $this->configureBiteship();
        Sanctum::actingAs(User::factory()->create(['role' => 'admin', 'is_active' => true]));

        [$order, $shipment] = $this->makeOrderWithShipment();

        Http::fake([
            'https://api.biteship.test/*' => Http::response([
                'id' => 'bsh_upd_1',
                'status' => 'confirmed',
                'courier_waybill_id' => 'WB-UPD-1',
            ], 200),
        ]);

        $this->putJson("/api/admin/orders/{$order->id}/shipment", [
            'destination_address' => 'Jl. Baru No. 2',
            'courier_type' => 'reg',
        ])->assertStatus(200)->assertJsonPath('status', 'success');

        Http::assertSent(function ($request) {
            return str_contains($request->url(), '/v1/orders/bsh_upd_1')
                && ! str_contains($request->url(), '/cancel')
                && ($request['destination_address'] ?? null) === 'Jl. Baru No. 2';
        });
    }

    public function test_rejects_update_when_already_picked(): void
    {
        $this->configureBiteship();
        Sanctum::actingAs(User::factory()->create(['role' => 'admin', 'is_active' => true]));

        [$order] = $this->makeOrderWithShipment('picked');

        Http::fake();

        $this->putJson("/api/admin/orders/{$order->id}/shipment", [
            'destination_address' => 'Jl. Baru No. 2',
        ])->assertStatus(422);

        Http::assertNothingSent();
    }

    public function test_service_ignores_unlisted_and_empty_fields(): void
    {
        $this->configureBiteship();

        [$order] = $this->makeOrderWithShipment();

        Http::fake();

        $result = app(BiteshipOrderService::class)->updateForOrder($order, [
            'unrelated_field' => 'x',
            'destination_address' => '',
        ]);

        $this->assertNull($result);
        Http::assertNothingSent();
    }
}
