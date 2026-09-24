<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use Database\Seeders\MasterReferenceSeeder;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PermissionMiddlewareTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(MasterReferenceSeeder::class);
        $this->seed(PermissionSeeder::class);

        Route::middleware('permission:inventory.adjust')->get('/api/__perm-inventory', fn () => response()->json(['ok' => true]));
        Route::middleware('permission:journals.manage')->get('/api/__perm-finance', fn () => response()->json(['ok' => true]));
    }

    private function user(string $role): User
    {
        static $sequence = 0;
        $sequence++;

        return User::create([
            'name' => 'RBAC ' . $sequence,
            'email' => 'rbac' . $sequence . '-' . uniqid() . '@example.test',
            'password' => 'password123',
            'role' => $role,
            'is_active' => true,
        ]);
    }

    /**
     * users.role enum hanya admin/customer; peran lain dipasang via pivot user_roles (T24.5).
     */
    private function userWithPivotRole(string $roleName): User
    {
        $user = $this->user('customer');
        $roleId = Role::where('name', $roleName)->value('id');
        $user->roles()->attach($roleId, ['created_at' => now()]);

        return $user;
    }

    public function test_admin_is_allowed_for_any_permission(): void
    {
        Sanctum::actingAs($this->user('admin'));

        $this->getJson('/api/__perm-inventory')->assertStatus(200);
        $this->getJson('/api/__perm-finance')->assertStatus(200);
    }

    public function test_warehouse_staff_has_inventory_permission_but_not_finance(): void
    {
        Sanctum::actingAs($this->userWithPivotRole('warehouse_staff'));

        $this->getJson('/api/__perm-inventory')->assertStatus(200);
        $this->getJson('/api/__perm-finance')->assertStatus(403);
    }

    public function test_finance_officer_has_finance_permission_but_not_inventory(): void
    {
        Sanctum::actingAs($this->userWithPivotRole('finance_officer'));

        $this->getJson('/api/__perm-finance')->assertStatus(200);
        $this->getJson('/api/__perm-inventory')->assertStatus(403);
    }

    public function test_customer_has_no_admin_permission(): void
    {
        Sanctum::actingAs($this->user('customer'));

        $this->getJson('/api/__perm-inventory')->assertStatus(403);
    }

    public function test_unauthenticated_is_rejected(): void
    {
        $this->getJson('/api/__perm-inventory')->assertStatus(401);
    }
}
