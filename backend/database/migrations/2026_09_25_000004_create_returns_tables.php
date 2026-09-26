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
        if (!Schema::hasTable('returns')) {
            Schema::create('returns', function (Blueprint $table) {
                $table->id();
                $table->string('return_number')->unique(); // 'RTR/25092026/001'
                $table->foreignId('order_id')->constrained('orders')->cascadeOnDelete();
                $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
                $table->string('status')->default('pending'); // pending, approved, rejected, refunded
                $table->string('reason')->nullable();
                $table->text('notes')->nullable();
                $table->decimal('refund_amount', 14, 2)->default(0.00);
                $table->string('refund_method')->nullable(); // midtrans, manual
                $table->string('refund_reference')->nullable();
                $table->timestamp('requested_at')->nullable();
                $table->timestamp('approved_at')->nullable();
                $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamp('rejected_at')->nullable();
                $table->foreignId('rejected_by')->nullable()->constrained('users')->nullOnDelete();
                $table->string('rejection_reason')->nullable();
                $table->timestamp('refunded_at')->nullable();
                $table->foreignId('refunded_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();

                $table->index(['order_id', 'status']);
            });
        }

        if (!Schema::hasTable('return_items')) {
            Schema::create('return_items', function (Blueprint $table) {
                $table->id();
                $table->foreignId('return_id')->constrained('returns')->cascadeOnDelete();
                $table->foreignId('order_item_id')->constrained('order_items')->cascadeOnDelete();
                $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
                $table->foreignId('product_variant_id')->nullable()->constrained('product_variants')->nullOnDelete();
                $table->unsignedInteger('quantity');
                $table->string('reason')->nullable();
                $table->string('condition')->nullable();
                $table->decimal('refund_amount', 14, 2)->default(0.00);
                $table->boolean('restocked')->default(false);
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('return_items');
        Schema::dropIfExists('returns');
    }
};
