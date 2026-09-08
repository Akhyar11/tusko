<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductModelTest extends TestCase
{
    use RefreshDatabase;

    public function test_product_model_defaults_and_casting(): void
    {
        $category = Category::create([
            'name' => 'Elektronik',
            'slug' => 'elektronik',
        ]);

        $product = Product::create([
            'category_id' => $category->id,
            'name' => 'Headset Gaming Tusko Pro',
            'slug' => 'headset-gaming-tusko-pro',
            'sku' => 'TSK-HS-01',
            'price' => 300000,
            'original_price' => 500000,
            'cost_price' => 200000,
            'specifications' => [
                'Brand' => 'Tusko',
                'Driver' => '50mm Neodymium',
            ],
            'variants' => [
                [
                    'name' => 'Warna',
                    'options' => ['Matte Black', 'Snow White'],
                ],
            ],
        ]);

        $this->assertSame(500, $product->weight);
        $this->assertSame('active', $product->status);
        $this->assertTrue($product->active);
        $this->assertTrue($product->isPublished());
        $this->assertSame(40, $product->discount_percentage); // (500000 - 300000) / 500000 = 40%
        $this->assertEquals(100000.0, $product->profit_margin); // 300000 - 200000 = 100000
        $this->assertIsArray($product->specifications);
        $this->assertSame('Tusko', $product->specifications['Brand']);
        $this->assertIsArray($product->variants);
        $this->assertSame('Warna', $product->variants[0]['name']);
    }

    public function test_product_scopes(): void
    {
        $categoryA = Category::create(['name' => 'Pakaian Pria', 'slug' => 'pakaian-pria']);
        $categoryB = Category::create(['name' => 'Gadget', 'slug' => 'gadget']);

        // Produk 1: Aktif, Kategori A, Stok 10
        Product::create([
            'category_id' => $categoryA->id,
            'name' => 'Kemeja Katun Tusko',
            'slug' => 'kemeja-katun-tusko',
            'sku' => 'TSK-KEM-01',
            'price' => 150000,
            'stock' => 10,
            'stock_minimum' => 3,
            'status' => 'active',
            'active' => true,
        ]);

        // Produk 2: Inaktif, Kategori B, Stok 0
        Product::create([
            'category_id' => $categoryB->id,
            'name' => 'Smartphone Case',
            'slug' => 'smartphone-case',
            'sku' => 'TSK-CASE-01',
            'price' => 50000,
            'stock' => 0,
            'stock_minimum' => 5,
            'status' => 'inactive',
            'active' => false,
        ]);

        // Test scopeActive
        $activeProducts = Product::active()->get();
        $this->assertCount(1, $activeProducts);
        $this->assertSame('Kemeja Katun Tusko', $activeProducts->first()->name);

        // Test scopeSearch
        $searchResults = Product::search('Katun')->get();
        $this->assertCount(1, $searchResults);

        // Test scopeByCategory
        $categoryResults = Product::byCategory('pakaian-pria')->get();
        $this->assertCount(1, $categoryResults);

        // Test scopeOutOfStock
        $outOfStockProducts = Product::outOfStock()->get();
        $this->assertCount(1, $outOfStockProducts);
        $this->assertSame('Smartphone Case', $outOfStockProducts->first()->name);
    }
}
