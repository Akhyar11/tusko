<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SizeChart extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'category_id',
        'is_default',
        'is_active',
        'sort_order',
    ];

    protected $casts = [
        'is_default' => 'boolean',
        'is_active' => 'boolean',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function rows(): HasMany
    {
        return $this->hasMany(SizeChartRow::class)->orderBy('sort_order')->orderBy('id');
    }

    /**
     * Resolusi chart untuk sebuah kategori: chart kategori (aktif) → chart default
     * (aktif) → chart aktif pertama. Null bila tak ada chart aktif sama sekali.
     */
    public static function resolveForCategory(?int $categoryId): ?self
    {
        if ($categoryId) {
            $byCategory = static::query()
                ->where('is_active', true)
                ->where('category_id', $categoryId)
                ->orderBy('sort_order')
                ->first();
            if ($byCategory) {
                return $byCategory;
            }
        }

        return static::query()
            ->where('is_active', true)
            ->orderByDesc('is_default')
            ->orderBy('sort_order')
            ->first();
    }
}
