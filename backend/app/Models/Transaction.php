<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Transaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'transaction_number',
        'order_id',
        'type',
        'category',
        'category_label',
        'amount',
        'description',
        'payment_method',
        'status',
        'customer_name',
        'notes',
    ];

    protected $casts = [
        'amount' => 'float',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Relasi ke pesanan terkait (opsional, karena transaksi operasional non-order order_id bernilai null).
     */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    /**
     * Scope transaksi uang masuk (income).
     */
    public function scopeIncome(Builder $query): Builder
    {
        return $query->where('type', 'income');
    }

    /**
     * Scope transaksi uang keluar (expense).
     */
    public function scopeExpense(Builder $query): Builder
    {
        return $query->where('type', 'expense');
    }

    /**
     * Scope transaksi yang telah terselesaikan (settled).
     */
    public function scopeSettled(Builder $query): Builder
    {
        return $query->where('status', 'settled');
    }

    /**
     * Scope transaksi tertunda (pending).
     */
    public function scopePending(Builder $query): Builder
    {
        return $query->where('status', 'pending');
    }

    /**
     * Scope untuk pesanan tertentu.
     */
    public function scopeForOrder(Builder $query, int $orderId): Builder
    {
        return $query->where('order_id', $orderId);
    }

    /**
     * Generate nomor transaksi kas unik: TRX/{YYYYMMDD}/{IN|EX}-{Random4Digits}.
     */
    public static function generateTransactionNumber(string $type = 'income'): string
    {
        $code = ($type === 'expense') ? 'EX' : 'IN';
        $date = Carbon::now()->format('Ymd');
        $random = mt_rand(1000, 9999);
        return "TRX/{$date}/{$code}-{$random}";
    }

    /**
     * Helper membuat pencatatan transaksi masuk dari pembayaran pesanan.
     */
    public static function recordOrderPayment(Order $order, ?string $channel = null): self
    {
        return self::create([
            'transaction_number' => self::generateTransactionNumber('income'),
            'order_id' => $order->id,
            'type' => 'income',
            'category' => 'order_payment',
            'category_label' => 'Pembayaran Pesanan',
            'amount' => $order->grand_total,
            'description' => "Pembayaran pesanan {$order->order_number} via " . ($channel ?: $order->payment_channel ?: $order->payment_method),
            'payment_method' => $channel ?: $order->payment_channel ?: $order->payment_method,
            'status' => 'settled',
            'customer_name' => $order->recipient_name,
            'notes' => "Invoice: {$order->order_number}",
        ]);
    }

    /**
     * Helper membuat pencatatan ongkos kirim ekspedisi sebagai pengeluaran kas.
     */
    public static function recordShippingExpense(Order $order): self
    {
        return self::create([
            'transaction_number' => self::generateTransactionNumber('expense'),
            'order_id' => $order->id,
            'type' => 'expense',
            'category' => 'shipping_fee',
            'category_label' => 'Ongkos Kirim Kurir',
            'amount' => $order->shipping_cost,
            'description' => "Pelunasan ongkos kirim {$order->expedition_name} {$order->expedition_service} untuk pesanan {$order->order_number}",
            'payment_method' => 'Saldo Ekspedisi / Kas Toko',
            'status' => 'settled',
            'notes' => "Resi: " . ($order->tracking_number ?: 'Pending Pickup'),
        ]);
    }
}
