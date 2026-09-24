<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Job dasar reusable untuk seluruh antrean Tusko (T30.1).
 *
 * Menyediakan default retry/backoff/timeout dan hook logging saat job gagal,
 * sehingga job turunan (email, sinkron tracking, dsb.) konsisten.
 */
abstract class BaseJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Jumlah maksimum percobaan.
     */
    public int $tries = 3;

    /**
     * Batas waktu eksekusi (detik).
     */
    public int $timeout = 120;

    /**
     * Jeda antar percobaan (detik).
     *
     * @var array<int, int>
     */
    public array $backoff = [10, 30, 60];

    /**
     * Tangani kegagalan job secara terpusat.
     */
    public function failed(?Throwable $exception): void
    {
        Log::error('Queued job gagal: ' . static::class, [
            'exception' => $exception?->getMessage(),
        ]);
    }
}
