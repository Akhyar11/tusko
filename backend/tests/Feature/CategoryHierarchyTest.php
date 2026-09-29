<?php

namespace Tests\Feature;

use App\Models\Category;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * T43.1 — Kolom navigasi kategori + pencegahan siklus hierarki.
 */
class CategoryHierarchyTest extends TestCase
{
    use RefreshDatabase;

    public function test_category_accepts_navigation_fields(): void
    {
        $response = $this->postJson('/api/categories', [
            'name' => 'Pria',
            'slug' => 'pria',
            'sort_order' => 5,
            'is_navbar' => true,
            'is_active' => true,
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('categories', [
            'slug' => 'pria',
            'sort_order' => 5,
            'is_navbar' => true,
            'is_active' => true,
        ]);
    }

    public function test_child_category_links_to_parent(): void
    {
        $parent = Category::create(['name' => 'Sepatu', 'slug' => 'sepatu']);

        $this->postJson('/api/categories', [
            'name' => 'Sepatu Lari',
            'slug' => 'sepatu-lari',
            'parent_id' => $parent->id,
        ])->assertStatus(201);

        $this->assertDatabaseHas('categories', ['slug' => 'sepatu-lari', 'parent_id' => $parent->id]);
    }

    public function test_update_rejects_cyclic_parent(): void
    {
        $a = Category::create(['name' => 'A', 'slug' => 'a']);
        $b = Category::create(['name' => 'B', 'slug' => 'b', 'parent_id' => $a->id]);
        $c = Category::create(['name' => 'C', 'slug' => 'c', 'parent_id' => $b->id]);

        // A dijadikan anak C (C -> B -> A) = siklus.
        $this->patchJson("/api/categories/{$a->id}", ['parent_id' => $c->id])
            ->assertStatus(422)
            ->assertJsonPath('message', 'Kategori induk tidak valid (membentuk siklus).');
    }

    public function test_update_rejects_self_parent(): void
    {
        $a = Category::create(['name' => 'A', 'slug' => 'a']);

        $this->patchJson("/api/categories/{$a->id}", ['parent_id' => $a->id])
            ->assertStatus(422);
    }
}
