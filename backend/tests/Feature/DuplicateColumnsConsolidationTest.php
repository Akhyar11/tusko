<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\Warehouse;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class DuplicateColumnsConsolidationTest extends TestCase
{
    use RefreshDatabase;

    private const MIGRATION_FILE = '2026_09_23_000008_consolidate_duplicate_columns.php';

    private function runUp(): void
    {
        (require database_path('migrations/' . self::MIGRATION_FILE))->up();
    }

    private function runDown(): void
    {
        (require database_path('migrations/' . self::MIGRATION_FILE))->down();
    }

    private function createProduct(array $overrides = []): Product
    {
        static $sequence = 0;
        $sequence++;

        $category = Category::create([
            'name' => 'Konsolidasi ' . $sequence,
            'slug' => 'konsolidasi-' . $sequence . '-' . uniqid(),
        ]);

        return Product::create(array_merge([
            'category_id' => $category->id,
            'name' => 'Produk Konsolidasi ' . $sequence,
            'slug' => 'produk-konsolidasi-' . $sequence . '-' . uniqid(),
            'sku' => 'TSK-KON-' . $sequence,
            'price' => 100000,
            'stock' => 10,
            'stock_minimum' => 5,
            'min_stock' => 5,
        ], $overrides));
    }

    private function insertOrder(?string $phone, ?string $phoneNumber): int
    {
        static $sequence = 0;
        $sequence++;

        return (int) DB::table('orders')->insertGetId([
            'order_number' => 'KON-ORD-' . $sequence,
            'recipient_name' => 'Pembeli Uji',
            'phone' => $phone,
            'phone_number' => $phoneNumber,
            'full_address' => 'Jl. Pengujian No. 1',
            'expedition_name' => 'J&T Express',
            'expedition_service' => 'EZ (Reguler)',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function test_consolidates_min_stock_into_stock_minimum(): void
    {
        $legacyUsed = $this->createProduct(['stock_minimum' => 5, 'min_stock' => 20]);
        $canonicalUsed = $this->createProduct(['stock_minimum' => 15, 'min_stock' => 5]);
        $bothCustom = $this->createProduct(['stock_minimum' => 10, 'min_stock' => 8]);

        $this->runUp();

        $this->assertSame(20, (int) $legacyUsed->fresh()->stock_minimum);
        $this->assertSame(20, (int) $legacyUsed->fresh()->min_stock);

        $this->assertSame(15, (int) $canonicalUsed->fresh()->stock_minimum);
        $this->assertSame(15, (int) $canonicalUsed->fresh()->min_stock);

        // Bila keduanya custom & beda, stock_minimum menang.
        $this->assertSame(10, (int) $bothCustom->fresh()->stock_minimum);
        $this->assertSame(10, (int) $bothCustom->fresh()->min_stock);
    }

    public function test_consolidates_phone_number_into_phone(): void
    {
        $fromLegacy = $this->insertOrder(null, '081211112222');
        $phoneOnly = $this->insertOrder('081333334444', null);
        $conflicting = $this->insertOrder('081555556666', '081777778888');

        $this->runUp();

        $this->assertSame('081211112222', DB::table('orders')->where('id', $fromLegacy)->value('phone'));
        $this->assertSame('081211112222', DB::table('orders')->where('id', $fromLegacy)->value('phone_number'));

        $this->assertSame('081333334444', DB::table('orders')->where('id', $phoneOnly)->value('phone_number'));

        $this->assertSame('081555556666', DB::table('orders')->where('id', $conflicting)->value('phone'));
        $this->assertSame('081555556666', DB::table('orders')->where('id', $conflicting)->value('phone_number'));
    }

    public function test_creates_warehouse_bins_and_links_inventory_balances(): void
    {
        $warehouse = Warehouse::create([
            'code' => 'WH-KON-01',
            'name' => 'Gudang Konsolidasi',
            'address' => 'Jl. Uji No. 1',
            'city' => 'Jakarta',
            'province' => 'DKI Jakarta',
            'is_primary' => true,
            'is_active' => true,
        ]);

        $product = $this->createProduct(['warehouse_bin' => 'Rak A-01']);

        DB::table('inventory_balances')->insert([
            'warehouse_id' => $warehouse->id,
            'product_id' => $product->id,
            'on_hand_stock' => 10,
            'reserved_stock' => 0,
            'available_stock' => 10,
            'safety_stock' => 5,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->runUp();

        $bin = DB::table('warehouse_bins')
            ->where('warehouse_id', $warehouse->id)
            ->where('bin_code', 'Rak A-01')
            ->first();

        $this->assertNotNull($bin);

        $balance = DB::table('inventory_balances')
            ->where('warehouse_id', $warehouse->id)
            ->where('product_id', $product->id)
            ->first();

        $this->assertSame((int) $bin->id, (int) $balance->bin_id);
    }

    public function test_warehouse_bin_consolidation_is_idempotent(): void
    {
        $warehouse = Warehouse::create([
            'code' => 'WH-KON-02',
            'name' => 'Gudang Konsolidasi 2',
            'address' => 'Jl. Uji No. 2',
            'city' => 'Jakarta',
            'province' => 'DKI Jakarta',
            'is_primary' => true,
            'is_active' => true,
        ]);

        $this->createProduct(['warehouse_bin' => 'Rak B-02']);

        $this->runUp();
        $this->runUp();

        $this->assertSame(
            1,
            DB::table('warehouse_bins')->where('warehouse_id', $warehouse->id)->where('bin_code', 'Rak B-02')->count()
        );
    }

    public function test_down_removes_unreferenced_backfilled_bins(): void
    {
        Warehouse::create([
            'code' => 'WH-KON-03',
            'name' => 'Gudang Konsolidasi 3',
            'address' => 'Jl. Uji No. 3',
            'city' => 'Jakarta',
            'province' => 'DKI Jakarta',
            'is_primary' => true,
            'is_active' => true,
        ]);

        $this->createProduct(['warehouse_bin' => 'Rak C-03']);

        $this->runUp();
        $this->assertSame(1, DB::table('warehouse_bins')->where('bin_code', 'Rak C-03')->count());

        $this->runDown();
        $this->assertSame(0, DB::table('warehouse_bins')->where('bin_code', 'Rak C-03')->count());
    }
}
