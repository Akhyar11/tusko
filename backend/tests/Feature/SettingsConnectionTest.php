<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\Settings\SettingsService;
use Database\Seeders\MasterReferenceSeeder;
use Database\Seeders\MenuSeeder;
use Database\Seeders\SettingsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SettingsConnectionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(MasterReferenceSeeder::class);
        $this->seed(MenuSeeder::class);
        $this->seed(SettingsSeeder::class);
        Sanctum::actingAs(User::factory()->create(['role' => 'admin', 'is_active' => true]));
    }

    public function test_shipping_connection_ping(): void
    {
        app(SettingsService::class)->setGroup('shipping', [
            'shipping.base_url' => 'https://api.kiriminaja.test',
            'shipping.api_key' => 'KEY-1',
        ]);

        Http::fake(['*' => Http::response(['ok' => true], 200)]);

        $this->postJson('/api/admin/settings/shipping/test-connection')
            ->assertStatus(200)
            ->assertJsonPath('data.ok', true);
    }

    public function test_payment_connection_uses_midtrans_credentials(): void
    {
        app(SettingsService::class)->setGroup('payment', [
            'payment.midtrans_server_key' => 'SB-Mid-server-test',
            'payment.snap_url' => 'https://app.sandbox.midtrans.com/snap/v1/transactions',
        ]);

        Http::fake(['*' => Http::response([], 200)]);

        $this->postJson('/api/admin/settings/payment/test-connection')
            ->assertStatus(200)
            ->assertJsonPath('data.ok', true);
    }

    public function test_storage_connection_writes_probe_object(): void
    {
        Storage::fake('local');

        app(SettingsService::class)->setGroup('storage', ['storage.disk' => 'local']);

        $this->postJson('/api/admin/settings/storage/test-connection')
            ->assertStatus(200)
            ->assertJsonPath('data.ok', true)
            ->assertJsonPath('data.details.disk', 'local');
    }

    public function test_unsupported_group_returns_422(): void
    {
        $this->postJson('/api/admin/settings/loyalty/test-connection')->assertStatus(422);
    }

    public function test_non_admin_is_forbidden(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'customer']));

        $this->postJson('/api/admin/settings/shipping/test-connection')->assertStatus(403);
    }
}
