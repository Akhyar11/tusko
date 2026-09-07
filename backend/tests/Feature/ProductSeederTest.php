<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\ProductImage;
use Database\Seeders\ProductSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_product_seeder_populates_categories_and_products(): void
    {
        $this->seed(ProductSeeder::class);

        $this->assertGreaterThan(0, Category::count());
        $this->assertGreaterThan(0, Product::count());
        $this->assertGreaterThan(0, ProductImage::count());

        $firstProduct = Product::with(['category', 'images'])->first();
        $this->assertNotNull($firstProduct);
        $this->assertNotNull($firstProduct->category);
        $this->assertNotEmpty($firstProduct->name);
        $this->assertGreaterThan(0, $firstProduct->price);
    }
}
