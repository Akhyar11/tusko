<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductUpdateApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_update_product_by_id(): void
    {
        $category = Category::create(['name' => 'Elektronik', 'slug' => 'elektronik']);

        $product = Product::create([
            'category_id' => $category->id,
            'name' => 'Nama Lama Keyboard',
            'slug' => 'nama-lama-keyboard',
            'sku' => 'TSK-KB-001',
            'price' => 200000,
            'original_price' => 300000,
            'stock' => 10,
            'weight' => 500,
            'status' => 'active',
        ]);

        $payload = [
            'name' => 'Nama Baru Keyboard RGB',
            'price' => 250000,
            'originalPrice' => 350000,
            'weight' => 650,
            'status' => 'inactive',
        ];

        $response = $this->putJson("/api/products/{$product->id}", $payload);

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'message' => 'Produk berhasil diperbarui.',
                'data' => [
                    'id' => $product->id,
                    'name' => 'Nama Baru Keyboard RGB',
                    'price' => 250000,
                    'original_price' => 350000,
                    'weight' => 650,
                    'status' => 'inactive',
                    'active' => false,
                ]
            ]);

        $this->assertDatabaseHas('products', [
            'id' => $product->id,
            'name' => 'Nama Baru Keyboard RGB',
            'price' => 250000,
            'weight' => 650,
            'status' => 'inactive',
        ]);
    }

    public function test_can_update_product_by_slug(): void
    {
        $category = Category::create(['name' => 'Pakaian', 'slug' => 'pakaian']);

        $product = Product::create([
            'category_id' => $category->id,
            'name' => 'Jaket Hoodie Hitam',
            'slug' => 'jaket-hoodie-hitam',
            'sku' => 'TSK-JKT-01',
            'price' => 180000,
            'stock' => 5,
        ]);

        $response = $this->patchJson('/api/products/jaket-hoodie-hitam', [
            'price' => 195000,
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'data' => [
                    'price' => 195000,
                ]
            ]);

        $this->assertSame('195000.00', (string) $product->fresh()->price);
    }

    public function test_updating_stock_creates_mutation_record(): void
    {
        $category = Category::create(['name' => 'Perlengkapan', 'slug' => 'perlengkapan']);

        $product = Product::create([
            'category_id' => $category->id,
            'name' => 'Botol Minum Olahraga',
            'slug' => 'botol-minum-olahraga',
            'sku' => 'TSK-BTL-01',
            'price' => 50000,
            'stock' => 10,
        ]);

        // Restock +15 (stok dari 10 jadi 25)
        $response = $this->putJson("/api/products/{$product->id}", [
            'stock' => 25,
        ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('stock_mutations', [
            'product_id' => $product->id,
            'type' => 'in',
            'quantity' => 15,
            'stock_before' => 10,
            'stock_after' => 25,
            'reference_type' => 'adjustment',
        ]);
    }

    public function test_update_fails_when_sku_taken_by_other_product(): void
    {
        $category = Category::create(['name' => 'Aksesoris', 'slug' => 'aksesoris']);

        Product::create([
            'category_id' => $category->id,
            'name' => 'Produk A',
            'slug' => 'produk-a',
            'sku' => 'TSK-SKU-A',
            'price' => 10000,
        ]);

        $productB = Product::create([
            'category_id' => $category->id,
            'name' => 'Produk B',
            'slug' => 'produk-b',
            'sku' => 'TSK-SKU-B',
            'price' => 20000,
        ]);

        $response = $this->putJson("/api/products/{$productB->id}", [
            'sku' => 'TSK-SKU-A',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['sku']);
    }

    public function test_update_returns_404_for_nonexistent_product(): void
    {
        $response = $this->putJson('/api/products/999999', [
            'name' => 'Tidak Ada',
        ]);

        $response->assertStatus(404);
    }
}
