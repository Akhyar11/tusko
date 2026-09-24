<?php

namespace App\Services;

use Exception;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * LocationService — peta kode wilayah (province/city/district/subdistrict)
 * dari KiriminAja (kontrak resmi):
 *  - POST /api/mitra/province                        -> { datas:[...] }
 *  - POST /api/mitra/city        { provinsi_id }     -> { datas:[...] }
 *  - POST /api/mitra/kecamatan   { kabupaten_id }    -> { datas:[...] }
 *  - POST /api/mitra/kelurahan   { kecamatan_id }    -> { results:[...] }
 *
 * Konfigurasi dari tabel `integrations` (G6). Bila belum dikonfigurasi -> [].
 */
class LocationService
{
    public function __construct(private readonly IntegrationService $integrations)
    {
    }

    public function isConfigured(): bool
    {
        return $this->integrations->isConfigured('shipping.base_url')
            && $this->integrations->isConfigured('shipping.api_key');
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function provinces(): array
    {
        return $this->normalize($this->post('/api/mitra/province')['datas'] ?? []);
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function cities(int $provinceId): array
    {
        return $this->normalize($this->post('/api/mitra/city', ['provinsi_id' => $provinceId])['datas'] ?? []);
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function districts(int $cityId): array
    {
        return $this->normalize($this->post('/api/mitra/kecamatan', ['kabupaten_id' => $cityId])['datas'] ?? []);
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function subdistricts(int $districtId): array
    {
        return $this->normalize($this->post('/api/mitra/kelurahan', ['kecamatan_id' => $districtId])['results'] ?? []);
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    private function post(string $path, array $payload = []): array
    {
        if (! $this->isConfigured()) {
            return [];
        }

        try {
            $response = Http::withToken((string) $this->integrations->get('shipping.api_key'))
                ->acceptJson()
                ->timeout(15)
                ->post(rtrim((string) $this->integrations->get('shipping.base_url'), '/') . $path, $payload);

            return $response->json() ?? [];
        } catch (Exception $e) {
            Log::error('Gagal mengambil data wilayah: ' . $e->getMessage());

            return [];
        }
    }

    /**
     * @param  array<int, array<string, mixed>>  $rows
     * @return array<int, array<string, mixed>>
     */
    private function normalize(array $rows): array
    {
        return array_map(fn (array $row) => [
            'id' => $row['id'] ?? null,
            'name' => $row['name']
                ?? $row['province_name']
                ?? $row['city_name']
                ?? $row['kecamatan_name']
                ?? $row['kelurahan_name']
                ?? null,
            'parent_id' => $row['provinsi_id'] ?? $row['kabupaten_id'] ?? $row['kecamatan_id'] ?? null,
        ], $rows);
    }
}
