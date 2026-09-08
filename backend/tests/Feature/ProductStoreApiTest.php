<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductStoreApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_create_product_with_full_attributes(): void
    {
        $category = Category::create(['name' => 'Olahraga', 'slug' => 'olahraga']);

        $payload = [
            'name' => 'Tusko Running Shoes Speedster',
            'categoryId' => $category->id,
            'sku' => 'TSK-RUN-001',
            'description' => 'Sepatu lari sol empuk dengan bantalan udara',
            'price' => 450000,
            'originalPrice' => 600000,
            'costPrice' => 280000,
            'stock' => 15,
            'stockMinimum' => 5,
            'weight' => 750,
            'imageUrl' => 'https://example.com/shoes-main.jpg',
            'galleryUrls' => [
                'https://example.com/shoes-side.jpg',
                'https://example.com/shoes-bottom.jpg',
            ],
            'specList' => [
                ['key' => 'Bahan', 'value' => 'Breathable Mesh'],
                ['key' => 'Sol', 'value' => 'EVA Foam'],
            ],
            'variants' => [
                ['name' => 'Ukuran', 'options' => ['40', '41', '42', '43']],
            ],
            'status' => 'active',
        ];

        $response = $this->postJson('/api/products', $payload);

        $response->assertStatus(201)
            ->assertJson([
                'status' => 'success',
                'message' => 'Produk baru berhasil ditambahkan.',
                'data' => [
                    'name' => 'Tusko Running Shoes Speedster',
                    'sku' => 'TSK-RUN-001',
                    'price' => 450000,
                    'original_price' => 600000,
                    'discount_percentage' => 25,
                    'stock' => 15,
                    'weight' => 750,
                    'status' => 'active',
                ]
            ]);

        $this->assertDatabaseHas('products', [
            'sku' => 'TSK-RUN-001',
            'name' => 'Tusko Running Shoes Speedster',
            'weight' => 750,
        ]);

        $product = Product::where('sku', 'TSK-RUN-001')->first();
        $this->assertNotNull($product);
        $this->assertCount(2, $product->images);

        // Mutasi stok tercatat otomatis
        $this->assertDatabaseHas('stock_mutations', [
            'product_id' => $product->id,
            'type' => 'in',
            'quantity' => 15,
            'reference_type' => 'initial_inventory',
        ]);
    }

    public function test_can_create_product_with_minimal_attributes(): void
    {
        $category = Category::create(['name' => 'Buku', 'slug' => 'buku']);

        $payload = [
            'name' => 'Buku Panduan React',
            'category_id' => $category->id,
            'price' => 95000,
        ];

        $response = $this->postJson('/api/products', $payload);

        $response->assertStatus(201);
        $this->assertDatabaseHas('products', [
            'name' => 'Buku Panduan React',
            'slug' => 'buku-panduan-react',
            'weight' => 500,
            'stock' => 0,
        ]);

        $createdProduct = Product::where('slug', 'buku-panduan-react')->first();
        $this->assertNotNull($createdProduct->sku);
    }

    public function test_store_product_validation_required_fields(): void
    {
        $response = $this->postJson('/api/products', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'category_id', 'price']);
    }

    public function test_store_product_fails_if_category_not_exists(): void
    {
        $payload = [
            'name' => 'Barang Valid',
            'category_id' => 99999,
            'price' => 10000,
        ];

        $response = $this->postJson('/api/products', $payload);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['category_id']);
    }
}
