<?php

namespace App\Services;

use Exception;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * ShippingRateService — ambil tarif pengiriman dari agregator pihak ketiga.
 *
 * Kontrak mengikuti dokumentasi RESMI:
 *  - KiriminAja : POST {base}/api/mitra/v6.1/shipping_price  (Authorization: Bearer)
 *                 payload: origin, subdistrict_origin, destination,
 *                 subdistrict_destination, weight (gram), courier[].
 *  - api.co.id  : GET  {base}/courier/v2/rates                (header: x-api-co-id)
 *                 query: origin_district_code, destination_district_code,
 *                 weight (kilogram).
 *
 * Seluruh konfigurasi (provider/base_url/api_key/kode asal) berasal dari tabel
 * `integrations` (G6 — tanpa hardcode).
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
     * Apakah kode/label asal pengiriman sudah dikonfigurasi admin.
     */
    public function isOriginConfigured(): bool
    {
        foreach (['store.origin_district_code', 'store.origin_kiriminaja_district_id', 'store.origin_city', 'store.origin_postal_code'] as $key) {
            if ($this->integrations->isConfigured($key)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Label kota asal dari pengaturan toko (bila tersedia) — untuk fallback/legacy.
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
     * @param  array<string, mixed>  $context  destination*, weight_grams*, courier, item_value,
     *                                          insurance, length, width, height,
     *                                          origin_district_code, destination_district_code,
     *                                          origin, subdistrict_origin, subdistrict_destination
     * @return array<int, array<string, mixed>>
     */
    public function getRates(array $context): array
    {
        if (! $this->isConfigured()) {
            return [];
        }

        // Caching per (provider, base_url, asal, tujuan, berat, kurir, dimensi) — T06.8.
        $cacheKey = $this->cacheKey($context);
        $cached = Cache::get($cacheKey);

        if (is_array($cached)) {
            return $cached;
        }

        try {
            $rates = $this->provider() === 'apicoid'
                ? $this->fetchApiCoId($context)
                : $this->fetchKiriminAja($context);
        } catch (Exception $e) {
            Log::error('Gagal mengambil tarif pengiriman: ' . $e->getMessage());

            return [];
        }

        // Hanya cache hasil sukses (jangan cache kegagalan/kosong).
        if (! empty($rates)) {
            Cache::put($cacheKey, $rates, now()->addSeconds($this->cacheTtl()));
        }

        return $rates;
    }

    private function cacheTtl(): int
    {
        return max(0, (int) ($this->integrations->get('shipping.rate_cache_ttl') ?: 600));
    }

    /**
     * @param  array<string, mixed>  $context
     */
    private function cacheKey(array $context): string
    {
        $normalized = $context;
        ksort($normalized);

        return 'shipping_rate:' . md5(
            $this->provider() . '|' . (string) $this->integrations->get('shipping.base_url') . '|' . json_encode($normalized)
        );
    }

    /**
     * @param  array<string, mixed>  $context
     * @return array<int, array<string, mixed>>
     */
    private function fetchApiCoId(array $context): array
    {
        $baseUrl = rtrim((string) $this->integrations->get('shipping.base_url'), '/');
        $apiKey = (string) $this->integrations->get('shipping.api_key');

        $originDistrict = $context['origin_district_code']
            ?? $this->integrations->get('store.origin_district_code');
        $destinationDistrict = $context['destination_district_code'] ?? null;

        if (! $originDistrict || ! $destinationDistrict) {
            return [];
        }

        // api.co.id memakai satuan KILOGRAM untuk berat.
        $weightKg = round(max(1, (int) ($context['weight_grams'] ?? 0)) / 1000, 3);

        $query = array_filter([
            'origin_district_code' => $originDistrict,
            'destination_district_code' => $destinationDistrict,
            'weight' => $weightKg,
            'item_value' => $context['item_value'] ?? null,
            'insurance' => $context['insurance'] ?? null,
            'length' => $context['length'] ?? null,
            'width' => $context['width'] ?? null,
            'height' => $context['height'] ?? null,
        ], fn ($value) => $value !== null && $value !== '');

        $response = Http::withHeaders(['x-api-co-id' => $apiKey])
            ->acceptJson()
            ->timeout(10)
            ->retry(2, 200, null, false)
            ->get($baseUrl . '/courier/v2/rates', $query);

        return $this->normalizeApiCoId($response->json() ?? []);
    }

    /**
     * @param  array<string, mixed>  $context
     * @return array<int, array<string, mixed>>
     */
    private function fetchKiriminAja(array $context): array
    {
        $baseUrl = rtrim((string) $this->integrations->get('shipping.base_url'), '/');
        $apiKey = (string) $this->integrations->get('shipping.api_key');

        $origin = $context['origin']
            ?? $this->integrations->get('store.origin_kiriminaja_district_id');
        $destination = $context['destination_district_code'] ?? $context['destination'] ?? null;

        if (! $origin || ! $destination) {
            return [];
        }

        $courier = $context['courier'] ?? null;

        $payload = array_filter([
            'origin' => (int) $origin,
            'subdistrict_origin' => isset($context['subdistrict_origin']) ? (int) $context['subdistrict_origin'] : null,
            'destination' => (int) $destination,
            'subdistrict_destination' => isset($context['subdistrict_destination']) ? (int) $context['subdistrict_destination'] : null,
            'weight' => max(1, (int) ($context['weight_grams'] ?? 0)),
            'length' => $context['length'] ?? null,
            'width' => $context['width'] ?? null,
            'height' => $context['height'] ?? null,
            'item_value' => (int) ($context['item_value'] ?? 0),
            'insurance' => (int) ($context['insurance'] ?? 0),
            'courier' => $courier ? (is_array($courier) ? $courier : [$courier]) : null,
        ], fn ($value) => $value !== null && $value !== '');

        $response = Http::withToken($apiKey)
            ->acceptJson()
            ->timeout(10)
            ->retry(2, 200, null, false)
            ->post($baseUrl . '/api/mitra/v6.1/shipping_price', $payload);

        return $this->normalizeKiriminAja($response->json() ?? []);
    }

    /**
     * Normalisasi respons api.co.id: data.rates[].
     *
     * @param  array<string, mixed>  $body
     * @return array<int, array<string, mixed>>
     */
    private function normalizeApiCoId(array $body): array
    {
        $rates = $body['data']['rates'] ?? $body['rates'] ?? [];
        $normalized = [];

        foreach ($rates as $rate) {
            $normalized[] = [
                'courier' => strtolower((string) ($rate['courier'] ?? '')),
                'service' => $rate['service'] ?? null,
                'description' => $rate['service_name'] ?? $rate['description'] ?? null,
                'cost' => (float) ($rate['price'] ?? $rate['cost'] ?? 0),
                'etd' => $rate['etd'] ?? $rate['estimation'] ?? null,
                'is_cheapest' => (bool) ($rate['is_cheapest'] ?? false),
                'provider' => 'apicoid',
            ];
        }

        return $normalized;
    }

    /**
     * Normalisasi respons KiriminAja: results[].
     *
     * @param  array<string, mixed>  $body
     * @return array<int, array<string, mixed>>
     */
    private function normalizeKiriminAja(array $body): array
    {
        $results = $body['results'] ?? [];
        $normalized = [];

        foreach ($results as $result) {
            $normalized[] = [
                'courier' => strtolower((string) ($result['service'] ?? '')),
                'service' => $result['service_type'] ?? $result['service_name'] ?? null,
                'description' => $result['service_name'] ?? null,
                'cost' => (float) ($result['cost'] ?? 0),
                'etd' => $result['etd'] ?? null,
                'provider' => 'kiriminaja',
            ];
        }

        return $normalized;
    }
}
