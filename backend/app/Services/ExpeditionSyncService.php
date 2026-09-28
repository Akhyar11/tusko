<?php

namespace App\Services;

use App\Models\Expedition;
use App\Models\ExpeditionService;
use Exception;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * ExpeditionSyncService — sinkronisasi master kurir & layanan dari KiriminAja.
 *
 * Kontrak resmi (developer.kiriminaja.com):
 *  - POST /api/mitra/couriers          -> { datas:[{code,name,type}] }
 *  - POST /api/mitra/courier_services  -> { datas:[{name,code,cut_off_time,courier_group}] } (body: courier_code)
 *
 * Idempotent (upsert by code). Field identitas diambil dari API; field lokal
 * (base_cost/cost/is_free/priority/rate) TIDAK ditimpa agar override admin aman.
 */
class ExpeditionSyncService
{
    public function __construct(
        private readonly IntegrationService $integrations,
        private readonly BiteshipClient $biteship
    ) {
    }

    public function isConfigured(): bool
    {
        if ($this->provider() === 'biteship') {
            return $this->biteship->isConfigured();
        }

        return $this->integrations->isConfigured('shipping.base_url')
            && $this->integrations->isConfigured('shipping.api_key');
    }

    public function provider(): string
    {
        $provider = (string) $this->integrations->get('shipping.provider', '');

        return $provider !== '' ? $provider : 'kiriminaja';
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function fetchCouriers(): array
    {
        $response = $this->client()->post($this->baseUrl() . '/api/mitra/couriers');

        return $response->json('datas') ?? [];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function fetchCourierServices(string $courierCode): array
    {
        $response = $this->client()->post(
            $this->baseUrl() . '/api/mitra/courier_services',
            ['courier_code' => $courierCode]
        );

        return $response->json('datas') ?? [];
    }

    /**
     * Sinkronkan seluruh kurir + layanan aktif.
     *
     * @return array{couriers:int, services:int}
     */
    public function sync(): array
    {
        if (! $this->isConfigured()) {
            return ['couriers' => 0, 'services' => 0];
        }

        if ($this->provider() === 'biteship') {
            return $this->syncBiteship();
        }

        $courierCount = 0;
        $serviceCount = 0;

        try {
            foreach ($this->fetchCouriers() as $courier) {
                $code = $courier['code'] ?? null;

                if (! $code) {
                    continue;
                }

                DB::transaction(function () use ($courier, $code, &$courierCount, &$serviceCount) {
                    $expedition = Expedition::firstOrNew(['code' => $code]);
                    $type = $courier['type'] ?? null;

                    $expedition->fill([
                        'name' => $courier['name'] ?? $expedition->name ?? $code,
                        'service' => $expedition->service ?: $type,
                        'category' => $type === 'Instant' ? 'Instan' : ($expedition->category ?: 'Reguler'),
                        'is_active' => true,
                    ]);

                    if (! $expedition->exists) {
                        $expedition->fill([
                            'etd' => $type === 'Instant' ? '1-2 jam' : '1-3 hari',
                            'base_cost' => 0,
                            'cost' => 0,
                            'is_free' => false,
                            'tracking_support' => true,
                            'cod_support' => false,
                        ]);
                    }

                    $expedition->save();
                    $courierCount++;

                    foreach ($this->fetchCourierServices($code) as $service) {
                        $serviceCode = $service['code'] ?? null;

                        if (! $serviceCode) {
                            continue;
                        }

                        $record = ExpeditionService::firstOrNew([
                            'expedition_id' => $expedition->id,
                            'service_code' => $serviceCode,
                        ]);

                        $record->fill([
                            'service_name' => $service['name'] ?? $record->service_name ?? $serviceCode,
                            'is_active' => true,
                        ]);

                        if (! $record->exists) {
                            $record->etd_days = '1-3 hari';
                            $record->base_rate = 0;
                            $record->per_kg_rate = 0;
                        }

                        $record->save();
                        $serviceCount++;
                    }
                });
            }
        } catch (Exception $e) {
            Log::error('Gagal sinkronisasi expedisi: ' . $e->getMessage());
        }

        return ['couriers' => $courierCount, 'services' => $serviceCount];
    }

    /**
     * Sinkronisasi master kurir & layanan dari Biteship (T40.6).
     *
     * GET /v1/couriers mengembalikan daftar LAYANAN (setiap record = 1 layanan),
     * dikelompokkan per `courier_code` menjadi `expeditions` dan per
     * `courier_service_code` menjadi `expedition_services`. Idempotent (upsert).
     *
     * @return array{couriers:int, services:int}
     */
    private function syncBiteship(): array
    {
        $courierCount = 0;
        $serviceCount = 0;
        $seenCouriers = [];

        $couriers = $this->biteship->get('/v1/couriers')['couriers'] ?? [];

        foreach ($couriers as $courier) {
            $code = $courier['courier_code'] ?? null;

            if (! $code) {
                continue;
            }

            DB::transaction(function () use ($courier, $code, &$courierCount, &$serviceCount, &$seenCouriers) {
                $expedition = Expedition::firstOrNew(['code' => strtolower((string) $code)]);
                $type = $courier['service_type'] ?? $courier['tier'] ?? null;

                $expedition->fill([
                    'name' => $courier['courier_name'] ?? $expedition->name ?? $code,
                    'service' => $expedition->service ?: ($type ? ucfirst(str_replace('_', ' ', (string) $type)) : null),
                    'category' => $this->categoryForBiteship($type, $expedition->category ?? null),
                    'is_active' => true,
                ]);

                if (! $expedition->exists) {
                    $expedition->fill([
                        'etd' => $this->etdFromBiteship($courier) ?? '1-3 hari',
                        'base_cost' => 0,
                        'cost' => 0,
                        'is_free' => false,
                        'tracking_support' => true,
                        'cod_support' => false,
                    ]);
                }

                $expedition->save();

                if (! isset($seenCouriers[$expedition->code])) {
                    $seenCouriers[$expedition->code] = true;
                    $courierCount++;
                }

                $serviceCode = $courier['courier_service_code'] ?? null;

                if (! $serviceCode) {
                    return;
                }

                $record = ExpeditionService::firstOrNew([
                    'expedition_id' => $expedition->id,
                    'service_code' => $serviceCode,
                ]);

                $record->fill([
                    'service_name' => $courier['courier_service_name'] ?? $record->service_name ?? $serviceCode,
                    'is_active' => true,
                ]);

                if (! $record->exists) {
                    $record->etd_days = $this->etdFromBiteship($courier) ?? '1-3 hari';
                    $record->base_rate = 0;
                    $record->per_kg_rate = 0;
                }

                $record->save();
                $serviceCount++;
            });
        }

        return ['couriers' => $courierCount, 'services' => $serviceCount];
    }

    private function categoryForBiteship(?string $type, ?string $current): string
    {
        $type = strtolower((string) $type);

        return match (true) {
            str_contains($type, 'instant') || str_contains($type, 'same_day') => 'Instan',
            str_contains($type, 'cargo') => 'Kargo',
            default => $current ?: 'Reguler',
        };
    }

    private function etdFromBiteship(array $courier): ?string
    {
        $range = $courier['shipment_duration_range'] ?? null;
        $unit = $courier['shipment_duration_unit'] ?? null;

        if (! $range) {
            return null;
        }

        return trim($range . ($unit ? ' ' . $unit : ''));
    }

    private function baseUrl(): string
    {
        return rtrim((string) $this->integrations->get('shipping.base_url'), '/');
    }

    private function client()
    {
        return Http::withToken((string) $this->integrations->get('shipping.api_key'))
            ->acceptJson()
            ->timeout(15);
    }
}
