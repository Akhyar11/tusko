<?php

namespace Tests\Feature;

use App\Exceptions\InsufficientStockException;
use App\Models\Category;
use App\Models\InventoryBalance;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\StockMutation;
use App\Models\Warehouse;
use App\Services\InventoryService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InventoryServiceTest extends TestCase
{
    use RefreshDatabase;

    private function service(): InventoryService
    {
        return app(InventoryService::class);
    }

    private function createWarehouse(string $code, bool $primary = true): Warehouse
    {
        return Warehouse::create([
            'code' => $code,
            'name' => 'Gudang ' . $code,
            'address' => 'Jl. Uji Inventori',
            'city' => 'Jakarta',
            'province' => 'DKI Jakarta',
            'is_primary' => $primary,
            'is_active' => true,
        ]);
    }

    private function createProduct(array $overrides = []): Product
    {
        static $sequence = 0;
        $sequence++;

        $category = Category::create([
            'name' => 'Inventori ' . $sequence,
            'slug' => 'inventori-' . $sequence . '-' . uniqid(),
        ]);

        return Product::create(array_merge([
            'category_id' => $category->id,
            'name' => 'Produk Inventori ' . $sequence,
            'slug' => 'produk-inventori-' . $sequence . '-' . uniqid(),
            'sku' => 'TSK-INV-' . $sequence,
            'price' => 150000,
            'stock' => 10,
            'stock_minimum' => 5,
        ], $overrides));
    }

    public function test_increase_writes_authoritative_balance_mutation_and_aggregate(): void
    {
        $warehouse = $this->createWarehouse('GDG-INV-01');
        $product = $this->createProduct(['stock' => 10]);

        $mutation = $this->service()->increase($product, 15, [
            'reference_type' => 'manual_restock',
            'reference_id' => 'PO/TEST/01',
            'notes' => 'Restock uji',
            'created_by' => 'Tester',
        ]);

        $balance = InventoryBalance::where('warehouse_id', $warehouse->id)
            ->where('product_id', $product->id)
            ->whereNull('product_variant_id')
            ->first();

        $this->assertNotNull($balance);
        $this->assertSame(25, (int) $balance->on_hand_stock);
        $this->assertSame(25, (int) $balance->available_stock);
        $this->assertSame(5, (int) $balance->safety_stock);

        $fresh = $product->fresh();
        $this->assertSame(25, (int) $fresh->stock);
        $this->assertNotNull($fresh->last_restock_at);

        $this->assertSame('in', $mutation->type);
        $this->assertSame(15, (int) $mutation->quantity);
        $this->assertSame(10, (int) $mutation->stock_before);
        $this->assertSame(25, (int) $mutation->stock_after);
        $this->assertSame($warehouse->id, $mutation->warehouse_id);
        $this->assertSame('PO/TEST/01', $mutation->reference_id);
        $this->assertSame('Tester', $mutation->created_by);
    }

    public function test_decrease_writes_authoritative_balance_mutation_and_aggregate(): void
    {
        $warehouse = $this->createWarehouse('GDG-INV-02');
        $product = $this->createProduct(['stock' => 20]);

        $mutation = $this->service()->decrease($product, 5, [
            'reference_type' => 'manual_reduce',
            'reference_id' => 'BA/TEST/01',
        ]);

        $balance = InventoryBalance::where('warehouse_id', $warehouse->id)
            ->where('product_id', $product->id)
            ->whereNull('product_variant_id')
            ->first();

        $this->assertSame(15, (int) $balance->on_hand_stock);
        $this->assertSame(15, (int) $balance->available_stock);
        $this->assertSame(15, (int) $product->fresh()->stock);

        $this->assertSame('out', $mutation->type);
        $this->assertSame(5, (int) $mutation->quantity);
        $this->assertSame(20, (int) $mutation->stock_before);
        $this->assertSame(15, (int) $mutation->stock_after);
    }

    public function test_decrease_throws_and_rolls_back_when_stock_insufficient(): void
    {
        $this->createWarehouse('GDG-INV-03');
        $product = $this->createProduct(['stock' => 3]);

        $thrown = null;

        try {
            $this->service()->decrease($product, 10, ['reference_type' => 'manual_reduce']);
        } catch (InsufficientStockException $exception) {
            $thrown = $exception;
        }

        $this->assertInstanceOf(InsufficientStockException::class, $thrown);
        $this->assertSame(3, $thrown->available());
        $this->assertSame(10, $thrown->requested());

        // Rollback total: tidak ada mutasi maupun saldo tersisa, stok tetap.
        $this->assertSame(3, (int) $product->fresh()->stock);
        $this->assertSame(0, StockMutation::count());
        $this->assertSame(0, InventoryBalance::count());
    }

    public function test_increase_on_variant_syncs_variant_and_product_aggregates(): void
    {
        $warehouse = $this->createWarehouse('GDG-INV-04');
        $product = $this->createProduct(['stock' => 15]);

        $variantA = ProductVariant::create([
            'product_id' => $product->id,
            'sku' => 'TSK-INV-04-A',
            'variant_name' => 'Merah / XL',
            'price' => 160000,
            'stock' => 10,
        ]);

        ProductVariant::create([
            'product_id' => $product->id,
            'sku' => 'TSK-INV-04-B',
            'variant_name' => 'Biru / L',
            'price' => 155000,
            'stock' => 5,
        ]);

        $this->service()->increase($product, 7, ['reference_type' => 'manual_restock'], $variantA);

        $balance = InventoryBalance::where('warehouse_id', $warehouse->id)
            ->where('product_variant_id', $variantA->id)
            ->first();

        $this->assertNotNull($balance);
        $this->assertSame(17, (int) $balance->on_hand_stock);

        $this->assertSame(17, (int) $variantA->fresh()->stock);
        // 17 (varian A) + 5 (varian B) = 22
        $this->assertSame(22, (int) $product->fresh()->stock);
    }

    public function test_uses_explicit_warehouse_when_provided(): void
    {
        $this->createWarehouse('GDG-INV-PRIMARY');
        $secondary = $this->createWarehouse('GDG-INV-SECONDARY', false);
        $product = $this->createProduct(['stock' => 8]);

        $mutation = $this->service()->increase($product, 4, [
            'reference_type' => 'manual_restock',
            'warehouse' => $secondary,
        ]);

        $this->assertSame($secondary->id, $mutation->warehouse_id);
        $this->assertSame(
            12,
            (int) InventoryBalance::where('warehouse_id', $secondary->id)->where('product_id', $product->id)->value('on_hand_stock')
        );
    }

    public function test_throws_when_no_active_warehouse_exists(): void
    {
        $product = $this->createProduct(['stock' => 5]);

        $this->expectException(\RuntimeException::class);

        $this->service()->increase($product, 5, ['reference_type' => 'manual_restock']);
    }
}
