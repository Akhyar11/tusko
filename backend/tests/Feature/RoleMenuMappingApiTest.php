<?php

namespace Tests\Feature;

use App\Models\Menu;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\MasterReferenceSeeder;
use Database\Seeders\MenuSeeder;
use Database\Seeders\SettingsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class RoleMenuMappingApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(MasterReferenceSeeder::class);
        $this->seed(SettingsSeeder::class);
        $this->seed(MenuSeeder::class);
    }

    private function actingAsAdmin(): User
    {
        $admin = User::factory()->create(['role' => 'admin', 'is_active' => true]);
        Sanctum::actingAs($admin);

        return $admin;
    }

    public function test_admin_can_fetch_role_menu_matrix(): void
    {
        $this->actingAsAdmin();
        $role = Role::where('name', 'warehouse_staff')->firstOrFail();

        $response = $this->getJson("/api/admin/roles/{$role->id}/menus")->assertStatus(200);

        $this->assertIsArray($response->json('data.menu_ids'));
        $this->assertNotEmpty($response->json('data.menus'));
        $this->assertSame($role->menus()->count(), count($response->json('data.menu_ids')));
    }

    public function test_admin_can_sync_role_menus(): void
    {
        $this->actingAsAdmin();
        $role = Role::create(['name' => 'mapping_role', 'display_name' => 'Mapping', 'is_system' => false]);
        $menuIds = Menu::whereIn('view_key', ['products-admin', 'stock'])->pluck('id')->all();

        $response = $this->putJson("/api/admin/roles/{$role->id}/menus", ['menu_ids' => $menuIds])
            ->assertStatus(200);

        $this->assertSame(2, $response->json('data.menus_count'));
        $this->assertEqualsCanonicalizing($menuIds, $role->fresh()->menus()->pluck('menus.id')->all());
        $this->assertDatabaseHas('activity_logs', ['action' => 'role.menus_synced', 'subject_id' => $role->id]);
    }

    public function test_sync_validates_menu_ids(): void
    {
        $this->actingAsAdmin();
        $role = Role::create(['name' => 'mapping_invalid', 'display_name' => 'Mapping', 'is_system' => false]);

        $this->putJson("/api/admin/roles/{$role->id}/menus", ['menu_ids' => [999999]])
            ->assertStatus(422)
            ->assertJsonValidationErrors('menu_ids.0');

        $this->putJson("/api/admin/roles/{$role->id}/menus", [])
            ->assertStatus(422)
            ->assertJsonValidationErrors('menu_ids');
    }

    public function test_admin_role_cannot_lose_core_rbac_menus(): void
    {
        $this->actingAsAdmin();
        $adminRole = Role::where('name', 'admin')->firstOrFail();

        $this->putJson("/api/admin/roles/{$adminRole->id}/menus", ['menu_ids' => []])
            ->assertStatus(422);
    }

    public function test_non_admin_is_forbidden(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'customer', 'is_active' => true]));
        $role = Role::where('name', 'warehouse_staff')->firstOrFail();

        $this->getJson("/api/admin/roles/{$role->id}/menus")->assertStatus(403);
        $this->putJson("/api/admin/roles/{$role->id}/menus", ['menu_ids' => []])->assertStatus(403);
    }

    public function test_guest_is_unauthorized(): void
    {
        $role = Role::where('name', 'warehouse_staff')->firstOrFail();

        $this->getJson("/api/admin/roles/{$role->id}/menus")->assertStatus(401);
    }
}
