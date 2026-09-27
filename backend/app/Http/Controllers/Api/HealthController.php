<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Throwable;

/**
 * HealthController — pemeriksaan kesehatan sistem (T35.4).
 *
 * Mengembalikan status dependensi inti (database, cache, queue, storage) agar
 * monitoring/uptime probe dapat mendeteksi degradasi lebih awal.
 */
class HealthController extends Controller
{
    public function index(): JsonResponse
    {
        $checks = [
            'database' => $this->checkDatabase(),
            'cache' => $this->checkCache(),
            'queue' => $this->checkQueue(),
            'storage' => $this->checkStorage(),
        ];

        $healthy = collect($checks)->every(fn (array $check) => $check['status'] === 'ok');

        return response()->json([
            'status' => $healthy ? 'ok' : 'degraded',
            'checks' => $checks,
            'timestamp' => now()->toIso8601String(),
        ], $healthy ? 200 : 503);
    }

    /**
     * @return array{status: string, detail: ?string}
     */
    private function checkDatabase(): array
    {
        try {
            DB::select('SELECT 1');

            return ['status' => 'ok', 'detail' => config('database.default')];
        } catch (Throwable $e) {
            return ['status' => 'fail', 'detail' => class_basename($e)];
        }
    }

    /**
     * @return array{status: string, detail: ?string}
     */
    private function checkCache(): array
    {
        try {
            $key = 'health.check.' . Str::uuid();
            $value = (string) Str::uuid();

            Cache::put($key, $value, 10);
            $ok = Cache::get($key) === $value;
            Cache::forget($key);

            return ['status' => $ok ? 'ok' : 'fail', 'detail' => config('cache.default')];
        } catch (Throwable $e) {
            return ['status' => 'fail', 'detail' => class_basename($e)];
        }
    }

    /**
     * @return array{status: string, detail: ?string}
     */
    private function checkQueue(): array
    {
        $connection = (string) config('queue.default');
        $driver = (string) config("queue.connections.{$connection}.driver");

        // Driver `sync` mengeksekusi job seketika tanpa backend antrean.
        if ($driver === 'sync') {
            return ['status' => 'ok', 'detail' => 'sync'];
        }

        try {
            Queue::connection($connection)->size();

            return ['status' => 'ok', 'detail' => $connection];
        } catch (Throwable $e) {
            return ['status' => 'fail', 'detail' => class_basename($e)];
        }
    }

    /**
     * @return array{status: string, detail: ?string}
     */
    private function checkStorage(): array
    {
        try {
            $disk = Storage::disk(config('filesystems.default'));
            $path = 'health/' . Str::uuid() . '.txt';

            $disk->put($path, 'ok');
            $ok = $disk->exists($path);
            $disk->delete($path);

            return ['status' => $ok ? 'ok' : 'fail', 'detail' => config('filesystems.default')];
        } catch (Throwable $e) {
            return ['status' => 'fail', 'detail' => class_basename($e)];
        }
    }
}
