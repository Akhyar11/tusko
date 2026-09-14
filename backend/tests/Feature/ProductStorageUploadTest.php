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

    public function test_updating_product_image_replaces_and_deletes_old_image_from_storage(): void
    {
        $disk = config('filesystems.default', 'public');
        $category = Category::create([
            'name' => 'Badminton Gear',
            'slug' => 'badminton-gear',
        ]);

        $fileA = UploadedFile::fake()->image('shoe_v1.jpg', 800, 800);
        $resCreate = $this->postJson('/api/products', [
            'name' => 'Tusko Smash Pro',
            'category_id' => $category->id,
            'price' => 750000,
            'stock' => 5,
            'image' => $fileA,
        ]);
        $resCreate->assertCreated();

        $product = Product::first();
        $oldImagePath = $product->getRawOriginal('image_url');
        $this->assertNotNull($oldImagePath);
        Storage::disk($disk)->assertExists($oldImagePath);

        // Update dengan foto baru (fileB) via multipart PUT
        $fileB = UploadedFile::fake()->image('shoe_v2.jpg', 800, 800);
        $resUpdate = $this->post('/api/products/' . $product->id, [
            '_method' => 'PUT',
            'name' => 'Tusko Smash Pro V2',
            'image' => $fileB,
        ]);
        $resUpdate->assertOk();

        $product->refresh();
        $newImagePath = $product->getRawOriginal('image_url');
        $this->assertNotEquals($oldImagePath, $newImagePath);

        // Pastikan foto baru ada, dan foto lama sudah musnah terhapus dari storage
        Storage::disk($disk)->assertExists($newImagePath);
        Storage::disk($disk)->assertMissing($oldImagePath);
    }

    public function test_updating_product_gallery_deletes_removed_images_from_storage(): void
    {
        $disk = config('filesystems.default', 'public');
        $category = Category::create([
            'name' => 'Tennis',
            'slug' => 'tennis',
        ]);

        $g1 = UploadedFile::fake()->image('g1.jpg', 600, 600);
        $g2 = UploadedFile::fake()->image('g2.jpg', 600, 600);

        $resCreate = $this->postJson('/api/products', [
            'name' => 'Tusko Court Tennis Ace',
            'category_id' => $category->id,
            'price' => 890000,
            'stock' => 10,
            'gallery_images' => [$g1, $g2],
        ]);
        $resCreate->assertCreated();

        $product = Product::with('images')->first();
        $this->assertCount(2, $product->images);

        $pathG1 = $product->images[0]->getRawOriginal('image_url');
        $pathG2 = $product->images[1]->getRawOriginal('image_url');

        Storage::disk($disk)->assertExists($pathG1);
        Storage::disk($disk)->assertExists($pathG2);

        // Update gallery: simpan hanya G2 dan tambah foto baru G3
        $g3 = UploadedFile::fake()->image('g3.jpg', 600, 600);
        $resUpdate = $this->post('/api/products/' . $product->id, [
            '_method' => 'PUT',
            'images' => [$pathG2],
            'gallery_images' => [$g3],
        ]);
        $resUpdate->assertOk();

        // G1 yang dibuang dari gallery harus terhapus dari storage
        Storage::disk($disk)->assertMissing($pathG1);
        // G2 tetap dipertahankan
        Storage::disk($disk)->assertExists($pathG2);

        // Foto baru G3 tersimpan
        $product->refresh();
        $this->assertCount(2, $product->images);
    }

    public function test_deleting_product_deletes_main_image_and_gallery_from_storage(): void
    {
        $disk = config('filesystems.default', 'public');
        $category = Category::create([
            'name' => 'Training',
            'slug' => 'training',
        ]);

        $mainFile = UploadedFile::fake()->image('main.jpg', 800, 800);
        $galFile = UploadedFile::fake()->image('gal.jpg', 800, 800);

        $resCreate = $this->postJson('/api/products', [
            'name' => 'Tusko Training Mat',
            'category_id' => $category->id,
            'price' => 350000,
            'stock' => 20,
            'image' => $mainFile,
            'gallery_images' => [$galFile],
        ]);
        $resCreate->assertCreated();

        $product = Product::with('images')->first();
        $mainPath = $product->getRawOriginal('image_url');
        $galPath = $product->images->first()->getRawOriginal('image_url');

        Storage::disk($disk)->assertExists($mainPath);
        Storage::disk($disk)->assertExists($galPath);

        // Hapus permanen produk
        $resDelete = $this->deleteJson('/api/products/' . $product->id);
        $resDelete->assertOk();

        // Seluruh berkas di storage harus terhapus bersih
        Storage::disk($disk)->assertMissing($mainPath);
        Storage::disk($disk)->assertMissing($galPath);
        $this->assertDatabaseMissing('products', ['id' => $product->id]);
    }
}
