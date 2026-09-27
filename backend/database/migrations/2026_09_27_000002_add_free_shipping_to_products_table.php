<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * T06.9 — penanda gratis ongkir PER PRODUK. Bila salah satu item pesanan
     * bertanda ini, `shipping_cost` di-nihilkan server-side (biaya kurir
     * ditanggung merchant, tercatat di `orders.shipping_subsidy`).
     */
    public function up(): void
    {
        if (Schema::hasTable('products') && !Schema::hasColumn('products', 'free_shipping')) {
            Schema::table('products', function (Blueprint $table) {
                $table->boolean('free_shipping')->default(false)->after('warehouse_bin');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('products') && Schema::hasColumn('products', 'free_shipping')) {
            Schema::table('products', function (Blueprint $table) {
                $table->dropColumn('free_shipping');
            });
        }
    }
};
