<?php

namespace Tests\Feature;

use App\Models\ActivityLog;
use App\Models\User;
use App\Services\Settings\SettingsService;
use Database\Seeders\MasterReferenceSeeder;
use Database\Seeders\MenuSeeder;
use Database\Seeders\SettingsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SettingsUpdateApiTest extends TestCase
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

    public function test_admin_can_update_group_and_secret_stays_masked(): void
    {
        $response = $this->putJson('/api/admin/settings/shipping', [
            'shipping.base_url' => 'https://api.kiriminaja.test',
            'shipping.api_key' => 'SECRET-KEY-1',
            'shipping.rate_cache_ttl' => 7200,
            'payment.is_production' => true, // key di luar grup → diabaikan
        ]);

        $response->assertStatus(200);

        $values = $response->json('data.values');
        $this->assertSame(7200, $values['shipping.rate_cache_ttl']);
        $this->assertSame('********', $values['shipping.api_key']);
        $this->assertSame('https://api.kiriminaja.test', $values['shipping.base_url']);

        $changed = $response->json('data.changed');
        $this->assertContains('shipping.base_url', $changed);
        $this->assertContains('shipping.rate_cache_ttl', $changed);
        $this->assertNotContains('payment.is_production', $changed);
        $this->assertStringNotContainsString('SECRET-KEY-1', $response->getContent());

        // Nilai tersimpan & dapat dipakai modul.
        $this->assertSame(7200, app(SettingsService::class)->get('shipping.rate_cache_ttl'));
        $this->assertSame('https://api.kiriminaja.test', app(SettingsService::class)->get('shipping.base_url'));

        // activity_logs tercatat tanpa nilai secret.
        $raw = (string) DB::table('activity_logs')->where('action', 'settings.updated')->value('properties');
        $this->assertStringNotContainsString('SECRET-KEY-1', $raw);
        $this->assertNotNull(ActivityLog::where('action', 'settings.updated')->first());
    }

    public function test_invalid_value_is_rejected(): void
    {
        $this->putJson('/api/admin/settings/shipping', [
            'shipping.base_url' => 'not-a-url',
        ])->assertStatus(422)->assertJsonValidationErrors(['shipping.base_url']);
    }

    public function test_invalid_group_returns_404(): void
    {
        $this->putJson('/api/admin/settings/nope', ['x' => 'y'])->assertStatus(404);
    }

    public function test_non_admin_is_forbidden(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'customer']));

        $this->putJson('/api/admin/settings/shipping', ['shipping.rate_cache_ttl' => 300])
            ->assertStatus(403);
    }
}
