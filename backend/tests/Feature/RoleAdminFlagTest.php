<?php

namespace Tests\Feature;

use App\Models\Menu;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\MasterReferenceSeeder;
use Database\Seeders\MenuSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class RoleAdminFlagTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(MasterReferenceSeeder::class);
        $this->seed(MenuSeeder::class);
    }

    private function actingAsAdmin(): User
    {
        $admin = User::factory()->create(['role' => 'admin', 'is_active' => true]);
        Sanctum::actingAs($admin);

        return $admin;
    }

    public function test_seeded_admin_role_has_is_admin_true(): void
    {
        $this->assertTrue((bool) Role::where('name', 'admin')->value('is_admin'));
        $this->assertFalse((bool) Role::where('name', 'customer')->value('is_admin'));
    }

    public function test_admin_can_create_role_with_admin_flag(): void
    {
        $this->actingAsAdmin();

        $response = $this->postJson('/api/admin/roles', [
            'name' => 'marketing_lead',
            'display_name' => 'Marketing Lead',
            'description' => 'Akses panel pemasaran',
            'is_admin' => true,
        ])->assertStatus(201);

        $response->assertJsonPath('data.is_admin', true);
        $this->assertTrue((bool) Role::where('name', 'marketing_lead')->value('is_admin'));
    }

    public function test_admin_can_toggle_is_admin_via_update(): void
    {
        $this->actingAsAdmin();

        $role = Role::create([
            'name' => 'finance_officer_x',
            'display_name' => 'Finance X',
            'is_system' => false,
            'is_admin' => false,
        ]);

        $this->putJson("/api/admin/roles/{$role->id}", [
            'display_name' => 'Finance X',
            'is_admin' => true,
        ])->assertStatus(200)->assertJsonPath('data.is_admin', true);

        $this->assertTrue((bool) $role->fresh()->is_admin);
    }

    public function test_auth_menus_reports_is_admin_flag(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'admin', 'is_active' => true]));
        $this->getJson('/api/auth/menus')->assertStatus(200)->assertJsonPath('data.is_admin', true);

        Sanctum::actingAs(User::factory()->create(['role' => 'customer', 'is_active' => true]));
        $this->getJson('/api/auth/menus')->assertStatus(200)->assertJsonPath('data.is_admin', false);
    }

    public function test_non_admin_role_with_flag_can_access_admin_panel(): void
    {
        // Role non-'admin' tapi bertanda is_admin + punya menu -> boleh akses panel.
        $marketing = Role::create([
            'name' => 'marketing',
            'display_name' => 'Marketing',
            'is_system' => false,
            'is_admin' => true,
        ]);
        $marketing->menus()->attach(
            Menu::where('view_key', 'roles-admin')->value('id'),
            ['created_at' => now()]
        );

        $user = User::factory()->create(['role' => 'customer', 'is_active' => true]);
        $user->roles()->attach($marketing->id, ['created_at' => now()]);

        Sanctum::actingAs($user);

        $this->getJson('/api/admin/roles')->assertStatus(200);
    }
}
