<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ConfirmManualPaymentRequest;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Models\Payment;
use App\Services\IntegrationService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class ManualPaymentController extends Controller
{
    /**
     * Get list of destination bank accounts for manual bank transfer.
     */
    public function bankAccounts(IntegrationService $integrations): JsonResponse
    {
        // G6: rekening bank manual dikonfigurasi Admin (tabel `integrations`,
        // key `payment.manual_banks` disimpan sebagai JSON string), tanpa hardcode.
        $raw = $integrations->get('payment.manual_banks');
        $decoded = is_string($raw) ? json_decode($raw, true) : $raw;
        $banks = is_array($decoded) ? array_values($decoded) : [];

        return response()->json([
            'data' => $banks,
            'configured' => $banks !== [],
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
        $filePath = $file->store('payment_proofs', config('filesystems.default', 'public'));

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

        // D8: catat pembayaran manual di tabel `payments` (otoritatif).
        Payment::updateOrCreate(
            ['order_id' => $order->id, 'reference' => $order->order_number],
            [
                'method' => 'manual_transfer',
                'channel' => $order->bank_name,
                'amount' => (float) $order->grand_total,
                'status' => 'verifying',
                'proof' => $filePath,
            ]
        );

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
        $order = Order::where('id', $idOrOrderNumber)
            ->orWhere('order_number', $idOrOrderNumber)
            ->firstOrFail();

        $alreadyPaid = false;

        DB::transaction(function () use ($order, &$alreadyPaid) {
            $locked = Order::whereKey($order->id)->lockForUpdate()->firstOrFail();

            if ($locked->payment_status === 'paid') {
                $alreadyPaid = true;

                return;
            }

            $locked->markAsPaid('manual_transfer');

            Payment::updateOrCreate(
                ['order_id' => $locked->id, 'reference' => $locked->order_number],
                [
                    'method' => 'manual_transfer',
                    'channel' => $locked->bank_name,
                    'amount' => (float) $locked->grand_total,
                    'status' => 'paid',
                    'paid_at' => Carbon::now(),
                ]
            );
        });

        return response()->json([
            'message' => $alreadyPaid
                ? 'Pembayaran pesanan sudah disetujui sebelumnya.'
                : 'Pembayaran pesanan berhasil disetujui.',
            'duplicate' => $alreadyPaid,
            'data' => new OrderResource($order->fresh()),
        ]);
    }

    /**
     * Reject manual transfer (Admin / System).
     */
    public function reject(Request $request, string $idOrOrderNumber): JsonResponse
    {
        $order = Order::where('id', $idOrOrderNumber)
            ->orWhere('order_number', $idOrOrderNumber)
            ->firstOrFail();

        $reason = $request->input('reason', 'Bukti pembayaran tidak valid.');

        $order->update([
            'payment_status' => 'rejected',
            'notes' => ($order->notes ? $order->notes . ' | ' : '') . 'Penolakan: ' . $reason,
        ]);

        Payment::updateOrCreate(
            ['order_id' => $order->id, 'reference' => $order->order_number],
            [
                'method' => 'manual_transfer',
                'channel' => $order->bank_name,
                'amount' => (float) $order->grand_total,
                'status' => 'rejected',
                'notes' => $reason,
            ]
        );

        return response()->json([
            'message' => 'Pembayaran ditolak: ' . $reason,
            'data' => new OrderResource($order),
        ]);
    }
}
