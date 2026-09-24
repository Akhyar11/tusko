<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ShippingRateService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ShippingRateController extends Controller
{
    /**
     * Ambil tarif pengiriman dari agregator yang dikonfigurasi Admin.
     */
    public function index(Request $request, ShippingRateService $shippingRate): JsonResponse
    {
        $validated = $request->validate([
            'origin' => ['nullable', 'string', 'max:100'],
            'destination' => ['required', 'string', 'max:100'],
            'weight' => ['required', 'integer', 'min:1'],
            'courier' => ['nullable', 'string', 'max:50'],
        ], [
            'destination.required' => 'Kota/area tujuan wajib diisi.',
            'weight.required' => 'Berat paket wajib diisi.',
            'weight.min' => 'Berat paket minimal 1 gram.',
        ]);

        $origin = $validated['origin'] ?? $shippingRate->originLabel();

        if (! $origin) {
            return response()->json([
                'message' => 'Kota asal toko belum dikonfigurasi admin.',
            ], 422);
        }

        $rates = $shippingRate->getRates(
            (string) $origin,
            (string) $validated['destination'],
            (int) $validated['weight'],
            $validated['courier'] ?? null
        );

        return response()->json([
            'data' => $rates,
            'provider' => $shippingRate->provider(),
            'configured' => $shippingRate->isConfigured(),
        ]);
    }
}
