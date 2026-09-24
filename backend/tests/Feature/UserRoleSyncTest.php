<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use Database\Seeders\MasterReferenceSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class UserRoleSyncTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(MasterReferenceSeeder::class);
    }

    public function test_user_creation_syncs_role_pivot(): void
    {
        $user = User::create([
            'name' => 'Admin Sync',
            'email' => 'admin-sync-' . uniqid() . '@example.test',
            'password' => 'password123',
            'role' => 'admin',
        ]);

        $this->assertSame(['admin'], $user->roles()->pluck('roles.name')->all());
    }

    public function test_role_change_resyncs_pivot(): void
    {
        $user = User::create([
            'name' => 'User Sync',
            'email' => 'user-sync-' . uniqid() . '@example.test',
            'password' => 'password123',
            'role' => 'admin',
        ]);

        $user->update(['role' => 'customer']);

        $this->assertSame(['customer'], $user->roles()->pluck('roles.name')->all());
    }

    public function test_backfill_command_syncs_existing_users(): void
    {
        $roleId = Role::where('name', 'admin')->value('id');

        $userId = DB::table('users')->insertGetId([
            'name' => 'Backfill User',
            'email' => 'backfill-' . uniqid() . '@example.test',
            'password' => Hash::make('password123'),
            'role' => 'admin',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->artisan('rbac:sync-user-roles')->assertExitCode(0);

        $this->assertDatabaseHas('user_roles', [
            'user_id' => $userId,
            'role_id' => $roleId,
        ]);
    }
}
