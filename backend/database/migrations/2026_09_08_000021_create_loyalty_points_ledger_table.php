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
        if (!Schema::hasTable('loyalty_points_ledger')) {
            Schema::create('loyalty_points_ledger', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
                $table->string('type'); // 'earn', 'redeem', 'adjustment', 'refund'
                $table->integer('points'); // Nilai positif untuk perolehan, negatif untuk penukaran
                $table->integer('balance_after'); // Saldo setelah mutasi poin
                $table->string('reference_type')->nullable(); // 'order', 'signup_bonus', 'review'
                $table->string('reference_id')->nullable(); // order_number / review_id
                $table->text('description')->nullable();
                $table->timestamp('expires_at')->nullable(); // Null = aktif seumur hidup
                $table->timestamps();

                $table->index(['user_id', 'created_at']);
                $table->index('reference_type');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('loyalty_points_ledger');
    }
};
