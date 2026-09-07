<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\StockMutation;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReduceStockApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_reduce_stock_with_valid_quantity(): void
    {
        $category = Category::create(['name' => 'Jersey', 'slug' => 'jersey']);

        $product = Product::create([
            'category_id' => $category->id,
            'name' => 'Tusko Matchday Jersey Home',
            'slug' => 'tusko-matchday-jersey-home',
            'sku' => 'TSK-JRS-HOME',
            'price' => 350000,
            'stock' => 20,
            'stock_minimum' => 5,
        ]);

        $payload = [
            'quantity' => 5,
            'reason' => 'damage',
            'reference' => 'BA-QC/2026/001',
            'notes' => 'Terdapat sobekan pada jahitan kerah',
            'operator' => 'Siska Nurhaliza',
        ];

        $response = $this->postJson("/api/inventory/{$product->id}/reduce-stock", $payload);

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.product.stock', 15)
            ->assertJsonPath('data.mutation.type', 'out')
            ->assertJsonPath('data.mutation.quantity', 5)
            ->assertJsonPath('data.mutation.stock_before', 20)
            ->assertJsonPath('data.mutation.stock_after', 15)
            ->assertJsonPath('data.mutation.reference_id', 'BA-QC/2026/001');

        $product->refresh();
        $this->assertEquals(15, $product->stock);

        $this->assertDatabaseHas('stock_mutations', [
            'product_id' => $product->id,
            'type' => 'out',
            'quantity' => 5,
            'stock_before' => 20,
            'stock_after' => 15,
            'reference_id' => 'BA-QC/2026/001',
        ]);
    }

    public function test_fails_when_reducing_more_than_available_stock(): void
    {
        $category = Category::create(['name' => 'Sepatu', 'slug' => 'sepatu']);

        $product = Product::create([
            'category_id' => $category->id,
            'name' => 'Running Shoes Pro Carbon',
            'slug' => 'running-shoes-pro-carbon',
            'sku' => 'TSK-SH-CRB',
            'price' => 1200000,
            'stock' => 3,
            'stock_minimum' => 5,
        ]);

        // Coba kurangi 10 unit padahal stok hanya 3
        $response = $this->postJson("/api/inventory/{$product->id}/reduce-stock", [
            'quantity' => 10,
            'reason' => 'sample',
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('status', 'error')
            ->assertJsonValidationErrors(['quantity']);

        // Pastikan stok tidak berubah di database
        $product->refresh();
        $this->assertEquals(3, $product->stock);
        $this->assertEquals(0, StockMutation::where('product_id', $product->id)->count());
    }

    public function test_can_reduce_stock_by_sku_with_sample_reason(): void
    {
        $category = Category::create(['name' => 'Apparel', 'slug' => 'apparel']);

        $product = Product::create([
            'category_id' => $category->id,
            'name' => 'Tusko Gym Stringer',
            'slug' => 'tusko-gym-stringer',
            'sku' => 'TSK-STR-001',
            'price' => 120000,
            'stock' => 12,
        ]);

        $payload = [
            'quantity' => 2,
            'reason' => 'sample',
            'notes' => 'Sampel foto produk studio photoshoot',
        ];

        $response = $this->postJson("/api/inventory/{$product->sku}/reduce-stock", $payload);

        $response->assertStatus(200)
            ->assertJsonPath('data.product.stock', 10);

        $product->refresh();
        $this->assertEquals(10, $product->stock);
    }

    public function test_fails_with_invalid_quantity(): void
    {
        $category = Category::create(['name' => 'Aksesoris', 'slug' => 'aksesoris']);

        $product = Product::create([
            'category_id' => $category->id,
            'name' => 'Wristband',
            'slug' => 'wristband',
            'price' => 30000,
            'stock' => 10,
        ]);

        $response = $this->postJson("/api/inventory/{$product->id}/reduce-stock", [
            'quantity' => 0,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['quantity']);

        $responseNegative = $this->postJson("/api/inventory/{$product->id}/reduce-stock", [
            'quantity' => -5,
        ]);

        $responseNegative->assertStatus(422)
            ->assertJsonValidationErrors(['quantity']);
    }

    public function test_fails_on_out_of_stock_product(): void
    {
        $category = Category::create(['name' => 'Tas', 'slug' => 'tas']);

        $product = Product::create([
            'category_id' => $category->id,
            'name' => 'Duffle Bag Habis',
            'slug' => 'duffle-bag-habis',
            'price' => 250000,
            'stock' => 0,
        ]);

        $response = $this->postJson("/api/inventory/{$product->id}/reduce-stock", [
            'quantity' => 1,
            'reason' => 'damage',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['quantity']);
    }
}
