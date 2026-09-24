<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\InventoryBalance;
use App\Models\Product;
use App\Models\Warehouse;
use App\Models\WarehouseBin;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WarehouseBinApiTest extends TestCase
{
    use RefreshDatabase;

    private function warehouse(): Warehouse
    {
        return Warehouse::create([
            'code' => 'GDG-BIN-01',
            'name' => 'Gudang Bin',
            'address' => 'Jl. Bin',
            'city' => 'Jakarta',
            'province' => 'DKI Jakarta',
            'is_primary' => true,
            'is_active' => true,
        ]);
    }

    public function test_can_create_bin_with_unique_code_per_warehouse(): void
    {
        $warehouse = $this->warehouse();

        $response = $this->postJson("/api/warehouses/{$warehouse->id}/bins", [
            'bin_code' => 'A-01-02',
            'zone' => 'APPAREL',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.bin_code', 'A-01-02');

        $this->assertDatabaseHas('warehouse_bins', [
            'warehouse_id' => $warehouse->id,
            'bin_code' => 'A-01-02',
            'zone' => 'APPAREL',
        ]);

        // Duplikat kode pada gudang yang sama ditolak.
        $this->postJson("/api/warehouses/{$warehouse->id}/bins", [
            'bin_code' => 'A-01-02',
        ])->assertStatus(422)->assertJsonValidationErrors(['bin_code']);
    }

    public function test_can_list_and_search_bins(): void
    {
        $warehouse = $this->warehouse();

        WarehouseBin::create(['warehouse_id' => $warehouse->id, 'bin_code' => 'A-01', 'zone' => 'APPAREL']);
        WarehouseBin::create(['warehouse_id' => $warehouse->id, 'bin_code' => 'B-02', 'zone' => 'FOOTWEAR']);

        $all = $this->getJson("/api/warehouses/{$warehouse->id}/bins");
        $all->assertStatus(200)->assertJsonCount(2, 'data');

        $search = $this->getJson("/api/warehouses/{$warehouse->id}/bins?search=FOOTWEAR");
        $search->assertStatus(200)->assertJsonCount(1, 'data')->assertJsonPath('data.0.bin_code', 'B-02');
    }

    public function test_can_update_bin(): void
    {
        $warehouse = $this->warehouse();
        $bin = WarehouseBin::create(['warehouse_id' => $warehouse->id, 'bin_code' => 'C-03', 'zone' => 'EQUIPMENT']);

        $this->patchJson("/api/warehouses/{$warehouse->id}/bins/{$bin->id}", [
            'zone' => 'EQUIPMENT-NEW',
        ])->assertStatus(200)->assertJsonPath('data.zone', 'EQUIPMENT-NEW');

        $this->assertDatabaseHas('warehouse_bins', ['id' => $bin->id, 'zone' => 'EQUIPMENT-NEW']);
    }

    public function test_can_delete_bin_without_balance(): void
    {
        $warehouse = $this->warehouse();
        $bin = WarehouseBin::create(['warehouse_id' => $warehouse->id, 'bin_code' => 'D-04']);

        $this->deleteJson("/api/warehouses/{$warehouse->id}/bins/{$bin->id}")->assertStatus(200);
        $this->assertDatabaseMissing('warehouse_bins', ['id' => $bin->id]);
    }

    public function test_cannot_delete_bin_referenced_by_inventory_balance(): void
    {
        $warehouse = $this->warehouse();
        $bin = WarehouseBin::create(['warehouse_id' => $warehouse->id, 'bin_code' => 'E-05']);

        $category = Category::create(['name' => 'Bin Test', 'slug' => 'bin-test']);
        $product = Product::create([
            'category_id' => $category->id,
            'name' => 'Produk Bin',
            'slug' => 'produk-bin',
            'sku' => 'TSK-BIN-01',
            'price' => 100000,
            'stock' => 5,
        ]);

        InventoryBalance::create([
            'warehouse_id' => $warehouse->id,
            'product_id' => $product->id,
            'bin_id' => $bin->id,
            'on_hand_stock' => 5,
            'reserved_stock' => 0,
            'available_stock' => 5,
            'safety_stock' => 5,
        ]);

        $this->deleteJson("/api/warehouses/{$warehouse->id}/bins/{$bin->id}")
            ->assertStatus(422)
            ->assertJsonPath('status', 'error');

        $this->assertDatabaseHas('warehouse_bins', ['id' => $bin->id]);
    }
}
