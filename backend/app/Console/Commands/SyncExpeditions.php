<?php

namespace App\Console\Commands;

use App\Services\ExpeditionSyncService;
use Illuminate\Console\Command;

class SyncExpeditions extends Command
{
    protected $signature = 'expeditions:sync';

    protected $description = 'Sinkronisasi master kurir & layanan dari agregator (KiriminAja)';

    public function handle(ExpeditionSyncService $service): int
    {
        if (! $service->isConfigured()) {
            $this->error('Integrasi pengiriman belum dikonfigurasi admin (base_url/api_key).');

            return self::FAILURE;
        }

        $result = $service->sync();

        $this->info("Sinkronisasi selesai: {$result['couriers']} kurir, {$result['services']} layanan.");

        return self::SUCCESS;
    }
}
