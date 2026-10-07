<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PaymentMethod extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'name',
        'category',
        'type',
        'icon',
        'badge',
        'description',
        'fee_percent',
        'fee_fixed',
        'is_active',
        'sort_order',
    ];

    protected $casts = [
        'fee_percent' => 'float',
        'fee_fixed' => 'float',
        'is_active' => 'boolean',
        'sort_order' => 'integer',
    ];

    /**
     * Scope only active methods.
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope filter by type (midtrans|manual).
     */
    public function scopeOfType(Builder $query, string $type): Builder
    {
        return $query->where('type', $type);
    }

    /**
     * Hitung estimasi admin fee untuk nominal tertentu.
     */
    public function estimateFee(float $amount): float
    {
        return round(($amount * $this->fee_percent) / 100 + $this->fee_fixed, 2);
    }
}
