<?php

namespace Tests\Feature;

use Database\Seeders\MasterReferenceSeeder;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class PermissionSeederTest extends TestCase
{
    use RefreshDatabase;

    private function seedRbac(): void
    {
        $this->seed(MasterReferenceSeeder::class);
        $this->seed(PermissionSeeder::class);
    }

    public function test_permission_seeder_populates_catalog_and_maps_roles(): void
    {
        $this->seedRbac();

        $total = DB::table('permissions')->count();
        $this->assertSame(26, $total);

        // admin mendapat seluruh permission.
        $adminId = (int) DB::table('roles')->where('name', 'admin')->value('id');
        $this->assertSame(
            $total,
            DB::table('role_permissions')->where('role_id', $adminId)->count()
        );

        // warehouse_staff punya permission inventori, bukan keuangan.
        $warehouseId = (int) DB::table('roles')->where('name', 'warehouse_staff')->value('id');
        $warehousePermissions = DB::table('role_permissions')
            ->join('permissions', 'permissions.id', '=', 'role_permissions.permission_id')
            ->where('role_permissions.role_id', $warehouseId)
            ->pluck('permissions.code');

        $this->assertTrue($warehousePermissions->contains('inventory.adjust'));
        $this->assertTrue($warehousePermissions->contains('grn.manage'));
        $this->assertFalse($warehousePermissions->contains('journals.manage'));

        // finance_officer punya permission keuangan.
        $financeId = (int) DB::table('roles')->where('name', 'finance_officer')->value('id');
        $financePermissions = DB::table('role_permissions')
            ->join('permissions', 'permissions.id', '=', 'role_permissions.permission_id')
            ->where('role_permissions.role_id', $financeId)
            ->pluck('permissions.code');

        $this->assertTrue($financePermissions->contains('journals.manage'));

        // customer tanpa permission.
        $customerId = (int) DB::table('roles')->where('name', 'customer')->value('id');
        $this->assertSame(0, DB::table('role_permissions')->where('role_id', $customerId)->count());
    }

    public function test_permission_seeder_is_idempotent(): void
    {
        $this->seedRbac();

        $permissionCount = DB::table('permissions')->count();
        $mappingCount = DB::table('role_permissions')->count();

        $this->seed(PermissionSeeder::class);

        $this->assertSame($permissionCount, DB::table('permissions')->count());
        $this->assertSame($mappingCount, DB::table('role_permissions')->count());
    }
}
