<?php

namespace App\Console\Commands;

use App\Models\LoyaltyPointsLedger;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * T30.3 — Kedaluwarsakan poin loyalitas yang melewati `expires_at`.
 *
 * Idempotent: entri earn yang sudah pernah dikedaluwarsakan ditandai via
 * entri balik `reference_type='loyalty_expiry'` (reference_id = id entri asal).
 */
class ExpireLoyaltyPoints extends Command
{
    protected $signature = 'loyalty:expire-points';

    protected $description = 'Kedaluwarsakan poin loyalitas yang telah melewati masa berlaku.';

    public function handle(): int
    {
        $entries = LoyaltyPointsLedger::query()
            ->where('type', 'earn')
            ->whereNotNull('expires_at')
            ->where('expires_at', '<=', now())
            ->whereNotExists(function ($query) {
                $query->select(DB::raw(1))
                    ->from('loyalty_points_ledger as expires')
                    ->whereColumn('expires.reference_id', 'loyalty_points_ledger.id')
                    ->where('expires.reference_type', 'loyalty_expiry');
            })
            ->get();

        $expired = 0;

        foreach ($entries as $entry) {
            DB::transaction(function () use ($entry, &$expired) {
                $user = User::query()->lockForUpdate()->find($entry->user_id);

                if (! $user) {
                    return;
                }

                $points = (int) $entry->points;
                $newBalance = max(0, (int) $user->points - $points);
                $user->forceFill(['points' => $newBalance])->save();

                LoyaltyPointsLedger::create([
                    'user_id' => $user->id,
                    'type' => 'expire',
                    'points' => -$points,
                    'balance_after' => $newBalance,
                    'reference_type' => 'loyalty_expiry',
                    'reference_id' => (string) $entry->id,
                    'description' => "Kedaluwarsa poin dari entri #{$entry->id}.",
                ]);

                $entry->forceFill(['expires_at' => null])->save();
                $expired++;
            });
        }

        $this->info("Poin kedaluwarsa diproses: {$expired} entri.");

        return self::SUCCESS;
    }
}
