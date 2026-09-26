<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * T06.6 — kolom gudang pemenuh (alokasi D1) pada `orders`.
     */
    public function up(): void
    {
        if (Schema::hasTable('orders') && !Schema::hasColumn('orders', 'warehouse_id')) {
            Schema::table('orders', function (Blueprint $table) {
                $table->foreignId('warehouse_id')->nullable()->after('expedition_service_id')
                    ->constrained('warehouses')->nullOnDelete();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('orders') && Schema::hasColumn('orders', 'warehouse_id')) {
            Schema::table('orders', function (Blueprint $table) {
                $table->dropConstrainedForeignId('warehouse_id');
            });
        }
    }
};
