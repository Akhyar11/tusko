<?php

namespace Tests\Feature;

use App\Models\LoyaltyPointsLedger;
use App\Models\Order;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * T31 — Loyalitas: ledger API + earning (idempoten) + reversal.
 */
class LoyaltyLifecycleTest extends TestCase
{
    use RefreshDatabase;

    public function test_ledger_endpoint_lists_entries_and_balance(): void
    {
        $user = User::factory()->create(['points' => 0]);
        Sanctum::actingAs($user);

        LoyaltyPointsLedger::create([
            'user_id' => $user->id,
            'type' => 'earned',
            'points' => 500,
            'balance_after' => 500,
            'reference_type' => 'order',
            'reference_id' => 'INV/TEST/001',
            'description' => 'Perolehan poin',
        ]);
        $user->update(['points' => 500]);

        $response = $this->getJson('/api/loyalty/ledger')->assertOk();

        $response->assertJsonPath('balance', 500)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.type', 'earned')
            ->assertJsonPath('data.0.points', 500);
    }

    public function test_earning_points_on_paid_is_idempotent(): void
    {
        $user = User::factory()->create(['points' => 0]);
        $order = Order::factory()->create([
            'user_id' => $user->id,
            'status' => 'pending',
            'payment_status' => 'pending',
            'loyalty_points_earned' => 750,
        ]);

        // Lunas -> observer mengkredit poin.
        $order->update(['status' => 'processing', 'payment_status' => 'paid']);

        $this->assertSame(750, (int) $user->fresh()->points);
        $this->assertSame(1, LoyaltyPointsLedger::where('user_id', $user->id)->where('type', 'earned')->count());

        // Update lagi -> idempoten (tidak dobel).
        $order->update(['payment_status' => 'paid']);
        $this->assertSame(750, (int) $user->fresh()->points);
        $this->assertSame(1, LoyaltyPointsLedger::where('user_id', $user->id)->where('type', 'earned')->count());
    }

    public function test_reversal_on_cancel(): void
    {
        $user = User::factory()->create(['points' => 0]);
        $order = Order::factory()->create([
            'user_id' => $user->id,
            'status' => 'pending',
            'payment_status' => 'pending',
            'loyalty_points_earned' => 400,
        ]);

        $order->update(['status' => 'processing', 'payment_status' => 'paid']);
        $this->assertSame(400, (int) $user->fresh()->points);

        $order->update(['status' => 'cancelled', 'payment_status' => 'cancelled']);
        $this->assertSame(0, (int) $user->fresh()->points);
        $this->assertSame(
            1,
            LoyaltyPointsLedger::where('user_id', $user->id)
                ->where('reference_type', 'order_cancelled')
                ->count()
        );
    }
}
