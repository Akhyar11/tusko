<?php

namespace Tests\Feature;

use App\Models\PurchaseOrder;
use App\Models\Vendor;
use App\Models\Warehouse;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WarehouseTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_list_warehouses_with_pagination(): void
    {
        Warehouse::create([
            'code' => 'WH-JKT-01',
            'name' => 'Gudang Pusat Jakarta',
            'address' => 'Jl. TB Simatupang No. 10',
            'city' => 'Jakarta Selatan',
            'province' => 'DKI Jakarta',
            'postal_code' => '12560',
            'is_primary' => true,
            'is_active' => true,
        ]);

        Warehouse::create([
            'code' => 'WH-BDG-01',
            'name' => 'Gudang Cabang Bandung',
            'address' => 'Jl. Soekarno Hatta No. 45',
            'city' => 'Bandung',
            'province' => 'Jawa Barat',
            'postal_code' => '40286',
            'is_primary' => false,
            'is_active' => true,
        ]);

        $response = $this->getJson('/api/warehouses');
        $response->assertStatus(200);
        $this->assertCount(2, $response->json('data'));
        $this->assertEquals(2, $response->json('total'));
    }

    public function test_can_filter_warehouses_by_status_and_search(): void
    {
        Warehouse::create([
            'code' => 'WH-SBY-01',
            'name' => 'Gudang Distribusi Surabaya',
            'address' => 'Jl. Rungkut Industri No. 8',
            'city' => 'Surabaya',
            'province' => 'Jawa Timur',
            'is_primary' => false,
            'is_active' => true,
        ]);

        Warehouse::create([
            'code' => 'WH-MDN-01',
            'name' => 'Gudang Logistik Medan',
            'address' => 'Jl. Gatot Subroto No. 99',
            'city' => 'Medan',
            'province' => 'Sumatera Utara',
            'is_primary' => false,
            'is_active' => false,
        ]);

        // Search test
        $searchRes = $this->getJson('/api/warehouses?search=Surabaya');
        $searchRes->assertStatus(200);
        $this->assertCount(1, $searchRes->json('data'));
        $this->assertEquals('WH-SBY-01', $searchRes->json('data.0.code'));

        // Filter active test
        $activeRes = $this->getJson('/api/warehouses?is_active=false');
        $activeRes->assertStatus(200);
        $this->assertCount(1, $activeRes->json('data'));
        $this->assertEquals('WH-MDN-01', $activeRes->json('data.0.code'));
    }

    public function test_can_create_warehouse_with_auto_generated_code(): void
    {
        $payload = [
            'name' => 'Gudang Transit Semarang',
            'address' => 'Jl. Pemuda No. 12',
            'city' => 'Semarang',
            'province' => 'Jawa Tengah',
            'postal_code' => '50132',
            'is_active' => true,
        ];

        $response = $this->postJson('/api/warehouses', $payload);
        $response->assertStatus(201);
        $this->assertEquals('Gudang Transit Semarang', $response->json('data.name'));
        $this->assertEquals('WH-001', $response->json('data.code'));
        $this->assertDatabaseHas('warehouses', [
            'name' => 'Gudang Transit Semarang',
            'code' => 'WH-001',
        ]);
    }

    public function test_can_create_warehouse_with_custom_code(): void
    {
        $payload = [
            'code' => 'GDG-DPS-01',
            'name' => 'Gudang Hub Denpasar',
            'address' => 'Jl. Sunset Road No. 88',
            'city' => 'Denpasar',
            'province' => 'Bali',
            'postal_code' => '80361',
            'is_primary' => false,
            'is_active' => true,
        ];

        $response = $this->postJson('/api/warehouses', $payload);
        $response->assertStatus(201);
        $this->assertEquals('GDG-DPS-01', $response->json('data.code'));
        $this->assertDatabaseHas('warehouses', ['code' => 'GDG-DPS-01']);
    }

    public function test_can_create_primary_warehouse_and_unsets_previous_primary(): void
    {
        $first = Warehouse::create([
            'code' => 'WH-001',
            'name' => 'Gudang Utama Lama',
            'address' => 'Jl. A No. 1',
            'city' => 'Jakarta',
            'province' => 'DKI Jakarta',
            'is_primary' => true,
            'is_active' => true,
        ]);

        $this->assertTrue($first->fresh()->is_primary);

        $payload = [
            'code' => 'WH-002',
            'name' => 'Gudang Utama Baru',
            'address' => 'Jl. B No. 2',
            'city' => 'Bekasi',
            'province' => 'Jawa Barat',
            'is_primary' => true,
            'is_active' => true,
        ];

        $res = $this->postJson('/api/warehouses', $payload);
        $res->assertStatus(201);
        $this->assertTrue($res->json('data.is_primary'));

        $this->assertFalse($first->fresh()->is_primary);
    }

    public function test_can_show_warehouse_by_id_or_code(): void
    {
        $warehouse = Warehouse::create([
            'code' => 'WH-MKS-01',
            'name' => 'Gudang Makassar',
            'address' => 'Jl. Urip Sumoharjo No. 7',
            'city' => 'Makassar',
            'province' => 'Sulawesi Selatan',
            'is_active' => true,
        ]);

        $resById = $this->getJson("/api/warehouses/{$warehouse->id}");
        $resById->assertStatus(200);
        $this->assertEquals('Gudang Makassar', $resById->json('data.name'));

        $resByCode = $this->getJson('/api/warehouses/WH-MKS-01');
        $resByCode->assertStatus(200);
        $this->assertEquals('Gudang Makassar', $resByCode->json('data.name'));
    }

    public function test_can_update_warehouse(): void
    {
        $warehouse = Warehouse::create([
            'code' => 'WH-YOG-01',
            'name' => 'Gudang Yogyakarta',
            'address' => 'Jl. Malioboro No. 5',
            'city' => 'Yogyakarta',
            'province' => 'DI Yogyakarta',
            'is_active' => true,
        ]);

        $updatePayload = [
            'name' => 'Gudang Regional Yogyakarta Baru',
            'address' => 'Jl. Ring Road Utara No. 10',
        ];

        $response = $this->putJson("/api/warehouses/{$warehouse->id}", $updatePayload);
        $response->assertStatus(200);
        $this->assertEquals('Gudang Regional Yogyakarta Baru', $response->json('data.name'));
        $this->assertEquals('Jl. Ring Road Utara No. 10', $response->json('data.address'));
    }

    public function test_can_toggle_warehouse_active_status(): void
    {
        $warehouse = Warehouse::create([
            'code' => 'WH-BJM-01',
            'name' => 'Gudang Banjarmasin',
            'address' => 'Jl. Lambung Mangkurat No. 3',
            'city' => 'Banjarmasin',
            'province' => 'Kalimantan Selatan',
            'is_active' => true,
        ]);

        $response = $this->postJson("/api/warehouses/{$warehouse->id}/toggle-status");
        $response->assertStatus(200);
        $this->assertFalse($response->json('data.is_active'));
        $this->assertFalse($warehouse->fresh()->is_active);

        $response2 = $this->postJson("/api/warehouses/{$warehouse->id}/toggle-status");
        $response2->assertStatus(200);
        $this->assertTrue($response2->json('data.is_active'));
        $this->assertTrue($warehouse->fresh()->is_active);
    }

    public function test_cannot_delete_warehouse_with_purchase_orders(): void
    {
        $vendor = Vendor::create([
            'code' => 'VND-001',
            'company_name' => 'PT Mitra Supplier',
            'contact_person' => 'Budi Santoso',
            'phone' => '08123456789',
            'address' => 'Jakarta',
        ]);

        $warehouse = Warehouse::create([
            'code' => 'WH-TGR-01',
            'name' => 'Gudang Tangerang',
            'address' => 'Jl. Daan Mogot No. 20',
            'city' => 'Tangerang',
            'province' => 'Banten',
            'is_active' => true,
        ]);

        PurchaseOrder::create([
            'po_number' => 'PO-202609-001',
            'vendor_id' => $vendor->id,
            'warehouse_id' => $warehouse->id,
            'status' => 'approved',
            'order_date' => now()->toDateString(),
            'total_amount' => 5000000,
        ]);

        $response = $this->deleteJson("/api/warehouses/{$warehouse->id}");
        $response->assertStatus(422);
        $this->assertDatabaseHas('warehouses', ['id' => $warehouse->id]);
    }

    public function test_can_delete_warehouse_without_dependencies(): void
    {
        $warehouse = Warehouse::create([
            'code' => 'WH-DEL-01',
            'name' => 'Gudang Sementara',
            'address' => 'Jl. Uji Coba No. 9',
            'city' => 'Cilegon',
            'province' => 'Banten',
            'is_active' => true,
        ]);

        $response = $this->deleteJson("/api/warehouses/{$warehouse->id}");
        $response->assertStatus(200);
        $this->assertDatabaseMissing('warehouses', ['id' => $warehouse->id]);
    }
}
