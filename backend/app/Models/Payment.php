<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Payment — sumber kebenaran pembayaran (D8).
 */
class Payment extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_id',
        'method',
        'channel',
        'amount',
        'status',
        'reference',
        'paid_at',
        'proof',
        'notes',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'paid_at' => 'datetime',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }
}
