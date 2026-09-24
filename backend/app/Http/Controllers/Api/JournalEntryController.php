<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\JournalEntryResource;
use App\Models\FinancialLedgerEntry;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class JournalEntryController extends Controller
{
    /**
     * Daftar baris jurnal umum (double-entry) dengan filter & ringkasan.
     */
    public function index(Request $request): JsonResponse
    {
        $query = FinancialLedgerEntry::with(['account', 'transaction']);

        if ($request->filled('transaction_id')) {
            $query->where('transaction_id', (int) $request->query('transaction_id'));
        }

        if ($request->filled('chart_of_account_id')) {
            $query->where('chart_of_account_id', (int) $request->query('chart_of_account_id'));
        }

        if ($request->filled('start_date') && $request->filled('end_date')) {
            $query->whereBetween('created_at', [
                Carbon::parse($request->query('start_date'))->startOfDay(),
                Carbon::parse($request->query('end_date'))->endOfDay(),
            ]);
        }

        if ($request->filled('search')) {
            $search = trim($request->query('search'));

            $query->where(function ($q) use ($search) {
                $q->where('notes', 'like', "%{$search}%")
                    ->orWhereHas('transaction', function ($transactionQuery) use ($search) {
                        $transactionQuery->where('transaction_number', 'like', "%{$search}%")
                            ->orWhere('description', 'like', "%{$search}%");
                    })
                    ->orWhereHas('account', function ($accountQuery) use ($search) {
                        $accountQuery->where('account_name', 'like', "%{$search}%")
                            ->orWhere('account_code', 'like', "%{$search}%");
                    });
            });
        }

        $summaryQuery = clone $query;
        $totalDebit = round((float) (clone $summaryQuery)->sum('debit'), 2);
        $totalCredit = round((float) (clone $summaryQuery)->sum('credit'), 2);

        match ($request->query('sort', 'latest')) {
            'oldest' => $query->oldest(),
            default => $query->latest(),
        };

        $perPage = min(100, max(1, (int) $request->query('per_page', 20)));
        $entries = $query->paginate($perPage);

        return response()->json([
            'data' => JournalEntryResource::collection($entries),
            'summary' => [
                'total_debit' => $totalDebit,
                'total_credit' => $totalCredit,
                'is_balanced' => $totalDebit === $totalCredit,
            ],
            'meta' => [
                'current_page' => $entries->currentPage(),
                'last_page' => $entries->lastPage(),
                'per_page' => $entries->perPage(),
                'total' => $entries->total(),
            ],
        ]);
    }
}
