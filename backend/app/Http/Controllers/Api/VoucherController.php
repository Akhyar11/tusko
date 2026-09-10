<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Voucher;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VoucherController extends Controller
{
    /**
     * Dapatkan daftar kupon dan voucher aktif.
     */
    public function index(Request $request): JsonResponse
    {
        $vouchers = Voucher::active()
            ->orderBy('id', 'asc')
            ->get();

        return response()->json([
            'data' => $vouchers,
        ]);
    }

    /**
     * Klaim atau validasi voucher dengan kode tertentu.
     */
    public function claim(Request $request): JsonResponse
    {
        $request->validate([
            'code' => 'required|string',
        ]);

        $code = strtoupper(trim($request->input('code')));
        $voucher = Voucher::active()->where('code', $code)->first();

        if (!$voucher) {
            return response()->json([
                'message' => "Voucher dengan kode \"{$code}\" tidak ditemukan atau sudah kedaluwarsa.",
            ], 404);
        }

        return response()->json([
            'message' => "Voucher \"{$voucher->title}\" berhasil diklaim.",
            'data' => $voucher,
        ]);
    }
}
