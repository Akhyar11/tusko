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

class AdminMenuApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(MasterReferenceSeeder::class);
        $this->seed(SettingsSeeder::class);
        $this->seed(MenuSeeder::class);
    }

    private function actingAsAdmin(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'admin', 'is_active' => true]));
    }

    private function adminRoleId(): int
    {
        return (int) Role::where('name', 'admin')->value('id');
    }

    /**
     * @return array<string, mixed>
     */
    private function payload(array $override = []): array
    {
        return array_merge([
            'environment' => 'admin',
            'section' => 'Keuangan & Sistem',
            'label' => 'Menu Uji',
            'sublabel' => 'Deskripsi menu uji',
            'path_prefix' => '/admin/menu-uji',
            'view_key' => 'menu-uji',
            'icon' => 'Settings',
            'feature_flag' => null,
            'sort_order' => 99,
            'is_active' => true,
            'role_ids' => [$this->adminRoleId()],
        ], $override);
    }

    public function test_admin_can_list_menus_with_pagination_and_roles(): void
    {
        $this->actingAsAdmin();

        $response = $this->getJson('/api/admin/menus?per_page=100');

        $response->assertStatus(200);
        $this->assertSame(24, $response->json('total'));

        $product = collect($response->json('data'))->firstWhere('path_prefix', '/admin/product');
        $this->assertNotNull($product);
        $this->assertContains($this->adminRoleId(), $product['role_ids']);
        $this->assertArrayHasKey('roles', $product);
    }

    public function test_admin_can_filter_by_environment_and_search(): void
    {
        $this->actingAsAdmin();

        $storefront = $this->getJson('/api/admin/menus?environment=storefront&per_page=100')->assertStatus(200);
        $this->assertSame(3, $storefront->json('total'));

        $search = $this->getJson('/api/admin/menus?search=settings&per_page=100')->assertStatus(200);
        $paths = collect($search->json('data'))->pluck('path_prefix');
        $this->assertTrue($paths->contains('/admin/settings'));
    }

    public function test_admin_can_filter_by_role_sort_order_and_feature_flag(): void
    {
        $this->actingAsAdmin();

        $byRole = $this->getJson('/api/admin/menus?role_id=' . $this->adminRoleId() . '&per_page=100')->assertStatus(200);
        $this->assertSame(21, $byRole->json('total'));

        $bySort = $this->getJson('/api/admin/menus?sort_order_min=50&per_page=100')->assertStatus(200);
        foreach ($bySort->json('data') as $row) {
            $this->assertGreaterThanOrEqual(50, $row['sort_order']);
        }

        $noFlag = $this->getJson('/api/admin/menus?feature_flag=0&per_page=100')->assertStatus(200);
        foreach ($noFlag->json('data') as $row) {
            $this->assertNull($row['feature_flag']);
        }

        $view = $this->getJson('/api/admin/menus?viewSearch=settings&per_page=100')->assertStatus(200);
        $this->assertTrue(collect($view->json('data'))->pluck('view_key')->contains('settings'));
    }

    public function test_admin_can_create_menu_and_assign_roles(): void
    {
        $this->actingAsAdmin();

        $response = $this->postJson('/api/admin/menus', $this->payload());

        $response->assertStatus(201)->assertJsonPath('data.path_prefix', '/admin/menu-uji');

        $menu = Menu::where('path_prefix', '/admin/menu-uji')->firstOrFail();
        $this->assertTrue($menu->roles()->where('roles.id', $this->adminRoleId())->exists());
    }

    public function test_create_validates_required_and_path_prefix_format(): void
    {
        $this->actingAsAdmin();

        $this->postJson('/api/admin/menus', $this->payload(['label' => '']))
            ->assertStatus(422)
            ->assertJsonValidationErrors('label');

        $this->postJson('/api/admin/menus', $this->payload(['path_prefix' => 'admin/tanpa-slash']))
            ->assertStatus(422)
            ->assertJsonValidationErrors('path_prefix');

        $this->postJson('/api/admin/menus', $this->payload(['path_prefix' => '/admin/product']))
            ->assertStatus(422)
            ->assertJsonValidationErrors('path_prefix');
    }

    public function test_admin_can_update_menu_and_sync_roles(): void
    {
        $this->actingAsAdmin();

        $menu = Menu::where('path_prefix', '/admin/product')->firstOrFail();

        $response = $this->putJson("/api/admin/menus/{$menu->id}", $this->payload([
            'path_prefix' => '/admin/product',
            'label' => 'Produk Diperbarui',
            'is_active' => false,
            'role_ids' => [],
        ]));

        $response->assertStatus(200)->assertJsonPath('data.label', 'Produk Diperbarui');

        $menu->refresh();
        $this->assertSame('Produk Diperbarui', $menu->label);
        $this->assertFalse($menu->is_active);
        $this->assertSame(0, $menu->roles()->count());
    }

    public function test_admin_can_toggle_menu_status(): void
    {
        $this->actingAsAdmin();

        $menu = Menu::where('path_prefix', '/admin/product')->firstOrFail();
        $before = $menu->is_active;

        $this->postJson("/api/admin/menus/{$menu->id}/toggle-status")
            ->assertStatus(200)
            ->assertJsonPath('data.is_active', !$before);

        $this->assertSame(!$before, $menu->fresh()->is_active);
    }

    public function test_admin_can_delete_menu(): void
    {
        $this->actingAsAdmin();

        $menu = Menu::create([
            'environment' => 'admin',
            'label' => 'Menu Hapus Uji',
            'path_prefix' => '/admin/hapus-uji',
            'sort_order' => 98,
            'is_active' => true,
        ]);

        $this->deleteJson("/api/admin/menus/{$menu->id}")->assertStatus(200);

        $this->assertDatabaseMissing('menus', ['id' => $menu->id]);
    }

    public function test_role_options_endpoint_returns_roles(): void
    {
        $this->actingAsAdmin();

        $response = $this->getJson('/api/admin/menus/role-options')->assertStatus(200);

        $this->assertCount(4, $response->json('data'));
    }

    public function test_non_admin_is_forbidden(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'customer', 'is_active' => true]));

        $this->getJson('/api/admin/menus')->assertStatus(403);
        $this->postJson('/api/admin/menus', $this->payload())->assertStatus(403);
    }

    public function test_unauthenticated_is_rejected(): void
    {
        $this->getJson('/api/admin/menus')->assertStatus(401);
    }
}
