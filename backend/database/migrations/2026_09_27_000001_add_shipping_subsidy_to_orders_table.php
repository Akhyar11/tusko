<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * T06.10 — biaya kurir yang DITANGGUNG merchant saat gratis ongkir
     * (dasar jurnal beban promosi). `shipping_cost` tetap 0 bagi pembeli.
     */
    public function up(): void
    {
        if (Schema::hasTable('orders') && !Schema::hasColumn('orders', 'shipping_subsidy')) {
            Schema::table('orders', function (Blueprint $table) {
                $table->decimal('shipping_subsidy', 14, 2)->default(0)->after('shipping_cost');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('orders') && Schema::hasColumn('orders', 'shipping_subsidy')) {
            Schema::table('orders', function (Blueprint $table) {
                $table->dropColumn('shipping_subsidy');
            });
        }
    }
};
