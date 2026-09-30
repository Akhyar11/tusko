<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FinancialAccount;
use Illuminate\Http\JsonResponse;

/**
 * T45.3 — Daftar rekening keuangan (untuk dropdown form transaksi).
 */
class FinancialAccountController extends Controller
{
    public function index(): JsonResponse
    {
        $accounts = FinancialAccount::query()
            ->where('is_active', true)
            ->orderBy('account_name')
            ->get();

        return response()->json([
            'data' => $accounts,
        ]);
    }
}
