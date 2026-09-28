<?php

namespace Tests\Feature;

use App\Models\ChartOfAccount;
use App\Models\Menu;
use App\Models\OrderStatus;
use App\Models\Role;
use App\Models\User;
use App\Services\MenuService;
use Database\Seeders\BootstrapSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class BootstrapSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_bootstrap_seeder_populates_reference_and_rbac_data(): void
    {
        $this->seed(BootstrapSeeder::class);

        $adminRole = Role::where('name', 'admin')->first();
        $this->assertNotNull($adminRole, 'role admin tidak dibuat');

        $this->assertGreaterThan(0, Menu::where('environment', 'admin')->count());
        $this->assertGreaterThan(0, DB::table('role_menus')->where('role_id', $adminRole->id)->count());
        $this->assertGreaterThan(0, OrderStatus::count());
        $this->assertGreaterThan(0, ChartOfAccount::count());

        // Efek nyata: user admin memiliki menu admin (tidak lagi "Akses ditolak").
        $adminUser = User::factory()->create(['role' => 'admin']);
        $menus = app(MenuService::class)->adminMenusFor($adminUser);
        $this->assertNotEmpty($menus, 'admin tidak punya menu setelah bootstrap');
    }

    public function test_bootstrap_seeder_is_idempotent(): void
    {
        $this->seed(BootstrapSeeder::class);

        $roleCount = Role::count();
        $menuCount = Menu::count();
        $roleMenuCount = DB::table('role_menus')->count();

        $this->seed(BootstrapSeeder::class);

        $this->assertSame($roleCount, Role::count());
        $this->assertSame($menuCount, Menu::count());
        $this->assertSame($roleMenuCount, DB::table('role_menus')->count());
    }
}
