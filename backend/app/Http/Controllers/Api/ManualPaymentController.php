<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ConfirmManualPaymentRequest;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ManualPaymentController extends Controller
{
    /**
     * Get list of destination bank accounts for manual bank transfer.
     */
    public function bankAccounts(): JsonResponse
    {
        return response()->json([
            'data' => [
                [
                    'bank' => 'BCA',
                    'bank_code' => '014',
                    'account_number' => '1234567890',
                    'account_name' => 'PT Toko Online Indonesia',
                    'logo' => 'https://upload.wikimedia.org/wikipedia/commons/5/5c/Bank_Central_Asia.svg',
                ],
                [
                    'bank' => 'Mandiri',
                    'bank_code' => '008',
                    'account_number' => '9876543210123',
                    'account_name' => 'PT Toko Online Indonesia',
                    'logo' => 'https://upload.wikimedia.org/wikipedia/commons/a/ad/Bank_Mandiri_logo_2016.svg',
                ],
                [
                    'bank' => 'BRI',
                    'bank_code' => '002',
                    'account_number' => '012345678901234',
                    'account_name' => 'PT Toko Online Indonesia',
                    'logo' => 'https://upload.wikimedia.org/wikipedia/commons/6/68/BANK_BRI_logo.svg',
                ],
                [
                    'bank' => 'BNI',
                    'bank_code' => '009',
                    'account_number' => '1122334455',
                    'account_name' => 'PT Toko Online Indonesia',
                    'logo' => 'https://upload.wikimedia.org/wikipedia/id/5/55/BNI_logo.svg',
                ],
            ],
        ]);
    }

    /**
     * Submit payment confirmation with transfer proof file.
     */
    public function confirm(ConfirmManualPaymentRequest $request, string $idOrOrderNumber): JsonResponse
    {
        $order = Order::with('items')
            ->where('id', $idOrOrderNumber)
            ->orWhere('order_number', $idOrOrderNumber)
            ->firstOrFail();

        // Store proof file
        $file = $request->file('payment_proof');
        $filePath = $file->store('payment_proofs', 'public');

        $transferredAt = $request->filled('transferred_at')
            ? Carbon::parse($request->input('transferred_at'))
            : Carbon::now();

        $order->update([
            'payment_method' => 'manual_transfer',
            'payment_proof' => $filePath,
            'bank_name' => $request->input('bank_name', $order->bank_name),
            'bank_account_name' => $request->input('bank_account_name', $order->bank_account_name),
            'payment_transferred_at' => $transferredAt,
            'payment_status' => 'verifying',
            'status' => 'pending',
            'notes' => $request->input('notes') ?: $order->notes,
        ]);

        return response()->json([
            'message' => 'Bukti pembayaran berhasil diunggah. Kami akan segera memverifikasi pembayaran Anda.',
            'data' => new OrderResource($order),
        ]);
    }

    /**
     * Approve manual transfer (Admin / System).
     */
    public function approve(Request $request, string $idOrOrderNumber): JsonResponse
    {
        $order = Order::with('items')
            ->where('id', $idOrOrderNumber)
            ->orWhere('order_number', $idOrOrderNumber)
            ->firstOrFail();

        $order->markAsPaid('manual_transfer');

        return response()->json([
            'message' => 'Pembayaran pesanan berhasil disetujui.',
            'data' => new OrderResource($order),
        ]);
    }

    /**
     * Reject manual transfer (Admin / System).
     */
    public function reject(Request $request, string $idOrOrderNumber): JsonResponse
    {
        $order = Order::with('items')
            ->where('id', $idOrOrderNumber)
            ->orWhere('order_number', $idOrOrderNumber)
            ->firstOrFail();

        $reason = $request->input('reason', 'Bukti pembayaran tidak valid.');

        $order->update([
            'payment_status' => 'rejected',
            'notes' => ($order->notes ? $order->notes . ' | ' : '') . 'Penolakan: ' . $reason,
        ]);

        return response()->json([
            'message' => 'Pembayaran ditolak: ' . $reason,
            'data' => new OrderResource($order),
        ]);
    }
}
