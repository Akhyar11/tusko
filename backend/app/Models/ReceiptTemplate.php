<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ReceiptTemplate extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'paper_size',
        'barcode_type',
        'barcode_height',
        'address_font_size',
        'show_items_list',
        'show_buyer_notes',
        'show_sorting_code',
        'show_unboxing_notice',
        'show_cod_badge',
        'sender_name',
        'sender_phone',
        'sender_address',
        'footer_note',
        'courier_brand_tag',
        'is_default',
    ];

    protected $casts = [
        'show_items_list' => 'boolean',
        'show_buyer_notes' => 'boolean',
        'show_sorting_code' => 'boolean',
        'show_unboxing_notice' => 'boolean',
        'show_cod_badge' => 'boolean',
        'is_default' => 'boolean',
    ];

    /**
     * Get the active or default template, creating one if none exists.
     */
    public static function getActiveTemplate(): self
    {
        $template = self::where('is_default', true)->first();

        if (! $template) {
            $template = self::create(self::defaultConfiguration());
        }

        return $template;
    }

    /**
     * Default template configuration.
     */
    public static function defaultConfiguration(): array
    {
        return [
            'name' => 'Thermal Label Standard (100x150mm)',
            'paper_size' => '100x150',
            'barcode_type' => 'code128',
            'barcode_height' => 'medium',
            'address_font_size' => 'normal',
            'show_items_list' => true,
            'show_buyer_notes' => true,
            'show_sorting_code' => true,
            'show_unboxing_notice' => true,
            'show_cod_badge' => true,
            'sender_name' => 'Tusko Official Store (Fulfillment Hub)',
            'sender_phone' => '0811-9876-5432',
            'sender_address' => 'Gudang Logistik Sentral Tusko, Jl. Industri Raya No. 88, Pergudangan Daan Mogot, Jakarta Barat, 11840',
            'footer_note' => 'Wajib rekam video unboxing saat membuka paket untuk klaim garansi & retur resmi.',
            'courier_brand_tag' => 'Layanan Pengiriman Resmi E-Commerce Toko Online',
            'is_default' => true,
        ];
    }
}
