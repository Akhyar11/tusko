<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\OrderStatus;
use App\Models\OrderStatusHistory;
use App\Models\User;
use Database\Seeders\MasterReferenceSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrderStatusHistoryTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(MasterReferenceSeeder::class);
    }

    public function test_order_creation_records_initial_status_history(): void
    {
        $order = Order::factory()->create();

        $this->assertSame(1, OrderStatusHistory::where('order_id', $order->id)->count());

        $history = OrderStatusHistory::where('order_id', $order->id)->first();
        $this->assertSame($order->status, $history->status_code);

        $pendingId = OrderStatus::where('code', 'pending')->value('id');
        $this->assertSame((int) $pendingId, (int) $order->fresh()->status_id);
    }

    public function test_status_update_records_history_and_syncs_status_id(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $order = Order::factory()->create(['status' => 'pending']);

        $response = $this->actingAs($admin)->patchJson("/api/orders/{$order->order_number}/status", [
            'status' => 'processing',
            'notes' => 'Pembayaran terverifikasi.',
        ]);

        $response->assertStatus(200);

        $order->refresh();
        $this->assertSame('processing', $order->status);

        $processingId = OrderStatus::where('code', 'processing')->value('id');
        $this->assertSame((int) $processingId, (int) $order->status_id);

        $histories = OrderStatusHistory::where('order_id', $order->id)->orderBy('id')->get();
        $this->assertSame(2, $histories->count());

        $latest = $histories->last();
        $this->assertSame('processing', $latest->status_code);
        $this->assertSame('admin', $latest->actor_type);
        $this->assertSame($admin->id, (int) $latest->actor_id);
        $this->assertSame('Pembayaran terverifikasi.', $latest->notes);
    }

    public function test_cancellation_records_history(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $order = Order::factory()->create(['status' => 'pending']);

        $this->actingAs($admin)->patchJson("/api/orders/{$order->order_number}/status", [
            'status' => 'cancelled',
            'cancellation_reason' => 'Stok habis.',
        ])->assertStatus(200);

        $latest = OrderStatusHistory::where('order_id', $order->id)->orderByDesc('id')->first();

        $this->assertSame('cancelled', $latest->status_code);
        $this->assertSame('Stok habis.', $latest->notes);
        $this->assertSame('cancelled', $order->fresh()->status);
    }
}
