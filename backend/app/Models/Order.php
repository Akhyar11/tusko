<?php

namespace App\Models;

use App\Models\Concerns\HasIdOrCodeLookup;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    use HasFactory;
    use HasIdOrCodeLookup;

    protected string $idOrCodeColumn = 'order_number';
    protected array $idOrCodeExtraColumns = ['midtrans_order_id'];

    protected $fillable = [
        'order_number',
        'midtrans_order_id',
        'user_id',
        'guest_session_id',
        'status',
        'payment_status',
        'payment_method',
        'payment_channel',
        'va_number',
        'midtrans_snap_token',
        'midtrans_transaction_id',
        'midtrans_payment_type',
        'midtrans_pdf_url',
        'midtrans_biller_code',
        'midtrans_bill_key',
        'midtrans_qr_string',
        'midtrans_qr_url',
        'payment_expires_at',
        'payment_proof',
        'payment_transferred_at',
        'bank_account_name',
        'bank_name',
        'shipping_address_id',
        'recipient_name',
        'phone',
        'phone_number',
        'full_address',
        'province',
        'city',
        'district',
        'postal_code',
        'address_label',
        'expedition_id',
        'expedition_name',
        'expedition_service',
        'expedition_etd',
        'tracking_number',
        'subtotal',
        'shipping_cost',
        'insurance_cost',
        'service_fee',
        'discount_amount',
        'grand_total',
        'total_weight',
        'coupon_code',
        'notes',
        'loyalty_points_earned',
        'loyalty_points_redeemed',
        'paid_at',
        'shipped_at',
        'completed_at',
        'cancelled_at',
        'expires_at',
        'status_id',
        'payment_status_id',
        'total_cogs',
    ];

    protected $casts = [
        'subtotal' => 'float',
        'shipping_cost' => 'float',
        'shipping_subsidy' => 'float',
        'insurance_cost' => 'float',
        'service_fee' => 'float',
        'discount_amount' => 'float',
        'grand_total' => 'float',
        'total_weight' => 'float',
        'loyalty_points_earned' => 'integer',
        'loyalty_points_redeemed' => 'integer',
        'paid_at' => 'datetime',
        'payment_expires_at' => 'datetime',
        'shipped_at' => 'datetime',
        'completed_at' => 'datetime',
        'cancelled_at' => 'datetime',
        'expires_at' => 'datetime',
        'payment_transferred_at' => 'datetime',
    ];

    /**
     * The "booted" method of the model.
     */
    protected static function booted(): void
    {
        static::observe(\App\Observers\OrderObserver::class);

        // T39.3: sinkronkan batas waktu bayar — bila `expires_at` diisi tetapi
        // `payment_expires_at` belum, samakan agar FE/validasi punya satu acuan.
        static::saving(function (Order $order) {
            if ($order->expires_at && ! $order->payment_expires_at) {
                $order->payment_expires_at = $order->expires_at;
            }
        });
    }

    /**
     * Apakah batas waktu pembayaran pesanan sudah lewat (T39.3).
     */
    public function hasExpired(): bool
    {
        $deadline = $this->payment_expires_at ?? $this->expires_at;

        return $deadline !== null && $deadline->isPast();
    }

    /**
     * Boleh melanjutkan pembayaran: masih pending, belum lunas, & belum kedaluwarsa.
     */
    public function canResumePayment(): bool
    {
        return $this->status === 'pending'
            && ! in_array((string) $this->payment_status, ['paid', 'settlement', 'capture'], true)
            && ! $this->hasExpired();
    }

    /**
     * Boleh dibatalkan sendiri oleh pelanggan: masih pending & belum lunas.
     */
    public function canBeCancelled(): bool
    {
        return $this->status === 'pending'
            && ! in_array((string) $this->payment_status, ['paid', 'settlement', 'capture'], true);
    }

    /**
     * User relation.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Order items relation.
     */
    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    /**
     * Hitung ulang total HPP/COGS pesanan dari item (T18.1).
     */
    public function recalculateTotalCogs(): float
    {
        $total = $this->items()
            ->get()
            ->sum(fn (OrderItem $item) => (float) $item->unit_cogs * (int) $item->quantity);

        $total = round((float) $total, 2);
        $this->forceFill(['total_cogs' => $total])->save();

        return $total;
    }

    /**
     * Shipping address relation.
     */
    public function shippingAddress(): BelongsTo
    {
        return $this->belongsTo(ShippingAddress::class, 'shipping_address_id');
    }

    /**
     * Expedition relation.
     */
    public function expedition(): BelongsTo
    {
        return $this->belongsTo(Expedition::class, 'expedition_id');
    }

    /**
     * Financial transactions relation.
     */
    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class);
    }

    /**
     * Semua pembayaran order (D8 — sumber kebenaran pembayaran).
     */
    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    /**
     * Pembayaran terbaru order.
     */
    public function latestPayment(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(Payment::class)->latestOfMany();
    }

    public function orderStatus(): BelongsTo
    {
        return $this->belongsTo(OrderStatus::class, 'status_id');
    }

    public function statusHistories(): HasMany
    {
        return $this->hasMany(OrderStatusHistory::class);
    }

    public function returns(): HasMany
    {
        return $this->hasMany(OrderReturn::class);
    }

    public function shipment(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(Shipment::class);
    }

    /**
     * Scope for pending orders.
     */
    public function scopePending(Builder $query): Builder
    {
        return $query->where('status', 'pending');
    }

    /**
     * Scope for paid orders.
     */
    public function scopePaid(Builder $query): Builder
    {
        return $query->where('payment_status', 'paid');
    }

    /**
     * Scope for shipped orders.
     */
    public function scopeShipped(Builder $query): Builder
    {
        return $query->where('status', 'shipped');
    }

    /**
     * Mark order as paid.
     */
    public function markAsPaid(?string $channel = null, ?string $transactionId = null): self
    {
        $this->update([
            'status' => 'processing',
            'payment_status' => 'paid',
            'payment_channel' => $channel ?: $this->payment_channel,
            'midtrans_transaction_id' => $transactionId ?: $this->midtrans_transaction_id,
            'paid_at' => Carbon::now(),
        ]);

        return $this;
    }

    /**
     * Mark order as shipped with tracking number.
     */
    public function markAsShipped(string $trackingNumber): self
    {
        $this->update([
            'status' => 'shipped',
            'tracking_number' => $trackingNumber,
            'shipped_at' => Carbon::now(),
        ]);

        return $this;
    }

    /**
     * Mark order as completed.
     */
    public function markAsCompleted(): self
    {
        $this->update([
            'status' => 'completed',
            'completed_at' => Carbon::now(),
        ]);

        return $this;
    }

    /**
     * Mark order as cancelled.
     */
    public function markAsCancelled(): self
    {
        $this->update([
            'status' => 'cancelled',
            'payment_status' => 'cancelled',
            'cancelled_at' => Carbon::now(),
        ]);

        return $this;
    }

    /**
     * Helper to generate unique order number.
     */
    public static function generateOrderNumber(): string
    {
        $prefix = 'INV/' . date('Ymd') . '/TK/';
        $random = mt_rand(100000, 999999);
        return $prefix . $random;
    }

    /**
     * Helper to generate unique tracking number for shipping.
     */
    public static function generateTrackingNumber(string $expeditionCode = 'TRK'): string
    {
        $cleanCode = strtoupper(preg_replace('/[^A-Z0-9]/', '', $expeditionCode));
        $prefix = !empty($cleanCode) ? substr($cleanCode, 0, 4) : 'TRK';
        $datePart = date('Ymd');
        $randomPart = strtoupper(substr(bin2hex(random_bytes(4)), 0, 6));

        return "{$prefix}-{$datePart}-{$randomPart}";
    }
}

