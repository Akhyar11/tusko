<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class OrderLookupScopeTest extends TestCase
{
    use RefreshDatabase;

    public function test_lookup_by_non_numeric_order_number_does_not_touch_id_column(): void
    {
        $order = Order::factory()->create([
            'order_number' => 'INV/20260928/TK/609420',
        ]);

        // Cari via nomor order (non-numerik). Scope TIDAK boleh menambahkan
        // kondisi `id = 'INV/...'` (di PostgreSQL itu error 22P02).
        $found = Order::query()->whereIdOrCode('INV/20260928/TK/609420')->first();
        $this->assertNotNull($found);
        $this->assertSame($order->id, $found->id);

        // Cari via id numerik tetap berfungsi.
        $byId = Order::query()->whereIdOrCode((string) $order->id)->first();
        $this->assertSame($order->id, $byId->id);

        // Cari via midtrans_order_id (kolom tambahan) juga cocok.
        $order->update(['midtrans_order_id' => 'INV-20260928-TK-609420']);
        $byMid = Order::query()->whereIdOrCode('INV-20260928-TK-609420')->first();
        $this->assertSame($order->id, $byMid->id);

        // Nilai non-numerik yang tidak ada -> null (bukan exception).
        $this->assertNull(Order::query()->whereIdOrCode('TIDAK/ADA/999')->first());
    }

    public function test_order_detail_endpoint_accepts_order_number_with_slashes(): void
    {
        $order = Order::factory()->create([
            'order_number' => 'INV/20260928/TK/777001',
        ]);

        Sanctum::actingAs(User::factory()->create(['role' => 'admin', 'is_active' => true]));

        $this->getJson('/api/orders/' . $order->order_number)
            ->assertStatus(200)
            ->assertJsonPath('data.order_number', 'INV/20260928/TK/777001');
    }
}
