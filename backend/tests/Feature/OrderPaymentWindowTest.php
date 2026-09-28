<?php

namespace Tests\Feature;

use App\Models\Order;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrderPaymentWindowTest extends TestCase
{
    use RefreshDatabase;

    public function test_payment_expires_at_is_synced_from_expires_at(): void
    {
        $deadline = now()->addHours(24);

        $order = Order::factory()->create([
            'status' => 'pending',
            'payment_status' => 'pending',
            'expires_at' => $deadline,
            'payment_expires_at' => null,
        ]);

        $this->assertNotNull($order->fresh()->payment_expires_at);
        $this->assertSame(
            $deadline->toDateTimeString(),
            $order->fresh()->payment_expires_at->toDateTimeString()
        );
    }

    public function test_can_resume_payment_only_when_pending_unpaid_and_not_expired(): void
    {
        $open = Order::factory()->create([
            'status' => 'pending',
            'payment_status' => 'pending',
            'expires_at' => now()->addHour(),
        ]);
        $this->assertTrue($open->canResumePayment());
        $this->assertFalse($open->hasExpired());

        $expired = Order::factory()->create([
            'status' => 'pending',
            'payment_status' => 'pending',
            'expires_at' => now()->subMinute(),
            'payment_expires_at' => now()->subMinute(),
        ]);
        $this->assertTrue($expired->hasExpired());
        $this->assertFalse($expired->canResumePayment());

        $paid = Order::factory()->create([
            'status' => 'processing',
            'payment_status' => 'paid',
            'expires_at' => now()->addHour(),
        ]);
        $this->assertFalse($paid->canResumePayment());
        $this->assertFalse($paid->canBeCancelled());

        $cancelled = Order::factory()->create([
            'status' => 'cancelled',
            'payment_status' => 'cancelled',
        ]);
        $this->assertFalse($cancelled->canResumePayment());
    }
}
