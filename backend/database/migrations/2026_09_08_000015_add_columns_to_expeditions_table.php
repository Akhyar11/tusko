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
        Schema::table('expeditions', function (Blueprint $table) {
            if (!Schema::hasColumn('expeditions', 'is_default')) {
                $table->boolean('is_default')->default(false)->index();
            }
            if (!Schema::hasColumn('expeditions', 'rate_type')) {
                $table->string('rate_type', 20)->default('per_kg');
            }
            if (!Schema::hasColumn('expeditions', 'cod_support')) {
                $table->boolean('cod_support')->default(false);
            }
            if (!Schema::hasColumn('expeditions', 'service_grade')) {
                $table->string('service_grade', 50)->nullable();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('expeditions', function (Blueprint $table) {
            $columns = [];
            if (Schema::hasColumn('expeditions', 'is_default')) {
                $columns[] = 'is_default';
            }
            if (Schema::hasColumn('expeditions', 'rate_type')) {
                $columns[] = 'rate_type';
            }
            if (Schema::hasColumn('expeditions', 'cod_support')) {
                $columns[] = 'cod_support';
            }
            if (Schema::hasColumn('expeditions', 'service_grade')) {
                $columns[] = 'service_grade';
            }

            if (!empty($columns)) {
                $table->dropColumn($columns);
            }
        });
    }
};
