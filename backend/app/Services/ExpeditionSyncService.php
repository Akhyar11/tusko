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
