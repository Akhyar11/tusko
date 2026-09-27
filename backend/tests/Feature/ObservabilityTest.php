<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\Vendor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Mockery;
use Tests\TestCase;

class ObservabilityTest extends TestCase
{
    use RefreshDatabase;

    public function test_health_endpoint_reports_all_subsystems_ok(): void
    {
        Storage::fake(config('filesystems.default'));

        $response = $this->getJson('/api/health');

        $response->assertOk()
            ->assertJsonPath('status', 'ok')
            ->assertJsonPath('checks.database.status', 'ok')
            ->assertJsonPath('checks.cache.status', 'ok')
            ->assertJsonPath('checks.queue.status', 'ok')
            ->assertJsonPath('checks.storage.status', 'ok');

        $this->assertNotEmpty($response->json('timestamp'));
    }

    public function test_api_requests_are_logged_structured(): void
    {
        Storage::fake(config('filesystems.default'));

        Log::spy();
        Log::shouldReceive('channel')->with('api')->andReturnSelf();
        Log::shouldReceive('info')->once()->with('api.request', Mockery::on(fn ($context) => $context['method'] === 'GET'
            && $context['path'] === '/api/health'
            && $context['status'] === 200
            && array_key_exists('duration_ms', $context)
            && array_key_exists('ip', $context)));

        $this->getJson('/api/health')->assertOk();
    }

    public function test_product_list_eager_loads_images_without_n_plus_one(): void
    {
        $category = Category::create(['name' => 'Eager', 'slug' => 'eager']);

        $vendor = Vendor::create([
            'code' => 'VND/EAGER/001',
            'company_name' => 'Vendor Eager',
            'contact_person' => 'Kontak',
            'phone' => '0812000000',
            'address' => 'Jl. Eager',
        ]);

        $this->seedProducts($category, $vendor, 3);

        DB::enableQueryLog();
        $this->getJson('/api/products?per_page=50&include_inactive=1')->assertOk();
        $firstRunQueries = count(DB::getQueryLog());
        DB::flushQueryLog();

        $this->seedProducts($category, $vendor, 3);
        DB::flushQueryLog();

        $this->getJson('/api/products?per_page=50&include_inactive=1')->assertOk();
        $secondRunQueries = count(DB::getQueryLog());

        // Menambah produk + gambar tidak boleh menambah jumlah query (bukan N+1).
        $this->assertLessThanOrEqual($firstRunQueries + 1, $secondRunQueries);
    }

    private function seedProducts(Category $category, Vendor $vendor, int $count): void
    {
        for ($i = 0; $i < $count; $i++) {
            $product = Product::create([
                'category_id' => $category->id,
                'vendor_id' => $vendor->id,
                'name' => 'Produk Eager ' . Str::uuid(),
                'slug' => 'produk-eager-' . Str::uuid(),
                'sku' => 'TSK-EAG-' . Str::random(8),
                'price' => 100000,
                'stock' => 10,
                'status' => 'active',
                'active' => true,
            ]);

            ProductImage::create([
                'product_id' => $product->id,
                'image_url' => 'products/' . Str::uuid() . '.jpg',
                'sort_order' => 1,
            ]);

            ProductImage::create([
                'product_id' => $product->id,
                'image_url' => 'products/' . Str::uuid() . '.jpg',
                'sort_order' => 2,
            ]);
        }
    }
}
