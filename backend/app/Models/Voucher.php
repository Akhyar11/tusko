<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Voucher extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'title',
        'description',
        'badge',
        'discount_type',
        'discount_value',
        'min_purchase',
        'max_discount',
        'expires_at',
        'is_active',
    ];

    protected $casts = [
        'discount_value' => 'float',
        'min_purchase' => 'float',
        'max_discount' => 'float',
        'expires_at' => 'date',
        'is_active' => 'boolean',
    ];

    /**
     * Scope only active vouchers that have not expired.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true)
            ->where(function ($q) {
                $q->whereNull('expires_at')
                  ->orWhere('expires_at', '>=', now()->toDateString());
            });
    }
}
