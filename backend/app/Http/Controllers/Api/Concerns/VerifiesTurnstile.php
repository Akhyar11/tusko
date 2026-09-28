<?php

namespace App\Http\Controllers\Api\Concerns;

use App\Services\TurnstileService;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\HttpException;

/**
 * Gerbang anti-bot Cloudflare Turnstile (T35.5d).
 *
 * Dipanggil di awal handler SEBELUM logika bisnis apa pun; kegagalan verifikasi
 * (token invalid, aksi/hostname tak cocok, timeout) melempar 403 (fail closed).
 * Bila Turnstile nonaktif via konfigurasi (`TURNSTILE_ENABLED=false`), lolos
 * sebagai no-op eksplisit untuk lingkungan dev.
 */
trait VerifiesTurnstile
{
    protected function requireTurnstile(Request $request, string $action): void
    {
        $token = $request->input('cf_turnstile_response');

        $verified = app(TurnstileService::class)->verify(
            is_string($token) ? $token : null,
            $action,
            $request->ip()
        );

        if (! $verified) {
            throw new HttpException(403, 'Verifikasi keamanan gagal. Silakan coba lagi.');
        }
    }
}
