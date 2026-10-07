<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Master metode pembayaran (T07.12) — kode semantik ala Midtrans.
     */
    public function up(): void
    {
        Schema::create('payment_methods', function (Blueprint $table) {
            $table->id();
            $table->string('code', 64)->unique()->comment('Kode semantik kanal (mis. bca_va, qris, gopay, manual_bca)');
            $table->string('name');
            $table->string('category', 64)->default('Virtual Account');
            $table->string('type', 32)->default('midtrans')->comment('midtrans|manual');
            $table->string('icon', 64)->nullable();
            $table->string('badge', 64)->nullable();
            $table->text('description')->nullable();
            $table->decimal('fee_percent', 5, 2)->default(0)->comment('Admin fee persen dari nominal');
            $table->decimal('fee_fixed', 15, 2)->default(0)->comment('Admin fee nominal tetap (Rp)');
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index(['type', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_methods');
    }
};
