<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

/*
|--------------------------------------------------------------------------
| T30 — Penjadwalan Scheduler (Shared Hosting / Hostinger)
|--------------------------------------------------------------------------
| Hosting shared tidak memiliki Supervisor/daemon permanen. Seluruh worker
| antrean & tugas pemeliharaan dijalankan melalui `php artisan schedule:run`
| yang dipicu Cron Job server setiap 1 menit. Flag worker dibatasi
| (`--max-time`/`--memory`) agar proses tidak dimatikan paksa oleh server,
| dan `withoutOverlapping()` mencegah penumpukan proses saat antrean panjang.
*/

$logScheduleResult = function (string $name, bool $ok): void {
    if ($ok) {
        Log::info("Scheduler [{$name}] selesai dieksekusi.");
    } else {
        Log::warning("Scheduler [{$name}] gagal dieksekusi.");
    }
};

// 1. Worker antrean database (memproses webhook Biteship, email, dsb.).
//    `--stop-when-empty`: keluar bersih + melepas memori saat antrean kosong.
//    `withoutOverlapping(10)`: lock dilepas setelah 10 menit bila worker macet.
$queueWorker = 'queue:work database --stop-when-empty --max-time=50 --memory=128 --tries=3';

Schedule::command($queueWorker)
    ->everyMinute()
    ->withoutOverlapping(10)
    ->runInBackground()
    ->onSuccess(fn () => $logScheduleResult('queue:work', true))
    ->onFailure(fn () => $logScheduleResult('queue:work', false));

// 2. Pembersihan riwayat antrean gagal (> 7 hari) & batch lama (T30.1).
Schedule::command('queue:prune-failed --hours=168')
    ->weekly()
    ->withoutOverlapping()
    ->onSuccess(fn () => $logScheduleResult('queue:prune-failed', true))
    ->onFailure(fn () => $logScheduleResult('queue:prune-failed', false));

Schedule::command('queue:prune-batches --hours=48')
    ->daily()
    ->withoutOverlapping()
    ->onSuccess(fn () => $logScheduleResult('queue:prune-batches', true))
    ->onFailure(fn () => $logScheduleResult('queue:prune-batches', false));

// 3. T30.2: auto-cancel pesanan kedaluwarsa + lepaskan reservasi stok.
Schedule::command('orders:cancel-expired')
    ->everyTenMinutes()
    ->withoutOverlapping();

// 4. T21.4d: sinkronisasi master kurir & layanan dari agregator (harian).
Schedule::command('expeditions:sync')
    ->dailyAt('02:00')
    ->withoutOverlapping();

// 5. T30.3: kedaluwarsakan poin loyalitas (harian).
Schedule::command('loyalty:expire-points')
    ->dailyAt('03:00')
    ->withoutOverlapping();

// 6. T30.3/T10.4: sinkron pelacakan kiriman Biteship yang belum selesai.
Schedule::command('shipments:sync-tracking')
    ->hourly()
    ->withoutOverlapping();

// 7. Fee per transaksi Midtrans via SNAP (otomatis, tanpa input manual admin).
Schedule::command('midtrans:sync-fees')
    ->hourly()
    ->withoutOverlapping();
