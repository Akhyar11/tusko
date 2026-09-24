<?php

namespace Tests\Feature;

use App\Models\Expedition;
use App\Models\ExpeditionService;
use App\Services\ExpeditionSyncService;
use App\Services\IntegrationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class ExpeditionSyncTest extends TestCase
{
    use RefreshDatabase;

    private function configureShipping(): void
    {
        $integrations = app(IntegrationService::class);
        $integrations->set('shipping.provider', 'kiriminaja', 'shipping');
        $integrations->set('shipping.base_url', 'https://shipping.test', 'shipping');
        $integrations->set('shipping.api_key', 'secret-key', 'shipping', true);
    }

    private function fakeProvider(): void
    {
        Http::fake([
            '*api/mitra/courier_services' => Http::response([
                'status' => true,
                'datas' => [
                    ['name' => 'Reguler', 'code' => 'REG', 'courier_group' => 'regular'],
                    ['name' => 'OKE', 'code' => 'OKE', 'courier_group' => 'economy'],
                ],
            ], 200),
            '*api/mitra/couriers' => Http::response([
                'status' => true,
                'datas' => [
                    ['code' => 'jne', 'name' => 'JNE Express', 'type' => 'Express'],
                    ['code' => 'gosend', 'name' => 'GoSend', 'type' => 'Instant'],
                ],
            ], 200),
        ]);
    }

    public function test_sync_creates_expeditions_and_services(): void
    {
        $this->configureShipping();
        $this->fakeProvider();

        $result = app(ExpeditionSyncService::class)->sync();

        $this->assertSame(2, $result['couriers']);
        $this->assertSame(4, $result['services']);

        $this->assertDatabaseHas('expeditions', ['code' => 'jne', 'name' => 'JNE Express', 'is_active' => true]);
        $this->assertDatabaseHas('expeditions', ['code' => 'gosend', 'name' => 'GoSend', 'category' => 'Instan']);

        $jne = Expedition::where('code', 'jne')->firstOrFail();
        $this->assertSame(2, ExpeditionService::where('expedition_id', $jne->id)->count());
        $this->assertDatabaseHas('expedition_services', [
            'expedition_id' => $jne->id,
            'service_code' => 'REG',
            'service_name' => 'Reguler',
        ]);
    }

    public function test_sync_is_idempotent(): void
    {
        $this->configureShipping();
        $this->fakeProvider();

        $service = app(ExpeditionSyncService::class);
        $service->sync();
        $service->sync();

        $this->assertSame(2, Expedition::count());
        $this->assertSame(4, ExpeditionService::count());
    }

    public function test_sync_preserves_local_overrides(): void
    {
        $this->configureShipping();
        $this->fakeProvider();

        $service = app(ExpeditionSyncService::class);
        $service->sync();

        $jne = Expedition::where('code', 'jne')->firstOrFail();
        $jne->update(['base_cost' => 17000, 'is_free' => true]);

        $this->fakeProvider();
        $service->sync();

        $jne->refresh();
        $this->assertEquals(17000, (float) $jne->base_cost);
        $this->assertTrue((bool) $jne->is_free);
    }

    public function test_sync_returns_zero_when_not_configured(): void
    {
        Http::fake();

        $result = app(ExpeditionSyncService::class)->sync();

        $this->assertSame(0, $result['couriers']);
        $this->assertSame(0, $result['services']);
        $this->assertSame(0, Expedition::count());
    }

    public function test_command_reports_when_not_configured(): void
    {
        Http::fake();

        $this->artisan('expeditions:sync')
            ->expectsOutputToContain('belum dikonfigurasi')
            ->assertExitCode(1);
    }

    public function test_command_runs_sync(): void
    {
        $this->configureShipping();
        $this->fakeProvider();

        $this->artisan('expeditions:sync')
            ->expectsOutput('Sinkronisasi selesai: 2 kurir, 4 layanan.')
            ->assertExitCode(0);

        $this->assertSame(2, Expedition::count());
    }
}
