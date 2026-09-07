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
        'category',
        'etd',
        'base_cost',
        'cost',
        'is_free',
        'is_active',
        'badge',
        'description',
        'tracking_support',
    ];

    protected $casts = [
        'base_cost' => 'float',
        'cost' => 'float',
        'is_free' => 'boolean',
        'is_active' => 'boolean',
        'tracking_support' => 'boolean',
    ];

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
