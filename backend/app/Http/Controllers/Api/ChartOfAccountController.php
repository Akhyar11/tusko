<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ChartOfAccount;
use Illuminate\Http\JsonResponse;

class ChartOfAccountController extends Controller
{
    /**
     * Daftar akun (Chart of Accounts) untuk dropdown filter (T34.11).
     * Data dinamis dari database — FE dilarang hardcode daftar akun.
     */
    public function index(): JsonResponse
    {
        $accounts = ChartOfAccount::query()
            ->orderBy('account_code')
            ->get(['id', 'account_code', 'account_name', 'account_type']);

        return response()->json(['data' => $accounts]);
    }
}
