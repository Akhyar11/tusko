<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use Database\Seeders\MasterReferenceSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class UserRoleAssignmentApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(MasterReferenceSeeder::class);
    }

    private function actingAsAdmin(): User
    {
        $admin = User::factory()->create(['role' => 'admin', 'is_active' => true]);
        Sanctum::actingAs($admin);

        return $admin;
    }

    private function roleId(string $name): int
    {
        return (int) Role::where('name', $name)->value('id');
    }

    public function test_admin_can_assign_multiple_roles_via_pivot(): void
    {
        $this->actingAsAdmin();
        $user = User::factory()->create(['role' => 'customer']);

        $response = $this->postJson("/api/admin/users/{$user->id}/roles", [
            'role_ids' => [$this->roleId('warehouse_staff'), $this->roleId('finance_officer')],
        ])->assertStatus(200);

        $response->assertJsonPath('data.role', 'customer');
        $this->assertEqualsCanonicalizing(
            ['warehouse_staff', 'finance_officer'],
            $user->fresh()->roles()->pluck('roles.name')->all()
        );
        $this->assertDatabaseHas('activity_logs', ['action' => 'user.roles_assigned', 'subject_id' => $user->id]);
    }

    public function test_assigning_admin_role_sets_primary_role_admin(): void
    {
        $this->actingAsAdmin();
        $user = User::factory()->create(['role' => 'customer']);

        $this->postJson("/api/admin/users/{$user->id}/roles", [
            'role_ids' => [$this->roleId('admin'), $this->roleId('warehouse_staff')],
        ])->assertStatus(200)->assertJsonPath('data.role', 'admin');

        $user->refresh();
        $this->assertSame('admin', $user->role);
        $this->assertEqualsCanonicalizing(
            ['admin', 'warehouse_staff'],
            $user->roles()->pluck('roles.name')->all()
        );
    }

    public function test_admin_cannot_remove_own_admin_role(): void
    {
        $admin = $this->actingAsAdmin();

        $this->postJson("/api/admin/users/{$admin->id}/roles", [
            'role_ids' => [$this->roleId('customer')],
        ])->assertStatus(422);
    }

    public function test_assign_role_validates_payload(): void
    {
        $this->actingAsAdmin();
        $user = User::factory()->create();

        $this->postJson("/api/admin/users/{$user->id}/roles", ['role_ids' => []])
            ->assertStatus(422)
            ->assertJsonValidationErrors('role_ids');

        $this->postJson("/api/admin/users/{$user->id}/roles", ['role_ids' => [999999]])
            ->assertStatus(422)
            ->assertJsonValidationErrors('role_ids.0');
    }

    public function test_non_admin_is_forbidden(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'customer', 'is_active' => true]));
        $user = User::factory()->create();

        $this->postJson("/api/admin/users/{$user->id}/roles", [
            'role_ids' => [$this->roleId('admin')],
        ])->assertStatus(403);
    }

    public function test_guest_is_unauthorized(): void
    {
        $user = User::factory()->create();

        $this->postJson("/api/admin/users/{$user->id}/roles", [
            'role_ids' => [$this->roleId('admin')],
        ])->assertStatus(401);
    }
}
