<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Payment;
use App\Services\MidtransService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class MidtransWebhookController extends Controller
{
    /**
     * Handle incoming Midtrans HTTP notification webhook (idempoten, D8/T07.3).
     */
    public function handle(Request $request, MidtransService $midtransService): JsonResponse
    {
        $orderId = (string) $request->input('order_id');
        $statusCode = (string) $request->input('status_code');
        $grossAmount = (string) $request->input('gross_amount');
        $signatureKey = (string) $request->input('signature_key');
        $transactionStatus = (string) $request->input('transaction_status');
        $fraudStatus = (string) $request->input('fraud_status');
        $transactionId = (string) $request->input('transaction_id');
        $paymentType = (string) $request->input('payment_type');

        if (! $orderId || ! $signatureKey) {
            return response()->json(['message' => 'Invalid notification payload.'], 400);
        }

        // Verify signature (signature invalid -> 403).
        $isValidSignature = $midtransService->verifySignature($orderId, $statusCode, $grossAmount, $signatureKey);

        if (! $isValidSignature) {
            Log::warning('Midtrans webhook invalid signature', [
                'order_id' => $orderId,
                'signature' => $signatureKey,
            ]);

            return response()->json(['message' => 'Invalid signature key.'], 403);
        }

        $order = Order::where('order_number', $orderId)->first();

        if (! $order) {
            return response()->json(['message' => "Order {$orderId} not found."], 404);
        }

        // Update payment channel & VA if present in payload.
        if ($request->has('va_numbers') && is_array($request->input('va_numbers')) && count($request->input('va_numbers')) > 0) {
            $vaInfo = $request->input('va_numbers')[0];
            $order->va_number = $vaInfo['va_number'] ?? $order->va_number;
            $order->payment_channel = ($vaInfo['bank'] ?? 'bank') . '_va';
        }

        $mappedStatus = $this->mapPaymentStatus($transactionStatus, $fraudStatus);
        $reference = $transactionId ?: $order->order_number;
        $duplicate = false;

        DB::transaction(function () use ($order, $paymentType, $transactionId, $grossAmount, $mappedStatus, $reference, &$duplicate) {
            $locked = Order::whereKey($order->id)->lockForUpdate()->firstOrFail();
            $payment = Payment::where('order_id', $locked->id)
                ->where('reference', $reference)
                ->lockForUpdate()
                ->first();

            // IDEMPOTENSI: event dengan status sama untuk reference sama tidak diproses ulang.
            if ($payment && $payment->status === $mappedStatus) {
                $duplicate = true;

                return;
            }

            $payment = $payment ?: new Payment(['order_id' => $locked->id, 'reference' => $reference]);
            $payment->fill([
                'method' => 'midtrans',
                'channel' => $paymentType ?: $payment->channel,
                'amount' => ((float) $grossAmount) > 0 ? (float) $grossAmount : ($payment->amount ?? $locked->grand_total),
                'status' => $mappedStatus,
                'paid_at' => $mappedStatus === 'paid' ? ($payment->paid_at ?? Carbon::now()) : $payment->paid_at,
            ])->save();

            // Sinkron status order (legacy) — sekali saja per perubahan status.
            if ($mappedStatus === 'paid') {
                if ($locked->payment_status !== 'paid') {
                    $locked->markAsPaid($paymentType ?: 'midtrans', $transactionId ?: null);
                }
            } elseif (in_array($mappedStatus, ['failed', 'expired', 'cancelled'], true)) {
                $locked->update([
                    'status' => $mappedStatus === 'failed' ? 'failed' : 'cancelled',
                    'payment_status' => $mappedStatus,
                    'cancelled_at' => Carbon::now(),
                ]);
            } elseif ($mappedStatus === 'challenge') {
                $locked->update(['status' => 'pending', 'payment_status' => 'challenge']);
            } else {
                $locked->update(['payment_status' => $mappedStatus]);
            }

            if ($paymentType) {
                $locked->midtrans_payment_type = $paymentType;
            }
            if ($transactionId) {
                $locked->midtrans_transaction_id = $transactionId;
            }
            $locked->save();
        });

        $order->refresh();

        return response()->json([
            'message' => $duplicate
                ? 'Notification already processed (idempotent).'
                : 'Notification handled successfully.',
            'duplicate' => $duplicate,
            'data' => [
                'order_number' => $order->order_number,
                'status' => $order->status,
                'payment_status' => $order->payment_status,
            ],
        ]);
    }

    /**
     * Pemetaan transaction_status Midtrans -> status `payments`.
     */
    private function mapPaymentStatus(string $transactionStatus, string $fraudStatus): string
    {
        return match (true) {
            $transactionStatus === 'capture' && $fraudStatus === 'accept' => 'paid',
            $transactionStatus === 'settlement' => 'paid',
            $transactionStatus === 'capture' && $fraudStatus === 'challenge' => 'challenge',
            $transactionStatus === 'pending' => 'pending',
            $transactionStatus === 'deny' => 'failed',
            $transactionStatus === 'expire' => 'expired',
            $transactionStatus === 'cancel' => 'cancelled',
            in_array($transactionStatus, ['refund', 'partial_refund'], true) => 'refunded',
            default => 'pending',
        };
    }
}
