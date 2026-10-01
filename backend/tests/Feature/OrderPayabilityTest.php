<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\User;
use App\Services\IntegrationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Carbon;
use Tests\TestCase;

/**
 * T39.3 — guard resume pembayaran: hanya order yang masih boleh dibayar
 * (belum lunas / belum dibatalkan / belum kedaluwarsa) yang dapat membuat
 * charge pembayaran.
 */
class OrderPayabilityTest extends TestCase
{
    use RefreshDatabase;

    private function configureMidtrans(): void
    {
        $integrations = app(IntegrationService::class);
        $integrations->set('payment.midtrans_server_key', 'SB-Mid-server-TEST', 'payment', true);
        $integrations->set('payment.midtrans_api_url', 'https://midtrans.test', 'payment');

        Http::fake([
            'midtrans.test/*' => Http::response([
                'transaction_id' => 'trx-1',
                'order_id' => 'x',
                'gross_amount' => '100000.00',
                'payment_type' => 'bank_transfer',
                'transaction_status' => 'pending',
                'va_numbers' => [['bank' => 'bca', 'va_number' => '12345678901']],
            ], 200),
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

    public function test_charge_allowed_for_pending_unexpired_order(): void
    {
        $this->configureMidtrans();
        $user = User::factory()->create();
        $order = $this->makeOrder(['user_id' => $user->id]);

        $this->actingAs($user)
            ->postJson("/api/orders/{$order->order_number}/charge", ['payment_method' => 'bca_va'])
            ->assertOk();
    }

    public function test_charge_rejected_for_paid_order(): void
    {
        $this->configureMidtrans();
        $user = User::factory()->create();
        $order = $this->makeOrder([
            'user_id' => $user->id,
            'status' => 'confirmed',
            'payment_status' => 'paid',
        ]);

        $this->actingAs($user)
            ->postJson("/api/orders/{$order->order_number}/charge", ['payment_method' => 'bca_va'])
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
            ->postJson("/api/orders/{$order->order_number}/charge", ['payment_method' => 'bca_va'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('order');
    }

    public function test_charge_rejected_for_expired_order(): void
    {
        $this->configureMidtrans();
        $user = User::factory()->create();
        $order = $this->makeOrder([
            'user_id' => $user->id,
            'expires_at' => now()->subMinutes(10),
        ]);

        $this->actingAs($user)
            ->postJson("/api/orders/{$order->order_number}/charge", ['payment_method' => 'bca_va'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('order');
    }

    public function test_charge_sets_payment_expiry_from_midtrans_expiry_time(): void
    {
        $integrations = app(IntegrationService::class);
        $integrations->set('payment.midtrans_server_key', 'SB-Mid-server-TEST', 'payment', true);
        $integrations->set('payment.midtrans_api_url', 'https://midtrans.test', 'payment');

        $expiry = Carbon::now('Asia/Jakarta')->addHours(3)->format('Y-m-d H:i:s');

        Http::fake([
            'midtrans.test/*' => Http::response([
                'transaction_id' => 'trx-expiry',
                'order_id' => 'x',
                'gross_amount' => '100000.00',
                'payment_type' => 'bank_transfer',
                'transaction_status' => 'pending',
                'va_numbers' => [['bank' => 'bca', 'va_number' => '12345678901']],
                'expiry_time' => $expiry,
            ], 200),
        ]);

        $user = User::factory()->create();
        $order = $this->makeOrder(['user_id' => $user->id]);

        $this->actingAs($user)
            ->postJson("/api/orders/{$order->order_number}/charge", ['payment_method' => 'bca_va'])
            ->assertOk();

        $expected = Carbon::createFromFormat('Y-m-d H:i:s', $expiry, 'Asia/Jakarta')
            ->setTimezone(config('app.timezone'));

        $order->refresh();
        $this->assertNotNull($order->payment_expires_at);
        $this->assertTrue($order->payment_expires_at->equalTo($expected));
        $this->assertNotNull($order->expires_at);
        $this->assertTrue($order->expires_at->equalTo($expected));
    }

}
