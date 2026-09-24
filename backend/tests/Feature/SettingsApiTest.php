<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\Settings\SettingsService;
use Database\Seeders\SettingsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SettingsApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(SettingsSeeder::class);
    }

    private function admin(): User
    {
        return User::factory()->create(['role' => 'admin', 'is_active' => true]);
    }

    public function test_admin_can_list_all_settings_groups_with_masked_secret(): void
    {
        Sanctum::actingAs($this->admin());

        app(SettingsService::class)->setGroup('shipping', ['shipping.api_key' => 'SECRET-KEY']);

        $response = $this->getJson('/api/admin/settings');

        $response->assertStatus(200)->assertJsonPath('status', 'success');
        $this->assertCount(8, $response->json('data.groups'));

        $shipping = collect($response->json('data.groups'))->firstWhere('group', 'shipping');
        $this->assertSame('********', $shipping['values']['shipping.api_key']);
        $this->assertStringNotContainsString('SECRET-KEY', $response->getContent());
    }

    public function test_admin_can_get_single_group_with_fields_metadata(): void
    {
        Sanctum::actingAs($this->admin());

        $response = $this->getJson('/api/admin/settings/shipping');

        $response->assertStatus(200)
            ->assertJsonPath('data.group', 'shipping')
            ->assertJsonPath('data.label', 'Pengiriman');

        $this->assertNotEmpty($response->json('data.fields'));
        $this->assertSame(
            'shipping.base_url',
            collect($response->json('data.fields'))->firstWhere('key', 'shipping.base_url')['key']
        );
    }

    public function test_invalid_group_returns_404(): void
    {
        Sanctum::actingAs($this->admin());

        $this->getJson('/api/admin/settings/unknown-group')->assertStatus(404);
    }

    public function test_non_admin_is_forbidden(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'customer']));

        $this->getJson('/api/admin/settings')->assertStatus(403);
        $this->getJson('/api/admin/settings/shipping')->assertStatus(403);
    }

    public function test_unauthenticated_is_rejected(): void
    {
        $this->getJson('/api/admin/settings')->assertStatus(401);
    }
}
