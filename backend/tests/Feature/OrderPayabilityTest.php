<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\User;
use App\Services\IntegrationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/**
 * T39.3 — guard resume pembayaran: hanya order yang masih boleh dibayar
 * (belum lunas / belum dibatalkan / belum kedaluwarsa) yang dapat membuat
 * Snap token atau charge.
 */
class OrderPayabilityTest extends TestCase
{
    use RefreshDatabase;

    private function configureMidtrans(): void
    {
        $integrations = app(IntegrationService::class);
        $integrations->set('payment.midtrans_server_key', 'SB-Mid-server-TEST', 'payment', true);
        $integrations->set('payment.snap_url', 'https://midtrans.test/snap/v1/transactions', 'payment');

        Http::fake([
            'midtrans.test/*' => Http::response([
                'token' => 'SNAP-TOKEN-123',
                'redirect_url' => 'https://midtrans.test/redirect',
            ], 201),
        ]);
    }

    private function makeOrder(array $attributes = []): Order
    {
        return Order::factory()->create(array_merge([
            'status' => 'pending',
            'payment_status' => 'pending',
            'grand_total' => 100000,
            'expires_at' => now()->addHours(24),
        ], $attributes));
    }

    public function test_snap_token_allowed_for_pending_unexpired_order(): void
    {
        $this->configureMidtrans();
        $user = User::factory()->create();
        $order = $this->makeOrder(['user_id' => $user->id]);

        $this->actingAs($user)
            ->postJson("/api/orders/{$order->order_number}/snap-token")
            ->assertOk()
            ->assertJsonPath('data.snap_token', 'SNAP-TOKEN-123');
    }

    public function test_snap_token_rejected_for_paid_order(): void
    {
        $this->configureMidtrans();
        $user = User::factory()->create();
        $order = $this->makeOrder([
            'user_id' => $user->id,
            'status' => 'confirmed',
            'payment_status' => 'paid',
        ]);

        $this->actingAs($user)
            ->postJson("/api/orders/{$order->order_number}/snap-token")
            ->assertStatus(422)
            ->assertJsonValidationErrors('order');
    }

    public function test_snap_token_rejected_for_cancelled_order(): void
    {
        $this->configureMidtrans();
        $user = User::factory()->create();
        $order = $this->makeOrder([
            'user_id' => $user->id,
            'status' => 'cancelled',
            'payment_status' => 'cancelled',
        ]);

        $this->actingAs($user)
            ->postJson("/api/orders/{$order->order_number}/snap-token")
            ->assertStatus(422)
            ->assertJsonValidationErrors('order');
    }

    public function test_snap_token_rejected_for_expired_order(): void
    {
        $this->configureMidtrans();
        $user = User::factory()->create();
        $order = $this->makeOrder([
            'user_id' => $user->id,
            'expires_at' => now()->subMinutes(10),
        ]);

        $this->actingAs($user)
            ->postJson("/api/orders/{$order->order_number}/snap-token")
            ->assertStatus(422)
            ->assertJsonValidationErrors('order');
    }

    public function test_charge_rejected_for_cancelled_order(): void
    {
        $this->configureMidtrans();
        $user = User::factory()->create();
        $order = $this->makeOrder([
            'user_id' => $user->id,
            'status' => 'cancelled',
            'payment_status' => 'cancelled',
        ]);

        $this->actingAs($user)
            ->postJson("/api/orders/{$order->order_number}/charge", [
                'payment_method' => 'bca_va',
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('order');
    }
}
