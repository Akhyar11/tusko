<?php

namespace App\Models;

use App\Models\Concerns\HasIdOrCodeLookup;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class StockOpname extends Model
{
    use HasFactory;
    use HasIdOrCodeLookup;

    protected string $idOrCodeColumn = 'opname_number';

    protected $fillable = [
        'opname_number',
        'warehouse_id',
        'purchase_order_id',
        'goods_receiving_id',
        'status',
        'conducted_by',
        'approved_by',
        'notes',
        'conducted_at',
        'approved_at',
    ];

    protected $casts = [
        'conducted_at' => 'datetime',
        'approved_at' => 'datetime',
    ];

    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function purchaseOrder(): BelongsTo
    {
        return $this->belongsTo(PurchaseOrder::class);
    }

    public function goodsReceiving(): BelongsTo
    {
        return $this->belongsTo(GoodsReceivingNote::class, 'goods_receiving_id');
    }

    public function conductor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'conducted_by');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function items(): HasMany
    {
        return $this->hasMany(StockOpnameItem::class);
    }
}
