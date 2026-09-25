<?php

namespace Tests\Feature;

use App\Models\Menu;
use App\Models\Role;
use Database\Seeders\MasterReferenceSeeder;
use Database\Seeders\MenuSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MenuSeederTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(MasterReferenceSeeder::class);
    }

    public function test_seeder_populates_admin_and_storefront_menus(): void
    {
        $this->seed(MenuSeeder::class);

        $this->assertSame(20, Menu::where('environment', 'admin')->count());
        $this->assertSame(3, Menu::where('environment', 'storefront')->count());

        $product = Menu::where('path_prefix', '/admin/product')->firstOrFail();
        $this->assertSame('products-admin', $product->view_key);
        $this->assertSame('Package', $product->icon);
        $this->assertTrue($product->is_active);

        $settings = Menu::where('path_prefix', '/admin/settings')->firstOrFail();
        $this->assertSame('feature_flags.settings_menu', $settings->feature_flag);
    }

    public function test_seeder_assigns_all_admin_menus_to_admin_role_only(): void
    {
        $this->seed(MenuSeeder::class);

        $adminRole = Role::where('name', 'admin')->firstOrFail();
        $adminMenuIds = Menu::where('environment', 'admin')->pluck('id')->all();

        $this->assertSame(count($adminMenuIds), $adminRole->menus()->count());
        $this->assertEmpty(array_diff($adminMenuIds, $adminRole->menus()->pluck('menus.id')->all()));

        // Storefront bersifat publik: tidak ada role yang menempel.
        $storefrontMenus = Menu::where('environment', 'storefront')->get();
        foreach ($storefrontMenus as $menu) {
            $this->assertSame(0, $menu->roles()->count());
        }

        // Role non-admin tidak otomatis mendapat menu.
        $warehouse = Role::where('name', 'warehouse_staff')->firstOrFail();
        $this->assertSame(0, $warehouse->menus()->count());
    }

    public function test_seeder_is_idempotent(): void
    {
        $this->seed(MenuSeeder::class);

        $menuCount = Menu::count();
        $pivotCount = \Illuminate\Support\Facades\DB::table('role_menus')->count();

        $this->seed(MenuSeeder::class);

        $this->assertSame($menuCount, Menu::count());
        $this->assertSame($pivotCount, \Illuminate\Support\Facades\DB::table('role_menus')->count());
    }
}
