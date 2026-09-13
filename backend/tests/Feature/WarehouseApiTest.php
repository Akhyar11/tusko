<?php

namespace Tests\Feature;

use App\Models\TrackingCheckpointLabel;
use App\Models\Warehouse;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WarehouseApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_get_warehouses_list(): void
    {
        Warehouse::create([
            'code' => 'GDG-JKT-01',
            'name' => 'Gudang Pusat Jakarta',
            'address' => 'Jl. TB Simatupang No. 88',
            'city' => 'Jakarta Selatan',
            'province' => 'DKI Jakarta',
            'postal_code' => '12430',
            'latitude' => -6.2923,
            'longitude' => 106.7995,
            'is_primary' => true,
            'is_active' => true,
        ]);

        $response = $this->getJson('/api/warehouses');

        $response->assertOk()
            ->assertJsonPath('status', 'success')
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.code', 'GDG-JKT-01');
    }

    public function test_can_get_primary_warehouse_with_tracking_labels(): void
    {
        $warehouse = Warehouse::create([
            'code' => 'GDG-SBY-01',
            'name' => 'Gudang Utama Surabaya',
            'address' => 'Jl. Rungkut Industri No. 12',
            'city' => 'Surabaya',
            'province' => 'Jawa Timur',
            'is_primary' => true,
            'is_active' => true,
        ]);

        TrackingCheckpointLabel::create([
            'stage_key' => 'at_warehouse',
            'stage_name' => 'Gudang Pusat',
            'custom_label' => 'Paket siap di Gudang Utama Surabaya',
            'description_template' => 'Pesanan siap diambil kurir KiriminAja',
            'sort_order' => 1,
            'is_active' => true,
        ]);

        $response = $this->getJson('/api/warehouses/primary');

        $response->assertOk()
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.warehouse.code', 'GDG-SBY-01')
            ->assertJsonPath('data.tracking_labels.0.custom_label', 'Paket siap di Gudang Utama Surabaya');
    }

    public function test_can_set_warehouse_as_primary(): void
    {
        $w1 = Warehouse::create([
            'code' => 'GDG-01',
            'name' => 'Gudang Lama',
            'address' => 'Alamat 1',
            'city' => 'Jakarta',
            'province' => 'DKI',
            'is_primary' => true,
            'is_active' => true,
        ]);

        $w2 = Warehouse::create([
            'code' => 'GDG-02',
            'name' => 'Gudang Baru Sentral',
            'address' => 'Alamat 2',
            'city' => 'Tangerang',
            'province' => 'Banten',
            'is_primary' => false,
            'is_active' => true,
        ]);

        $response = $this->postJson("/api/warehouses/{$w2->id}/set-primary");

        $response->assertOk()
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.is_primary', true);

        $this->assertFalse((bool) $w1->fresh()->is_primary);
        $this->assertTrue((bool) $w2->fresh()->is_primary);
    }

    public function test_can_update_tracking_checkpoint_labels(): void
    {
        TrackingCheckpointLabel::create([
            'stage_key' => 'at_warehouse',
            'stage_name' => 'Gudang Pusat',
            'custom_label' => 'Paket di Gudang',
            'description_template' => 'Template lama',
            'sort_order' => 1,
            'is_active' => true,
        ]);

        $response = $this->postJson('/api/warehouses/tracking-labels', [
            'labels' => [
                [
                    'stage_key' => 'at_warehouse',
                    'custom_label' => 'Paket sedang di-quality check di Gudang Pusat Tusko',
                    'description_template' => 'Tim QC sedang memverifikasi item sebelum serah terima kurir KiriminAja',
                ],
            ],
        ]);

        $response->assertOk()
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.0.custom_label', 'Paket sedang di-quality check di Gudang Pusat Tusko');
    }
}
