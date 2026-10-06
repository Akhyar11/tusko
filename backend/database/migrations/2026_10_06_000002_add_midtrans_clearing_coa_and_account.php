<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Tambah COA 1210: Kliring Payment Gateway Midtrans (Dana Customer)
        $coaId = DB::table('chart_of_accounts')->where('account_code', '1210')->value('id');
        if (!$coaId) {
            $coaId = DB::table('chart_of_accounts')->insertGetId([
                'account_code' => '1210',
                'account_name' => 'Kliring Payment Gateway Midtrans (Dana Customer)',
                'account_type' => 'asset',
                'description' => 'Rekening penampungan kliring dana pembayaran transaksi customer dari Midtrans',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // 2. Tambah Akun Rekening Midtrans Escrow di financial_accounts
        DB::table('financial_accounts')->updateOrInsert(
            ['account_number' => 'MIDTRANS-ESCROW'],
            [
                'account_name' => 'Midtrans Escrow (Dana Customer)',
                'bank_name' => 'Midtrans Payment Gateway',
                'account_holder' => 'PT Tusko Sportswear',
                'type' => 'bank',
                'chart_of_account_id' => $coaId,
                'opening_balance' => 0.00,
                'current_balance' => 0.00,
                'is_active' => true,
                'notes' => 'Rekening penampungan otomatis transaksi online customer via Midtrans (QRIS, VA, E-Wallet, CC). Belum ditransfer ke bank operasional.',
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('financial_accounts')->where('account_number', 'MIDTRANS-ESCROW')->delete();
        DB::table('chart_of_accounts')->where('account_code', '1210')->delete();
    }
};
