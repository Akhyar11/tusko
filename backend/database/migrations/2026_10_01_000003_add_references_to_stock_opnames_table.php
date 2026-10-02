<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('stock_opnames', function (Blueprint $table) {
            if (! Schema::hasColumn('stock_opnames', 'purchase_order_id')) {
                $table->foreignId('purchase_order_id')->nullable()->after('warehouse_id')
                    ->constrained('purchase_orders')->nullOnDelete();
            }
            if (! Schema::hasColumn('stock_opnames', 'goods_receiving_id')) {
                $table->foreignId('goods_receiving_id')->nullable()->after('purchase_order_id')
                    ->constrained('goods_receiving_notes')->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('stock_opnames', function (Blueprint $table) {
            if (Schema::hasColumn('stock_opnames', 'goods_receiving_id')) {
                $table->dropConstrainedForeignId('goods_receiving_id');
            }
            if (Schema::hasColumn('stock_opnames', 'purchase_order_id')) {
                $table->dropConstrainedForeignId('purchase_order_id');
            }
        });
    }
};
