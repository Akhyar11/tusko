<?php

namespace App\Observers;

use App\Models\Order;
use App\Models\Transaction;

class OrderObserver
{
    /**
     * Handle the Order "saved" event.
     */
    public function saved(Order $order): void
    {
        $this->syncFinancialTransactions($order);
    }

    /**
     * Sinkronisasi transaksi kas masuk / keluar secara otomatis berdasarkan status pesanan.
     */
    public function syncFinancialTransactions(Order $order): void
    {
        // 1. Transaksi Otomatis Uang Masuk (Income: order_payment)
        // Terjadi saat pembayaran lunas (payment_status == paid) atau status pesanan processing/shipped/completed
        $isPaid = $order->payment_status === 'paid' || in_array($order->status, ['processing', 'shipped', 'completed']);
        if ($isPaid && $order->grand_total > 0) {
            $hasPaymentTrx = $order->transactions()
                ->where('type', 'income')
                ->where('category', 'order_payment')
                ->exists();

            if (!$hasPaymentTrx) {
                Transaction::recordOrderPayment($order, $order->payment_channel ?: $order->payment_method);
            }
        }

        // 2. Transaksi Otomatis Uang Keluar (Expense: shipping_fee)
        // Terjadi saat status pesanan dikirim (shipped) atau selesai (completed)
        $isShipped = in_array($order->status, ['shipped', 'completed']);
        if ($isShipped && (float) $order->shipping_cost > 0) {
            $hasShippingTrx = $order->transactions()
                ->where('type', 'expense')
                ->where('category', 'shipping_fee')
                ->exists();

            if (!$hasShippingTrx) {
                Transaction::recordShippingExpense($order);
            }
        }

        // 3. Transaksi Otomatis Pengembalian Dana (Expense: refund)
        // Terjadi saat pesanan dibatalkan (cancelled) padahal sebelumnya sudah pernah ada transaksi pembayaran lunas
        if ($order->status === 'cancelled') {
            $hasSettledPayment = $order->transactions()
                ->where('type', 'income')
                ->where('category', 'order_payment')
                ->where('status', 'settled')
                ->exists();

            $hasRefundTrx = $order->transactions()
                ->where('type', 'expense')
                ->where('category', 'refund')
                ->exists();

            if ($hasSettledPayment && !$hasRefundTrx) {
                Transaction::create([
                    'transaction_number' => Transaction::generateTransactionNumber('expense'),
                    'order_id' => $order->id,
                    'type' => 'expense',
                    'category' => 'refund',
                    'category_label' => 'Pengembalian Dana',
                    'amount' => $order->grand_total,
                    'description' => "Pengembalian dana untuk pembatalan pesanan {$order->order_number}",
                    'payment_method' => $order->payment_method ?: 'Refund Kas Toko',
                    'status' => 'settled',
                    'customer_name' => $order->recipient_name,
                    'notes' => $order->notes ?: 'Pesanan dibatalkan',
                ]);
            }

            // 4. Pengembalian Stok Otomatis saat Pesanan Dibatalkan (Restore Stock)
            $hasRestored = \App\Models\StockMutation::where('reference_type', 'order_cancelled')
                ->where('reference_id', $order->order_number)
                ->exists();

            if (!$hasRestored) {
                foreach ($order->items as $item) {
                    $product = $item->product ?: \App\Models\Product::find($item->product_id);
                    if ($product) {
                        $stockBefore = (int) $product->stock;
                        $product->increment('stock', $item->quantity);
                        $stockAfter = (int) $product->fresh()->stock;

                        \App\Models\StockMutation::create([
                            'product_id' => $product->id,
                            'type' => 'in',
                            'quantity' => $item->quantity,
                            'stock_before' => $stockBefore,
                            'stock_after' => $stockAfter,
                            'reference_type' => 'order_cancelled',
                            'reference_id' => $order->order_number,
                            'notes' => "Pengembalian stok dari pembatalan pesanan {$order->order_number}",
                            'created_by' => 'Order Cancellation System',
                        ]);
                    }
                }
            }
        }

        // 5. Perolehan Poin Loyalitas Otomatis saat Pesanan Terbayar Lunas
        if ($isPaid && $order->user_id && (int) $order->loyalty_points_earned > 0) {
            $alreadyCredited = \App\Models\LoyaltyPointsLedger::where('user_id', $order->user_id)
                ->where('reference_type', 'order')
                ->where('reference_id', $order->order_number)
                ->where('points', '>', 0)
                ->exists();

            if (!$alreadyCredited) {
                $customer = \App\Models\User::lockForUpdate()->find($order->user_id);
                if ($customer) {
                    $customer->increment('points', (int) $order->loyalty_points_earned);
                    \App\Models\LoyaltyPointsLedger::create([
                        'user_id' => $customer->id,
                        'type' => 'earned',
                        'points' => (int) $order->loyalty_points_earned,
                        'balance_after' => (int) $customer->fresh()->points,
                        'reference_type' => 'order',
                        'reference_id' => $order->order_number,
                        'description' => "Perolehan poin reward dari pesanan {$order->order_number}",
                    ]);
                }
            }
        }

        // 6. Pembatalan Poin Loyalitas jika Pesanan Dibatalkan
        if ($order->status === 'cancelled' && $order->user_id && (int) $order->loyalty_points_earned > 0) {
            $hasCredited = \App\Models\LoyaltyPointsLedger::where('user_id', $order->user_id)
                ->where('reference_type', 'order')
                ->where('reference_id', $order->order_number)
                ->where('type', 'earned')
                ->exists();

            $hasReversed = \App\Models\LoyaltyPointsLedger::where('user_id', $order->user_id)
                ->where('reference_type', 'order_cancelled')
                ->where('reference_id', $order->order_number)
                ->exists();

            if ($hasCredited && !$hasReversed) {
                $customer = \App\Models\User::lockForUpdate()->find($order->user_id);
                if ($customer) {
                    $deductPoints = min((int) $customer->points, (int) $order->loyalty_points_earned);
                    $customer->decrement('points', $deductPoints);
                    \App\Models\LoyaltyPointsLedger::create([
                        'user_id' => $customer->id,
                        'type' => 'redeemed',
                        'points' => -$deductPoints,
                        'balance_after' => (int) $customer->fresh()->points,
                        'reference_type' => 'order_cancelled',
                        'reference_id' => $order->order_number,
                        'description' => "Pembatalan perolehan poin dari pesanan dibatalkan {$order->order_number}",
                    ]);
                }
            }
        }
    }
}
