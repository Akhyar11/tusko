<?php

namespace Tests\Feature;

use App\Models\Expedition;
use App\Models\ExpeditionService;
use App\Services\ExpeditionSyncService;
use App\Services\IntegrationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class BiteshipExpeditionSyncTest extends TestCase
{
    use RefreshDatabase;

    private function configureBiteship(): void
    {
        $integrations = app(IntegrationService::class);
        $integrations->set('shipping.provider', 'biteship', 'shipping');
        $integrations->set('shipping.biteship_base_url', 'https://api.biteship.test', 'shipping');
        $integrations->set('shipping.biteship_api_key', 'biteship_test_key', 'shipping', true);
    }

    private function fakeCouriers(): void
    {
        Http::fake([
            'https://api.biteship.test/v1/couriers' => Http::response([
                'success' => true,
                'couriers' => [
                    [
                        'courier_name' => 'JNE',
                        'courier_code' => 'jne',
                        'courier_service_name' => 'JNE Reguler',
                        'courier_service_code' => 'reg',
                        'service_type' => 'standard',
                        'shipment_duration_range' => '2 - 3',
                        'shipment_duration_unit' => 'days',
                    ],
                    [
                        'courier_name' => 'JNE',
                        'courier_code' => 'jne',
                        'courier_service_name' => 'JNE OKE',
                        'courier_service_code' => 'oke',
                        'service_type' => 'standard',
                    ],
                    [
                        'courier_name' => 'GoSend',
                        'courier_code' => 'gosend',
                        'courier_service_name' => 'GoSend Instant',
                        'courier_service_code' => 'instant',
                        'service_type' => 'instant',
                    ],
                ],
            ], 200),
        ]);
    }

    public function test_syncs_biteship_couriers_and_services(): void
    {
        $this->configureBiteship();
        $this->fakeCouriers();

        $result = app(ExpeditionSyncService::class)->sync();

        $this->assertSame(2, $result['couriers']);
        $this->assertSame(3, $result['services']);

        $jne = Expedition::where('code', 'jne')->firstOrFail();
        $this->assertSame('2 - 3 days', ExpeditionService::where('expedition_id', $jne->id)->where('service_code', 'reg')->value('etd_days'));

        $gosend = Expedition::where('code', 'gosend')->firstOrFail();
        $this->assertSame('Instan', $gosend->category);
    }

    public function test_sync_is_idempotent_and_preserves_overrides(): void
    {
        $this->configureBiteship();
        $this->fakeCouriers();

        $service = app(ExpeditionSyncService::class);
        $service->sync();

        $jne = Expedition::where('code', 'jne')->firstOrFail();
        $jne->update(['base_cost' => 15000, 'is_free' => true]);

        $service->sync();

        $this->assertSame(2, Expedition::count());
        $this->assertSame(3, ExpeditionService::count());

        $jne->refresh();
        $this->assertEquals(15000, (float) $jne->base_cost);
        $this->assertTrue((bool) $jne->is_free);
    }

    public function test_returns_zero_when_biteship_not_configured(): void
    {
        Http::fake();

        $result = app(ExpeditionSyncService::class)->sync();

        $this->assertSame(['couriers' => 0, 'services' => 0], $result);
    }

    public function test_admin_endpoint_syncs_biteship(): void
    {
        $this->seed(\Database\Seeders\MasterReferenceSeeder::class);
        $this->configureBiteship();
        $this->fakeCouriers();

        \Laravel\Sanctum\Sanctum::actingAs(
            \App\Models\User::factory()->create(['role' => 'admin', 'is_active' => true])
        );

        $this->postJson('/api/admin/expeditions/sync')
            ->assertStatus(200)
            ->assertJsonPath('data.couriers', 2)
            ->assertJsonPath('data.services', 3);
    }
}
