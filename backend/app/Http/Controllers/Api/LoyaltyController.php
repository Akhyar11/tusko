<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LoyaltyPointsLedger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LoyaltyController extends Controller
{
    /**
     * Riwayat poin loyalitas pengguna (T31) — paginasi + saldo terkini.
     */
    public function ledger(Request $request): JsonResponse
    {
        $user = $request->user();
        $perPage = min((int) ($request->input('per_page') ?: 20), 100);

        $paginated = LoyaltyPointsLedger::query()
            ->where('user_id', $user->id)
            ->latest()
            ->paginate($perPage);

        $paginated->through(fn (LoyaltyPointsLedger $entry) => [
            'id' => $entry->id,
            'type' => $entry->type,
            'points' => (int) $entry->points,
            'balance_after' => (int) $entry->balance_after,
            'reference_type' => $entry->reference_type,
            'reference_id' => $entry->reference_id,
            'description' => $entry->description,
            'expires_at' => $entry->expires_at,
            'created_at' => $entry->created_at,
        ]);

        return response()->json([
            'data' => $paginated->items(),
            'meta' => [
                'current_page' => $paginated->currentPage(),
                'last_page' => $paginated->lastPage(),
                'per_page' => $paginated->perPage(),
                'total' => $paginated->total(),
            ],
            'balance' => (int) $user->points,
        ]);
    }
}
