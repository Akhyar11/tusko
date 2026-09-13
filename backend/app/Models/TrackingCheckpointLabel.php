<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TrackingCheckpointLabel extends Model
{
    use HasFactory;

    protected $fillable = [
        'stage_key',
        'stage_name',
        'custom_label',
        'description_template',
        'sort_order',
        'is_active',
    ];

    protected $casts = [
        'sort_order' => 'integer',
        'is_active' => 'boolean',
    ];
}
