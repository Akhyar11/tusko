<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Settings\SettingsRegistry;
use App\Services\Settings\SettingsService;
use Illuminate\Http\JsonResponse;

/**
 * T42.1 — Profil toko publik (identitas bisnis, kontak, sosial, isi kebijakan).
 *
 * Seluruh nilai bersumber dari Settings Hub (grup `store`) agar storefront
 * sepenuhnya dinamis (G6). Nilai bertanda secret tidak pernah dikembalikan.
 */
class StoreProfileController extends Controller
{
    public function show(SettingsService $settings): JsonResponse
    {
        $values = $settings->all('store');

        $profile = [];
        foreach ($values as $key => $value) {
            if (SettingsRegistry::isSecret($key)) {
                continue;
            }
            $short = str_starts_with($key, 'store.') ? substr($key, 6) : $key;
            $profile[$short] = $value;
        }

        return response()->json([
            'data' => $profile,
        ]);
    }
}
