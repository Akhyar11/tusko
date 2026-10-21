<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Services\FileStorageService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class StorageProxyTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_serve_file_via_storage_proxy(): void
    {
        Storage::fake('s3');
        Storage::fake('public');

        // Simpan file dummy
        $dummyContent = 'PNG_DUMMY_BINARY';
        Storage::disk(FileStorageService::disk())->put('products/sample.png', $dummyContent);

        // Akses via /api/storage/products/sample.png
        $response = $this->get('/api/storage/products/sample.png');
        $response->assertStatus(200);
        $response->assertHeader('Cache-Control', 'immutable, max-age=31536000, public');
    }

    public function test_rejects_path_traversal(): void
    {
        $response = $this->get('/api/storage/../secret.txt');
        $response->assertStatus(400);
    }

    public function test_returns_404_for_missing_file(): void
    {
        $response = $this->get('/api/storage/products/not-found-image.png');
        $response->assertStatus(404);
    }

    public function test_product_store_and_update_accepts_gallery_payload(): void
    {
        $category = Category::create(['name' => 'Olahraga', 'slug' => 'olahraga']);

        $storePayload = [
            'name' => 'Tusko Boxing Gloves Pro',
            'category_id' => $category->id,
            'price' => 250000,
            'imageUrl' => 'https://example.com/main.jpg',
            'gallery' => [
                'https://example.com/gallery-1.jpg',
                'https://example.com/gallery-2.jpg',
            ],
        ];

        $response = $this->postJson('/api/products', $storePayload);
        $response->assertStatus(201);
        $response->assertJsonPath('data.gallery.0', 'https://example.com/gallery-1.jpg');
        $response->assertJsonPath('data.gallery.1', 'https://example.com/gallery-2.jpg');

        $productId = $response->json('data.id');
        $product = Product::find($productId);
        $this->assertCount(2, $product->images);

        // Test update with gallery
        $updatePayload = [
            'gallery' => [
                'https://example.com/gallery-updated.jpg',
            ],
        ];

        $updateResponse = $this->putJson("/api/products/{$productId}", $updatePayload);
        $updateResponse->assertStatus(200);
        $this->assertCount(1, $product->fresh()->images);
        $updateResponse->assertJsonPath('data.gallery.0', 'https://example.com/gallery-updated.jpg');
    }
}
