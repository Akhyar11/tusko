<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GoodsReceivingItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'grn_id',
        'product_id',
        'product_variant_id',
        'accepted_quantity',
        'rejected_quantity',
        'unit_cost',
        'notes',
    ];

    protected $casts = [
        'accepted_quantity' => 'integer',
        'rejected_quantity' => 'integer',
        'unit_cost' => 'decimal:2',
    ];

    public function receivingNote(): BelongsTo
    {
        return $this->belongsTo(GoodsReceivingNote::class, 'grn_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function variant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class, 'product_variant_id');
    }
}
