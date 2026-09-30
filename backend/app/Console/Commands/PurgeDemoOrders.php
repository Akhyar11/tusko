<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Hapus seluruh pesanan beserta data terkait (untuk membersihkan data demo).
 *
 * Aman dijalankan berulang; meminta konfirmasi kecuali `--force` diberikan.
 */
class PurgeDemoOrders extends Command
{
    protected $signature = 'demo:purge-orders {--force : Jalankan tanpa konfirmasi}';

    protected $description = 'Hapus seluruh pesanan + data terkait (order_items, payments, shipments, dll) — pembersihan data demo.';

    public function handle(): int
    {
        $count = DB::table('orders')->count();

        if ($count === 0) {
            $this->info('Tidak ada pesanan untuk dihapus.');

            return self::SUCCESS;
        }

        if (! $this->option('force')
            && ! $this->confirm("Hapus {$count} pesanan beserta data terkait? Tindakan ini tidak dapat dibatalkan.", false)) {
            $this->warn('Dibatalkan. Tidak ada data yang dihapus.');

            return self::SUCCESS;
        }

        DB::transaction(function () {
            $orderIds = DB::table('orders')->pluck('id');

            $returnIds = DB::table('returns')->whereIn('order_id', $orderIds)->pluck('id');
            DB::table('return_items')->whereIn('return_id', $returnIds)->delete();
            DB::table('returns')->whereIn('order_id', $orderIds)->delete();

            $shipmentIds = DB::table('shipments')->whereIn('order_id', $orderIds)->pluck('id');
            DB::table('shipment_trackings')->whereIn('shipment_id', $shipmentIds)->delete();
            DB::table('shipments')->whereIn('order_id', $orderIds)->delete();

            foreach ([
                'product_reviews',
                'voucher_usages',
                'email_logs',
                'stock_reservations',
                'payments',
                'transactions',
                'order_status_histories',
                'order_items',
            ] as $table) {
                DB::table($table)->whereIn('order_id', $orderIds)->delete();
            }

            DB::table('orders')->whereIn('id', $orderIds)->delete();
        });

        $this->info("Berhasil menghapus {$count} pesanan demo beserta data terkait.");

        return self::SUCCESS;
    }
}
