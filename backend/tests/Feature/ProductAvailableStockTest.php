<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Services\InventoryService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductAvailableStockTest extends TestCase
{
    use RefreshDatabase;

    private Category $category;

    protected function setUp(): void
    {
        parent::setUp();
        $this->category = Category::create([
            'name' => 'Olahraga Test',
            'slug' => 'olahraga-test',
        ]);
    }

    public function test_can_update_available_stock_for_single_product_within_physical_stock(): void
    {
        $product = Product::create([
            'category_id' => $this->category->id,
            'name' => 'Bola Basket Tusko',
            'slug' => 'bola-basket-tusko',
            'sku' => 'TSK-BBL-001',
            'price' => 250000,
            'stock' => 50,
            'active' => true,
        ]);

        $response = $this->putJson("/api/products/{$product->id}/available-stock", [
            'available_for_sale_stock' => 20,
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.available_for_sale_stock', 20)
            ->assertJsonPath('data.effective_available_stock', 20);

        $this->assertDatabaseHas('products', [
            'id' => $product->id,
            'available_for_sale_stock' => 20,
        ]);

        // Verifikasi pada InventoryService
        /** @var InventoryService $inventoryService */
        $inventoryService = app(InventoryService::class);
        $this->assertEquals(20, $inventoryService->availableStock($product->fresh()));
    }

    public function test_cannot_set_available_stock_exceeding_physical_stock_for_single_product(): void
    {
        $product = Product::create([
            'category_id' => $this->category->id,
            'name' => 'Bola Voli Tusko',
            'slug' => 'bola-voli-tusko',
            'sku' => 'TSK-VBL-001',
            'price' => 150000,
            'stock' => 15,
            'active' => true,
        ]);

        $response = $this->putJson("/api/products/{$product->id}/available-stock", [
            'available_for_sale_stock' => 20,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['available_for_sale_stock']);
    }

    public function test_cannot_set_available_stock_when_physical_stock_is_zero(): void
    {
        $product = Product::create([
            'category_id' => $this->category->id,
            'name' => 'Jersey Habis Stok',
            'slug' => 'jersey-habis-stok',
            'sku' => 'TSK-JRS-000',
            'price' => 100000,
            'stock' => 0,
            'active' => true,
        ]);

        $response = $this->putJson("/api/products/{$product->id}/available-stock", [
            'available_for_sale_stock' => 5,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['available_for_sale_stock']);
    }

    public function test_can_update_available_stock_for_product_variants(): void
    {
        $product = Product::create([
            'category_id' => $this->category->id,
            'name' => 'Jersey Tusko Pro',
            'slug' => 'jersey-tusko-pro',
            'sku' => 'TSK-JRS-PRO',
            'price' => 200000,
            'stock' => 40,
            'active' => true,
        ]);

        $variantM = ProductVariant::create([
            'product_id' => $product->id,
            'sku' => 'TSK-JRS-PRO-M',
            'variant_name' => 'Ukuran M',
            'price' => 200000,
            'stock' => 30,
            'is_active' => true,
        ]);

        $variantL = ProductVariant::create([
            'product_id' => $product->id,
            'sku' => 'TSK-JRS-PRO-L',
            'variant_name' => 'Ukuran L',
            'price' => 200000,
            'stock' => 10,
            'is_active' => true,
        ]);

        $response = $this->putJson("/api/products/{$product->id}/available-stock", [
            'variants' => [
                [
                    'id' => $variantM->id,
                    'available_for_sale_stock' => 15,
                ],
                [
                    'id' => $variantL->id,
                    'available_for_sale_stock' => 5,
                ],
            ],
        ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('product_variants', [
            'id' => $variantM->id,
            'available_for_sale_stock' => 15,
        ]);

        $this->assertDatabaseHas('product_variants', [
            'id' => $variantL->id,
            'available_for_sale_stock' => 5,
        ]);

        // Verifikasi pada InventoryService per varian
        /** @var InventoryService $inventoryService */
        $inventoryService = app(InventoryService::class);
        $this->assertEquals(15, $inventoryService->availableStock($product, $variantM->fresh()));
        $this->assertEquals(5, $inventoryService->availableStock($product, $variantL->fresh()));
    }

    public function test_cannot_set_variant_available_stock_exceeding_its_physical_stock(): void
    {
        $product = Product::create([
            'category_id' => $this->category->id,
            'name' => 'Celana Lari Tusko',
            'slug' => 'celana-lari-tusko',
            'sku' => 'TSK-RUN-001',
            'price' => 180000,
            'stock' => 20,
            'active' => true,
        ]);

        $variantS = ProductVariant::create([
            'product_id' => $product->id,
            'sku' => 'TSK-RUN-001-S',
            'variant_name' => 'Ukuran S',
            'price' => 180000,
            'stock' => 5,
            'is_active' => true,
        ]);

        $response = $this->putJson("/api/products/{$product->id}/available-stock", [
            'variants' => [
                [
                    'id' => $variantS->id,
                    'available_for_sale_stock' => 10, // Melebihi stock fisik 5
                ],
            ],
        ]);

        $response->assertStatus(422);
    }
}
