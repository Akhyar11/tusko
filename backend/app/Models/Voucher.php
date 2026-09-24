<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

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
        'quota',
        'used_count',
        'per_user_limit',
        'is_free_shipping',
        'stackable',
        'expires_at',
        'is_active',
    ];

    protected $casts = [
        'discount_value' => 'float',
        'min_purchase' => 'float',
        'max_discount' => 'float',
        'quota' => 'integer',
        'used_count' => 'integer',
        'per_user_limit' => 'integer',
        'is_free_shipping' => 'boolean',
        'stackable' => 'boolean',
        'expires_at' => 'date',
        'is_active' => 'boolean',
    ];

    /**
     * Cakupan target voucher (produk/varian/kategori).
     */
    public function targets(): HasMany
    {
        return $this->hasMany(VoucherTarget::class);
    }

    /**
     * Riwayat pemakaian voucher.
     */
    public function usages(): HasMany
    {
        return $this->hasMany(VoucherUsage::class);
    }

    /**
     * Apakah kuota voucher masih tersedia.
     */
    public function hasQuotaRemaining(): bool
    {
        return $this->quota === null || (int) $this->used_count < (int) $this->quota;
    }

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
