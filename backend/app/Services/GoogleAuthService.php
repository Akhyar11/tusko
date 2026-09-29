<?php

namespace App\Services;

use App\Services\Settings\SettingsService;

/**
 * GoogleAuthService — konfigurasi login Google (T41.2).
 *
 * Kredensial dibaca dari Settings Hub (integrations) dan disuntikkan ke
 * `config('services.google.*')` saat runtime (G6 — tanpa hardcode). Blok
 * `config/services.php` hanya fallback env untuk pengembangan.
 */
class GoogleAuthService
{
    public function __construct(private readonly SettingsService $settings)
    {
    }

    public function isConfigured(): bool
    {
        return (bool) $this->settings->get('auth.google_enabled')
            && (string) $this->settings->get('auth.google_client_id') !== ''
            && (string) $this->settings->get('auth.google_client_secret') !== ''
            && (string) $this->settings->get('auth.google_redirect_url') !== '';
    }

    /**
     * Suntikkan konfigurasi Socialite dari Settings Hub ke runtime config.
     */
    public function applyConfig(): void
    {
        config([
            'services.google.client_id' => $this->settings->get('auth.google_client_id'),
            'services.google.client_secret' => $this->settings->get('auth.google_client_secret'),
            'services.google.redirect' => $this->settings->get('auth.google_redirect_url'),
        ]);
    }

    /**
     * Daftar origin frontend yang boleh menjadi tujuan balik.
     *
     * @return array<int, string>
     */
    public function allowedOrigins(): array
    {
        $raw = (string) ($this->settings->get('auth.allowed_redirect_origins') ?? '');
        $origins = array_values(array_filter(array_map('trim', explode(',', $raw))));

        if ($origins !== []) {
            return $origins;
        }

        $app = parse_url((string) config('app.url'));

        if (! empty($app['scheme']) && ! empty($app['host'])) {
            $port = isset($app['port']) ? ':' . $app['port'] : '';

            return [$app['scheme'] . '://' . $app['host'] . $port];
        }

        return [];
    }

    /**
     * Validasi `redirect_uri` berada pada origin yang diizinkan (anti open-redirect).
     */
    public function isAllowedRedirectUri(?string $uri): bool
    {
        if (! $uri) {
            return false;
        }

        $parts = parse_url($uri);

        if (empty($parts['scheme']) || empty($parts['host'])) {
            return false;
        }

        if (! in_array(strtolower($parts['scheme']), ['http', 'https'], true)) {
            return false;
        }

        $port = isset($parts['port']) ? ':' . $parts['port'] : '';
        $origin = $parts['scheme'] . '://' . $parts['host'] . $port;

        return in_array($origin, $this->allowedOrigins(), true);
    }
}
