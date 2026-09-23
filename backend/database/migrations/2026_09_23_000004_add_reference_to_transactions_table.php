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
        if (Schema::hasTable('transactions')) {
            Schema::table('transactions', function (Blueprint $table) {
                if (!Schema::hasColumn('transactions', 'reference_type')) {
                    $table->string('reference_type')->nullable()->after('order_id');
                }
                if (!Schema::hasColumn('transactions', 'reference_id')) {
                    $table->unsignedBigInteger('reference_id')->nullable()->after('reference_type');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('transactions')) {
            Schema::table('transactions', function (Blueprint $table) {
                if (Schema::hasColumn('transactions', 'reference_id')) {
                    $table->dropColumn('reference_id');
                }
                if (Schema::hasColumn('transactions', 'reference_type')) {
                    $table->dropColumn('reference_type');
                }
            });
        }
    }
};
