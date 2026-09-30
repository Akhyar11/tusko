<?php

namespace Tests\Feature;

use App\Models\LoyaltyPointsLedger;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * T30.3 — Command `loyalty:expire-points`.
 */
class LoyaltyExpiryTest extends TestCase
{
    use RefreshDatabase;

    public function test_expires_points_past_expiry_idempotently(): void
    {
        $user = User::factory()->create(['points' => 100]);

        LoyaltyPointsLedger::create([
            'user_id' => $user->id,
            'type' => 'earn',
            'points' => 100,
            'balance_after' => 100,
            'reference_type' => 'order',
            'reference_id' => '1',
            'description' => 'Poin pesanan',
            'expires_at' => now()->subDay(),
        ]);

        $this->artisan('loyalty:expire-points')->assertExitCode(0);

        $this->assertSame(0, (int) $user->fresh()->points);
        $this->assertDatabaseHas('loyalty_points_ledger', [
            'user_id' => $user->id,
            'type' => 'expire',
            'points' => -100,
            'reference_type' => 'loyalty_expiry',
        ]);

        // Idempotent: tidak dobel.
        $this->artisan('loyalty:expire-points')->assertExitCode(0);
        $this->assertSame(1, LoyaltyPointsLedger::where('type', 'expire')->count());
        $this->assertSame(0, (int) $user->fresh()->points);
    }

    public function test_does_not_expire_future_points(): void
    {
        $user = User::factory()->create(['points' => 50]);

        LoyaltyPointsLedger::create([
            'user_id' => $user->id,
            'type' => 'earn',
            'points' => 50,
            'balance_after' => 50,
            'reference_type' => 'order',
            'reference_id' => '2',
            'description' => 'Poin aktif',
            'expires_at' => now()->addMonth(),
        ]);

        $this->artisan('loyalty:expire-points')->assertExitCode(0);

        $this->assertSame(50, (int) $user->fresh()->points);
        $this->assertSame(0, LoyaltyPointsLedger::where('type', 'expire')->count());
    }
}
