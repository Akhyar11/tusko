<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Shipment extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_id',
        'expedition_service_id',
        'waybill_number',
        'status',
        'thermal_label_url',
        'pickup_time',
        'delivered_time',
    ];

    protected $casts = [
        'pickup_time' => 'datetime',
        'delivered_time' => 'datetime',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function service(): BelongsTo
    {
        return $this->belongsTo(ExpeditionService::class, 'expedition_service_id');
    }

    public function trackings(): HasMany
    {
        return $this->hasMany(ShipmentTracking::class);
    }
}
