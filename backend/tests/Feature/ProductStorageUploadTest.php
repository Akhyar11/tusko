<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ProductStorageUploadTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake(config('filesystems.default', 'public'));
    }

    public function test_can_create_product_with_uploaded_image_file(): void
    {
        $category = Category::create([
            'name' => 'Running Shoes',
            'slug' => 'running-shoes',
        ]);

        $file = UploadedFile::fake()->image('sneaker.jpg', 800, 800);
        $galleryFile = UploadedFile::fake()->image('sneaker_side.jpg', 800, 800);

        $payload = [
            'name' => 'Tusko Speed Runner Pro',
            'category_id' => $category->id,
            'price' => 1250000,
            'stock' => 15,
            'image' => $file,
            'gallery_images' => [$galleryFile],
        ];

        $response = $this->postJson('/api/products', $payload);

        $response->assertCreated()
            ->assertJsonPath('data.name', 'Tusko Speed Runner Pro');

        $product = Product::with('images')->first();
        $this->assertNotNull($product);
        $this->assertNotNull($product->getRawOriginal('image_url'));

        // Assert file exists in active storage disk
        $disk = config('filesystems.default', 'public');
        Storage::disk($disk)->assertExists($product->getRawOriginal('image_url'));

        // Assert gallery image exists in storage
        $this->assertCount(1, $product->images);
        Storage::disk($disk)->assertExists($product->images->first()->getRawOriginal('image_url'));
    }

    public function test_can_create_product_with_base64_data_image(): void
    {
        $category = Category::create([
            'name' => 'Basketball Shoes',
            'slug' => 'basketball-shoes',
        ]);

        // 1x1 transparent PNG data URL
        $base64Image = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

        $payload = [
            'name' => 'Tusko Court Master',
            'category_id' => $category->id,
            'price' => 950000,
            'stock' => 10,
            'image_url' => $base64Image,
        ];

        $response = $this->postJson('/api/products', $payload);

        $response->assertCreated();

        $product = Product::first();
        $this->assertNotNull($product);

        $storedPath = $product->getRawOriginal('image_url');
        $this->assertNotNull($storedPath);
        $this->assertStringStartsWith('products/', $storedPath);

        $disk = config('filesystems.default', 'public');
        Storage::disk($disk)->assertExists($storedPath);
    }

    public function test_can_upload_image_via_standalone_endpoint(): void
    {
        $file = UploadedFile::fake()->image('banner.png', 1200, 600);

        $response = $this->postJson('/api/products/upload-image', [
            'image' => $file,
        ]);

        $response->assertCreated()
            ->assertJsonStructure([
                'message',
                'data' => [
                    'path',
                    'url',
                ],
            ]);

        $path = $response->json('data.path');
        $disk = config('filesystems.default', 'public');
        Storage::disk($disk)->assertExists($path);
    }

    public function test_can_upload_avatar_to_storage(): void
    {
        $user = User::factory()->create();

        $file = UploadedFile::fake()->image('profile_pic.jpg', 400, 400);

        $response = $this->actingAs($user)->patchJson('/api/auth/profile', [
            'name' => 'Updated User Name',
            'avatar' => $file,
        ]);

        $response->assertOk();

        $user->refresh();
        $storedPath = $user->getRawOriginal('avatar');
        $this->assertNotNull($storedPath);

        $disk = config('filesystems.default', 'public');
        Storage::disk($disk)->assertExists($storedPath);
    }
}
