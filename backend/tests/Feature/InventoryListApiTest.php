<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InventoryListApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_get_inventory_product_list_with_stats(): void
    {
        $category = Category::create([
            'name' => 'Jersey & Apparel',
            'slug' => 'jersey-apparel',
        ]);

        // Safe stock (stok 30 > min 10)
        Product::create([
            'category_id' => $category->id,
            'name' => 'Tusko Matchday Jersey',
            'slug' => 'tusko-matchday-jersey',
            'sku' => 'TSK-JRS-001',
            'price' => 250000,
            'cost_price' => 150000,
            'stock' => 30,
            'stock_minimum' => 10,
            'warehouse_bin' => 'Rak A-01',
            'active' => true,
        ]);

        // Low stock (stok 5 <= min 10)
        Product::create([
            'category_id' => $category->id,
            'name' => 'Tusko Training Pants',
            'slug' => 'tusko-training-pants',
            'sku' => 'TSK-PNT-002',
            'price' => 200000,
            'cost_price' => 120000,
            'stock' => 5,
            'stock_minimum' => 10,
            'warehouse_bin' => 'Rak B-02',
            'active' => true,
        ]);

        // Out of stock (stok 0)
        Product::create([
            'category_id' => $category->id,
            'name' => 'Tusko Running Cap',
            'slug' => 'tusko-running-cap',
            'sku' => 'TSK-CAP-003',
            'price' => 100000,
            'cost_price' => 50000,
            'stock' => 0,
            'stock_minimum' => 5,
            'warehouse_bin' => 'Rak C-03',
            'active' => true,
        ]);

        $response = $this->getJson('/api/inventory');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'status',
                'data' => [
                    '*' => [
                        'id',
                        'sku',
                        'name',
                        'slug',
                        'category_id',
                        'category_name',
                        'cost_price',
                        'selling_price',
                        'stock',
                        'stock_minimum',
                        'warehouse_bin',
                        'status',
                        'is_low_stock',
                        'is_out_of_stock',
                    ],
                ],
                'stats' => [
                    'sku_count',
                    'total_items',
                    'total_asset_cost',
                    'total_retail_value',
                    'safe_stock_count',
                    'low_stock_count',
                    'out_of_stock_count',
                ],
                'categories',
                'meta',
            ])
            ->assertJsonPath('stats.sku_count', 3)
            ->assertJsonPath('stats.total_items', 35)
            ->assertJsonPath('stats.safe_stock_count', 1)
            ->assertJsonPath('stats.low_stock_count', 1)
            ->assertJsonPath('stats.out_of_stock_count', 1);
    }

    public function test_can_filter_inventory_by_stock_status(): void
    {
        $category = Category::create([
            'name' => 'Sepatu',
            'slug' => 'sepatu',
        ]);

        Product::create([
            'category_id' => $category->id,
            'name' => 'Sepatu Aman',
            'slug' => 'sepatu-aman',
            'price' => 400000,
            'stock' => 20,
            'stock_minimum' => 5,
        ]);

        Product::create([
            'category_id' => $category->id,
            'name' => 'Sepatu Menipis',
            'slug' => 'sepatu-menipis',
            'price' => 450000,
            'stock' => 3,
            'stock_minimum' => 5,
        ]);

        Product::create([
            'category_id' => $category->id,
            'name' => 'Sepatu Habis',
            'slug' => 'sepatu-habis',
            'price' => 500000,
            'stock' => 0,
            'stock_minimum' => 5,
        ]);

        // Filter low
        $lowRes = $this->getJson('/api/inventory?stock_status=low');
        $lowRes->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.slug', 'sepatu-menipis');

        // Filter out_of_stock
        $outRes = $this->getJson('/api/inventory?stock_status=out_of_stock');
        $outRes->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.slug', 'sepatu-habis');

        // Filter safe
        $safeRes = $this->getJson('/api/inventory?stock_status=safe');
        $safeRes->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.slug', 'sepatu-aman');
    }

    public function test_can_filter_inventory_by_category(): void
    {
        $catJersey = Category::create(['name' => 'Jersey', 'slug' => 'jersey']);
        $catSepatu = Category::create(['name' => 'Sepatu', 'slug' => 'sepatu']);

        Product::create([
            'category_id' => $catJersey->id,
            'name' => 'Jersey Home',
            'slug' => 'jersey-home',
            'price' => 200000,
            'stock' => 10,
        ]);

        Product::create([
            'category_id' => $catSepatu->id,
            'name' => 'Sepatu Lari',
            'slug' => 'sepatu-lari',
            'price' => 600000,
            'stock' => 15,
        ]);

        $response = $this->getJson("/api/inventory?category_id={$catJersey->id}");
        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Jersey Home');
    }

    public function test_can_search_inventory_by_name_and_sku(): void
    {
        $category = Category::create(['name' => 'Aksesoris', 'slug' => 'aksesoris']);

        Product::create([
            'category_id' => $category->id,
            'name' => 'Kaos Kaki Tusko Pro',
            'slug' => 'kaos-kaki-tusko-pro',
            'sku' => 'TSK-SCK-PRO',
            'price' => 50000,
            'stock' => 40,
        ]);

        Product::create([
            'category_id' => $category->id,
            'name' => 'Deker Pelindung Kaki',
            'slug' => 'deker-pelindung-kaki',
            'sku' => 'TSK-SHN-001',
            'price' => 75000,
            'stock' => 25,
        ]);

        // Search by SKU
        $resSku = $this->getJson('/api/inventory?search=SCK-PRO');
        $resSku->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.sku', 'TSK-SCK-PRO');

        // Search by Name keyword
        $resName = $this->getJson('/api/inventory?search=Deker');
        $resName->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.sku', 'TSK-SHN-001');
    }

    public function test_can_get_single_inventory_product_detail(): void
    {
        $category = Category::create(['name' => 'Gym', 'slug' => 'gym']);

        $product = Product::create([
            'category_id' => $category->id,
            'name' => 'Dumbbell 5kg Hexagonal',
            'slug' => 'dumbbell-5kg-hexagonal',
            'sku' => 'TSK-DBL-05KG',
            'price' => 125000,
            'stock' => 18,
            'stock_minimum' => 5,
            'warehouse_bin' => 'Gudang B Rak D-02',
        ]);

        $byId = $this->getJson("/api/inventory/{$product->id}");
        $byId->assertStatus(200)
            ->assertJsonPath('data.id', $product->id)
            ->assertJsonPath('data.sku', 'TSK-DBL-05KG')
            ->assertJsonPath('data.warehouse_bin', 'Gudang B Rak D-02');

        $bySku = $this->getJson("/api/inventory/{$product->sku}");
        $bySku->assertStatus(200)
            ->assertJsonPath('data.id', $product->id);
    }
}
