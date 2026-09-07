<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'category_id',
        'name',
        'slug',
        'sku',
        'description',
        'price',
        'cost_price',
        'stock',
        'stock_minimum',
        'min_stock',
        'warehouse_bin',
        'last_restock_at',
        'image_url',
        'active',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'cost_price' => 'decimal:2',
        'stock' => 'integer',
        'stock_minimum' => 'integer',
        'min_stock' => 'integer',
        'last_restock_at' => 'datetime',
        'active' => 'boolean',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function images(): HasMany
    {
        return $this->hasMany(ProductImage::class)->orderBy('sort_order');
    }

    public function stockMutations(): HasMany
    {
        return $this->hasMany(StockMutation::class)->latest();
    }

    public function isLowStock(): bool
    {
        $min = $this->stock_minimum ?: ($this->min_stock ?: 5);
        return $this->stock <= $min && $this->stock > 0;
    }

    public function isOutOfStock(): bool
    {
        return $this->stock <= 0;
    }

    public function getEffectiveStockMinimumAttribute(): int
    {
        return $this->stock_minimum ?: ($this->min_stock ?: 5);
    }

    /**
     * Scope produk dengan stok menipis (di bawah atau sama dengan batas minimum, > 0).
     */
    public function scopeLowStock($query)
    {
        return $query->where('stock', '>', 0)
            ->where(function ($q) {
                $q->whereColumn('stock', '<=', 'stock_minimum')
                  ->orWhereColumn('stock', '<=', 'min_stock');
            });
    }

    /**
     * Scope produk dengan stok habis (0 atau negatif).
     */
    public function scopeOutOfStock($query)
    {
        return $query->where('stock', '<=', 0);
    }

    /**
     * Scope produk dengan stok aman (di atas batas minimum).
     */
    public function scopeSafeStock($query)
    {
        return $query->where(function ($q) {
            $q->whereColumn('stock', '>', 'stock_minimum')
              ->where(function ($sub) {
                  $sub->whereNull('min_stock')
                      ->orWhereColumn('stock', '>', 'min_stock');
              });
        });
    }
}
