<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CategoryApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_list_categories_and_search(): void
    {
        Category::create(['name' => 'Sepatu Olahraga', 'slug' => 'sepatu-olahraga']);
        Category::create(['name' => 'Jersey & Apparel', 'slug' => 'jersey-apparel']);
        Category::create(['name' => 'Peralatan Gym', 'slug' => 'peralatan-gym']);

        $response = $this->getJson('/api/categories');
        $response->assertStatus(200);
        $this->assertCount(3, $response->json('data'));

        // Test search
        $searchResponse = $this->getJson('/api/categories?search=Jersey');
        $searchResponse->assertStatus(200);
        $this->assertCount(1, $searchResponse->json('data'));
        $this->assertEquals('Jersey & Apparel', $searchResponse->json('data.0.name'));
    }

    public function test_can_create_category_with_auto_slug(): void
    {
        $payload = [
            'name' => 'Running & Marathon',
            'icon' => 'Zap',
            'description' => 'Kategori khusus lari jarak jauh dan maraton.',
        ];

        $response = $this->postJson('/api/categories', $payload);
        $response->assertStatus(201);
        $this->assertEquals('Running & Marathon', $response->json('data.name'));
        $this->assertEquals('running-marathon', $response->json('data.slug'));
        $this->assertEquals('Zap', $response->json('data.icon'));

        $this->assertDatabaseHas('categories', [
            'name' => 'Running & Marathon',
            'slug' => 'running-marathon',
        ]);
    }

    public function test_can_show_category_by_id_or_slug(): void
    {
        $category = Category::create([
            'name' => 'Futsal & Sepakbola',
            'slug' => 'futsal-sepakbola',
        ]);

        $resById = $this->getJson("/api/categories/{$category->id}");
        $resById->assertStatus(200);
        $this->assertEquals('Futsal & Sepakbola', $resById->json('data.name'));

        $resBySlug = $this->getJson("/api/categories/{$category->slug}");
        $resBySlug->assertStatus(200);
        $this->assertEquals($category->id, $resBySlug->json('data.id'));
    }

    public function test_can_update_category(): void
    {
        $category = Category::create([
            'name' => 'Pakaian Training',
            'slug' => 'pakaian-training',
        ]);

        $response = $this->putJson("/api/categories/{$category->id}", [
            'name' => 'Training & Fitness Pro',
            'icon' => 'Activity',
        ]);

        $response->assertStatus(200);
        $this->assertEquals('Training & Fitness Pro', $response->json('data.name'));
        $this->assertEquals('Activity', $response->json('data.icon'));
    }

    public function test_can_delete_unused_category(): void
    {
        $category = Category::create([
            'name' => 'Kategori Sementara',
            'slug' => 'kategori-sementara',
        ]);

        $response = $this->deleteJson("/api/categories/{$category->id}");
        $response->assertStatus(200);
        $this->assertDatabaseMissing('categories', ['id' => $category->id]);
    }

    public function test_cannot_delete_category_with_active_products(): void
    {
        $category = Category::create([
            'name' => 'Sepatu Pro',
            'slug' => 'sepatu-pro',
        ]);

        Product::create([
            'category_id' => $category->id,
            'name' => 'Sepatu Tusko Speed Pro 2026',
            'slug' => 'sepatu-tusko-speed-pro-2026',
            'price' => 799000,
            'stock' => 10,
            'stock_minimum' => 2,
            'active' => true,
            'status' => 'active',
        ]);

        $response = $this->deleteJson("/api/categories/{$category->id}");
        $response->assertStatus(422);
        $this->assertDatabaseHas('categories', ['id' => $category->id]);
    }
}
