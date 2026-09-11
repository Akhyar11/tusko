<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class OrderStatus extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'name',
        'badge_color',
        'sort_order',
        'is_terminal',
        'allows_cancellation',
    ];

    protected $casts = [
        'sort_order' => 'integer',
        'is_terminal' => 'boolean',
        'allows_cancellation' => 'boolean',
    ];

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class, 'status_id');
    }
}
