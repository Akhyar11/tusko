<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Kolom kode wilayah KiriminAja (T06.7) untuk integrasi tarif kurir asli.
     */
    public function up(): void
    {
        Schema::table('shipping_addresses', function (Blueprint $table) {
            if (! Schema::hasColumn('shipping_addresses', 'province_code')) {
                $table->string('province_code', 30)->nullable()->after('province');
            }
            if (! Schema::hasColumn('shipping_addresses', 'city_code')) {
                $table->string('city_code', 30)->nullable()->after('city');
            }
            if (! Schema::hasColumn('shipping_addresses', 'district_code')) {
                $table->string('district_code', 30)->nullable()->after('district');
            }
            if (! Schema::hasColumn('shipping_addresses', 'subdistrict_code')) {
                $table->string('subdistrict_code', 30)->nullable()->after('district_code');
            }
        });
    }

    public function down(): void
    {
        Schema::table('shipping_addresses', function (Blueprint $table) {
            foreach (['province_code', 'city_code', 'district_code', 'subdistrict_code'] as $column) {
                if (Schema::hasColumn('shipping_addresses', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
