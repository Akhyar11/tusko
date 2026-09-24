<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\InventoryBalance;
use App\Models\Product;
use App\Models\StockTransfer;
use App\Models\Warehouse;
use App\Services\WarehouseAllocationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StockTransferApiTest extends TestCase
{
    use RefreshDatabase;

    private function warehouse(string $code, int $priority = 0): Warehouse
    {
        return Warehouse::create([
            'code' => $code,
            'name' => 'Gudang ' . $code,
            'address' => 'Jl. Transfer',
            'city' => 'Jakarta',
            'province' => 'DKI Jakarta',
            'is_primary' => false,
            'is_active' => true,
            'priority' => $priority,
        ]);
    }

    private function product(int $stock): Product
    {
        static $sequence = 0;
        $sequence++;

        $category = Category::create([
            'name' => 'Transfer ' . $sequence,
            'slug' => 'transfer-' . $sequence . '-' . uniqid(),
        ]);

        return Product::create([
            'category_id' => $category->id,
            'name' => 'Produk Transfer ' . $sequence,
            'slug' => 'produk-transfer-' . $sequence . '-' . uniqid(),
            'sku' => 'TSK-TRF-' . $sequence,
            'price' => 100000,
            'stock' => $stock,
        ]);
    }

    private function seedBalance(Warehouse $warehouse, Product $product, int $onHand): InventoryBalance
    {
        return InventoryBalance::create([
            'warehouse_id' => $warehouse->id,
            'product_id' => $product->id,
            'on_hand_stock' => $onHand,
            'reserved_stock' => 0,
            'available_stock' => $onHand,
            'safety_stock' => 5,
        ]);
    }

    public function test_transfer_approval_moves_stock_between_warehouses(): void
    {
        $source = $this->warehouse('GDG-TRF-SRC');
        $dest = $this->warehouse('GDG-TRF-DST', 5);
        $product = $this->product(10);
        $this->seedBalance($source, $product, 10);

        $create = $this->postJson('/api/stock-transfers', [
            'from_warehouse_id' => $source->id,
            'to_warehouse_id' => $dest->id,
            'items' => [
                ['product_id' => $product->id, 'quantity' => 4],
            ],
        ]);

        $create->assertStatus(201);
        $transferNumber = $create->json('data.transfer_number');
        $this->assertMatchesRegularExpression('/^TRF\/' . now()->format('dmY') . '\/\d{3,}$/', $transferNumber);

        $this->postJson("/api/stock-transfers/{$transferNumber}/approve")
            ->assertStatus(200)
            ->assertJsonPath('data.status', 'completed');

        $this->assertSame(6, (int) InventoryBalance::where('warehouse_id', $source->id)->where('product_id', $product->id)->value('on_hand_stock'));
        $this->assertSame(4, (int) InventoryBalance::where('warehouse_id', $dest->id)->where('product_id', $product->id)->value('on_hand_stock'));
        $this->assertSame(10, (int) $product->fresh()->stock);
    }

    public function test_transfer_approval_rejected_when_source_insufficient(): void
    {
        $source = $this->warehouse('GDG-TRF-SRC2');
        $dest = $this->warehouse('GDG-TRF-DST2');
        $product = $this->product(2);
        $this->seedBalance($source, $product, 2);

        $create = $this->postJson('/api/stock-transfers', [
            'from_warehouse_id' => $source->id,
            'to_warehouse_id' => $dest->id,
            'items' => [
                ['product_id' => $product->id, 'quantity' => 5],
            ],
        ]);

        $create->assertStatus(201);
        $transferNumber = $create->json('data.transfer_number');

        $this->postJson("/api/stock-transfers/{$transferNumber}/approve")->assertStatus(422);

        $this->assertSame(2, (int) InventoryBalance::where('warehouse_id', $source->id)->where('product_id', $product->id)->value('on_hand_stock'));
        $this->assertSame('draft', StockTransfer::where('transfer_number', $transferNumber)->value('status'));
    }

    public function test_warehouse_allocation_prefers_priority_then_availability(): void
    {
        $lowPriority = $this->warehouse('GDG-ALLOC-LOW', 0);
        $highTight = $this->warehouse('GDG-ALLOC-HIGH-A', 10);
        $highRoomy = $this->warehouse('GDG-ALLOC-HIGH-B', 10);

        $product = $this->product(16);
        $this->seedBalance($lowPriority, $product, 5);
        $this->seedBalance($highTight, $product, 3);
        $this->seedBalance($highRoomy, $product, 8);

        $service = app(WarehouseAllocationService::class);

        $allocation = $service->allocate($product->id, null, 4);
        $this->assertNotNull($allocation);
        $this->assertSame($highRoomy->id, (int) $allocation->warehouse_id);

        $this->assertNull($service->allocate($product->id, null, 9));
    }
}
