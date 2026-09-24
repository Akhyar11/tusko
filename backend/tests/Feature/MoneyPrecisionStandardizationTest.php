<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\InventoryBalance;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Warehouse;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class MoneyPrecisionStandardizationTest extends TestCase
{
    use RefreshDatabase;

    private const MIGRATION_FILE = '2026_09_23_000007_standardize_money_columns_to_decimal_14_2.php';

    private function runUp(): void
    {
        (require database_path('migrations/' . self::MIGRATION_FILE))->up();
    }

    private function runDown(): void
    {
        (require database_path('migrations/' . self::MIGRATION_FILE))->down();
    }

    /**
     * @return array<string, mixed>
     */
    private function column(string $table, string $name): array
    {
        foreach (Schema::getColumns($table) as $column) {
            if ($column['name'] === $name) {
                return $column;
            }
        }

        $this->fail("Kolom {$table}.{$name} tidak ditemukan.");
    }

    public function test_standardization_preserves_nullability_and_defaults(): void
    {
        $this->runUp();

        // products
        $this->assertFalse($this->column('products', 'price')['nullable']);
        $this->assertTrue($this->column('products', 'cost_price')['nullable']);
        $this->assertTrue($this->column('products', 'original_price')['nullable']);
        $this->assertFalse($this->column('products', 'point_value')['nullable']);
        $this->assertNotNull($this->column('products', 'point_value')['default']);

        // expedition
        $this->assertFalse($this->column('expeditions', 'base_cost')['nullable']);
        $this->assertFalse($this->column('expeditions', 'cost')['nullable']);
        $this->assertNotNull($this->column('expedition_services', 'base_rate')['default']);
        $this->assertNotNull($this->column('expedition_services', 'per_kg_rate')['default']);

        // voucher
        $this->assertNotNull($this->column('vouchers', 'discount_value')['default']);
        $this->assertNotNull($this->column('vouchers', 'min_purchase')['default']);
        $this->assertTrue($this->column('vouchers', 'max_discount')['nullable']);

        // keuangan
        $this->assertNotNull($this->column('transactions', 'fee_deducted')['default']);
        $this->assertNotNull($this->column('financial_accounts', 'current_balance')['default']);
    }

    public function test_standardization_is_idempotent_and_reversible(): void
    {
        $this->runUp();
        $this->runUp();

        $this->runDown();

        foreach ([
            'products' => ['price', 'cost_price', 'original_price', 'point_value'],
            'expeditions' => ['base_cost', 'cost'],
            'expedition_services' => ['base_rate', 'per_kg_rate'],
            'vouchers' => ['discount_value', 'min_purchase', 'max_discount'],
            'transactions' => ['fee_deducted'],
            'financial_accounts' => ['current_balance'],
        ] as $table => $columns) {
            foreach ($columns as $column) {
                $this->assertTrue(
                    Schema::hasColumn($table, $column),
                    "Kolom {$table}.{$column} hilang setelah rollback."
                );
            }
        }

        // Kembali ke presisi asal tanpa mengubah nullability.
        $this->assertTrue($this->column('products', 'cost_price')['nullable']);
        $this->assertTrue($this->column('vouchers', 'max_discount')['nullable']);
    }

    public function test_standardization_preserves_existing_money_values(): void
    {
        $category = Category::create([
            'name' => 'Sepatu Uji',
            'slug' => 'sepatu-uji-' . uniqid(),
        ]);

        $product = Product::create([
            'category_id' => $category->id,
            'name' => 'Sepatu Mahal',
            'slug' => 'sepatu-mahal-' . uniqid(),
            'price' => 12345678.90,
            'cost_price' => 11111111.11,
            'original_price' => 15000000.00,
            'point_value' => 12.34,
            'stock' => 1,
        ]);

        $this->runUp();

        $fresh = $product->fresh();

        $this->assertEqualsWithDelta(12345678.90, (float) $fresh->price, 0.01);
        $this->assertEqualsWithDelta(11111111.11, (float) $fresh->cost_price, 0.01);
        $this->assertEqualsWithDelta(15000000.00, (float) $fresh->original_price, 0.01);
        $this->assertEqualsWithDelta(12.34, (float) $fresh->point_value, 0.01);
    }

    public function test_change_preserves_related_rows(): void
    {
        $warehouse = Warehouse::create([
            'code' => 'GDG-MONEY-01',
            'name' => 'Gudang Uji Presisi',
            'address' => 'Jl. Uji',
            'city' => 'Jakarta',
            'province' => 'DKI Jakarta',
            'is_primary' => true,
            'is_active' => true,
        ]);

        $category = Category::create([
            'name' => 'Presisi',
            'slug' => 'presisi-' . uniqid(),
        ]);

        $product = Product::create([
            'category_id' => $category->id,
            'name' => 'Produk Presisi',
            'slug' => 'produk-presisi-' . uniqid(),
            'sku' => 'TSK-PRS-01',
            'price' => 100000,
            'stock' => 10,
        ]);

        $variant = ProductVariant::create([
            'product_id' => $product->id,
            'sku' => 'TSK-PRS-01-A',
            'variant_name' => 'Merah / L',
            'price' => 100000,
            'stock' => 10,
        ]);

        $balance = InventoryBalance::create([
            'warehouse_id' => $warehouse->id,
            'product_id' => $product->id,
            'product_variant_id' => $variant->id,
            'on_hand_stock' => 10,
            'reserved_stock' => 0,
            'available_stock' => 10,
            'safety_stock' => 5,
        ]);

        $this->runUp();

        // Baris anak tidak boleh hilang akibat rebuild tabel SQLite.
        $this->assertDatabaseHas('products', ['id' => $product->id]);
        $this->assertDatabaseHas('product_variants', ['id' => $variant->id]);
        $this->assertDatabaseHas('inventory_balances', ['id' => $balance->id]);
    }
}
