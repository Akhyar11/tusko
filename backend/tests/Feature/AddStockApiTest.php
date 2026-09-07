<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\StockMutation;
use App\Models\Transaction;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AddStockApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_add_stock_to_product_by_id(): void
    {
        $category = Category::create(['name' => 'Jersey', 'slug' => 'jersey']);

        $product = Product::create([
            'category_id' => $category->id,
            'name' => 'Tusko Jersey Classic',
            'slug' => 'tusko-jersey-classic',
            'sku' => 'TSK-JRS-CLS',
            'price' => 200000,
            'cost_price' => 120000,
            'stock' => 10,
            'stock_minimum' => 5,
        ]);

        $payload = [
            'quantity' => 15,
            'notes' => 'Restock batch pertama September 2026',
            'operator' => 'Budi Santoso',
        ];

        $response = $this->postJson("/api/inventory/{$product->id}/add-stock", $payload);

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.product.stock', 25)
            ->assertJsonPath('data.mutation.type', 'in')
            ->assertJsonPath('data.mutation.quantity', 15)
            ->assertJsonPath('data.mutation.stock_before', 10)
            ->assertJsonPath('data.mutation.stock_after', 25);

        $product->refresh();
        $this->assertEquals(25, $product->stock);
        $this->assertNotNull($product->last_restock_at);

        $this->assertDatabaseHas('stock_mutations', [
            'product_id' => $product->id,
            'type' => 'in',
            'quantity' => 15,
            'stock_before' => 10,
            'stock_after' => 25,
            'created_by' => 'Budi Santoso',
        ]);
    }

    public function test_can_add_stock_by_sku_with_po_and_supplier(): void
    {
        $category = Category::create(['name' => 'Sepatu', 'slug' => 'sepatu']);

        $product = Product::create([
            'category_id' => $category->id,
            'name' => 'HyperPace Running Shoes',
            'slug' => 'hyperpace-running-shoes',
            'sku' => 'TSK-HYP-001',
            'price' => 899000,
            'cost_price' => 550000,
            'stock' => 5,
            'warehouse_bin' => 'Rak A-01',
        ]);

        $payload = [
            'quantity' => 20,
            'cost_price' => 540000,
            'supplier' => 'PT NitroFoam Shoes Distributor',
            'po_number' => 'PO/2026/09/9981',
            'warehouse_bin' => 'Rak S-05 (Gudang Utama)',
            'notes' => 'Pengadaan sepatu baru',
        ];

        $response = $this->postJson("/api/inventory/{$product->sku}/add-stock", $payload);

        $response->assertStatus(200)
            ->assertJsonPath('data.product.stock', 25)
            ->assertJsonPath('data.product.cost_price', 540000)
            ->assertJsonPath('data.product.warehouse_bin', 'Rak S-05 (Gudang Utama)')
            ->assertJsonPath('data.mutation.reference_id', 'PO/2026/09/9981');

        $product->refresh();
        $this->assertEquals(25, $product->stock);
        $this->assertEquals(540000, $product->cost_price);
        $this->assertEquals('Rak S-05 (Gudang Utama)', $product->warehouse_bin);
    }

    public function test_can_add_stock_and_automatically_sync_to_cashflow(): void
    {
        $category = Category::create(['name' => 'Gym', 'slug' => 'gym']);

        $product = Product::create([
            'category_id' => $category->id,
            'name' => 'Kettlebell 12kg',
            'slug' => 'kettlebell-12kg',
            'sku' => 'TSK-KTB-12',
            'price' => 250000,
            'cost_price' => 150000,
            'stock' => 4,
        ]);

        $payload = [
            'quantity' => 10,
            'cost_price' => 150000,
            'supplier' => 'PT Apex Gear Industri',
            'sync_to_cashflow' => true,
        ];

        $response = $this->postJson("/api/inventory/{$product->id}/add-stock", $payload);

        $response->assertStatus(200);

        // 10 * 150.000 = 1.500.000 expense
        $this->assertDatabaseHas('transactions', [
            'type' => 'expense',
            'category' => 'restock',
            'amount' => 1500000,
            'status' => 'settled',
        ]);
    }

    public function test_fails_when_quantity_is_invalid(): void
    {
        $category = Category::create(['name' => 'Aksesoris', 'slug' => 'aksesoris']);

        $product = Product::create([
            'category_id' => $category->id,
            'name' => 'Kaos Kaki',
            'slug' => 'kaos-kaki',
            'price' => 25000,
            'stock' => 10,
        ]);

        $response = $this->postJson("/api/inventory/{$product->id}/add-stock", [
            'quantity' => 0,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['quantity']);
    }

    public function test_can_retrieve_stock_mutations_history(): void
    {
        $category = Category::create(['name' => 'Tas', 'slug' => 'tas']);

        $product = Product::create([
            'category_id' => $category->id,
            'name' => 'Gym Duffle Bag',
            'slug' => 'gym-duffle-bag',
            'sku' => 'TSK-BAG-001',
            'price' => 300000,
            'stock' => 10,
        ]);

        StockMutation::create([
            'product_id' => $product->id,
            'type' => 'in',
            'quantity' => 5,
            'stock_before' => 5,
            'stock_after' => 10,
            'reference_type' => 'manual_restock',
            'reference_id' => 'PO/TEST/01',
            'notes' => 'Restock batch 1',
            'created_by' => 'Admin',
        ]);

        // Route specific product
        $prodMutations = $this->getJson("/api/inventory/{$product->id}/mutations");
        $prodMutations->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.quantity', 5)
            ->assertJsonPath('data.0.type', 'in');

        // Route all mutations
        $allMutations = $this->getJson("/api/inventory/mutations");
        $allMutations->assertStatus(200)
            ->assertJsonCount(1, 'data');
    }
}
