<?php

namespace Tests\Feature;

use App\Models\Menu;
use App\Models\Role;
use App\Models\User;
use App\Services\Settings\SettingsService;
use Database\Seeders\MasterReferenceSeeder;
use Database\Seeders\MenuSeeder;
use Database\Seeders\SettingsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AuthMenuEndpointTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(MasterReferenceSeeder::class);
        $this->seed(SettingsSeeder::class);
        $this->seed(MenuSeeder::class);
    }

    private function admin(): User
    {
        return User::factory()->create(['role' => 'admin', 'is_active' => true]);
    }

    private function employee(string $roleName): User
    {
        $user = User::factory()->create(['role' => 'customer', 'is_active' => true]);
        $user->roles()->attach(Role::where('name', $roleName)->value('id'), ['created_at' => now()]);

        return $user;
    }

    public function test_guest_gets_public_storefront_menus_only(): void
    {
        $response = $this->getJson('/api/auth/menus');

        $response->assertStatus(200);
        $this->assertSame([], $response->json('data.admin'));
        $this->assertCount(3, $response->json('data.storefront'));

        $paths = collect($response->json('data.storefront'))->pluck('path_prefix');
        $this->assertTrue($paths->contains('/'));
        $this->assertTrue($paths->contains('/cart'));
        $this->assertTrue($paths->contains('/profile'));
    }

    public function test_admin_gets_admin_menus_minus_disabled_feature_flags(): void
    {
        Sanctum::actingAs($this->admin());

        $response = $this->getJson('/api/auth/menus')->assertStatus(200);

        $paths = collect($response->json('data.admin'))->pluck('path_prefix');
        $this->assertTrue($paths->contains('/admin/product'));
        $this->assertTrue($paths->contains('/admin/settings'));
        // finance_menu default false -> Buku Kas tidak tampil.
        $this->assertFalse($paths->contains('/admin/transaction'));
        $this->assertCount(16, $response->json('data.admin'));
        $this->assertCount(3, $response->json('data.storefront'));
    }

    public function test_enabling_feature_flag_exposes_flagged_menu(): void
    {
        app(SettingsService::class)->setGroup('feature_flags', ['feature_flags.finance_menu' => true]);

        Sanctum::actingAs($this->admin());

        $response = $this->getJson('/api/auth/menus')->assertStatus(200);

        $paths = collect($response->json('data.admin'))->pluck('path_prefix');
        $this->assertTrue($paths->contains('/admin/transaction'));
        $this->assertCount(17, $response->json('data.admin'));
    }

    public function test_limited_role_only_sees_assigned_menus(): void
    {
        $warehouse = $this->employee('warehouse_staff');
        $stockMenu = Menu::where('path_prefix', '/admin/stock')->firstOrFail();
        Role::where('name', 'warehouse_staff')->firstOrFail()
            ->menus()
            ->syncWithoutDetaching([$stockMenu->id]);

        Sanctum::actingAs($warehouse);

        $response = $this->getJson('/api/auth/menus')->assertStatus(200);

        $paths = collect($response->json('data.admin'))->pluck('path_prefix');
        $this->assertTrue($paths->contains('/admin/stock'));
        $this->assertFalse($paths->contains('/admin/settings'));
        $this->assertCount(1, $response->json('data.admin'));
        $this->assertCount(3, $response->json('data.storefront'));
    }
}
