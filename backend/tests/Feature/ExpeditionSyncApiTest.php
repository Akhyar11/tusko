<?php

namespace Tests\Feature;

use App\Models\Expedition;
use App\Models\User;
use App\Services\Settings\SettingsService;
use Database\Seeders\MasterReferenceSeeder;
use Database\Seeders\SettingsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ExpeditionSyncApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(MasterReferenceSeeder::class);
        $this->seed(SettingsSeeder::class);
    }

    private function actingAsAdmin(): User
    {
        $admin = User::factory()->create(['role' => 'admin', 'is_active' => true]);
        Sanctum::actingAs($admin);

        return $admin;
    }

    private function configureShipping(): void
    {
        app(SettingsService::class)->setGroup('shipping', [
            'shipping.base_url' => 'https://kiriminaja.test',
            'shipping.api_key' => 'secret-key',
        ]);
    }

    public function test_admin_can_sync_couriers_from_integration(): void
    {
        $this->actingAsAdmin();
        $this->configureShipping();

        Http::fake([
            '*/api/mitra/couriers' => Http::response(['datas' => [['code' => 'jne', 'name' => 'JNE', 'type' => 'Reguler']]]),
            '*/api/mitra/courier_services' => Http::response(['datas' => [['code' => 'REG', 'name' => 'JNE Reguler']]]),
        ]);

        $response = $this->postJson('/api/admin/expeditions/sync')->assertStatus(200);

        $response->assertJsonPath('data.couriers', 1);
        $response->assertJsonPath('data.services', 1);
        $this->assertDatabaseHas('expeditions', ['code' => 'jne']);
        $this->assertDatabaseHas('expedition_services', ['service_code' => 'REG']);
    }

    public function test_sync_requires_configuration(): void
    {
        $this->actingAsAdmin();

        $this->postJson('/api/admin/expeditions/sync')->assertStatus(422);
    }

    public function test_non_admin_forbidden_and_guest_unauthorized(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'customer', 'is_active' => true]));
        $this->postJson('/api/admin/expeditions/sync')->assertStatus(403);
    }

    public function test_guest_is_unauthorized(): void
    {
        $this->postJson('/api/admin/expeditions/sync')->assertStatus(401);
    }
}
