<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LowStockAlertApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_get_low_stock_products_for_dashboard_with_reorder_suggestions(): void
    {
        $category = Category::create(['name' => 'Jersey', 'slug' => 'jersey']);

        // Out of stock (stok 0, min 5, cost 100k)
        $outProd = Product::create([
            'category_id' => $category->id,
            'name' => 'Jersey Home Habis',
            'slug' => 'jersey-home-habis',
            'sku' => 'TSK-JRS-000',
            'price' => 200000,
            'cost_price' => 100000,
            'stock' => 0,
            'stock_minimum' => 5,
        ]);

        // Low stock (stok 3, min 10, cost 150k)
        $lowProd = Product::create([
            'category_id' => $category->id,
            'name' => 'Jersey Away Menipis',
            'slug' => 'jersey-away-menipis',
            'sku' => 'TSK-JRS-003',
            'price' => 250000,
            'cost_price' => 150000,
            'stock' => 3,
            'stock_minimum' => 10,
        ]);

        // Safe stock (stok 40, min 10)
        Product::create([
            'category_id' => $category->id,
            'name' => 'Jersey Third Aman',
            'slug' => 'jersey-third-aman',
            'sku' => 'TSK-JRS-040',
            'price' => 250000,
            'cost_price' => 150000,
            'stock' => 40,
            'stock_minimum' => 10,
        ]);

        $response = $this->getJson('/api/inventory/low-stock');

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('summary.out_of_stock_count', 1)
            ->assertJsonPath('summary.low_stock_count', 1)
            ->assertJsonPath('summary.total_critical', 2)
            ->assertJsonPath('summary.is_safe', false);

        // Uji route dashboard /api/dashboard/low-stock
        $dashResponse = $this->getJson('/api/dashboard/low-stock');
        $dashResponse->assertStatus(200)
            ->assertJsonCount(2, 'data');

        // Uji route /api/stock/alerts
        $alertResponse = $this->getJson('/api/stock/alerts');
        $alertResponse->assertStatus(200)
            ->assertJsonCount(2, 'data');
    }

    public function test_can_filter_alert_by_type(): void
    {
        $category = Category::create(['name' => 'Sepatu', 'slug' => 'sepatu']);

        Product::create([
            'category_id' => $category->id,
            'name' => 'Sepatu Habis',
            'slug' => 'sepatu-habis',
            'price' => 500000,
            'stock' => 0,
            'stock_minimum' => 5,
        ]);

        Product::create([
            'category_id' => $category->id,
            'name' => 'Sepatu Menipis',
            'slug' => 'sepatu-menipis',
            'price' => 500000,
            'stock' => 2,
            'stock_minimum' => 5,
        ]);

        // Out of stock only
        $resOut = $this->getJson('/api/inventory/low-stock?type=out_of_stock');
        $resOut->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.status', 'out_of_stock');

        // Low stock only
        $resLow = $this->getJson('/api/inventory/low-stock?type=low_stock');
        $resLow->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.status', 'low');
    }

    public function test_returns_safe_when_no_critical_products(): void
    {
        $category = Category::create(['name' => 'Gym', 'slug' => 'gym']);

        Product::create([
            'category_id' => $category->id,
            'name' => 'Barbell 20kg',
            'slug' => 'barbell-20kg',
            'price' => 800000,
            'stock' => 15,
            'stock_minimum' => 5,
        ]);

        $response = $this->getJson('/api/inventory/low-stock');

        $response->assertStatus(200)
            ->assertJsonCount(0, 'data')
            ->assertJsonPath('summary.total_critical', 0)
            ->assertJsonPath('summary.is_safe', true);
    }

    public function test_supports_limit_parameter(): void
    {
        $category = Category::create(['name' => 'Apparel', 'slug' => 'apparel']);

        for ($i = 1; $i <= 5; $i++) {
            Product::create([
                'category_id' => $category->id,
                'name' => "Produk Menipis {$i}",
                'slug' => "produk-menipis-{$i}",
                'price' => 100000,
                'stock' => $i,
                'stock_minimum' => 10,
            ]);
        }

        $response = $this->getJson('/api/inventory/low-stock?limit=2');

        $response->assertStatus(200)
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('summary.total_critical', 5);
    }
}
