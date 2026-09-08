<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductListApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_get_products_list_with_summary_and_fields(): void
    {
        $category = Category::create(['name' => 'Fashion', 'slug' => 'fashion']);

        Product::create([
            'category_id' => $category->id,
            'name' => 'Kaos Polos Tusko Premium',
            'slug' => 'kaos-polos-tusko-premium',
            'sku' => 'TSK-KOS-01',
            'price' => 85000,
            'original_price' => 120000,
            'cost_price' => 50000,
            'stock' => 50,
            'stock_minimum' => 10,
            'weight' => 200,
            'status' => 'active',
            'active' => true,
            'rating' => 4.85,
            'sold_count' => 120,
        ]);

        $response = $this->getJson('/api/products');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'status',
                'message',
                'data' => [
                    '*' => [
                        'id',
                        'name',
                        'slug',
                        'sku',
                        'price',
                        'original_price',
                        'discount_percentage',
                        'cost_price',
                        'profit_margin',
                        'stock',
                        'weight',
                        'status',
                        'rating',
                        'sold_count',
                    ]
                ],
                'summary' => [
                    'total_sku',
                    'total_stock',
                    'low_stock_count',
                    'active_count',
                    'total_asset_value',
                ],
                'meta' => [
                    'current_page',
                    'total',
                ]
            ])
            ->assertJson([
                'status' => 'success',
                'summary' => [
                    'total_sku' => 1,
                    'total_stock' => 50,
                    'low_stock_count' => 0,
                    'active_count' => 1,
                    'total_asset_value' => 2500000.0, // 50 * 50000
                ]
            ]);
    }

    public function test_get_products_filtered_by_search_and_stock_status(): void
    {
        $category = Category::create(['name' => 'Elektronik', 'slug' => 'elektronik']);

        Product::create([
            'category_id' => $category->id,
            'name' => 'Mouse Wireless Ergonomis',
            'slug' => 'mouse-wireless-ergonomis',
            'sku' => 'TSK-MOU-01',
            'price' => 120000,
            'stock' => 2,
            'stock_minimum' => 5,
            'status' => 'active',
            'active' => true,
        ]);

        Product::create([
            'category_id' => $category->id,
            'name' => 'Mechanical Keyboard RGB',
            'slug' => 'mechanical-keyboard-rgb',
            'sku' => 'TSK-KEY-01',
            'price' => 450000,
            'stock' => 20,
            'stock_minimum' => 5,
            'status' => 'active',
            'active' => true,
        ]);

        // Search Mouse
        $searchResponse = $this->getJson('/api/products?search=Mouse');
        $searchResponse->assertStatus(200);
        $this->assertCount(1, $searchResponse->json('data'));
        $this->assertSame('Mouse Wireless Ergonomis', $searchResponse->json('data.0.name'));

        // Filter low stock
        $lowStockResponse = $this->getJson('/api/products?stock_status=low_stock');
        $lowStockResponse->assertStatus(200);
        $this->assertCount(1, $lowStockResponse->json('data'));
        $this->assertSame('Mouse Wireless Ergonomis', $lowStockResponse->json('data.0.name'));
    }

    public function test_get_products_includes_inactive_when_status_all(): void
    {
        $category = Category::create(['name' => 'Umum', 'slug' => 'umum']);

        Product::create([
            'category_id' => $category->id,
            'name' => 'Produk Aktif',
            'slug' => 'produk-aktif',
            'price' => 10000,
            'stock' => 10,
            'status' => 'active',
            'active' => true,
        ]);

        Product::create([
            'category_id' => $category->id,
            'name' => 'Produk Inaktif',
            'slug' => 'produk-inaktif',
            'price' => 10000,
            'stock' => 10,
            'status' => 'inactive',
            'active' => false,
        ]);

        // Default query only returns active
        $defaultResponse = $this->getJson('/api/products');
        $this->assertCount(1, $defaultResponse->json('data'));

        // Status=all returns both
        $allResponse = $this->getJson('/api/products?status=all');
        $this->assertCount(2, $allResponse->json('data'));
    }
}
