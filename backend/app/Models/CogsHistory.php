<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CogsHistory extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id',
        'product_variant_id',
        'source_type',
        'source_id',
        'incoming_quantity',
        'incoming_cost_per_unit',
        'previous_average_cogs',
        'new_average_cogs',
        'effective_date',
    ];

    protected $casts = [
        'incoming_quantity' => 'integer',
        'incoming_cost_per_unit' => 'decimal:2',
        'previous_average_cogs' => 'decimal:2',
        'new_average_cogs' => 'decimal:2',
        'effective_date' => 'datetime',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function variant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class, 'product_variant_id');
    }
}
