<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ExpeditionService;
use App\Services\ShippingRateService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ShippingRateController extends Controller
{
    /**
     * Daftar layanan kurir LOKAL (expedition_services) aktif — sumber fallback
     * saat agregator tidak dikonfigurasi/offline (T06.5).
     */
    public function localServices(): JsonResponse
    {
        $services = ExpeditionService::with('expedition')
            ->where('is_active', true)
            ->whereHas('expedition', fn ($query) => $query->where('is_active', true))
            ->orderBy('expedition_id')
            ->get()
            ->map(fn (ExpeditionService $service) => [
                'expedition_id' => $service->expedition_id,
                'expedition_service_id' => $service->id,
                'courier' => strtolower((string) ($service->expedition?->code ?? '')),
                'service' => $service->service_code,
                'description' => $service->service_name,
                'cost' => (float) ($service->base_rate ?? 0),
                'etd' => $service->etd_days,
                'provider' => 'local',
            ]);

        return response()->json(['data' => $services]);
    }

    /**
     * Ambil tarif pengiriman dari agregator yang dikonfigurasi Admin.
     */
    public function index(Request $request, ShippingRateService $shippingRate): JsonResponse
    {
        $validated = $request->validate([
            'origin' => ['nullable', 'string', 'max:100'],
            'origin_district_code' => ['nullable', 'string', 'max:50'],
            'subdistrict_origin' => ['nullable', 'integer'],
            'destination' => ['nullable', 'string', 'max:100'],
            'destination_district_code' => ['nullable', 'string', 'max:50'],
            'subdistrict_destination' => ['nullable', 'integer'],
            'weight' => ['required', 'integer', 'min:1'],
            'courier' => ['nullable', 'string', 'max:50'],
            'item_value' => ['nullable', 'numeric', 'min:0'],
            'insurance' => ['nullable', 'boolean'],
            'length' => ['nullable', 'integer', 'min:1'],
            'width' => ['nullable', 'integer', 'min:1'],
            'height' => ['nullable', 'integer', 'min:1'],
        ], [
            'weight.required' => 'Berat paket wajib diisi.',
            'weight.min' => 'Berat paket minimal 1 gram.',
        ]);

        // Provider belum dikonfigurasi: kembalikan kosong (200) agar FE dapat
        // memakai fallback `expedition_services` tanpa error konsol.
        if (! $shippingRate->isConfigured()) {
            return response()->json([
                'data' => [],
                'provider' => $shippingRate->provider(),
                'configured' => false,
            ]);
        }

        $hasOrigin = ! empty($validated['origin'])
            || ! empty($validated['origin_district_code'])
            || $shippingRate->isOriginConfigured();

        if (! $hasOrigin) {
            return response()->json([
                'message' => 'Kota asal toko belum dikonfigurasi admin.',
            ], 422);
        }

        $rates = $shippingRate->getRates([
            'weight_grams' => (int) $validated['weight'],
            'courier' => $validated['courier'] ?? null,
            'origin' => $validated['origin'] ?? null,
            'destination' => $validated['destination'] ?? null,
            'origin_district_code' => $validated['origin_district_code'] ?? null,
            'destination_district_code' => $validated['destination_district_code'] ?? null,
            'subdistrict_origin' => $validated['subdistrict_origin'] ?? null,
            'subdistrict_destination' => $validated['subdistrict_destination'] ?? null,
            'item_value' => $validated['item_value'] ?? null,
            'insurance' => $validated['insurance'] ?? null,
            'length' => $validated['length'] ?? null,
            'width' => $validated['width'] ?? null,
            'height' => $validated['height'] ?? null,
        ]);

        return response()->json([
            'data' => $rates,
            'provider' => $shippingRate->provider(),
            'configured' => $shippingRate->isConfigured(),
        ]);
    }
}
