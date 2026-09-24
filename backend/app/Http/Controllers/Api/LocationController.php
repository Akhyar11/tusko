<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\LocationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LocationController extends Controller
{
    public function provinces(LocationService $locations): JsonResponse
    {
        return response()->json(['data' => $locations->provinces()]);
    }

    public function cities(Request $request, LocationService $locations): JsonResponse
    {
        $validated = $request->validate([
            'province_id' => ['required', 'integer', 'min:1'],
        ]);

        return response()->json(['data' => $locations->cities((int) $validated['province_id'])]);
    }

    public function districts(Request $request, LocationService $locations): JsonResponse
    {
        $validated = $request->validate([
            'city_id' => ['required', 'integer', 'min:1'],
        ]);

        return response()->json(['data' => $locations->districts((int) $validated['city_id'])]);
    }

    public function subdistricts(Request $request, LocationService $locations): JsonResponse
    {
        $validated = $request->validate([
            'district_id' => ['required', 'integer', 'min:1'],
        ]);

        return response()->json(['data' => $locations->subdistricts((int) $validated['district_id'])]);
    }
}
