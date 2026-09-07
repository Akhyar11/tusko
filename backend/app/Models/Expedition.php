<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Expedition extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'code',
        'service',
        'service_grade',
        'category',
        'etd',
        'rate_type',
        'base_cost',
        'cost',
        'is_free',
        'is_active',
        'is_default',
        'badge',
        'description',
        'tracking_support',
        'cod_support',
    ];

    protected $casts = [
        'base_cost' => 'float',
        'cost' => 'float',
        'is_free' => 'boolean',
        'is_active' => 'boolean',
        'is_default' => 'boolean',
        'tracking_support' => 'boolean',
        'cod_support' => 'boolean',
    ];

    /**
     * Scope default expedition.
     */
    public function scopeDefault(Builder $query): Builder
    {
        return $query->where('is_default', true);
    }

    /**
     * Scope only active expeditions.
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope filter by category.
     */
    public function scopeByCategory(Builder $query, string $category): Builder
    {
        return $query->where('category', $category);
    }
}
