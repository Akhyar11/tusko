<?php

namespace Tests\Feature;

use App\Models\Category;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * T43.2 — API navbar storefront (pohon kategori).
 */
class StorefrontNavbarApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_navbar_returns_active_navbar_category_tree(): void
    {
        $pria = Category::create(['name' => 'Pria', 'slug' => 'pria', 'sort_order' => 1, 'is_navbar' => true, 'is_active' => true]);
        Category::create(['name' => 'Sepatu Pria', 'slug' => 'sepatu-pria', 'parent_id' => $pria->id, 'sort_order' => 1, 'is_navbar' => true, 'is_active' => true]);
        Category::create(['name' => 'Jaket Pria', 'slug' => 'jaket-pria', 'parent_id' => $pria->id, 'sort_order' => 2, 'is_navbar' => true, 'is_active' => true]);

        $wanita = Category::create(['name' => 'Wanita', 'slug' => 'wanita', 'sort_order' => 2, 'is_navbar' => true, 'is_active' => true]);
        Category::create(['name' => 'Sepatu Wanita', 'slug' => 'sepatu-wanita', 'parent_id' => $wanita->id, 'is_navbar' => true, 'is_active' => true]);

        // Tidak tampil: non-navbar & nonaktif.
        Category::create(['name' => 'Internal', 'slug' => 'internal', 'is_navbar' => false, 'is_active' => true]);
        Category::create(['name' => 'Arsip', 'slug' => 'arsip', 'is_navbar' => true, 'is_active' => false]);

        $response = $this->getJson('/api/storefront/navbar');

        $response->assertStatus(200)
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.name', 'Pria')
            ->assertJsonCount(2, 'data.0.children')
            ->assertJsonPath('data.0.children.0.name', 'Sepatu Pria')
            ->assertJsonPath('data.1.name', 'Wanita')
            ->assertJsonCount(1, 'data.1.children');
    }

    public function test_navbar_orders_by_sort_order(): void
    {
        Category::create(['name' => 'Kedua', 'slug' => 'kedua', 'sort_order' => 2]);
        Category::create(['name' => 'Pertama', 'slug' => 'pertama', 'sort_order' => 1]);

        $this->getJson('/api/storefront/navbar')
            ->assertStatus(200)
            ->assertJsonPath('data.0.name', 'Pertama')
            ->assertJsonPath('data.1.name', 'Kedua');
    }
}
