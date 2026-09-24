<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Integration extends Model
{
    use HasFactory;

    protected $fillable = [
        'key',
        'value',
        'group',
        'is_secret',
    ];

    protected $casts = [
        'value' => 'encrypted',
        'is_secret' => 'boolean',
    ];
}
