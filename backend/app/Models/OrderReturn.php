<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * OrderReturn — pengajuan retur & refund pesanan (T29).
 * Tabel `returns` (nama kelas `OrderReturn` karena `Return` kata kunci PHP).
 */
class OrderReturn extends Model
{
    use HasFactory;

    protected $table = 'returns';

    protected $fillable = [
        'return_number',
        'order_id',
        'user_id',
        'status',
        'reason',
        'notes',
        'refund_amount',
        'refund_method',
        'refund_reference',
        'requested_at',
        'approved_at',
        'approved_by',
        'rejected_at',
        'rejected_by',
        'rejection_reason',
        'refunded_at',
        'refunded_by',
    ];

    protected $casts = [
        'refund_amount' => 'decimal:2',
        'requested_at' => 'datetime',
        'approved_at' => 'datetime',
        'rejected_at' => 'datetime',
        'refunded_at' => 'datetime',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(ReturnItem::class, 'return_id');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function refunder(): BelongsTo
    {
        return $this->belongsTo(User::class, 'refunded_by');
    }
}
