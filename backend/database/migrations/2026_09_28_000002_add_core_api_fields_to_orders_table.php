<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * T07.9: kolom instruksi pembayaran Core API (VA/Mandiri/QRIS) + kedaluwarsa.
     */
    public function up(): void
    {
        if (!Schema::hasTable('orders')) {
            return;
        }

        Schema::table('orders', function (Blueprint $table) {
            if (!Schema::hasColumn('orders', 'midtrans_biller_code')) {
                $table->string('midtrans_biller_code')->nullable()->after('midtrans_payment_type');
            }
            if (!Schema::hasColumn('orders', 'midtrans_bill_key')) {
                $table->string('midtrans_bill_key')->nullable()->after('midtrans_biller_code');
            }
            if (!Schema::hasColumn('orders', 'midtrans_qr_string')) {
                $table->text('midtrans_qr_string')->nullable()->after('midtrans_bill_key');
            }
            if (!Schema::hasColumn('orders', 'midtrans_qr_url')) {
                $table->string('midtrans_qr_url')->nullable()->after('midtrans_qr_string');
            }
            if (!Schema::hasColumn('orders', 'payment_expires_at')) {
                $table->timestamp('payment_expires_at')->nullable()->after('paid_at');
            }
        });
    }

    public function down(): void
    {
        if (!Schema::hasTable('orders')) {
            return;
        }

        Schema::table('orders', function (Blueprint $table) {
            foreach (['midtrans_biller_code', 'midtrans_bill_key', 'midtrans_qr_string', 'midtrans_qr_url', 'payment_expires_at'] as $column) {
                if (Schema::hasColumn('orders', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
