<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * T07.9: simpan order_id versi Midtrans (sanitasi karakter agar valid:
     * hanya dash/underscore/tilde/dot). Dipakai untuk mapping notifikasi webhook.
     */
    public function up(): void
    {
        if (Schema::hasTable('orders') && !Schema::hasColumn('orders', 'midtrans_order_id')) {
            Schema::table('orders', function (Blueprint $table) {
                $table->string('midtrans_order_id')->nullable()->after('order_number')->index();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('orders') && Schema::hasColumn('orders', 'midtrans_order_id')) {
            Schema::table('orders', function (Blueprint $table) {
                $table->dropColumn('midtrans_order_id');
            });
        }
    }
};
