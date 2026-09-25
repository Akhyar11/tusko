<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\MasterReferenceSeeder;
use Database\Seeders\MenuSeeder;
use Database\Seeders\SettingsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SettingsMenuGuardTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::factory()->create(['role' => 'admin', 'is_active' => true]);
    }

    public function test_admin_without_settings_menu_is_forbidden(): void
    {
        $this->seed(MasterReferenceSeeder::class);
        $this->seed(SettingsSeeder::class);

        Sanctum::actingAs($this->admin());

        $this->getJson('/api/admin/settings')->assertStatus(403);
        $this->putJson('/api/admin/settings/shipping', ['shipping.rate_cache_ttl' => 300])->assertStatus(403);
        $this->postJson('/api/admin/settings/shipping/test-connection')->assertStatus(403);
    }

    public function test_admin_with_settings_menu_is_allowed(): void
    {
        $this->seed(MasterReferenceSeeder::class);
        $this->seed(MenuSeeder::class);
        $this->seed(SettingsSeeder::class);

        Sanctum::actingAs($this->admin());

        $this->getJson('/api/admin/settings')->assertStatus(200);
        $this->getJson('/api/admin/settings/shipping')->assertStatus(200);
    }
}
