<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'category_id',
        'vendor_id',
        'name',
        'slug',
        'sku',
        'description',
        'price',
        'original_price',
        'cost_price',
        'stock',
        'stock_minimum',
        'min_stock',
        'weight',
        'warehouse_bin',
        'last_restock_at',
        'image_url',
        'active',
        'status',
        'specifications',
        'variants',
        'rating',
        'rating_count',
        'sold_count',
        'point_type',
        'point_value',
    ];

    protected $attributes = [
        'stock' => 0,
        'stock_minimum' => 5,
        'min_stock' => 5,
        'weight' => 500,
        'active' => true,
        'status' => 'active',
        'rating' => 5.00,
        'sold_count' => 0,
        'point_type' => 'manual',
        'point_value' => 0.00,
    ];

    protected $casts = [
        'vendor_id' => 'integer',
        'price' => 'decimal:2',
        'original_price' => 'decimal:2',
        'cost_price' => 'decimal:2',
        'stock' => 'integer',
        'stock_minimum' => 'integer',
        'min_stock' => 'integer',
        'weight' => 'integer',
        'last_restock_at' => 'datetime',
        'active' => 'boolean',
        'specifications' => 'array',
        'variants' => 'array',
        'rating' => 'decimal:2',
        'sold_count' => 'integer',
        'point_type' => 'string',
        'point_value' => 'decimal:2',
    ];

    protected $appends = [
        'discount_percentage',
        'profit_margin',
        'effective_stock_minimum',
        'reward_points',
    ];

    protected static function booted(): void
    {
        static::saved(function ($product) {
            if (!empty($product->category_id)) {
                $product->categories()->syncWithoutDetaching([$product->category_id]);
            }
        });

        static::deleting(function ($product) {
            // Bersihkan file foto utama dari storage
            $rawImage = $product->getRawOriginal('image_url');
            if (!empty($rawImage)) {
                \App\Services\FileStorageService::delete($rawImage);
            }

            // Bersihkan seluruh foto galeri dari storage
            foreach ($product->images as $galleryImg) {
                $rawGallery = $galleryImg->getRawOriginal('image_url');
                if (!empty($rawGallery)) {
                    \App\Services\FileStorageService::delete($rawGallery);
                }
            }
        });
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(Vendor::class);
    }

    public function recalculateTotalStockFromVariants(): int
    {
        if ($this->variants()->exists()) {
            $total = (int) $this->variants()->sum('stock');
            $this->update(['stock' => $total]);
            return $total;
        }
        return (int) $this->stock;
    }

    public function categories(): BelongsToMany
    {
        return $this->belongsToMany(Category::class, 'category_product');
    }

    public function images(): HasMany
    {
        return $this->hasMany(ProductImage::class);
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(ProductReview::class);
    }

    public function approvedReviews(): HasMany
    {
        return $this->hasMany(ProductReview::class)->where('is_approved', true);
    }

    public function stockMutations(): HasMany
    {
        return $this->hasMany(StockMutation::class)->latest();
    }

    public function variants(): HasMany
    {
        return $this->hasMany(ProductVariant::class);
    }

    public function inventoryBalances(): HasMany
    {
        return $this->hasMany(InventoryBalance::class);
    }

    public function cogsHistories(): HasMany
    {
        return $this->hasMany(CogsHistory::class);
    }

    public function cartItems(): HasMany
    {
        return $this->hasMany(CartItem::class);
    }

    public function orderItems(): HasMany
    {
        return $this->hasMany(OrderItem::class);
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

    public function getImageUrlAttribute($value): ?string
    {
        return \App\Services\FileStorageService::url($value);
    }

    public function getEffectiveStockMinimumAttribute(): int
    {
        return $this->stock_minimum ?: ($this->min_stock ?: 5);
    }

    /**
     * Hitung persentase diskon dari original_price dan price saat ini.
     */
    public function getDiscountPercentageAttribute(): int
    {
        if (!empty($this->original_price) && $this->original_price > $this->price) {
            return (int) round((($this->original_price - $this->price) / $this->original_price) * 100);
        }
        return 0;
    }

    /**
     * Hitung margin keuntungan dari cost_price dan price saat ini.
     */
    public function getProfitMarginAttribute(): float
    {
        if (!empty($this->cost_price)) {
            return (float) ($this->price - $this->cost_price);
        }
        return 0.0;
    }

    /**
     * Hitung perolehan poin reward per unit produk berdasarkan pengaturan manual atau persentase harga jual.
     */
    public function getRewardPointsAttribute(): int
    {
        return $this->calculatePointsEarned();
    }

    /**
     * Hitung poin loyalitas yang diperoleh pembeli untuk 1 unit produk.
     * Mendukung penentuan harga kustom saat checkout promo/diskon.
     */
    public function calculatePointsEarned(?float $customPrice = null): int
    {
        $effectivePrice = $customPrice !== null ? $customPrice : (float) $this->price;
        $type = $this->point_type ?? 'manual';
        $val = (float) ($this->point_value ?? 0);

        if ($val <= 0) {
            return 0;
        }

        if ($type === 'percentage') {
            // Persentase dari harga jual: misal 2% dari Rp 100.000 = 2.000 poin
            return (int) round(($effectivePrice * $val) / 100);
        }

        // Poin tetap (manual) per unit
        return (int) round($val);
    }

    /**
     * Cek apakah produk aktif untuk ditampilkan ke pembeli.
     */
    public function isPublished(): bool
    {
        return $this->active && $this->status === 'active';
    }

    /**
     * Scope produk aktif (hanya yang berstatus active).
     */
    public function scopeActive($query)
    {
        return $query->where('active', true)->where('status', 'active');
    }

    /**
     * Scope pencarian kata kunci berdasarkan nama, sku, atau deskripsi.
     */
    public function scopeSearch($query, ?string $term)
    {
        if (empty($term)) {
            return $query;
        }

        return $query->where(function ($q) use ($term) {
            $q->where('name', 'like', "%{$term}%")
              ->orWhere('sku', 'like', "%{$term}%")
              ->orWhere('description', 'like', "%{$term}%");
        });
    }

    /**
     * Scope filter berdasarkan kategori ID atau slug (mendukung kategori utama dan multi-kategori).
     */
    public function scopeByCategory($query, $categoryIdOrSlug)
    {
        if (empty($categoryIdOrSlug)) {
            return $query;
        }

        if (is_numeric($categoryIdOrSlug)) {
            return $query->where(function ($q) use ($categoryIdOrSlug) {
                $q->where('category_id', $categoryIdOrSlug)
                  ->orWhereHas('categories', function ($sub) use ($categoryIdOrSlug) {
                      $sub->where('categories.id', $categoryIdOrSlug);
                  });
            });
        }

        return $query->where(function ($q) use ($categoryIdOrSlug) {
            $q->whereHas('category', function ($sub) use ($categoryIdOrSlug) {
                $sub->where('slug', $categoryIdOrSlug);
            })->orWhereHas('categories', function ($sub) use ($categoryIdOrSlug) {
                $sub->where('slug', $categoryIdOrSlug);
            });
        });
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
