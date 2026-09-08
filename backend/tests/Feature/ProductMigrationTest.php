<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class ProductMigrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_products_table_has_all_expected_columns(): void
    {
        $columns = [
            'id',
            'category_id',
            'name',
            'slug',
            'sku',
            'description',
            'price',
            'original_price',
            'cost_price',
            'stock',
            'stock_minimum',
            'min_stock',
            'weight',
            'warehouse_bin',
            'last_restock_at',
            'image_url',
            'active',
            'status',
            'specifications',
            'variants',
            'rating',
            'sold_count',
            'created_at',
            'updated_at',
        ];

        foreach ($columns as $column) {
            $this->assertTrue(
                Schema::hasColumn('products', $column),
                "Kolom [{$column}] tidak ditemukan pada tabel products."
            );
        }
    }

    public function test_product_record_can_be_inserted_with_new_columns(): void
    {
        $categoryId = DB::table('categories')->insertGetId([
            'name' => 'Elektronik',
            'slug' => 'elektronik',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $productId = DB::table('products')->insertGetId([
            'category_id' => $categoryId,
            'name' => 'Tusko Mechanical Keyboard Pro',
            'slug' => 'tusko-mechanical-keyboard-pro',
            'sku' => 'TSK-KB-001',
            'description' => 'Keyboard mekanikal switch blue',
            'price' => 750000,
            'original_price' => 950000,
            'cost_price' => 500000,
            'stock' => 25,
            'stock_minimum' => 5,
            'weight' => 850,
            'warehouse_bin' => 'A-01-02',
            'image_url' => 'https://example.com/kb.png',
            'active' => true,
            'status' => 'active',
            'specifications' => json_encode(['Switch' => 'Blue Clicky', 'Koneksi' => 'Wireless / Type-C']),
            'variants' => json_encode([['name' => 'Warna', 'options' => ['Hitam', 'Putih']]]),
            'rating' => 4.90,
            'sold_count' => 12,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->assertDatabaseHas('products', [
            'id' => $productId,
            'sku' => 'TSK-KB-001',
            'weight' => 850,
            'status' => 'active',
            'sold_count' => 12,
        ]);
    }
}
