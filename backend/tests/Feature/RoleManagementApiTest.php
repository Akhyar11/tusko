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

class RoleManagementApiTest extends TestCase
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

    private function payload(array $override = []): array
    {
        return array_merge([
            'name' => 'supervisor_' . uniqid(),
            'display_name' => 'Supervisor Gudang',
            'description' => 'Mengawasi operasional gudang',
        ], $override);
    }

    public function test_admin_can_list_roles_with_counts_and_filters(): void
    {
        $this->actingAsAdmin();

        $response = $this->getJson('/api/admin/roles?per_page=100')->assertStatus(200);
        $this->assertGreaterThanOrEqual(4, $response->json('total'));
        $this->assertArrayHasKey('users_count', $response->json('data.0'));
        $this->assertArrayHasKey('menus_count', $response->json('data.0'));

        $system = $this->getJson('/api/admin/roles?is_system=1&per_page=100')->assertStatus(200);
        foreach ($system->json('data') as $row) {
            $this->assertTrue($row['is_system']);
        }

        $search = $this->getJson('/api/admin/roles?search=finance')->assertStatus(200);
        $this->assertSame(1, $search->json('total'));

        $withMenus = $this->getJson('/api/admin/roles?menus_min=1&per_page=100')->assertStatus(200);
        foreach ($withMenus->json('data') as $row) {
            $this->assertGreaterThanOrEqual(1, $row['menus_count']);
        }

        $withoutUsers = $this->getJson('/api/admin/roles?users_max=0&per_page=100')->assertStatus(200);
        foreach ($withoutUsers->json('data') as $row) {
            $this->assertSame(0, $row['users_count']);
        }
    }

    public function test_admin_can_create_role(): void
    {
        $this->actingAsAdmin();

        $payload = $this->payload();
        $response = $this->postJson('/api/admin/roles', $payload)->assertStatus(201);

        $role = Role::where('name', $payload['name'])->firstOrFail();
        $this->assertFalse($role->is_system);
        $this->assertDatabaseHas('activity_logs', ['action' => 'role.created', 'subject_id' => $role->id]);
        $response->assertJsonPath('data.display_name', 'Supervisor Gudang');
    }

    public function test_create_validates_unique_and_format(): void
    {
        $this->actingAsAdmin();

        $this->postJson('/api/admin/roles', $this->payload(['name' => 'admin']))
            ->assertStatus(422)->assertJsonValidationErrors('name');

        $this->postJson('/api/admin/roles', $this->payload(['name' => 'nama ada spasi']))
            ->assertStatus(422)->assertJsonValidationErrors('name');
    }

    public function test_admin_can_update_custom_role_but_not_system_role_name(): void
    {
        $this->actingAsAdmin();
        $role = Role::create(['name' => 'custom_role', 'display_name' => 'Custom', 'is_system' => false]);

        $this->putJson("/api/admin/roles/{$role->id}", [
            'name' => 'custom_role_renamed',
            'display_name' => 'Custom Diubah',
            'description' => 'Deskripsi baru',
        ])->assertStatus(200)->assertJsonPath('data.name', 'custom_role_renamed');

        $adminRole = Role::where('name', 'admin')->firstOrFail();
        $this->putJson("/api/admin/roles/{$adminRole->id}", [
            'name' => 'admin_renamed',
            'display_name' => 'Admin',
        ])->assertStatus(422);
    }

    public function test_admin_can_delete_custom_role_without_dependencies(): void
    {
        $this->actingAsAdmin();
        $role = Role::create(['name' => 'hapus_role', 'display_name' => 'Hapus', 'is_system' => false]);

        $this->deleteJson("/api/admin/roles/{$role->id}")->assertStatus(200);
        $this->assertDatabaseMissing('roles', ['id' => $role->id]);
        $this->assertDatabaseHas('activity_logs', ['action' => 'role.deleted']);
    }

    public function test_cannot_delete_system_role_or_role_in_use(): void
    {
        $this->actingAsAdmin();

        $adminRole = Role::where('name', 'admin')->firstOrFail();
        $this->deleteJson("/api/admin/roles/{$adminRole->id}")->assertStatus(422);

        $withUser = Role::create(['name' => 'with_user', 'display_name' => 'With User', 'is_system' => false]);
        $user = User::factory()->create(['role' => 'customer']);
        $user->roles()->attach($withUser->id, ['created_at' => now()]);
        $this->deleteJson("/api/admin/roles/{$withUser->id}")->assertStatus(422);

        $withMenu = Role::create(['name' => 'with_menu', 'display_name' => 'With Menu', 'is_system' => false]);
        $menu = Menu::firstOrFail();
        $withMenu->menus()->attach($menu->id, ['created_at' => now()]);
        $this->deleteJson("/api/admin/roles/{$withMenu->id}")->assertStatus(422);
    }

    public function test_non_admin_is_forbidden(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'customer', 'is_active' => true]));

        $this->getJson('/api/admin/roles')->assertStatus(403);
        $this->postJson('/api/admin/roles', $this->payload())->assertStatus(403);
    }

    public function test_guest_is_unauthorized(): void
    {
        $this->getJson('/api/admin/roles')->assertStatus(401);
    }
}
