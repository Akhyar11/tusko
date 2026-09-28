<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * T38.6: indikator role yang boleh mengakses Panel Admin (roles.is_admin).
     */
    public function up(): void
    {
        if (Schema::hasTable('roles') && !Schema::hasColumn('roles', 'is_admin')) {
            Schema::table('roles', function (Blueprint $table) {
                $table->boolean('is_admin')->default(false)->after('is_system');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('roles') && Schema::hasColumn('roles', 'is_admin')) {
            Schema::table('roles', function (Blueprint $table) {
                $table->dropColumn('is_admin');
            });
        }
    }
};
