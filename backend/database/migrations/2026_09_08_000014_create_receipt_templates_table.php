<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('receipt_templates', function (Blueprint $table) {
            $table->id();
            $table->string('name')->default('Thermal Label Standard (100x150mm)');
            $table->string('paper_size')->default('100x150');
            $table->string('barcode_type')->default('code128');
            $table->string('barcode_height')->default('medium');
            $table->string('address_font_size')->default('normal');
            $table->boolean('show_items_list')->default(true);
            $table->boolean('show_buyer_notes')->default(true);
            $table->boolean('show_sorting_code')->default(true);
            $table->boolean('show_unboxing_notice')->default(true);
            $table->boolean('show_cod_badge')->default(true);
            $table->string('sender_name')->default('Tusko Official Store (Fulfillment Hub)');
            $table->string('sender_phone')->default('0811-9876-5432');
            $table->text('sender_address')->nullable();
            $table->text('footer_note')->nullable();
            $table->string('courier_brand_tag')->default('Layanan Pengiriman Resmi E-Commerce Toko Online');
            $table->boolean('is_default')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('receipt_templates');
    }
};
