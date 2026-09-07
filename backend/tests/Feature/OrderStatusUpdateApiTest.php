<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrderStatusUpdateApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_update_status_from_pending_to_processing(): void
    {
        $order = Order::create([
            'order_number' => 'INV/20260907/TK/100001',
            'recipient_name' => 'Ahmad Dani',
            'phone' => '081234567891',
            'full_address' => 'Jl. Pahlawan No 1 Bandung',
            'expedition_name' => 'JNE',
            'expedition_service' => 'REG',
            'subtotal' => 200000,
            'shipping_cost' => 10000,
            'grand_total' => 210000,
            'status' => 'pending',
            'payment_status' => 'pending',
        ]);

        $response = $this->patchJson("/api/orders/{$order->id}/status", [
            'status' => 'processing',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.status', 'processing')
            ->assertJsonPath('data.payment_status', 'paid');

        $this->assertDatabaseHas('orders', [
            'id' => $order->id,
            'status' => 'processing',
            'payment_status' => 'paid',
        ]);

        $order->refresh();
        $this->assertNotNull($order->paid_at);
    }

    public function test_can_update_status_to_shipped_with_tracking_number(): void
    {
        $order = Order::create([
            'order_number' => 'INV/20260907/TK/100002',
            'recipient_name' => 'Budi Santoso',
            'full_address' => 'Jl. Sudirman 45 Jakarta',
            'expedition_name' => 'JNE',
            'expedition_service' => 'REG',
            'subtotal' => 300000,
            'shipping_cost' => 15000,
            'grand_total' => 315000,
            'status' => 'processing',
            'payment_status' => 'paid',
        ]);

        $response = $this->putJson("/api/orders/{$order->id}/status", [
            'status' => 'shipped',
            'tracking_number' => 'JNEREG123456789ID',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.status', 'shipped')
            ->assertJsonPath('data.tracking_number', 'JNEREG123456789ID');

        $order->refresh();
        $this->assertEquals('shipped', $order->status);
        $this->assertEquals('JNEREG123456789ID', $order->tracking_number);
        $this->assertNotNull($order->shipped_at);
    }

    public function test_fails_when_updating_to_shipped_without_tracking_number(): void
    {
        $order = Order::create([
            'order_number' => 'INV/20260907/TK/100003',
            'recipient_name' => 'Citra Dewi',
            'full_address' => 'Jl. Diponegoro 10 Medan',
            'expedition_name' => 'SiCepat',
            'expedition_service' => 'REG',
            'subtotal' => 150000,
            'shipping_cost' => 20000,
            'grand_total' => 170000,
            'status' => 'processing',
            'payment_status' => 'paid',
        ]);

        $response = $this->patchJson("/api/orders/{$order->id}/status", [
            'status' => 'shipped',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['tracking_number']);
    }

    public function test_can_update_status_to_completed(): void
    {
        $order = Order::create([
            'order_number' => 'INV/20260907/TK/100004',
            'recipient_name' => 'Dian Sastro',
            'full_address' => 'Jl. Gajah Mada 8 Yogyakarta',
            'expedition_name' => 'SiCepat',
            'expedition_service' => 'BEST',
            'subtotal' => 450000,
            'shipping_cost' => 12000,
            'grand_total' => 462000,
            'status' => 'shipped',
            'tracking_number' => 'SICPAT998877',
            'payment_status' => 'paid',
        ]);

        $response = $this->patchJson("/api/orders/{$order->id}/status", [
            'status' => 'completed',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.status', 'completed');

        $order->refresh();
        $this->assertEquals('completed', $order->status);
        $this->assertNotNull($order->completed_at);
    }

    public function test_can_cancel_order_with_cancellation_reason(): void
    {
        $order = Order::create([
            'order_number' => 'INV/20260907/TK/100005',
            'recipient_name' => 'Eko Prasetyo',
            'full_address' => 'Jl. Malioboro 15 Yogyakarta',
            'expedition_name' => 'J&T',
            'expedition_service' => 'EZ',
            'subtotal' => 100000,
            'shipping_cost' => 10000,
            'grand_total' => 110000,
            'status' => 'pending',
            'payment_status' => 'pending',
        ]);

        $response = $this->patchJson("/api/orders/{$order->id}/status", [
            'status' => 'cancelled',
            'cancellation_reason' => 'Pembeli membatalkan pesanan karena salah varian produk',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.status', 'cancelled')
            ->assertJsonPath('data.payment_status', 'cancelled')
            ->assertJsonPath('data.notes', 'Pembeli membatalkan pesanan karena salah varian produk');

        $order->refresh();
        $this->assertEquals('cancelled', $order->status);
        $this->assertNotNull($order->cancelled_at);
    }

    public function test_cannot_change_status_from_terminal_states(): void
    {
        $completedOrder = Order::create([
            'order_number' => 'INV/20260907/TK/100006',
            'recipient_name' => 'Fajar Nugraha',
            'full_address' => 'Jl. Veteran 3 Malang',
            'expedition_name' => 'JNE',
            'expedition_service' => 'REG',
            'subtotal' => 250000,
            'shipping_cost' => 15000,
            'grand_total' => 265000,
            'status' => 'completed',
            'payment_status' => 'paid',
        ]);

        $response = $this->patchJson("/api/orders/{$completedOrder->id}/status", [
            'status' => 'processing',
        ]);

        $response->assertStatus(422)
            ->assertJsonFragment([
                'message' => 'Status pesanan tidak dapat diubah lagi karena pesanan sudah completed.',
            ]);
    }
}
