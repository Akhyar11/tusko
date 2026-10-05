<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * Midtrans SNAP — Transaction History API (fee per transaksi).
 *
 * Sumber fee PER TRANSAKSI (additionalInfo.fee.value) dari Midtrans. Berbeda
 * dengan Core API status yang tidak memuat fee. Membutuhkan SNAP aktif:
 * Client ID + RSA Private Key (public key di-upload ke Midtrans).
 */
class MidtransSnapService
{
    public function __construct(private readonly IntegrationService $integrations)
    {
    }

    public function isConfigured(): bool
    {
        return (bool) $this->integrations->get('payment.snap_enabled', false)
            && $this->clientId() !== ''
            && $this->privateKey() !== '';
    }

    private function baseUrl(): string
    {
        return rtrim((string) ($this->integrations->get('payment.snap_base_url') ?: 'https://api.midtrans.com'), '/');
    }

    private function clientId(): string
    {
        return trim((string) ($this->integrations->get('payment.snap_client_id') ?? ''));
    }

    private function privateKey(): string
    {
        return (string) ($this->integrations->get('payment.snap_private_key') ?? '');
    }

    private function timestamp(): string
    {
        return now('Asia/Jakarta')->format('Y-m-d\TH:i:sP');
    }

    private function sign(string $stringToSign): string
    {
        $pkey = openssl_pkey_get_private($this->privateKey());
        if ($pkey === false) {
            throw new \RuntimeException('SNAP private key tidak valid.');
        }
        openssl_sign($stringToSign, $signature, $pkey, OPENSSL_ALGO_SHA256);

        return base64_encode($signature);
    }

    /**
     * Access token B2B SNAP.
     */
    public function accessToken(): ?string
    {
        $timestamp = $this->timestamp();
        $stringToSign = $this->clientId().'|'.$timestamp;

        try {
            $response = Http::withHeaders([
                'X-CLIENT-KEY' => $this->clientId(),
                'X-TIMESTAMP' => $timestamp,
                'X-SIGNATURE' => $this->sign($stringToSign),
                'Content-Type' => 'application/json',
                'Accept' => 'application/json',
            ])->timeout(15)->post($this->baseUrl().'/v1.0/access-token/b2b', [
                'grant_type' => 'client_credentials',
            ]);

            if (! $response->successful()) {
                Log::warning('SNAP access-token gagal', ['status' => $response->status(), 'body' => $response->json()]);

                return null;
            }

            return $response->json('accessToken') ?: $response->json('access_token');
        } catch (\Throwable $e) {
            Log::error('SNAP access-token exception: '.$e->getMessage());

            return null;
        }
    }

    /**
     * Ambil daftar riwayat transaksi (termasuk fee per transaksi).
     *
     * @return array<int, array<string, mixed>>
     */
    public function transactionHistory(string $fromDateTime, string $toDateTime, int $pageNumber = 0, int $pageSize = 50): array
    {
        $token = $this->accessToken();
        if (! $token) {
            return [];
        }

        $path = '/v1.0/transaction-history-list';
        $payload = [
            'fromDateTime' => $fromDateTime,
            'toDateTime' => $toDateTime,
            'pageSize' => $pageSize,
            'pageNumber' => $pageNumber,
            'additionalInfo' => [
                'types' => ['PAYMENT'],
                'sortOrder' => 'DESC',
            ],
        ];
        $body = json_encode($payload, JSON_UNESCAPED_SLASHES);
        $timestamp = $this->timestamp();
        $bodyHash = strtolower(hash('sha256', $body));
        $stringToSign = 'POST:'.$path.':'.$token.':'.$bodyHash.':'.$timestamp;

        try {
            $response = Http::withToken($token)->withHeaders([
                'X-PARTNER-ID' => $this->clientId(),
                'X-EXTERNAL-ID' => (string) Str::uuid(),
                'X-TIMESTAMP' => $timestamp,
                'X-SIGNATURE' => $this->sign($stringToSign),
                'Content-Type' => 'application/json',
                'Accept' => 'application/json',
            ])->timeout(20)->post($this->baseUrl().$path, $payload);

            if (! $response->successful()) {
                Log::warning('SNAP transaction-history gagal', ['status' => $response->status(), 'body' => $response->json()]);

                return [];
            }

            return $response->json('detailData') ?? [];
        } catch (\Throwable $e) {
            Log::error('SNAP transaction-history exception: '.$e->getMessage());

            return [];
        }
    }
}
