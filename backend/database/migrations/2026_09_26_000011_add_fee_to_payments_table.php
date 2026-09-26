<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * T07.7 — kolom fee gateway pada `payments`.
     */
    public function up(): void
    {
        if (Schema::hasTable('payments') && !Schema::hasColumn('payments', 'fee')) {
            Schema::table('payments', function (Blueprint $table) {
                $table->decimal('fee', 14, 2)->default(0)->after('amount');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('payments') && Schema::hasColumn('payments', 'fee')) {
            Schema::table('payments', function (Blueprint $table) {
                $table->dropColumn('fee');
            });
        }
    }
};
