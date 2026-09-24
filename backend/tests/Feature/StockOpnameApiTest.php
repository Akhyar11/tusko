<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\InventoryBalance;
use App\Models\Product;
use App\Models\StockOpname;
use App\Models\StockOpnameItem;
use App\Models\Warehouse;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StockOpnameApiTest extends TestCase
{
    use RefreshDatabase;

    private function warehouse(): Warehouse
    {
        return Warehouse::create([
            'code' => 'GDG-SO-01',
            'name' => 'Gudang Opname',
            'address' => 'Jl. Opname',
            'city' => 'Jakarta',
            'province' => 'DKI Jakarta',
            'is_primary' => true,
            'is_active' => true,
        ]);
    }

    private function product(int $stock): Product
    {
        static $sequence = 0;
        $sequence++;

        $category = Category::create([
            'name' => 'Opname ' . $sequence,
            'slug' => 'opname-' . $sequence . '-' . uniqid(),
        ]);

        return Product::create([
            'category_id' => $category->id,
            'name' => 'Produk Opname ' . $sequence,
            'slug' => 'produk-opname-' . $sequence . '-' . uniqid(),
            'sku' => 'TSK-SO-' . $sequence,
            'price' => 100000,
            'stock' => $stock,
        ]);
    }

    public function test_can_create_opname_with_system_snapshot_and_submit(): void
    {
        $warehouse = $this->warehouse();
        $product = $this->product(10);

        InventoryBalance::create([
            'warehouse_id' => $warehouse->id,
            'product_id' => $product->id,
            'on_hand_stock' => 10,
            'reserved_stock' => 0,
            'available_stock' => 10,
            'safety_stock' => 5,
        ]);

        $response = $this->postJson('/api/stock-opnames', [
            'warehouse_id' => $warehouse->id,
            'notes' => 'Opname bulanan',
            'items' => [
                ['product_id' => $product->id, 'physical_stock' => 8],
            ],
        ]);

        $response->assertStatus(201);
        $opnameNumber = $response->json('data.opname_number');
        $this->assertMatchesRegularExpression('/^SO\/' . now()->format('dmY') . '\/\d{3,}$/', $opnameNumber);

        $item = StockOpnameItem::whereHas('opname', fn ($q) => $q->where('opname_number', $opnameNumber))->firstOrFail();
        $this->assertSame(10, (int) $item->system_stock);
        $this->assertSame(8, (int) $item->physical_stock);
        $this->assertSame(-2, (int) $item->difference);

        $this->postJson("/api/stock-opnames/{$opnameNumber}/submit")
            ->assertStatus(200)
            ->assertJsonPath('data.status', 'in_progress');

        // Submit kedua ditolak.
        $this->postJson("/api/stock-opnames/{$opnameNumber}/submit")->assertStatus(422);

        $this->assertSame('in_progress', StockOpname::where('opname_number', $opnameNumber)->value('status'));
    }

    public function test_can_list_opnames_with_filter(): void
    {
        $warehouse = $this->warehouse();
        $product = $this->product(5);

        StockOpname::create([
            'opname_number' => 'SO/MANUAL/001',
            'warehouse_id' => $warehouse->id,
            'status' => 'draft',
        ]);
        StockOpname::create([
            'opname_number' => 'SO/MANUAL/002',
            'warehouse_id' => $warehouse->id,
            'status' => 'approved',
        ]);

        $all = $this->getJson('/api/stock-opnames');
        $all->assertStatus(200)->assertJsonCount(2, 'data');

        $filtered = $this->getJson('/api/stock-opnames?status=draft');
        $filtered->assertStatus(200)->assertJsonCount(1, 'data')->assertJsonPath('data.0.opname_number', 'SO/MANUAL/001');
    }
}
