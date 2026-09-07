<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Transaction;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrderDetailApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_get_order_detail_by_id(): void
    {
        $order = Order::create([
            'order_number' => 'INV/20260907/TK/987654',
            'recipient_name' => 'Budi Santoso',
            'phone' => '081234567890',
            'full_address' => 'Jl. Sudirman 45 Jakarta',
            'expedition_name' => 'J&T Express',
            'expedition_service' => 'EZ (Reguler)',
            'subtotal' => 500000,
            'shipping_cost' => 15000,
            'grand_total' => 515000,
            'status' => 'pending',
            'payment_status' => 'pending',
            'payment_method' => 'midtrans',
            'payment_channel' => 'BCA Virtual Account',
            'va_number' => '88081234567890',
        ]);

        OrderItem::create([
            'order_id' => $order->id,
            'product_name' => 'Tusko Matchday Jersey',
            'product_price' => 250000,
            'quantity' => 2,
            'subtotal' => 500000,
        ]);

        $response = $this->getJson("/api/orders/{$order->id}");

        $response->assertStatus(200)
            ->assertJsonPath('data.id', $order->id)
            ->assertJsonPath('data.order_number', 'INV/20260907/TK/987654')
            ->assertJsonPath('data.address.recipient_name', 'Budi Santoso')
            ->assertJsonPath('data.flags.can_pay', true)
            ->assertJsonCount(1, 'data.items');
    }

    public function test_can_get_order_detail_by_order_number(): void
    {
        $order = Order::create([
            'order_number' => 'INV/20260907/TK/SLASHTEST/112',
            'recipient_name' => 'Citra Lestari',
            'full_address' => 'Jl. Merdeka No 12 Surabaya',
            'expedition_name' => 'SiCepat',
            'expedition_service' => 'BEST',
            'subtotal' => 300000,
            'grand_total' => 320000,
            'status' => 'processing',
            'payment_status' => 'paid',
        ]);

        $response = $this->getJson("/api/orders/{$order->order_number}");

        $response->assertStatus(200)
            ->assertJsonPath('data.order_number', 'INV/20260907/TK/SLASHTEST/112')
            ->assertJsonPath('data.status', 'processing')
            ->assertJsonPath('data.flags.can_pay', false);
    }

    public function test_order_detail_loads_financial_transactions(): void
    {
        $order = Order::create([
            'order_number' => 'INV/20260907/TK/WITH-TRX',
            'recipient_name' => 'Doni Sport',
            'full_address' => 'Jl. Gajah Mada No. 1',
            'expedition_name' => 'JNE',
            'expedition_service' => 'REG',
            'subtotal' => 150000,
            'shipping_cost' => 10000,
            'grand_total' => 160000,
            'status' => 'processing',
            'payment_status' => 'paid',
        ]);

        $response = $this->getJson("/api/orders/{$order->order_number}");

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data.transactions')
            ->assertJsonPath('data.transactions.0.category', 'order_payment')
            ->assertJsonPath('data.transactions.0.amount', 160000);
    }

    public function test_returns_404_for_non_existent_order(): void
    {
        $response = $this->getJson('/api/orders/INV/NON_EXISTENT/999');

        $response->assertStatus(404);
    }
}
