<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\Settings\SettingsService;
use Database\Seeders\MasterReferenceSeeder;
use Database\Seeders\MenuSeeder;
use Database\Seeders\SettingsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SettingsSecurityTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(MasterReferenceSeeder::class);
        $this->seed(MenuSeeder::class);
        $this->seed(SettingsSeeder::class);
    }

    private function admin(): User
    {
        return User::factory()->create(['role' => 'admin', 'is_active' => true]);
    }

    public function test_secrets_never_leak_in_responses_or_logs(): void
    {
        Sanctum::actingAs($this->admin());

        app(SettingsService::class)->setGroup('payment', [
            'payment.midtrans_server_key' => 'SECRET-LEAK-TEST',
        ]);

        $all = $this->getJson('/api/admin/settings');
        $all->assertStatus(200);
        $this->assertStringNotContainsString('SECRET-LEAK-TEST', $all->getContent());

        $group = $this->getJson('/api/admin/settings/payment');
        $group->assertStatus(200);
        $this->assertStringNotContainsString('SECRET-LEAK-TEST', $group->getContent());
        $this->assertSame('********', $group->json('data.values')['payment.midtrans_server_key']);

        $rawLog = (string) DB::table('activity_logs')->where('action', 'settings.updated')->value('properties');
        $this->assertStringNotContainsString('SECRET-LEAK-TEST', $rawLog);
    }

    public function test_unauthenticated_is_rejected(): void
    {
        $this->getJson('/api/admin/settings')->assertStatus(401);
        $this->putJson('/api/admin/settings/shipping', ['shipping.rate_cache_ttl' => 300])->assertStatus(401);
    }

    public function test_non_admin_is_forbidden(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'customer']));

        $this->getJson('/api/admin/settings')->assertStatus(403);
        $this->putJson('/api/admin/settings/shipping', ['shipping.rate_cache_ttl' => 300])->assertStatus(403);
        $this->postJson('/api/admin/settings/shipping/test-connection')->assertStatus(403);
    }

    public function test_rate_limit_applies(): void
    {
        Sanctum::actingAs($this->admin());

        $throttled = false;
        for ($i = 0; $i < 130; $i++) {
            $response = $this->getJson('/api/admin/settings');
            if ($response->status() === 429) {
                $throttled = true;
                break;
            }
        }

        $this->assertTrue($throttled, 'Rate limit 30/menit tidak diterapkan.');
    }
}
