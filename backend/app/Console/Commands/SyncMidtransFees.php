<?php

namespace App\Console\Commands;

use App\Models\Order;
use App\Models\Payment;
use App\Models\Transaction;
use App\Services\JournalMappingService;
use App\Services\MidtransSnapService;
use Illuminate\Console\Command;

/**
 * Sinkronisasi FEE per transaksi Midtrans dari SNAP Transaction History API.
 *
 * Menyesuaikan payments.fee, transactions.fee_deducted/net_amount, dan posting
 * jurnal biaya gateway — tanpa input manual admin.
 */
class SyncMidtransFees extends Command
{
    protected $signature = 'midtrans:sync-fees {--days=2 : Rentang hari ke belakang}';

    protected $description = 'Tarik fee per transaksi Midtrans (SNAP) dan catat ke kas & jurnal.';

    public function handle(MidtransSnapService $snap, JournalMappingService $journal): int
    {
        if (! $snap->isConfigured()) {
            $this->warn('SNAP belum dikonfigurasi (nonaktif / Client ID / Private Key kosong).');

            return self::SUCCESS;
        }

        $days = max(1, (int) $this->option('days'));
        $from = now('Asia/Jakarta')->subDays($days)->startOfDay()->format('Y-m-d\TH:i:sP');
        $to = now('Asia/Jakarta')->format('Y-m-d\TH:i:sP');

        $updated = 0;
        $scanned = 0;

        for ($page = 0; $page < 40; $page++) {
            $rows = $snap->transactionHistory($from, $to, $page);
            if (empty($rows)) {
                break;
            }

            foreach ($rows as $row) {
                $scanned++;
                $info = $row['additionalInfo'] ?? [];
                $type = strtoupper((string) ($info['type'] ?? ''));
                $status = strtoupper((string) ($info['status'] ?? ''));
                $partner = (string) ($info['partnerReferenceNo'] ?? ($row['partnerReferenceNo'] ?? ''));
                $fee = (float) ($info['fee']['value'] ?? 0);

                if ($type !== 'PAYMENT' || $partner === '' || $fee <= 0) {
                    continue;
                }

                $order = Order::where('order_number', $partner)->first();
                if (! $order) {
                    continue;
                }

                Payment::where('order_id', $order->id)
                    ->where('method', 'midtrans')
                    ->update(['fee' => $fee]);

                Transaction::where('order_id', $order->id)
                    ->where('category', 'order_payment')
                    ->update([
                        'fee_deducted' => $fee,
                        'net_amount' => max(0, (float) $order->grand_total - $fee),
                    ]);

                try {
                    $journal->postPaymentGatewayFee($order, $fee);
                    $updated++;
                } catch (\Throwable $e) {
                    $this->error("Gagal jurnal fee {$partner}: {$e->getMessage()}");
                }
            }
        }

        $this->info("Selesai. Dipindai: {$scanned} transaksi, fee disinkronkan: {$updated}.");

        return self::SUCCESS;
    }
}
