<?php

namespace Tests\Feature;

use App\Models\Menu;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\MasterReferenceSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class MenuAccessGuardTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(MasterReferenceSeeder::class);

        Route::middleware('menu.access:/admin/product/create')->get('/api/__menu-product', fn () => response()->json(['ok' => true]));
        Route::middleware('menu.access:products-admin')->get('/api/__menu-view', fn () => response()->json(['ok' => true]));
        Route::middleware('menu.access')->get('/api/admin/__derived', fn () => response()->json(['ok' => true]));
    }

    private function role(string $name): Role
    {
        return Role::where('name', $name)->firstOrFail();
    }

    /**
     * @param  array<int, string>  $roleNames
     */
    private function menu(array $attributes, array $roleNames): Menu
    {
        $menu = Menu::create(array_merge([
            'environment' => 'admin',
            'section' => 'Katalog & Inventaris',
            'label' => 'Produk & Varian SKU',
            'sublabel' => 'Katalog produk, harga & SKU',
            'path_prefix' => '/admin/product',
            'view_key' => 'products-admin',
            'icon' => 'Package',
            'sort_order' => 10,
            'is_active' => true,
        ], $attributes));

        foreach ($roleNames as $roleName) {
            $menu->roles()->attach($this->role($roleName)->id, ['created_at' => now()]);
        }

        return $menu;
    }

    private function user(string $role): User
    {
        static $sequence = 0;
        $sequence++;

        return User::create([
            'name' => 'Menu Guard ' . $sequence,
            'email' => 'menu-guard' . $sequence . '-' . uniqid() . '@example.test',
            'password' => 'password123',
            'role' => $role,
            'is_active' => true,
        ]);
    }

    private function userWithPivotRole(string $roleName): User
    {
        $user = $this->user('customer');
        $user->roles()->attach($this->role($roleName)->id, ['created_at' => now()]);

        return $user;
    }

    public function test_admin_role_with_matching_prefix_can_reach_subpath(): void
    {
        $this->menu([], ['admin']);

        Sanctum::actingAs($this->user('admin'));

        $this->getJson('/api/__menu-product')->assertStatus(200);
    }

    public function test_menu_view_key_matches_requested_view(): void
    {
        $this->menu([], ['admin']);

        Sanctum::actingAs($this->user('admin'));

        $this->getJson('/api/__menu-view')->assertStatus(200);
    }

    public function test_derived_path_from_request_is_matched(): void
    {
        $this->menu(['path_prefix' => '/admin', 'view_key' => 'admin-dashboard'], ['admin']);

        Sanctum::actingAs($this->user('admin'));

        $this->getJson('/api/admin/__derived')->assertStatus(200);
    }

    public function test_pivot_role_menu_grants_access(): void
    {
        $this->menu([], ['warehouse_staff']);

        Sanctum::actingAs($this->userWithPivotRole('warehouse_staff'));

        $this->getJson('/api/__menu-product')->assertStatus(200);
    }

    public function test_role_without_matching_menu_is_rejected(): void
    {
        $this->menu(['path_prefix' => '/admin/inventory', 'view_key' => 'stock'], ['warehouse_staff']);

        Sanctum::actingAs($this->userWithPivotRole('warehouse_staff'));

        $this->getJson('/api/__menu-product')->assertStatus(403);
        $this->getJson('/api/__menu-view')->assertStatus(403);
    }

    public function test_inactive_menu_does_not_grant_access(): void
    {
        $this->menu(['is_active' => false], ['admin']);

        Sanctum::actingAs($this->user('admin'));

        $this->getJson('/api/__menu-product')->assertStatus(403);
    }

    public function test_disabled_feature_flag_menu_does_not_grant_access(): void
    {
        $this->menu(['feature_flag' => 'feature_flags.finance_menu'], ['admin']);

        Sanctum::actingAs($this->user('admin'));

        $this->getJson('/api/__menu-product')->assertStatus(403);
    }

    public function test_storefront_menu_does_not_grant_admin_access(): void
    {
        $this->menu(['environment' => 'storefront'], ['admin']);

        Sanctum::actingAs($this->user('admin'));

        $this->getJson('/api/__menu-product')->assertStatus(403);
    }

    public function test_customer_without_role_menu_is_rejected(): void
    {
        Sanctum::actingAs($this->user('customer'));

        $this->getJson('/api/__menu-product')->assertStatus(403);
    }

    public function test_unauthenticated_is_rejected(): void
    {
        $this->getJson('/api/__menu-product')->assertStatus(401);
    }
}
