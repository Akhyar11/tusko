<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ShippingAddress extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'label',
        'recipient_name',
        'phone',
        'full_address',
        'district',
        'city',
        'province',
        'postal_code',
        'notes',
        'latitude',
        'longitude',
        'is_default',
    ];

    protected $casts = [
        'is_default' => 'boolean',
        'latitude' => 'float',
        'longitude' => 'float',
    ];

    /**
     * Virtual attribute alias for latitude (lat).
     */
    public function getLatAttribute(): ?float
    {
        return $this->latitude ? (float) $this->latitude : null;
    }

    /**
     * Virtual attribute alias for longitude (lng).
     */
    public function getLngAttribute(): ?float
    {
        return $this->longitude ? (float) $this->longitude : null;
    }

    /**
     * User owning this shipping address.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Mark this address as default for the owner, unsetting any previous defaults.
     */
    public function markAsDefault(): void
    {
        static::where('user_id', $this->user_id)
            ->where('id', '!=', $this->id)
            ->update(['is_default' => false]);

        $this->update(['is_default' => true]);
    }
}
