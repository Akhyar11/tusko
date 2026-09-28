<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class OrderActionFlagsTest extends TestCase
{
    use RefreshDatabase;

    public function test_pending_unpaid_order_exposes_pay_and_cancel_flags(): void
    {
        $user = User::factory()->create(['role' => 'customer', 'is_active' => true]);
        Sanctum::actingAs($user);

        $order = Order::factory()->create([
            'user_id' => $user->id,
            'status' => 'pending',
            'payment_status' => 'pending',
            'expires_at' => now()->addHour(),
            'payment_expires_at' => now()->addHour(),
        ]);

        $this->getJson("/api/orders/{$order->id}")
            ->assertStatus(200)
            ->assertJsonPath('data.flags.can_pay', true)
            ->assertJsonPath('data.flags.can_cancel', true)
            ->assertJsonPath('data.flags.can_complete', false);
    }

    public function test_shipped_order_exposes_complete_and_track_flags(): void
    {
        $user = User::factory()->create(['role' => 'customer', 'is_active' => true]);
        Sanctum::actingAs($user);

        $order = Order::factory()->create([
            'user_id' => $user->id,
            'status' => 'shipped',
            'payment_status' => 'paid',
            'tracking_number' => 'JNE-ABC-123',
        ]);

        $this->getJson("/api/orders/{$order->id}")
            ->assertStatus(200)
            ->assertJsonPath('data.flags.can_pay', false)
            ->assertJsonPath('data.flags.can_complete', true)
            ->assertJsonPath('data.flags.can_track', true);
    }

    public function test_expired_pending_order_cannot_pay(): void
    {
        $user = User::factory()->create(['role' => 'customer', 'is_active' => true]);
        Sanctum::actingAs($user);

        $order = Order::factory()->create([
            'user_id' => $user->id,
            'status' => 'pending',
            'payment_status' => 'pending',
            'expires_at' => now()->subMinute(),
            'payment_expires_at' => now()->subMinute(),
        ]);

        $this->getJson("/api/orders/{$order->id}")
            ->assertStatus(200)
            ->assertJsonPath('data.flags.can_pay', false);
    }
}
