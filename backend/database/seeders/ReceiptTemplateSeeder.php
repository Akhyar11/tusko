<?php

namespace Database\Seeders;

use App\Models\ReceiptTemplate;
use Illuminate\Database\Seeder;

class ReceiptTemplateSeeder extends Seeder
{
    /**
     * Seed template resi (label termal) default.
     */
    public function run(): void
    {
        ReceiptTemplate::firstOrCreate(
            ['name' => 'Thermal Label Standard (100x150mm)'],
            [
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
                'sender_address' => 'Gudang Pusat Tusko Jakarta, Jl. TB Simatupang No. 88, Cilandak, Jakarta Selatan, 12430',
                'footer_note' => 'Terima kasih telah berbelanja di Tusko. Barang dicek sebelum dikirim.',
                'courier_brand_tag' => 'Layanan Pengiriman Resmi E-Commerce Toko Online',
                'is_default' => true,
            ]
        );
    }
}
