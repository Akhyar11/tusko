<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Warehouse;
use App\Services\InventoryService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class VariantInventoryStockTest extends TestCase
{
    use RefreshDatabase;

    private Category $category;
    private Warehouse $warehouse;

    protected function setUp(): void
    {
        parent::setUp();

        $this->warehouse = Warehouse::create([
            'code' => 'GDG-TEST-VAR',
            'name' => 'Gudang Uji Varian',
            'address' => 'Jl. Varian No. 10',
            'city' => 'Jakarta',
            'province' => 'DKI Jakarta',
            'is_primary' => true,
            'is_active' => true,
        ]);

        $this->category = Category::create([
            'name' => 'Jersey Olahraga',
            'slug' => 'jersey-olahraga',
        ]);
    }

    public function test_can_add_stock_to_specific_product_variant(): void
    {
        $product = Product::create([
            'category_id' => $this->category->id,
            'name' => 'Tusko Matchday Jersey Pro',
            'slug' => 'tusko-matchday-jersey-pro',
            'sku' => 'TSK-MDJ-PRO',
            'price' => 250000,
            'stock' => 15,
            'active' => true,
        ]);

        $variantM = ProductVariant::create([
            'product_id' => $product->id,
            'sku' => 'TSK-MDJ-PRO-M',
            'variant_name' => 'Ukuran M',
            'price' => 250000,
            'stock' => 5,
            'is_active' => true,
        ]);

        $variantL = ProductVariant::create([
            'product_id' => $product->id,
            'sku' => 'TSK-MDJ-PRO-L',
            'variant_name' => 'Ukuran L',
            'price' => 250000,
            'stock' => 10,
            'is_active' => true,
        ]);

        // Tambah 10 unit ke Ukuran M
        $response = $this->postJson("/api/inventory/{$product->id}/add-stock", [
            'product_variant_id' => $variantM->id,
            'quantity' => 10,
            'notes' => 'Restock jersey ukuran M',
            'operator' => 'Staff Gudang',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.variant.id', $variantM->id)
            ->assertJsonPath('data.variant.stock', 15)
            ->assertJsonPath('data.mutation.product_variant_id', $variantM->id);

        $variantM->refresh();
        $variantL->refresh();
        $product->refresh();

        $this->assertEquals(15, $variantM->stock);
        $this->assertEquals(10, $variantL->stock);
        // Total stok produk = 15 (M) + 10 (L) = 25
        $this->assertEquals(25, $product->stock);

        $this->assertDatabaseHas('stock_mutations', [
            'product_id' => $product->id,
            'product_variant_id' => $variantM->id,
            'type' => 'in',
            'quantity' => 10,
        ]);
    }

    public function test_can_reduce_stock_from_specific_product_variant(): void
    {
        $product = Product::create([
            'category_id' => $this->category->id,
            'name' => 'Tusko Training Pants',
            'slug' => 'tusko-training-pants',
            'sku' => 'TSK-TRP-001',
            'price' => 180000,
            'stock' => 20,
            'active' => true,
        ]);

        $variantS = ProductVariant::create([
            'product_id' => $product->id,
            'sku' => 'TSK-TRP-001-S',
            'variant_name' => 'Ukuran S',
            'price' => 180000,
            'stock' => 8,
            'is_active' => true,
        ]);

        $variantXL = ProductVariant::create([
            'product_id' => $product->id,
            'sku' => 'TSK-TRP-001-XL',
            'variant_name' => 'Ukuran XL',
            'price' => 180000,
            'stock' => 12,
            'is_active' => true,
        ]);

        // Kurangi 3 unit dari Ukuran S
        $response = $this->postJson("/api/inventory/{$product->id}/reduce-stock", [
            'product_variant_id' => $variantS->id,
            'quantity' => 3,
            'reason' => 'damage',
            'notes' => 'Rusak jahitan saat QC',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.variant.id', $variantS->id)
            ->assertJsonPath('data.variant.stock', 5)
            ->assertJsonPath('data.mutation.product_variant_id', $variantS->id);

        $variantS->refresh();
        $variantXL->refresh();
        $product->refresh();

        $this->assertEquals(5, $variantS->stock);
        $this->assertEquals(12, $variantXL->stock);
        $this->assertEquals(17, $product->stock);
    }

    public function test_cannot_reduce_stock_exceeding_variant_stock(): void
    {
        $product = Product::create([
            'category_id' => $this->category->id,
            'name' => 'Tusko Compression Sleeves',
            'slug' => 'tusko-compression-sleeves',
            'sku' => 'TSK-SLV-001',
            'price' => 90000,
            'stock' => 5,
            'active' => true,
        ]);

        $variant = ProductVariant::create([
            'product_id' => $product->id,
            'sku' => 'TSK-SLV-001-M',
            'variant_name' => 'Ukuran M',
            'price' => 90000,
            'stock' => 4,
            'is_active' => true,
        ]);

        // Kurangi 10 unit padahal stok varian hanya 4
        $response = $this->postJson("/api/inventory/{$product->id}/reduce-stock", [
            'product_variant_id' => $variant->id,
            'quantity' => 10,
            'reason' => 'sample',
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('status', 'error')
            ->assertJsonValidationErrors(['quantity']);
    }

    public function test_inventory_index_includes_variants_and_available_for_sale_stock(): void
    {
        $product = Product::create([
            'category_id' => $this->category->id,
            'name' => 'Tusko Grip Socks',
            'slug' => 'tusko-grip-socks',
            'sku' => 'TSK-SCK-001',
            'price' => 50000,
            'stock' => 30,
            'available_for_sale_stock' => 20,
            'active' => true,
        ]);

        $variant = ProductVariant::create([
            'product_id' => $product->id,
            'sku' => 'TSK-SCK-001-BLK',
            'variant_name' => 'Hitam',
            'price' => 50000,
            'stock' => 30,
            'available_for_sale_stock' => 15,
            'is_active' => true,
        ]);

        $response = $this->getJson('/api/inventory');

        $response->assertStatus(200)
            ->assertJsonPath('data.0.available_for_sale_stock', 20)
            ->assertJsonPath('data.0.effective_available_stock', 20)
            ->assertJsonPath('data.0.has_variants', true)
            ->assertJsonPath('data.0.variants.0.available_for_sale_stock', 15)
            ->assertJsonPath('data.0.variants.0.effective_available_stock', 15);
    }

    public function test_can_batch_restock_multiple_variants_and_set_available_for_sale_stock(): void
    {
        $product = Product::create([
            'category_id' => $this->category->id,
            'name' => 'Tusko Running Shorts',
            'slug' => 'tusko-running-shorts',
            'sku' => 'TSK-SHR-001',
            'price' => 120000,
            'stock' => 0,
            'active' => true,
        ]);

        $vS = ProductVariant::create([
            'product_id' => $product->id,
            'sku' => 'TSK-SHR-001-S',
            'variant_name' => 'Ukuran S',
            'price' => 120000,
            'stock' => 0,
            'is_active' => true,
        ]);

        $vM = ProductVariant::create([
            'product_id' => $product->id,
            'sku' => 'TSK-SHR-001-M',
            'variant_name' => 'Ukuran M',
            'price' => 120000,
            'stock' => 0,
            'is_active' => true,
        ]);

        $response = $this->postJson("/api/inventory/{$product->id}/add-stock", [
            'cost_price' => 70000,
            'supplier' => 'PT Konveksi Tusko',
            'sync_to_cashflow' => true,
            'items' => [
                [
                    'product_variant_id' => $vS->id,
                    'quantity' => 10,
                    'available_for_sale_stock' => 8,
                ],
                [
                    'product_variant_id' => $vM->id,
                    'quantity' => 20,
                    'available_for_sale_stock' => 15,
                ],
            ],
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success');

        $vS->refresh();
        $vM->refresh();
        $product->refresh();

        $this->assertEquals(10, $vS->stock);
        $this->assertEquals(8, $vS->available_for_sale_stock);
        $this->assertEquals(20, $vM->stock);
        $this->assertEquals(15, $vM->available_for_sale_stock);
        $this->assertEquals(30, $product->stock);
        $this->assertEquals(23, $product->available_for_sale_stock);

        $this->assertDatabaseHas('transactions', [
            'type' => 'expense',
            'category' => 'restock',
            'amount' => 30 * 70000,
        ]);
    }
}
