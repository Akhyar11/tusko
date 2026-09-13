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
        // 1. Tabel Kustomisasi Label Respons Checkpoint Pelacakan KiriminAja
        if (!Schema::hasTable('tracking_checkpoint_labels')) {
            Schema::create('tracking_checkpoint_labels', function (Blueprint $table) {
                $table->id();
                $table->string('stage_key')->unique(); // 'at_warehouse', 'courier_pickup', 'transit_hub', 'out_for_delivery', 'delivered'
                $table->string('stage_name'); // Nama tahapan
                $table->string('custom_label'); // Label kustom admin (misal: "Paket di Gudang Pusat Tusko")
                $table->text('description_template')->nullable(); // Template deskripsi dinamis
                $table->integer('sort_order')->default(0);
                $table->boolean('is_active')->default(true);
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tracking_checkpoint_labels');
    }
};
