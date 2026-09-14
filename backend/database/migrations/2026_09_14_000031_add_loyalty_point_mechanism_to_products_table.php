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
            if (!Schema::hasColumn('products', 'point_type')) {
                $table->string('point_type', 20)->default('manual')->after('price');
            }
            if (!Schema::hasColumn('products', 'point_value')) {
                $table->decimal('point_value', 10, 2)->default(0.00)->after('point_type');
            }
        });

        Schema::table('order_items', function (Blueprint $table) {
            if (!Schema::hasColumn('order_items', 'points_earned')) {
                $table->unsignedInteger('points_earned')->default(0)->after('subtotal');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $columnsToDrop = [];
            if (Schema::hasColumn('products', 'point_value')) {
                $columnsToDrop[] = 'point_value';
            }
            if (Schema::hasColumn('products', 'point_type')) {
                $columnsToDrop[] = 'point_type';
            }
            if (!empty($columnsToDrop)) {
                $table->dropColumn($columnsToDrop);
            }
        });

        Schema::table('order_items', function (Blueprint $table) {
            if (Schema::hasColumn('order_items', 'points_earned')) {
                $table->dropColumn('points_earned');
            }
        });
    }
};
