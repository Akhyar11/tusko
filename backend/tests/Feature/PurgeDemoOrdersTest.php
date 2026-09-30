<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Shipment;
use App\Models\ShipmentTracking;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * Uji command `demo:purge-orders` (pembersihan pesanan demo).
 */
class PurgeDemoOrdersTest extends TestCase
{
    use RefreshDatabase;

    private function seedOrdersWithRelations(): void
    {
        $order = Order::factory()->paid()->create();

        OrderItem::factory()->create(['order_id' => $order->id]);

        DB::table('order_status_histories')->insert([
            'order_id' => $order->id,
            'status_code' => 'processing',
            'actor_type' => 'system',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $shipment = Shipment::create([
            'order_id' => $order->id,
            'waybill_number' => 'RESI/TEST/001',
            'status' => 'manifested',
        ]);

        ShipmentTracking::create([
            'shipment_id' => $shipment->id,
            'tracking_time' => now(),
            'city_location' => 'Jakarta',
            'status_description' => 'Diterima',
        ]);
    }

    public function test_purges_orders_and_relations_with_force(): void
    {
        $this->seedOrdersWithRelations();

        $this->assertSame(1, DB::table('orders')->count());

        $this->artisan('demo:purge-orders --force')->assertExitCode(0);

        $this->assertSame(0, DB::table('orders')->count());
        $this->assertSame(0, DB::table('order_items')->count());
        $this->assertSame(0, DB::table('order_status_histories')->count());
        $this->assertSame(0, DB::table('shipments')->count());
        $this->assertSame(0, DB::table('shipment_trackings')->count());
    }

    public function test_reports_when_no_orders(): void
    {
        $this->artisan('demo:purge-orders --force')
            ->expectsOutput('Tidak ada pesanan untuk dihapus.')
            ->assertExitCode(0);
    }
}
