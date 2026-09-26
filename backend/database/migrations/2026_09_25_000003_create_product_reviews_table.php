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
        if (!Schema::hasTable('product_reviews')) {
            Schema::create('product_reviews', function (Blueprint $table) {
                $table->id();
                $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
                $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
                $table->foreignId('order_id')->constrained('orders')->cascadeOnDelete();
                $table->unsignedTinyInteger('rating'); // 1..5
                $table->string('title')->nullable();
                $table->text('comment')->nullable();
                $table->boolean('is_approved')->default(false);
                $table->timestamp('approved_at')->nullable();
                $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();

                $table->unique(['product_id', 'order_id']);
                $table->index(['product_id', 'is_approved']);
            });
        }

        if (Schema::hasTable('products') && !Schema::hasColumn('products', 'rating_count')) {
            Schema::table('products', function (Blueprint $table) {
                $table->unsignedInteger('rating_count')->default(0)->after('rating');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('products') && Schema::hasColumn('products', 'rating_count')) {
            Schema::table('products', function (Blueprint $table) {
                $table->dropColumn('rating_count');
            });
        }

        Schema::dropIfExists('product_reviews');
    }
};
