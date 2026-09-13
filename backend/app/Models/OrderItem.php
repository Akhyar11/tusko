<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_id',
        'product_id',
        'product_variant_id',
        'product_name',
        'product_slug',
        'product_image',
        'product_price',
        'product_weight',
        'unit_cogs',
        'quantity',
        'subtotal',
        'notes',
    ];

    protected $casts = [
        'product_price' => 'float',
        'product_weight' => 'float',
        'unit_cogs' => 'float',
        'quantity' => 'integer',
        'subtotal' => 'float',
    ];

    /**
     * Order relation.
     */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    /**
     * Product relation.
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * Variant relation.
     */
    public function variant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class, 'product_variant_id');
    }
}
