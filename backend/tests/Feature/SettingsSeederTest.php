<?php

namespace Tests\Feature;

use App\Models\Integration;
use App\Services\Settings\SettingsService;
use Database\Seeders\SettingsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SettingsSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_seeder_populates_registry_defaults(): void
    {
        $this->seed(SettingsSeeder::class);

        $this->assertDatabaseHas('integrations', ['key' => 'shipping.rate_cache_ttl', 'group' => 'shipping']);
        $this->assertSame('3600', Integration::where('key', 'shipping.rate_cache_ttl')->value('value'));
        $this->assertSame('12', Integration::where('key', 'loyalty.points_expiry_months')->value('value'));
        $this->assertSame('1', Integration::where('key', 'feature_flags.orders_menu')->value('value'));

        // Secret default null tidak di-seed sebagai baris.
        $this->assertNull(Integration::where('key', 'payment.midtrans_server_key')->first());
    }

    public function test_seeder_is_idempotent(): void
    {
        $this->seed(SettingsSeeder::class);
        $count = Integration::count();

        $this->seed(SettingsSeeder::class);

        $this->assertSame($count, Integration::count());
    }

    public function test_seeder_does_not_overwrite_admin_values(): void
    {
        $this->seed(SettingsSeeder::class);

        app(SettingsService::class)->setGroup('shipping', ['shipping.rate_cache_ttl' => 7200]);

        $this->seed(SettingsSeeder::class);

        $this->assertSame(7200, app(SettingsService::class)->get('shipping.rate_cache_ttl'));
    }

    public function test_sync_command_runs_successfully(): void
    {
        $this->artisan('settings:sync-defaults')->assertExitCode(0);

        $this->assertDatabaseHas('integrations', ['key' => 'shipping.rate_cache_ttl']);
    }
}
