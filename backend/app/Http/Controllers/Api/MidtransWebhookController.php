<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Transaction;
use App\Services\IntegrationService;
use App\Services\JournalMappingService;
use App\Services\MidtransService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class MidtransWebhookController extends Controller
{
    public function __construct(
        private readonly IntegrationService $integrations,
        private readonly JournalMappingService $journalMapping
    ) {
    }

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

        $order = Order::query()->whereIdOrCode($orderId)->first();

        if (! $order) {
            return response()->json(['message' => "Order {$orderId} not found."], 404);
        }

        // Update payment channel, VA, biller, dan QR bila ada di payload (Core API & Snap).
        if ($request->has('va_numbers') && is_array($request->input('va_numbers')) && count($request->input('va_numbers')) > 0) {
            $vaInfo = $request->input('va_numbers')[0];
            $order->va_number = $vaInfo['va_number'] ?? $order->va_number;
            $order->payment_channel = ($vaInfo['bank'] ?? 'bank') . '_va';
        }

        if ($paymentType === 'echannel') {
            $order->payment_channel = 'mandiri_va';
        } elseif ($paymentType === 'qris') {
            $order->payment_channel = 'qris';
        }

        if ($request->filled('biller_code')) {
            $order->midtrans_biller_code = (string) $request->input('biller_code');
        }
        if ($request->filled('bill_key')) {
            $order->midtrans_bill_key = (string) $request->input('bill_key');
        }
        if ($request->filled('qr_string')) {
            $order->midtrans_qr_string = (string) $request->input('qr_string');
        }
        foreach ((array) $request->input('actions', []) as $action) {
            if (($action['name'] ?? null) === 'generate-qr-code' && !empty($action['url'])) {
                $order->midtrans_qr_url = (string) $action['url'];
            }
        }

        if ($order->isDirty()) {
            $order->save();
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

            // T07.7: catat fee gateway saat lunas (dari konfigurasi Admin, G6) + sinkron ke kas.
            if ($mappedStatus === 'paid') {
                $fee = $this->calculateGatewayFee((float) $payment->amount, $locked->payment_channel);
                $payment->fee = $fee;
                $payment->save();

                Transaction::where('order_id', $locked->id)
                    ->where('category', 'order_payment')
                    ->update([
                        'fee_deducted' => $fee,
                        'net_amount' => max(0, (float) $payment->amount - $fee),
                    ]);

                // T34.5: jurnal biaya gateway (idempoten) saat lunas.
                try {
                    $this->journalMapping->postPaymentGatewayFee($locked, $fee);
                } catch (\Throwable $e) {
                    Log::warning('postPaymentGatewayFee gagal: ' . $e->getMessage());
                }
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
     * Hitung fee gateway dari master Metode Pembayaran (T07.12) — G6.
     * Fallback ke konfigurasi legacy `integrations` bila master belum ada.
     */
    private function calculateGatewayFee(float $amount, ?string $channel = null): float
    {
        $percent = 0.0;
        $fixed = 0.0;

        if ($channel) {
            $master = \App\Models\PaymentMethod::where('code', $channel)->where('is_active', true)->first();
            if ($master) {
                $percent = (float) $master->fee_percent;
                $fixed = (float) $master->fee_fixed;
            } else {
                $percent = (float) ($this->integrations->get("payment.fee_{$channel}_percent", 0) ?? 0);
                $fixed = (float) ($this->integrations->get("payment.fee_{$channel}_fixed", 0) ?? 0);
            }
        }

        // Fallback ke tarif global bila fee kanal belum diatur.
        if ($percent <= 0 && $fixed <= 0) {
            $percent = (float) ($this->integrations->get('payment.midtrans_fee_percent', 0) ?? 0);
            $fixed = (float) ($this->integrations->get('payment.midtrans_fee_fixed', 0) ?? 0);
        }

        return round(max(0, ($amount * $percent / 100) + $fixed), 2);
    }

    /**
     * Pemetaan transaction_status Midtrans -> status `payments`.
     */
    private function mapPaymentStatus(string $transactionStatus, string $fraudStatus): string
    {
        return \App\Services\MidtransService::mapStatus($transactionStatus, $fraudStatus);
    }
}
