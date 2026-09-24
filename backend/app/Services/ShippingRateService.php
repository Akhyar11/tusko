<?php

namespace App\Services;

use Exception;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * ShippingRateService — ambil tarif pengiriman dari agregator pihak ketiga.
 *
 * Sepenuhnya dikonfigurasi Admin via tabel `integrations` (G6 — tanpa hardcode):
 *  - `shipping.provider`  : kiriminaja | apicoid
 *  - `shipping.base_url`  : endpoint dasar API
 *  - `shipping.api_key`   : kredensial
 *  - `store.origin_city`  : kota asal pengiriman (fallback origin)
 */
class ShippingRateService
{
    public function __construct(private readonly IntegrationService $integrations)
    {
    }

    public function provider(): string
    {
        $provider = (string) $this->integrations->get('shipping.provider', '');

        return $provider !== '' ? $provider : 'kiriminaja';
    }

    public function isConfigured(): bool
    {
        return $this->integrations->isConfigured('shipping.base_url')
            && $this->integrations->isConfigured('shipping.api_key');
    }

    /**
     * Kota asal default dari pengaturan toko (bila tersedia).
     */
    public function originLabel(): ?string
    {
        $city = $this->integrations->get('store.origin_city');
        $postal = $this->integrations->get('store.origin_postal_code');

        $origin = $city ?: $postal;

        return $origin ? (string) $origin : null;
    }

    /**
     * Ambil dan normalisasi daftar tarif pengiriman.
     *
     * @return array<int, array<string, mixed>>
     */
    public function getRates(string $origin, string $destination, int $weightGrams, ?string $courier = null): array
    {
        if (! $this->isConfigured()) {
            return [];
        }

        $baseUrl = rtrim((string) $this->integrations->get('shipping.base_url'), '/');
        $apiKey = (string) $this->integrations->get('shipping.api_key');
        $provider = $this->provider();

        $payload = array_filter([
            'origin' => $origin,
            'destination' => $destination,
            'weight' => $weightGrams,
            'courier' => $courier,
        ], fn ($value) => $value !== null && $value !== '');

        try {
            if ($provider === 'apicoid') {
                $response = Http::withHeaders(['key' => $apiKey])
                    ->timeout(10)
                    ->post($baseUrl . '/cost', $payload);

                return $this->normalizeApiCoId($response->json() ?? []);
            }

            $response = Http::withToken($apiKey)
                ->timeout(10)
                ->post($baseUrl . '/v1/shipping/price', $payload);

            return $this->normalizeKiriminAja($response->json() ?? []);
        } catch (Exception $e) {
            Log::error('Gagal mengambil tarif pengiriman: ' . $e->getMessage());

            return [];
        }
    }

    /**
     * @param  array<string, mixed>  $body
     * @return array<int, array<string, mixed>>
     */
    private function normalizeApiCoId(array $body): array
    {
        $results = $body['rajaongkir']['results'] ?? $body['results'] ?? [];
        $rates = [];

        foreach ($results as $result) {
            $courier = $result['code'] ?? $result['courier'] ?? null;

            foreach (($result['costs'] ?? []) as $cost) {
                $firstCost = $cost['cost'][0] ?? [];

                $rates[] = [
                    'courier' => $courier,
                    'service' => $cost['service'] ?? null,
                    'description' => $cost['description'] ?? null,
                    'cost' => (float) ($firstCost['value'] ?? 0),
                    'etd' => $firstCost['etd'] ?? null,
                    'provider' => 'apicoid',
                ];
            }
        }

        return $rates;
    }

    /**
     * @param  array<string, mixed>  $body
     * @return array<int, array<string, mixed>>
     */
    private function normalizeKiriminAja(array $body): array
    {
        $results = $body['results'] ?? $body['data'] ?? [];
        $rates = [];

        foreach ($results as $result) {
            $rates[] = [
                'courier' => $result['courier'] ?? $result['shipping_name'] ?? null,
                'service' => $result['service'] ?? $result['service_name'] ?? null,
                'description' => $result['description'] ?? null,
                'cost' => (float) ($result['price'] ?? $result['cost'] ?? 0),
                'etd' => $result['etd'] ?? $result['estimation'] ?? null,
                'provider' => 'kiriminaja',
            ];
        }

        return $rates;
    }
}
