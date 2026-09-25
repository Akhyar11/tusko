<?php

namespace Tests\Feature;

use App\Models\InventoryBalance;
use App\Models\Product;
use App\Models\StockMutation;
use App\Models\StockOpname;
use App\Models\User;
use App\Models\Warehouse;
use Database\Seeders\MasterReferenceSeeder;
use Database\Seeders\SettingsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class StockOpnameApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(MasterReferenceSeeder::class);
        $this->seed(SettingsSeeder::class);
    }

    private function actingAsAdmin(): User
    {
        $admin = User::factory()->create(['role' => 'admin', 'is_active' => true]);
        Sanctum::actingAs($admin);

        return $admin;
    }

    /**
     * @return array{0: Warehouse, 1: Product}
     */
    private function fixture(): array
    {
        $warehouse = Warehouse::firstOrFail();
        $product = Product::factory()->create(['stock' => 10, 'cost_price' => 10000]);

        InventoryBalance::create([
            'warehouse_id' => $warehouse->id,
            'product_id' => $product->id,
            'product_variant_id' => null,
            'on_hand_stock' => 10,
            'reserved_stock' => 0,
            'available_stock' => 10,
            'safety_stock' => 0,
        ]);

        return [$warehouse, $product];
    }

    private function createOpname(Warehouse $warehouse, Product $product, int $physical): StockOpname
    {
        $response = $this->postJson('/api/stock-opnames', [
            'warehouse_id' => $warehouse->id,
            'notes' => 'Uji opname',
            'items' => [
                ['product_id' => $product->id, 'physical_stock' => $physical],
            ],
        ])->assertStatus(201);

        return StockOpname::findOrFail($response->json('data.id'));
    }

    public function test_admin_can_run_full_opname_cycle_with_stock_adjustment_and_journal(): void
    {
        $this->actingAsAdmin();
        [$warehouse, $product] = $this->fixture();

        $opname = $this->createOpname($warehouse, $product, 15);
        $this->assertSame(5, (int) $opname->items()->first()->difference);

        $this->postJson("/api/stock-opnames/{$opname->id}/submit")->assertStatus(200);
        $this->assertSame('in_progress', $opname->fresh()->status);

        $approve = $this->postJson("/api/stock-opnames/{$opname->id}/approve")->assertStatus(200);
        $approve->assertJsonPath('data.status', 'approved');

        // Stok otoritatif naik 10 -> 15 + kartu stok adjust.
        $balance = InventoryBalance::where('product_id', $product->id)->where('warehouse_id', $warehouse->id)->firstOrFail();
        $this->assertSame(15, (int) $balance->on_hand_stock);
        $this->assertDatabaseHas('stock_mutations', [
            'product_id' => $product->id,
            'warehouse_id' => $warehouse->id,
            'type' => 'adjust',
            'quantity' => 5,
            'stock_before' => 10,
            'stock_after' => 15,
        ]);

        // Jurnal selisih lebih opname + audit log.
        $this->assertDatabaseHas('transactions', ['reference_type' => 'stock_opname', 'reference_id' => $opname->opname_number]);
        $this->assertGreaterThanOrEqual(2, DB::table('financial_ledger_entries')->count());
        $this->assertDatabaseHas('activity_logs', ['action' => 'stock_opname.approved', 'subject_id' => $opname->id]);
    }

    public function test_negative_difference_decreases_stock(): void
    {
        $this->actingAsAdmin();
        [$warehouse, $product] = $this->fixture();

        $opname = $this->createOpname($warehouse, $product, 7);
        $this->postJson("/api/stock-opnames/{$opname->id}/submit")->assertStatus(200);
        $this->postJson("/api/stock-opnames/{$opname->id}/approve")->assertStatus(200);

        $balance = InventoryBalance::where('product_id', $product->id)->firstOrFail();
        $this->assertSame(7, (int) $balance->on_hand_stock);
        $this->assertDatabaseHas('stock_mutations', ['product_id' => $product->id, 'type' => 'adjust', 'quantity' => 3]);
    }

    public function test_approve_requires_in_progress_status(): void
    {
        $this->actingAsAdmin();
        [$warehouse, $product] = $this->fixture();

        $opname = $this->createOpname($warehouse, $product, 12);

        // Masih draft -> tidak boleh approve.
        $this->postJson("/api/stock-opnames/{$opname->id}/approve")->assertStatus(422);
    }

    public function test_index_supports_filters(): void
    {
        $this->actingAsAdmin();
        [$warehouse, $product] = $this->fixture();
        $opname = $this->createOpname($warehouse, $product, 15);

        $byStatus = $this->getJson('/api/stock-opnames?status=draft')->assertStatus(200);
        $this->assertGreaterThanOrEqual(1, count($byStatus->json('data')));

        $byWarehouse = $this->getJson("/api/stock-opnames?warehouse_id={$warehouse->id}&items_min=1")->assertStatus(200);
        $this->assertGreaterThanOrEqual(1, count($byWarehouse->json('data')));

        $byNumber = $this->getJson('/api/stock-opnames?search=' . $opname->opname_number)->assertStatus(200);
        $this->assertSame(1, count($byNumber->json('data')));
    }

    public function test_non_admin_is_forbidden(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'customer', 'is_active' => true]));

        $this->getJson('/api/stock-opnames')->assertStatus(403);
        $this->postJson('/api/stock-opnames', [])->assertStatus(403);
    }

    public function test_guest_is_unauthorized(): void
    {
        $this->getJson('/api/stock-opnames')->assertStatus(401);
    }
}
