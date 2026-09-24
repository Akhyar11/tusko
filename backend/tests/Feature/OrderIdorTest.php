<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrderIdorTest extends TestCase
{
    use RefreshDatabase;

    public function test_customer_cannot_access_others_order(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        $order = Order::factory()->create(['user_id' => $owner->id]);

        $this->actingAs($other)->getJson("/api/orders/{$order->order_number}")->assertStatus(404);
        $this->actingAs($other)->getJson("/api/orders/{$order->order_number}/receipt")->assertStatus(404);
        $this->actingAs($other)->postJson("/api/orders/{$order->order_number}/snap-token")->assertStatus(404);
    }

    public function test_owner_and_admin_can_access_order(): void
    {
        $owner = User::factory()->create();
        $admin = User::factory()->create(['role' => 'admin']);
        $order = Order::factory()->create(['user_id' => $owner->id]);

        $this->actingAs($owner)->getJson("/api/orders/{$order->order_number}")->assertStatus(200);
        $this->actingAs($admin)->getJson("/api/orders/{$order->order_number}")->assertStatus(200);
    }

    public function test_guest_can_access_only_own_session_order(): void
    {
        $order = Order::factory()->create([
            'user_id' => null,
            'guest_session_id' => 'sess-owner-123',
        ]);

        $this->withHeaders(['X-Session-ID' => 'sess-owner-123'])
            ->getJson("/api/orders/{$order->order_number}")
            ->assertStatus(200);

        $this->withHeaders(['X-Session-ID' => 'sess-other-999'])
            ->getJson("/api/orders/{$order->order_number}")
            ->assertStatus(404);
    }
}
