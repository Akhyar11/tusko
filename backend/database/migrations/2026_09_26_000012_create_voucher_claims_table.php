<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * T08.5 — tabel klaim voucher per pengguna (`voucher_claims`).
     */
    public function up(): void
    {
        if (! Schema::hasTable('voucher_claims')) {
            Schema::create('voucher_claims', function (Blueprint $table) {
                $table->id();
                $table->foreignId('voucher_id')->constrained('vouchers')->cascadeOnDelete();
                $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
                $table->timestamp('claimed_at')->nullable();
                $table->timestamps();

                $table->unique(['voucher_id', 'user_id']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('voucher_claims');
    }
};
