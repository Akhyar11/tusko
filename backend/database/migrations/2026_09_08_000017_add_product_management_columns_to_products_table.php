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
        Schema::table('products', function (Blueprint $table) {
            if (!Schema::hasColumn('products', 'weight')) {
                $table->integer('weight')->default(500)->after('stock_minimum')->comment('Berat produk dalam gram');
            }
            if (!Schema::hasColumn('products', 'original_price')) {
                $table->decimal('original_price', 12, 2)->nullable()->after('price')->comment('Harga sebelum diskon');
            }
            if (!Schema::hasColumn('products', 'status')) {
                $table->string('status', 30)->default('active')->after('active');
            }
            if (!Schema::hasColumn('products', 'specifications')) {
                $table->json('specifications')->nullable()->after('description');
            }
            if (!Schema::hasColumn('products', 'variants')) {
                $table->json('variants')->nullable()->after('specifications');
            }
            if (!Schema::hasColumn('products', 'rating')) {
                $table->decimal('rating', 3, 2)->default(5.00)->after('status');
            }
            if (!Schema::hasColumn('products', 'sold_count')) {
                $table->integer('sold_count')->default(0)->after('rating');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $columns = ['weight', 'original_price', 'status', 'specifications', 'variants', 'rating', 'sold_count'];
            foreach ($columns as $column) {
                if (Schema::hasColumn('products', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
