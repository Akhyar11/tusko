<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PaymentGatewaySetting extends Model
{
    use HasFactory;

    protected $table = 'payment_gateway_settings';

    protected $fillable = [
        'gateway_name',
        'payment_mode',
        'is_production',
        'merchant_id',
        'client_key',
        'server_key',
        'expiry_duration_hours',
        'enable_va',
        'enable_qris',
        'enable_cc',
        'is_active',
    ];

    protected $casts = [
        'is_production' => 'boolean',
        'expiry_duration_hours' => 'integer',
        'enable_va' => 'boolean',
        'enable_qris' => 'boolean',
        'enable_cc' => 'boolean',
        'is_active' => 'boolean',
    ];
}
