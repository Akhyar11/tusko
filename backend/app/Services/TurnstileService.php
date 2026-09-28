<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * TurnstileService — verifikasi token anti-bot Cloudflare Turnstile (T35.5b).
 *
 * Kontrak: browser → backend → siteverify (TIDAK PERNAH dari browser langsung).
 * Mode fail-closed: setiap kegagalan (jaringan, non-2xx, success=false, action/
 * hostname tak cocok) mengembalikan false. Bypass HANYA bila eksplisit nonaktif
 * via `TURNSTILE_ENABLED=false` (dev); produksi WAJIB aktif + secret terisi.
 */
class TurnstileService
{
    public function isEnabled(): bool
    {
        return (bool) config('services.turnstile.enabled');
    }

    /**
     * Verifikasi token `cf-turnstile-response` terhadap aksi & hostname yang diharapkan.
     */
    public function verify(?string $token, string $expectedAction, ?string $ip = null): bool
    {
        if (! $this->isEnabled()) {
            return true;
        }

        $secret = (string) config('services.turnstile.secret');
        $token = (string) $token;

        if ($secret === '' || $token === '' || strlen($token) > 2048) {
            return false;
        }

        $hostnames = config('services.turnstile.hostnames', []);

        if (! is_array($hostnames) || count($hostnames) === 0) {
            return false;
        }

        // URL siteverify murni dari konfigurasi (env); tanpa fallback hardcode (G6).
        $verifyUrl = (string) config('services.turnstile.verify_url');

        if ($verifyUrl === '') {
            return false;
        }

        try {
            $response = Http::asForm()
                ->timeout(10)
                ->post($verifyUrl, array_filter([
                    'secret' => $secret,
                    'response' => $token,
                    'remoteip' => $ip,
                ], fn ($value) => $value !== null && $value !== ''));

            if (! $response->successful()) {
                return false;
            }

            $result = $response->json();
        } catch (\Throwable $e) {
            Log::warning('Turnstile siteverify gagal: ' . $e->getMessage());

            return false;
        }

        if (empty($result['success'])) {
            return false;
        }

        if (($result['action'] ?? null) !== $expectedAction) {
            return false;
        }

        $hostname = (string) ($result['hostname'] ?? '');

        return $hostname !== '' && in_array($hostname, $hostnames, true);
    }
}
