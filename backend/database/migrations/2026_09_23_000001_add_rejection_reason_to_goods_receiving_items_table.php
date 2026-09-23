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
        if (Schema::hasTable('goods_receiving_items') && !Schema::hasColumn('goods_receiving_items', 'rejection_reason')) {
            Schema::table('goods_receiving_items', function (Blueprint $table) {
                $table->string('rejection_reason')->nullable()->after('rejected_quantity');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('goods_receiving_items') && Schema::hasColumn('goods_receiving_items', 'rejection_reason')) {
            Schema::table('goods_receiving_items', function (Blueprint $table) {
                $table->dropColumn('rejection_reason');
            });
        }
    }
};
