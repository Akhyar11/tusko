<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\MidtransService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class MidtransWebhookController extends Controller
{
    /**
     * Handle incoming Midtrans HTTP notification webhook.
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

        // Verify signature
        $isValidSignature = $midtransService->verifySignature($orderId, $statusCode, $grossAmount, $signatureKey);

        if (! $isValidSignature) {
            Log::warning('Midtrans webhook invalid signature', [
                'order_id' => $orderId,
                'signature' => $signatureKey,
            ]);

            return response()->json(['message' => 'Invalid signature key.'], 403);
        }

        // Locate order
        $order = Order::with('items.product')->where('order_number', $orderId)->first();

        if (! $order) {
            return response()->json(['message' => "Order {$orderId} not found."], 404);
        }

        // Update payment channel & VA if present in payload
        if ($request->has('va_numbers') && is_array($request->input('va_numbers')) && count($request->input('va_numbers')) > 0) {
            $vaInfo = $request->input('va_numbers')[0];
            $order->va_number = $vaInfo['va_number'] ?? $order->va_number;
            $order->payment_channel = ($vaInfo['bank'] ?? 'bank') . '_va';
        }

        $order->midtrans_transaction_id = $transactionId ?: $order->midtrans_transaction_id;
        $order->midtrans_payment_type = $paymentType ?: $order->midtrans_payment_type;

        DB::transaction(function () use ($order, $transactionStatus, $fraudStatus, $paymentType, $transactionId) {
            if ($transactionStatus === 'capture') {
                if ($fraudStatus === 'accept') {
                    $order->markAsPaid($paymentType, $transactionId);
                } elseif ($fraudStatus === 'challenge') {
                    $order->update([
                        'status' => 'pending',
                        'payment_status' => 'challenge',
                    ]);
                }
            } elseif ($transactionStatus === 'settlement') {
                $order->markAsPaid($paymentType, $transactionId);
            } elseif ($transactionStatus === 'pending') {
                $order->update([
                    'status' => 'pending',
                    'payment_status' => 'pending',
                ]);
            } elseif (in_array($transactionStatus, ['deny', 'expire', 'cancel'], true)) {
                $isAlreadyCancelled = in_array($order->status, ['cancelled', 'failed'], true);

                $newStatus = ($transactionStatus === 'deny') ? 'failed' : 'cancelled';
                $newPaymentStatus = ($transactionStatus === 'expire') ? 'expired' : (($transactionStatus === 'deny') ? 'failed' : 'cancelled');

                $order->update([
                    'status' => $newStatus,
                    'payment_status' => $newPaymentStatus,
                    'cancelled_at' => Carbon::now(),
                ]);

                // Restore stock if previously deducted and not yet restored
                if (! $isAlreadyCancelled) {
                    foreach ($order->items as $item) {
                        if ($item->product) {
                            $item->product->increment('stock', $item->quantity);
                        }
                    }
                }
            } else {
                $order->save();
            }
        });

        return response()->json([
            'message' => 'Notification handled successfully.',
            'data' => [
                'order_number' => $order->order_number,
                'status' => $order->fresh()->status,
                'payment_status' => $order->fresh()->payment_status,
            ],
        ]);
    }
}
