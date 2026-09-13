<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductMultiCategoryTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_create_product_with_multiple_categories(): void
    {
        $catPria = Category::create(['name' => 'Pria', 'slug' => 'pria']);
        $catJersey = Category::create(['name' => 'Jersey Olahraga', 'slug' => 'jersey-olahraga']);

        $payload = [
            'name' => 'Jersey Lari Breathable DryFit Pria',
            'category_ids' => [$catPria->id, $catJersey->id],
            'sku' => 'TSK-JRS-001',
            'price' => 150000,
            'stock' => 20,
            'status' => 'active',
        ];

        $response = $this->postJson('/api/products', $payload);

        $response->assertStatus(201)
            ->assertJson([
                'status' => 'success',
                'data' => [
                    'name' => 'Jersey Lari Breathable DryFit Pria',
                    'category_id' => $catPria->id,
                ],
            ]);

        $responseData = $response->json('data');
        $this->assertCount(2, $responseData['categories']);
        $this->assertContains($catPria->id, $responseData['category_ids']);
        $this->assertContains($catJersey->id, $responseData['category_ids']);

        $this->assertDatabaseHas('category_product', [
            'category_id' => $catPria->id,
            'product_id' => $responseData['id'],
        ]);
        $this->assertDatabaseHas('category_product', [
            'category_id' => $catJersey->id,
            'product_id' => $responseData['id'],
        ]);
    }

    public function test_can_update_product_categories(): void
    {
        $catPria = Category::create(['name' => 'Pria', 'slug' => 'pria']);
        $catJersey = Category::create(['name' => 'Jersey Olahraga', 'slug' => 'jersey-olahraga']);
        $catAksesoris = Category::create(['name' => 'Aksesoris', 'slug' => 'aksesoris']);

        $product = Product::create([
            'name' => 'Produk Awal',
            'slug' => 'produk-awal',
            'category_id' => $catPria->id,
            'sku' => 'TSK-AWL-001',
            'price' => 100000,
            'stock' => 10,
            'active' => true,
        ]);
        $product->categories()->sync([$catPria->id]);

        $updatePayload = [
            'category_ids' => [$catJersey->id, $catAksesoris->id],
        ];

        $response = $this->putJson("/api/products/{$product->id}", $updatePayload);

        $response->assertStatus(200);
        $responseData = $response->json('data');

        $this->assertEquals($catJersey->id, $responseData['category_id']);
        $this->assertCount(2, $responseData['categories']);
        $this->assertContains($catJersey->id, $responseData['category_ids']);
        $this->assertContains($catAksesoris->id, $responseData['category_ids']);
        $this->assertNotContains($catPria->id, $responseData['category_ids']);

        $this->assertDatabaseMissing('category_product', [
            'category_id' => $catPria->id,
            'product_id' => $product->id,
        ]);
        $this->assertDatabaseHas('category_product', [
            'category_id' => $catJersey->id,
            'product_id' => $product->id,
        ]);
    }

    public function test_can_filter_products_by_secondary_category(): void
    {
        $catPria = Category::create(['name' => 'Pria', 'slug' => 'pria']);
        $catJersey = Category::create(['name' => 'Jersey Olahraga', 'slug' => 'jersey-olahraga']);
        $catSepatu = Category::create(['name' => 'Sepatu Olahraga', 'slug' => 'sepatu-olahraga']);

        $productJersey = Product::create([
            'name' => 'Jersey Pria Keren',
            'slug' => 'jersey-pria-keren',
            'category_id' => $catPria->id,
            'sku' => 'TSK-JRS-002',
            'price' => 120000,
            'stock' => 10,
            'active' => true,
        ]);
        $productJersey->categories()->sync([$catPria->id, $catJersey->id]);

        $productSepatu = Product::create([
            'name' => 'Sepatu Pria Cepat',
            'slug' => 'sepatu-pria-cepat',
            'category_id' => $catPria->id,
            'sku' => 'TSK-SPT-001',
            'price' => 300000,
            'stock' => 5,
            'active' => true,
        ]);
        $productSepatu->categories()->sync([$catPria->id, $catSepatu->id]);

        $resPria = $this->getJson("/api/products?category_id={$catPria->id}");
        $resPria->assertStatus(200);
        $priaItems = collect($resPria->json('data'));
        $this->assertTrue($priaItems->contains('sku', 'TSK-JRS-002'));
        $this->assertTrue($priaItems->contains('sku', 'TSK-SPT-001'));

        $resJersey = $this->getJson("/api/products?category_id={$catJersey->id}");
        $resJersey->assertStatus(200);
        $jerseyItems = collect($resJersey->json('data'));
        $this->assertTrue($jerseyItems->contains('sku', 'TSK-JRS-002'));
        $this->assertFalse($jerseyItems->contains('sku', 'TSK-SPT-001'));

        $resSlugJersey = $this->getJson("/api/products?category=jersey-olahraga");
        $resSlugJersey->assertStatus(200);
        $slugJerseyItems = collect($resSlugJersey->json('data'));
        $this->assertTrue($slugJerseyItems->contains('sku', 'TSK-JRS-002'));
        $this->assertFalse($slugJerseyItems->contains('sku', 'TSK-SPT-001'));
    }
}
