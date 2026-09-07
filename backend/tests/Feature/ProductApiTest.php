<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\ProductImage;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_list_products_with_pagination(): void
    {
        $category = Category::factory()->create(['name' => 'Elektronik', 'slug' => 'elektronik']);
        Product::factory()->count(15)->create(['category_id' => $category->id]);

        $response = $this->getJson('/api/products?per_page=10');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'status',
                'message',
                'data' => [
                    '*' => [
                        'id',
                        'name',
                        'slug',
                        'price',
                        'stock',
                        'category',
                        'images',
                    ]
                ],
                'meta' => [
                    'current_page',
                    'last_page',
                    'per_page',
                    'total',
                ]
            ]);

        $this->assertCount(10, $response->json('data'));
        $this->assertEquals(15, $response->json('meta.total'));
    }

    public function test_can_search_products_by_keyword(): void
    {
        $category = Category::factory()->create();
        Product::factory()->create([
            'category_id' => $category->id,
            'name' => 'Mechanical Keyboard RGB 75%',
            'slug' => 'mechanical-keyboard-rgb-75',
        ]);
        Product::factory()->create([
            'category_id' => $category->id,
            'name' => 'Mouse Gaming Wireless',
            'slug' => 'mouse-gaming-wireless',
        ]);

        $response = $this->getJson('/api/products?search=Keyboard');

        $response->assertStatus(200);
        $this->assertCount(1, $response->json('data'));
        $this->assertEquals('Mechanical Keyboard RGB 75%', $response->json('data.0.name'));
    }

    public function test_can_filter_products_by_category(): void
    {
        $cat1 = Category::factory()->create(['slug' => 'komputer']);
        $cat2 = Category::factory()->create(['slug' => 'pakaian']);

        Product::factory()->count(3)->create(['category_id' => $cat1->id]);
        Product::factory()->count(2)->create(['category_id' => $cat2->id]);

        $response = $this->getJson('/api/products?category=komputer');

        $response->assertStatus(200);
        $this->assertCount(3, $response->json('data'));
    }

    public function test_can_show_product_detail_by_slug(): void
    {
        $category = Category::factory()->create();
        $product = Product::factory()->create([
            'category_id' => $category->id,
            'name' => 'Headset Gaming 7.1',
            'slug' => 'headset-gaming-71',
        ]);

        ProductImage::create([
            'product_id' => $product->id,
            'image_url' => 'https://example.com/headset.jpg',
            'sort_order' => 1,
        ]);

        $response = $this->getJson("/api/products/{$product->slug}");

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'data' => [
                    'id' => $product->id,
                    'name' => 'Headset Gaming 7.1',
                    'slug' => 'headset-gaming-71',
                ]
            ]);

        $this->assertCount(1, $response->json('data.images'));
    }
}
