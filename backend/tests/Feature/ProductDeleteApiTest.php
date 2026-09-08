<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductDeleteApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_permanently_delete_product_by_id(): void
    {
        $category = Category::create(['name' => 'Kategori Uji', 'slug' => 'kategori-uji']);

        $product = Product::create([
            'category_id' => $category->id,
            'name' => 'Produk Dihapus Segera',
            'slug' => 'produk-dihapus-segera',
            'sku' => 'TSK-DEL-01',
            'price' => 50000,
        ]);

        $product->images()->create([
            'image_url' => 'https://example.com/del-img.jpg',
            'sort_order' => 0,
        ]);

        $this->assertDatabaseHas('products', ['id' => $product->id]);
        $this->assertDatabaseHas('product_images', ['product_id' => $product->id]);

        $response = $this->deleteJson("/api/products/{$product->id}");

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'deleted_id' => $product->id,
            ]);

        $this->assertDatabaseMissing('products', ['id' => $product->id]);
        $this->assertDatabaseMissing('product_images', ['product_id' => $product->id]);
    }

    public function test_can_permanently_delete_product_by_slug(): void
    {
        $category = Category::create(['name' => 'Kategori Uji', 'slug' => 'kategori-uji']);

        Product::create([
            'category_id' => $category->id,
            'name' => 'Hapus Lewat Slug',
            'slug' => 'hapus-lewat-slug',
            'price' => 25000,
        ]);

        $response = $this->deleteJson('/api/products/hapus-lewat-slug');

        $response->assertStatus(200);
        $this->assertDatabaseMissing('products', ['slug' => 'hapus-lewat-slug']);
    }

    public function test_can_deactivate_product_instead_of_permanent_delete(): void
    {
        $category = Category::create(['name' => 'Kategori Uji', 'slug' => 'kategori-uji']);

        $product = Product::create([
            'category_id' => $category->id,
            'name' => 'Produk Nonaktifkan Saja',
            'slug' => 'produk-nonaktifkan-saja',
            'price' => 80000,
            'status' => 'active',
            'active' => true,
        ]);

        $response = $this->deleteJson("/api/products/{$product->id}?deactivate_only=1");

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'data' => [
                    'id' => $product->id,
                    'status' => 'inactive',
                    'active' => false,
                ]
            ]);

        $this->assertDatabaseHas('products', [
            'id' => $product->id,
            'status' => 'inactive',
            'active' => false,
        ]);
    }

    public function test_can_toggle_product_status(): void
    {
        $category = Category::create(['name' => 'Kategori Uji', 'slug' => 'kategori-uji']);

        $product = Product::create([
            'category_id' => $category->id,
            'name' => 'Produk Toggle',
            'slug' => 'produk-toggle',
            'price' => 30000,
            'status' => 'active',
            'active' => true,
        ]);

        // Toggle dari aktif jadi inaktif
        $response1 = $this->postJson("/api/products/{$product->id}/toggle-status");
        $response1->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'data' => [
                    'active' => false,
                    'status' => 'inactive',
                ]
            ]);

        // Toggle kembali dari inaktif jadi aktif
        $response2 = $this->postJson("/api/products/{$product->id}/toggle-status");
        $response2->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'data' => [
                    'active' => true,
                    'status' => 'active',
                ]
            ]);
    }

    public function test_delete_returns_404_when_product_not_found(): void
    {
        $response = $this->deleteJson('/api/products/999999');
        $response->assertStatus(404);
    }
}
