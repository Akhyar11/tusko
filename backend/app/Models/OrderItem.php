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
        'product_name',
        'product_slug',
        'product_image',
        'product_price',
        'product_weight',
        'quantity',
        'subtotal',
        'notes',
    ];

    protected $casts = [
        'product_price' => 'float',
        'product_weight' => 'float',
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
}
