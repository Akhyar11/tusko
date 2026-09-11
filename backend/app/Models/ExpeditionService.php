<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ExpeditionService extends Model
{
    use HasFactory;

    protected $fillable = [
        'expedition_id',
        'service_code',
        'service_name',
        'etd_days',
        'base_rate',
        'per_kg_rate',
        'is_active',
    ];

    protected $casts = [
        'base_rate' => 'decimal:2',
        'per_kg_rate' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public function expedition(): BelongsTo
    {
        return $this->belongsTo(Expedition::class);
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class, 'expedition_service_id');
    }
}
