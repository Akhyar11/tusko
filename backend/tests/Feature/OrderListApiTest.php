<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrderListApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_list_orders_with_status_counts(): void
    {
        Order::create([
            'order_number' => 'INV/20260907/TK/000001',
            'recipient_name' => 'Ahmad Customer',
            'full_address' => 'Jl. Thamrin Jakarta',
            'expedition_name' => 'J&T Express',
            'expedition_service' => 'EZ',
            'subtotal' => 100000,
            'grand_total' => 115000,
            'status' => 'pending',
            'payment_status' => 'pending',
        ]);

        Order::create([
            'order_number' => 'INV/20260907/TK/000002',
            'recipient_name' => 'Budi Customer',
            'full_address' => 'Jl. Asia Afrika Bandung',
            'expedition_name' => 'SiCepat',
            'expedition_service' => 'BEST',
            'subtotal' => 200000,
            'grand_total' => 220000,
            'status' => 'completed',
            'payment_status' => 'paid',
        ]);

        $response = $this->getJson('/api/orders');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data',
                'status_counts' => [
                    'all',
                    'pending',
                    'processing',
                    'shipped',
                    'completed',
                    'cancelled',
                ],
                'meta' => [
                    'current_page',
                    'per_page',
                    'total',
                ],
            ]);

        $this->assertEquals(2, $response->json('status_counts.all'));
        $this->assertEquals(1, $response->json('status_counts.pending'));
        $this->assertEquals(1, $response->json('status_counts.completed'));
    }

    public function test_can_filter_orders_by_status(): void
    {
        Order::create([
            'order_number' => 'INV/20260907/TK/111111',
            'recipient_name' => 'Pending User',
            'full_address' => 'Jakarta',
            'expedition_name' => 'J&T Express',
            'expedition_service' => 'EZ',
            'grand_total' => 100000,
            'status' => 'pending',
        ]);

        Order::create([
            'order_number' => 'INV/20260907/TK/222222',
            'recipient_name' => 'Processing User',
            'full_address' => 'Surabaya',
            'expedition_name' => 'J&T Express',
            'expedition_service' => 'EZ',
            'grand_total' => 150000,
            'status' => 'processing',
        ]);

        $response = $this->getJson('/api/orders?status=pending');

        $response->assertStatus(200);
        $this->assertCount(1, $response->json('data'));
        $this->assertEquals('INV/20260907/TK/111111', $response->json('data.0.order_number'));
    }

    public function test_can_search_orders_by_keyword(): void
    {
        Order::create([
            'order_number' => 'INV/20260907/TK/889900',
            'recipient_name' => 'Dedi Perkasa',
            'full_address' => 'Semarang',
            'expedition_name' => 'JNE',
            'expedition_service' => 'REG',
            'grand_total' => 300000,
            'status' => 'shipped',
        ]);

        Order::create([
            'order_number' => 'INV/20260907/TK/998877',
            'recipient_name' => 'Eko Prasetyo',
            'full_address' => 'Yogyakarta',
            'expedition_name' => 'Anteraja',
            'expedition_service' => 'Reguler',
            'grand_total' => 450000,
            'status' => 'processing',
        ]);

        $response = $this->getJson('/api/orders?q=Dedi');

        $response->assertStatus(200);
        $this->assertCount(1, $response->json('data'));
        $this->assertEquals('Dedi Perkasa', $response->json('data.0.address.recipient_name'));
    }

    public function test_can_sort_orders_by_highest_amount(): void
    {
        Order::create([
            'order_number' => 'INV/20260907/TK/LOW',
            'recipient_name' => 'Low Order',
            'full_address' => 'Jakarta',
            'expedition_name' => 'J&T Express',
            'expedition_service' => 'EZ',
            'grand_total' => 50000,
        ]);

        Order::create([
            'order_number' => 'INV/20260907/TK/HIGH',
            'recipient_name' => 'High Order',
            'full_address' => 'Jakarta',
            'expedition_name' => 'J&T Express',
            'expedition_service' => 'EZ',
            'grand_total' => 950000,
        ]);

        $response = $this->getJson('/api/orders?sort_by=highest_amount');

        $response->assertStatus(200);
        $this->assertEquals('INV/20260907/TK/HIGH', $response->json('data.0.order_number'));
    }

    public function test_can_show_single_order_by_order_number(): void
    {
        $order = Order::create([
            'order_number' => 'INV/20260907/TK/SHOW123',
            'recipient_name' => 'Detail Customer',
            'full_address' => 'Jl. Diponegoro No. 5',
            'expedition_name' => 'SiCepat',
            'expedition_service' => 'BEST',
            'grand_total' => 250000,
            'status' => 'processing',
        ]);

        $response = $this->getJson("/api/orders/{$order->order_number}");

        $response->assertStatus(200)
            ->assertJsonPath('data.order_number', 'INV/20260907/TK/SHOW123')
            ->assertJsonPath('data.status', 'processing');
    }
}
