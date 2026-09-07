<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\StockMutation;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class ProductStockSchemaTest extends TestCase
{
    use RefreshDatabase;

    public function test_products_table_has_stock_and_minimum_columns(): void
    {
        $this->assertTrue(Schema::hasColumns('products', [
            'stock',
            'stock_minimum',
            'min_stock',
            'sku',
            'cost_price',
            'warehouse_bin',
            'last_restock_at',
        ]));
    }

    public function test_stock_mutations_table_exists(): void
    {
        $this->assertTrue(Schema::hasTable('stock_mutations'));
        $this->assertTrue(Schema::hasColumns('stock_mutations', [
            'id',
            'product_id',
            'type',
            'quantity',
            'stock_before',
            'stock_after',
            'reference_type',
            'reference_id',
            'notes',
            'created_by',
        ]));
    }

    public function test_can_save_and_retrieve_stock_and_minimum_values(): void
    {
        $category = Category::create([
            'name' => 'Jersey',
            'slug' => 'jersey',
        ]);

        $product = Product::create([
            'category_id' => $category->id,
            'name' => 'Tusko AeroTech Jersey 2026',
            'slug' => 'tusko-aerotech-jersey-2026',
            'sku' => 'TSK-JRS-2026',
            'price' => 299000,
            'cost_price' => 175000,
            'stock' => 12,
            'stock_minimum' => 15,
            'min_stock' => 15,
            'warehouse_bin' => 'Rak A-01',
            'active' => true,
        ]);

        $this->assertDatabaseHas('products', [
            'id' => $product->id,
            'sku' => 'TSK-JRS-2026',
            'stock' => 12,
            'stock_minimum' => 15,
            'min_stock' => 15,
            'warehouse_bin' => 'Rak A-01',
        ]);

        $this->assertTrue($product->isLowStock());
        $this->assertFalse($product->isOutOfStock());
    }

    public function test_stock_scopes_filter_products_correctly(): void
    {
        $category = Category::create([
            'name' => 'Apparel',
            'slug' => 'apparel',
        ]);

        // Produk stok aman (stok 50 > min 10)
        Product::create([
            'category_id' => $category->id,
            'name' => 'Safe Stock Product',
            'slug' => 'safe-stock-product',
            'price' => 100000,
            'stock' => 50,
            'stock_minimum' => 10,
            'min_stock' => 10,
        ]);

        // Produk stok menipis (stok 4 <= min 10)
        Product::create([
            'category_id' => $category->id,
            'name' => 'Low Stock Product',
            'slug' => 'low-stock-product',
            'price' => 120000,
            'stock' => 4,
            'stock_minimum' => 10,
            'min_stock' => 10,
        ]);

        // Produk stok habis (stok 0)
        Product::create([
            'category_id' => $category->id,
            'name' => 'Out of Stock Product',
            'slug' => 'out-of-stock-product',
            'price' => 150000,
            'stock' => 0,
            'stock_minimum' => 10,
            'min_stock' => 10,
        ]);

        $this->assertEquals(1, Product::safeStock()->count());
        $this->assertEquals(1, Product::lowStock()->count());
        $this->assertEquals(1, Product::outOfStock()->count());
    }

    public function test_product_stock_mutations_relation(): void
    {
        $category = Category::create([
            'name' => 'Sepatu',
            'slug' => 'sepatu',
        ]);

        $product = Product::create([
            'category_id' => $category->id,
            'name' => 'Running Shoes Pro',
            'slug' => 'running-shoes-pro',
            'price' => 500000,
            'stock' => 20,
            'stock_minimum' => 5,
        ]);

        $mutation = StockMutation::create([
            'product_id' => $product->id,
            'type' => 'in',
            'quantity' => 10,
            'stock_before' => 10,
            'stock_after' => 20,
            'reference_type' => 'manual_restock',
            'notes' => 'Penerimaan stok tambahan dari vendor',
            'created_by' => 'Admin Gudang',
        ]);

        $this->assertCount(1, $product->stockMutations);
        $this->assertEquals($mutation->id, $product->stockMutations->first()->id);
        $this->assertEquals($product->id, $mutation->product->id);
    }
}
