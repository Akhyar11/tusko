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
        Schema::table('shipping_addresses', function (Blueprint $table) {
            if (!Schema::hasColumn('shipping_addresses', 'latitude')) {
                $table->decimal('latitude', 10, 7)->nullable()->after('notes');
            }
            if (!Schema::hasColumn('shipping_addresses', 'longitude')) {
                $table->decimal('longitude', 10, 7)->nullable()->after('latitude');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('shipping_addresses', function (Blueprint $table) {
            if (Schema::hasColumn('shipping_addresses', 'latitude')) {
                $table->dropColumn('latitude');
            }
            if (Schema::hasColumn('shipping_addresses', 'longitude')) {
                $table->dropColumn('longitude');
            }
        });
    }
};
