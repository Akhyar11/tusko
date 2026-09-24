<?php

namespace Tests\Feature;

use App\Models\ActivityLog;
use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use App\Models\Warehouse;
use App\Services\InventoryService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ActivityLogTest extends TestCase
{
    use RefreshDatabase;

    private function createProduct(array $overrides = []): Product
    {
        static $sequence = 0;
        $sequence++;

        $category = Category::create([
            'name' => 'Audit ' . $sequence,
            'slug' => 'audit-' . $sequence . '-' . uniqid(),
        ]);

        return Product::create(array_merge([
            'category_id' => $category->id,
            'name' => 'Produk Audit ' . $sequence,
            'slug' => 'produk-audit-' . $sequence . '-' . uniqid(),
            'sku' => 'TSK-AUD-' . $sequence,
            'price' => 100000,
            'cost_price' => 60000,
            'stock' => 10,
            'stock_minimum' => 5,
        ], $overrides));
    }

    public function test_logs_product_price_change(): void
    {
        $product = $this->createProduct(['price' => 100000, 'cost_price' => 60000]);

        $product->update(['price' => 120000, 'cost_price' => 70000]);

        $log = ActivityLog::where('action', 'product.price_updated')
            ->where('subject_type', $product->getMorphClass())
            ->where('subject_id', $product->id)
            ->latest('id')
            ->first();

        $this->assertNotNull($log);
        $this->assertEqualsWithDelta(100000.0, (float) $log->properties['changes']['price']['before'], 0.01);
        $this->assertEqualsWithDelta(120000.0, (float) $log->properties['changes']['price']['after'], 0.01);
        $this->assertEqualsWithDelta(60000.0, (float) $log->properties['changes']['cost_price']['before'], 0.01);
        $this->assertEqualsWithDelta(70000.0, (float) $log->properties['changes']['cost_price']['after'], 0.01);
    }

    public function test_does_not_log_when_watched_product_attributes_unchanged(): void
    {
        $product = $this->createProduct();

        $product->update(['name' => 'Nama Baru Tanpa Perubahan Harga']);

        $this->assertSame(
            0,
            ActivityLog::where('action', 'product.price_updated')->where('subject_id', $product->id)->count()
        );
    }

    public function test_logs_stock_mutation_by_inventory_service(): void
    {
        Warehouse::create([
            'code' => 'GDG-AUD-01',
            'name' => 'Gudang Audit',
            'address' => 'Jl. Audit No. 1',
            'city' => 'Jakarta',
            'province' => 'DKI Jakarta',
            'is_primary' => true,
            'is_active' => true,
        ]);

        $product = $this->createProduct(['stock' => 10]);

        app(InventoryService::class)->increase($product, 15, [
            'reference_type' => 'manual_restock',
            'reference_id' => 'PO/AUD/01',
        ]);

        $log = ActivityLog::where('action', 'stock.mutated')
            ->where('subject_id', $product->id)
            ->latest('id')
            ->first();

        $this->assertNotNull($log);
        $this->assertSame(15, (int) $log->properties['quantity']);
        $this->assertSame('in', $log->properties['type']);
        $this->assertSame(10, (int) $log->properties['stock_before']);
        $this->assertSame(25, (int) $log->properties['stock_after']);
        $this->assertSame('PO/AUD/01', $log->properties['reference_id']);
    }

    public function test_logs_user_role_change(): void
    {
        $user = User::create([
            'name' => 'Staf Gudang',
            'email' => 'staf-audit-' . uniqid() . '@example.test',
            'password' => 'password123',
            'role' => 'customer',
        ]);

        $user->update(['role' => 'admin']);

        $log = ActivityLog::where('action', 'user.role_updated')
            ->where('subject_id', $user->id)
            ->latest('id')
            ->first();

        $this->assertNotNull($log);
        $this->assertSame('customer', $log->properties['before']);
        $this->assertSame('admin', $log->properties['after']);
    }

    public function test_does_not_log_when_role_unchanged(): void
    {
        $user = User::create([
            'name' => 'Pelanggan Uji',
            'email' => 'pelanggan-audit-' . uniqid() . '@example.test',
            'password' => 'password123',
            'role' => 'customer',
        ]);

        $user->update(['name' => 'Pelanggan Uji Diubah']);

        $this->assertSame(
            0,
            ActivityLog::where('action', 'user.role_updated')->where('subject_id', $user->id)->count()
        );
    }
}
