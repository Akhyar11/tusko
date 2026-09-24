<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Warehouse;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class InventoryBalanceBackfillTest extends TestCase
{
    use RefreshDatabase;

    private const MIGRATION_FILE = '2026_09_23_000005_backfill_inventory_balances_from_legacy_stock.php';

    protected function setUp(): void
    {
        parent::setUp();

        // Migrasi backfill berjalan di DB kosong saat RefreshDatabase; pastikan bersih.
        DB::table('inventory_balances')->delete();
        DB::table('stock_mutations')->delete();
    }

    private function runBackfillUp(): void
    {
        (require database_path('migrations/' . self::MIGRATION_FILE))->up();
    }

    private function runBackfillDown(): void
    {
        (require database_path('migrations/' . self::MIGRATION_FILE))->down();
    }

    private function createWarehouse(bool $primary = true): Warehouse
    {
        return Warehouse::create([
            'code' => $primary ? 'GDG-PRIMARY-T12' : 'GDG-BRANCH-T12',
            'name' => $primary ? 'Gudang Pusat Backfill' : 'Gudang Cabang Backfill',
            'address' => 'Jl. Pengujian No. 1',
            'city' => 'Jakarta',
            'province' => 'DKI Jakarta',
            'is_primary' => $primary,
            'is_active' => true,
        ]);
    }

    private function createCategory(): Category
    {
        return Category::create([
            'name' => 'Apparel Backfill',
            'slug' => 'apparel-backfill-' . uniqid(),
        ]);
    }

    private function createProduct(array $overrides = []): Product
    {
        static $sequence = 0;
        $sequence++;

        return Product::create(array_merge([
            'category_id' => $this->createCategory()->id,
            'name' => 'Produk Backfill ' . $sequence,
            'slug' => 'produk-backfill-' . $sequence . '-' . uniqid(),
            'sku' => 'TSK-BKF-' . str_pad((string) $sequence, 3, '0', STR_PAD_LEFT),
            'price' => 200000,
            'stock' => 10,
            'stock_minimum' => 5,
        ], $overrides));
    }

    public function test_backfills_product_level_balance_and_initial_mutation_for_simple_product(): void
    {
        $warehouse = $this->createWarehouse();
        $product = $this->createProduct([
            'stock' => 30,
            'stock_minimum' => 10,
        ]);

        $this->runBackfillUp();

        $this->assertDatabaseHas('inventory_balances', [
            'warehouse_id' => $warehouse->id,
            'product_id' => $product->id,
            'product_variant_id' => null,
            'on_hand_stock' => 30,
            'reserved_stock' => 0,
            'available_stock' => 30,
            'safety_stock' => 10,
        ]);

        $this->assertDatabaseHas('stock_mutations', [
            'warehouse_id' => $warehouse->id,
            'product_id' => $product->id,
            'product_variant_id' => null,
            'type' => 'in',
            'quantity' => 30,
            'stock_before' => 0,
            'stock_after' => 30,
            'reference_type' => 'initial_backfill',
        ]);
    }

    public function test_backfills_variant_level_balances_without_product_level_duplication(): void
    {
        $warehouse = $this->createWarehouse();
        $product = $this->createProduct([
            'stock' => 15,
            'stock_minimum' => 5,
        ]);

        $variantA = ProductVariant::create([
            'product_id' => $product->id,
            'sku' => 'TSK-BKF-VAR-A',
            'variant_name' => 'Merah / XL',
            'price' => 210000,
            'stock' => 10,
        ]);

        $variantB = ProductVariant::create([
            'product_id' => $product->id,
            'sku' => 'TSK-BKF-VAR-B',
            'variant_name' => 'Biru / L',
            'price' => 205000,
            'stock' => 5,
        ]);

        $this->runBackfillUp();

        $this->assertDatabaseHas('inventory_balances', [
            'warehouse_id' => $warehouse->id,
            'product_id' => $product->id,
            'product_variant_id' => $variantA->id,
            'on_hand_stock' => 10,
            'available_stock' => 10,
        ]);

        $this->assertDatabaseHas('inventory_balances', [
            'warehouse_id' => $warehouse->id,
            'product_id' => $product->id,
            'product_variant_id' => $variantB->id,
            'on_hand_stock' => 5,
            'available_stock' => 5,
        ]);

        $this->assertFalse(
            DB::table('inventory_balances')
                ->where('product_id', $product->id)
                ->whereNull('product_variant_id')
                ->exists(),
            'Produk bervarian tidak boleh memiliki saldo level produk (double counting).'
        );

        $this->assertEquals(
            15,
            (int) DB::table('inventory_balances')->where('product_id', $product->id)->sum('on_hand_stock')
        );

        $this->assertEquals(
            2,
            DB::table('stock_mutations')
                ->where('reference_type', 'initial_backfill')
                ->where('product_id', $product->id)
                ->count()
        );
    }

    public function test_backfill_is_idempotent_when_run_twice(): void
    {
        $this->createWarehouse();
        $product = $this->createProduct(['stock' => 25, 'stock_minimum' => 5]);

        $this->runBackfillUp();
        $this->runBackfillUp();

        $this->assertEquals(
            1,
            DB::table('inventory_balances')
                ->where('product_id', $product->id)
                ->whereNull('product_variant_id')
                ->count()
        );

        $this->assertEquals(
            1,
            DB::table('stock_mutations')
                ->where('reference_type', 'initial_backfill')
                ->where('product_id', $product->id)
                ->count()
        );
    }

    public function test_down_removes_backfilled_balance_and_mutation(): void
    {
        $this->createWarehouse();
        $product = $this->createProduct(['stock' => 25, 'stock_minimum' => 5]);

        $this->runBackfillUp();
        $this->assertDatabaseCount('inventory_balances', 1);
        $this->assertDatabaseCount('stock_mutations', 1);

        $this->runBackfillDown();
        $this->assertDatabaseCount('inventory_balances', 0);
        $this->assertDatabaseCount('stock_mutations', 0);
    }

    public function test_does_not_backfill_products_with_zero_stock(): void
    {
        $this->createWarehouse();
        $this->createProduct(['stock' => 0, 'stock_minimum' => 5]);

        $this->runBackfillUp();

        $this->assertDatabaseCount('inventory_balances', 0);
        $this->assertDatabaseCount('stock_mutations', 0);
    }

    public function test_falls_back_to_first_active_warehouse_when_no_primary(): void
    {
        $warehouse = $this->createWarehouse(primary: false);
        $product = $this->createProduct(['stock' => 12, 'stock_minimum' => 5]);

        $this->runBackfillUp();

        $this->assertDatabaseHas('inventory_balances', [
            'warehouse_id' => $warehouse->id,
            'product_id' => $product->id,
            'on_hand_stock' => 12,
        ]);
    }

    public function test_skips_gracefully_when_no_warehouse_exists(): void
    {
        $this->createProduct(['stock' => 12, 'stock_minimum' => 5]);

        $this->runBackfillUp();

        $this->assertDatabaseCount('inventory_balances', 0);
        $this->assertDatabaseCount('stock_mutations', 0);
    }
}
