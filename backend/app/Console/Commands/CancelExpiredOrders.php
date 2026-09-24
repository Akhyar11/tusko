<?php

namespace App\Console\Commands;

use App\Models\Order;
use App\Models\OrderStatus;
use App\Models\OrderStatusHistory;
use App\Services\StockReservationService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class CancelExpiredOrders extends Command
{
    protected $signature = 'orders:cancel-expired {--limit=500}';

    protected $description = 'Batalkan pesanan pending kedaluwarsa & lepaskan reservasi stok.';

    public function handle(StockReservationService $reservations): int
    {
        $orders = Order::query()
            ->where('status', 'pending')
            ->where('payment_status', '!=', 'paid')
            ->whereNotNull('expires_at')
            ->where('expires_at', '<', now())
            ->limit((int) $this->option('limit'))
            ->get();

        $count = 0;

        foreach ($orders as $order) {
            DB::transaction(function () use ($order, $reservations) {
                // Lepaskan reservasi stok terlebih dahulu (bila ada).
                $reservations->release($order);

                $order->update([
                    'status' => 'cancelled',
                    'payment_status' => 'cancelled',
                    'cancelled_at' => now(),
                ]);

                OrderStatusHistory::create([
                    'order_id' => $order->id,
                    'status_id' => OrderStatus::where('code', 'cancelled')->value('id'),
                    'status_code' => 'cancelled',
                    'actor_type' => 'system',
                    'actor_id' => null,
                    'notes' => 'Auto-cancel: batas waktu pembayaran terlewat.',
                ]);
            });

            $count++;
        }

        $this->info("Pesanan kedaluwarsa dibatalkan: {$count}");

        return self::SUCCESS;
    }
}
