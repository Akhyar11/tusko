<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ExpeditionService;
use App\Services\BiteshipAreaService;
use App\Services\ShippingRateService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ShippingRateController extends Controller
{
    /**
     * Pencarian Area ID Biteship (T40.5) — proxy /v1/maps/areas.
     */
    public function areas(Request $request, BiteshipAreaService $areas): JsonResponse
    {
        $validated = $request->validate([
            'search' => ['required', 'string', 'min:3', 'max:100'],
            'country' => ['nullable', 'string', 'max:5'],
        ], [
            'search.required' => 'Kata kunci pencarian area wajib diisi.',
            'search.min' => 'Masukkan minimal 3 karakter untuk mencari area.',
        ]);

        if (! $areas->isConfigured()) {
            return response()->json([
                'data' => [],
                'configured' => false,
            ]);
        }

        return response()->json([
            'data' => $areas->search($validated['search'], $validated['country'] ?? 'ID'),
            'configured' => true,
        ]);
    }
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
            'origin_biteship_area_id' => ['nullable', 'string', 'max:50'],
            'destination_biteship_area_id' => ['nullable', 'string', 'max:50'],
            'origin_postal_code' => ['nullable', 'string', 'max:10'],
            'destination_postal_code' => ['nullable', 'string', 'max:10'],
            'weight' => ['required', 'integer', 'min:1'],
            'courier' => ['nullable', 'string', 'max:50'],
            'item_name' => ['nullable', 'string', 'max:150'],
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
            || ! empty($validated['origin_biteship_area_id'])
            || ! empty($validated['origin_postal_code'])
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
            'origin_biteship_area_id' => $validated['origin_biteship_area_id'] ?? null,
            'destination_biteship_area_id' => $validated['destination_biteship_area_id'] ?? null,
            'origin_postal_code' => $validated['origin_postal_code'] ?? null,
            'destination_postal_code' => $validated['destination_postal_code'] ?? null,
            'item_name' => $validated['item_name'] ?? null,
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
