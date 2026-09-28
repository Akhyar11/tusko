<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

/**
 * LogApiRequests — logging terstruktur (JSON) untuk setiap request API (T35.4).
 *
 * Mencatat method, path, status, durasi, user, dan IP ke channel `api`
 * agar dapat diagregasi oleh sistem monitoring.
 */
class LogApiRequests
{
    public function handle(Request $request, Closure $next): Response
    {
        $startedAt = microtime(true);

        $response = $next($request);

        $durationMs = round((microtime(true) - $startedAt) * 1000, 2);

        try {
            Log::channel('api')->info('api.request', [
                'method' => $request->method(),
                'path' => '/' . ltrim($request->path(), '/'),
                'status' => $response->getStatusCode(),
                'duration_ms' => $durationMs,
                'user_id' => optional($request->user())->id,
                'ip' => $request->ip(),
            ]);
        } catch (\Throwable $e) {
            // Logging tidak boleh menggagalkan request.
        }

        return $response;
    }
}
