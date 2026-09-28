<?php

namespace App\Services;

use Exception;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * BiteshipClient — klien HTTP reusable untuk API Biteship (T40.3).
 *
 * Kontrak resmi (biteship.com/docs): base URL default https://api.biteship.com,
 * autentikasi via header `Authorization: <api_key>` (tanpa prefix "Bearer").
 * Test & live memakai base URL sama, dibedakan oleh API key. Seluruh kredensial
 * bersumber dari tabel `integrations` (G6 — tanpa hardcode).
 */
class BiteshipClient
{
    public function __construct(private readonly IntegrationService $integrations)
    {
    }

    public function isConfigured(): bool
    {
        return $this->integrations->isConfigured('shipping.biteship_api_key')
            && $this->integrations->isConfigured('shipping.biteship_base_url');
    }

    public function baseUrl(): string
    {
        return rtrim((string) $this->integrations->get('shipping.biteship_base_url'), '/');
    }

    public function apiKey(): string
    {
        return (string) $this->integrations->get('shipping.biteship_api_key');
    }

    /**
     * Header signature webhook yang dikonfigurasi admin (nama => nilai rahasia).
     *
     * @return array<string, string>
     */
    public function webhookSignatureHeaders(): array
    {
        $key = (string) ($this->integrations->get('shipping.biteship_webhook_signature_key') ?? '');
        $secret = (string) ($this->integrations->get('shipping.biteship_webhook_signature_secret') ?? '');

        if ($key === '' || $secret === '') {
            return [];
        }

        return [$key => $secret];
    }

    public function get(string $path, array $query = []): array
    {
        return $this->request('get', $path, $query);
    }

    public function post(string $path, array $payload = []): array
    {
        return $this->request('post', $path, $payload);
    }

    public function delete(string $path, array $payload = []): array
    {
        return $this->request('delete', $path, $payload);
    }

    private function http(): PendingRequest
    {
        return Http::withHeaders(['Authorization' => $this->apiKey()])
            ->acceptJson()
            ->timeout(15)
            ->retry(2, 200, null, false);
    }

    /**
     * @return array<string, mixed>
     */
    private function request(string $method, string $path, array $data): array
    {
        if (! $this->isConfigured()) {
            return [];
        }

        $url = $this->baseUrl() . '/' . ltrim($path, '/');

        try {
            $response = match ($method) {
                'post' => $this->http()->post($url, $data),
                'delete' => $this->http()->delete($url, $data),
                default => $this->http()->get($url, $data),
            };
        } catch (Exception $e) {
            Log::error('Biteship request error: ' . $e->getMessage(), ['path' => $path]);

            return [];
        }

        if ($response->failed()) {
            Log::warning('Biteship request gagal', [
                'path' => $path,
                'status' => $response->status(),
                'body' => $response->json(),
            ]);

            return [];
        }

        return $response->json() ?? [];
    }
}
