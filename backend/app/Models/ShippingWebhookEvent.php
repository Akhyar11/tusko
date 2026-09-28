<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ShippingWebhookEvent extends Model
{
    use HasFactory;

    protected $fillable = [
        'provider',
        'event',
        'external_id',
        'payload',
        'payload_hash',
        'signature_valid',
        'status',
        'error_message',
        'processed_at',
    ];

    protected $casts = [
        'payload' => 'array',
        'signature_valid' => 'boolean',
        'processed_at' => 'datetime',
    ];
}
