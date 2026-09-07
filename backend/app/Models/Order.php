<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_number',
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
        'paid_at',
        'shipped_at',
        'completed_at',
        'cancelled_at',
        'expires_at',
    ];

    protected $casts = [
        'subtotal' => 'float',
        'shipping_cost' => 'float',
        'insurance_cost' => 'float',
        'service_fee' => 'float',
        'discount_amount' => 'float',
        'grand_total' => 'float',
        'total_weight' => 'float',
        'paid_at' => 'datetime',
        'shipped_at' => 'datetime',
        'completed_at' => 'datetime',
        'cancelled_at' => 'datetime',
        'expires_at' => 'datetime',
        'payment_transferred_at' => 'datetime',
    ];

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
}
