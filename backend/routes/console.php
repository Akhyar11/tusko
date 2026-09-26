<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Infrastruktur antrean (T30.1): pembersihan berkala data queue.
Schedule::command('queue:prune-failed --hours=168')->weekly();
Schedule::command('queue:prune-batches --hours=48')->daily();

// T30.2: auto-cancel pesanan kedaluwarsa + lepaskan reservasi stok.
Schedule::command('orders:cancel-expired')->everyTenMinutes();

// T21.4d: sinkronisasi master kurir & layanan dari agregator (harian).
Schedule::command('expeditions:sync')->dailyAt('02:00');
