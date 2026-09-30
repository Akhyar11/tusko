<?php

namespace App\Console\Commands;

use App\Models\Shipment;
use App\Services\BiteshipTrackingService;
use Illuminate\Console\Command;

/**
 * T30.3 / T10.4 — Sinkronisasi pelacakan kiriman Biteship yang masih berjalan.
 */
class SyncShipmentTrackings extends Command
{
    protected $signature = 'shipments:sync-tracking';

    protected $description = 'Sinkronkan status & riwayat pelacakan kiriman Biteship yang belum selesai.';

    public function handle(BiteshipTrackingService $tracking): int
    {
        $shipments = Shipment::query()
            ->where('provider', 'biteship')
            ->whereNotNull('provider_order_id')
            ->whereNotIn('status', ['delivered', 'returned'])
            ->get();

        $synced = 0;

        foreach ($shipments as $shipment) {
            if ($tracking->syncShipment($shipment) >= 0) {
                $synced++;
            }
        }

        $this->info("Sinkronisasi pelacakan selesai: {$synced} kiriman diproses.");

        return self::SUCCESS;
    }
}
