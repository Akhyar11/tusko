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
        if (Schema::hasTable('products') && !Schema::hasColumn('products', 'available_for_sale_stock')) {
            Schema::table('products', function (Blueprint $table) {
                $table->integer('available_for_sale_stock')->nullable()->after('stock');
            });
        }

        if (Schema::hasTable('product_variants') && !Schema::hasColumn('product_variants', 'available_for_sale_stock')) {
            Schema::table('product_variants', function (Blueprint $table) {
                $table->integer('available_for_sale_stock')->nullable()->after('stock');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('products') && Schema::hasColumn('products', 'available_for_sale_stock')) {
            Schema::table('products', function (Blueprint $table) {
                $table->dropColumn('available_for_sale_stock');
            });
        }

        if (Schema::hasTable('product_variants') && Schema::hasColumn('product_variants', 'available_for_sale_stock')) {
            Schema::table('product_variants', function (Blueprint $table) {
                $table->dropColumn('available_for_sale_stock');
            });
        }
    }
};
