<?php

namespace Tests\Feature;

use App\Models\Menu;
use App\Models\Role;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class MenuModelTest extends TestCase
{
    use RefreshDatabase;

    private function role(string $name = 'admin'): Role
    {
        return Role::create([
            'name' => $name,
            'display_name' => ucfirst($name),
            'description' => 'Role uji menu',
            'is_system' => true,
        ]);
    }

    private function menu(array $attributes = []): Menu
    {
        return Menu::create(array_merge([
            'environment' => 'admin',
            'section' => 'Katalog & Inventaris',
            'label' => 'Produk & Varian SKU',
            'sublabel' => 'Katalog produk, harga & SKU',
            'path_prefix' => '/admin/product',
            'view_key' => 'products-admin',
            'icon' => 'Package',
            'feature_flag' => 'feature_flags.products_menu',
            'sort_order' => 10,
            'is_active' => true,
        ], $attributes));
    }

    public function test_menus_schema_has_expected_columns(): void
    {
        $this->assertTrue(Schema::hasTable('menus'));
        $this->assertTrue(Schema::hasTable('role_menus'));

        foreach ([
            'id',
            'parent_id',
            'environment',
            'section',
            'label',
            'sublabel',
            'path_prefix',
            'view_key',
            'icon',
            'feature_flag',
            'sort_order',
            'is_active',
        ] as $column) {
            $this->assertTrue(Schema::hasColumn('menus', $column), "Kolom menus.{$column} tidak ada.");
        }

        foreach (['role_id', 'menu_id', 'created_at'] as $column) {
            $this->assertTrue(Schema::hasColumn('role_menus', $column), "Kolom role_menus.{$column} tidak ada.");
        }
    }

    public function test_menu_persists_attributes_with_casts(): void
    {
        $menu = $this->menu(['sort_order' => '5', 'is_active' => 0])->fresh();

        $this->assertSame('admin', $menu->environment);
        $this->assertSame('/admin/product', $menu->path_prefix);
        $this->assertSame('products-admin', $menu->view_key);
        $this->assertSame(5, $menu->sort_order);
        $this->assertFalse($menu->is_active);
    }

    public function test_menu_belongs_to_many_roles_via_role_menus(): void
    {
        $menu = $this->menu();
        $role = $this->role('warehouse_staff');

        $menu->roles()->attach($role->id, ['created_at' => now()]);

        $this->assertDatabaseHas('role_menus', [
            'role_id' => $role->id,
            'menu_id' => $menu->id,
        ]);
        $this->assertTrue($role->fresh()->id === $menu->fresh()->roles->first()->id);
    }

    public function test_menu_parent_children_relationship_is_ordered(): void
    {
        $parent = $this->menu(['label' => 'Pengadaan', 'path_prefix' => '/admin/procurement']);

        $later = $this->menu(['label' => 'Tagihan', 'path_prefix' => '/admin/procurement/bill', 'parent_id' => $parent->id, 'sort_order' => 20]);
        $earlier = $this->menu(['label' => 'PO', 'path_prefix' => '/admin/procurement/po', 'parent_id' => $parent->id, 'sort_order' => 5]);

        $this->assertSame($parent->id, $later->parent->id);
        $this->assertSame([$earlier->id, $later->id], $parent->children()->pluck('id')->all());
    }

    public function test_scope_active_and_for_environment_filter_menus(): void
    {
        $this->menu(['is_active' => true]);
        $this->menu(['is_active' => false, 'path_prefix' => '/admin/inactive']);
        $this->menu(['environment' => 'storefront', 'path_prefix' => '/catalog', 'view_key' => 'catalog']);

        $this->assertSame(1, Menu::query()->active()->forEnvironment('admin')->count());
        $this->assertSame(1, Menu::query()->forEnvironment('storefront')->count());
    }

    public function test_deleting_menu_cascades_role_menus_pivot(): void
    {
        $menu = $this->menu();
        $role = $this->role('finance_officer');
        $menu->roles()->attach($role->id, ['created_at' => now()]);

        $menu->delete();

        $this->assertDatabaseMissing('role_menus', ['menu_id' => $menu->id]);
    }
}
