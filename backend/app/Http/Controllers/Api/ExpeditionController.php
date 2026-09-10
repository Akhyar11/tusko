<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreExpeditionRequest;
use App\Http\Requests\UpdateExpeditionRequest;
use App\Http\Resources\ExpeditionResource;
use App\Models\Expedition;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ExpeditionController extends Controller
{
    /**
     * List all active expeditions with optional category and weight tariff calculation.
     */
    /**
     * List all active expeditions with optional category and weight tariff calculation.
     */
    public function index(Request $request): JsonResponse
    {
        $query = ($request->boolean('all') || $request->boolean('include_inactive'))
            ? Expedition::query()
            : Expedition::active();

        if ($request->filled('category') && $request->query('category') !== 'Semua') {
            $query->byCategory($request->query('category'));
        }

        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('service', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%");
            });
        }

        $expeditions = $query->orderByDesc('is_default')->orderBy('id')->get();

        $weight = (float) ($request->query('weight') ?: 1.0);

        return response()->json([
            'data' => ExpeditionResource::collection($expeditions),
            'meta' => [
                'total' => $expeditions->count(),
                'weight_kg' => $weight,
                'categories' => $this->getCategoriesList(),
            ],
        ]);
    }

    /**
     * Get available expedition categories.
     */
    public function categories(): JsonResponse
    {
        return response()->json([
            'data' => $this->getCategoriesList(),
        ]);
    }

    /**
     * Show single expedition details.
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $query = ($request->boolean('all') || $request->boolean('include_inactive'))
            ? Expedition::query()
            : Expedition::active();

        $expedition = $query->findOrFail($id);

        return response()->json([
            'data' => new ExpeditionResource($expedition),
        ]);
    }

    /**
     * Store a new expedition.
     */
    public function store(StoreExpeditionRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $baseCost = $validated['base_cost'] ?? $validated['baseRate'] ?? $validated['cost'] ?? 10000;
        $cost = $validated['cost'] ?? $baseCost;
        $isDefault = $validated['is_default'] ?? $validated['isDefault'] ?? false;

        if ($isDefault) {
            Expedition::query()->update(['is_default' => false]);
        }

        $expedition = Expedition::create([
            'name' => $validated['name'],
            'code' => strtolower(trim($validated['code'])),
            'service' => $validated['service'],
            'service_grade' => $validated['service_grade'] ?? null,
            'category' => $validated['category'] ?? 'Reguler',
            'etd' => $validated['etd'],
            'rate_type' => $validated['rate_type'] ?? $validated['rateType'] ?? 'per_kg',
            'base_cost' => (float) $baseCost,
            'cost' => (float) $cost,
            'is_free' => (bool) ($validated['is_free'] ?? false),
            'is_active' => (bool) ($validated['is_active'] ?? $validated['isActive'] ?? true),
            'is_default' => (bool) $isDefault,
            'badge' => $validated['badge'] ?? null,
            'description' => $validated['description'] ?? null,
            'tracking_support' => (bool) ($validated['tracking_support'] ?? $validated['trackingSupport'] ?? true),
            'cod_support' => (bool) ($validated['cod_support'] ?? $validated['codSupport'] ?? false),
        ]);

        return response()->json([
            'message' => "Ekspedisi '{$expedition->name}' berhasil ditambahkan.",
            'data' => new ExpeditionResource($expedition),
        ], 201);
    }

    /**
     * Update existing expedition.
     */
    public function update(UpdateExpeditionRequest $request, int $id): JsonResponse
    {
        $expedition = Expedition::findOrFail($id);
        $validated = $request->validated();

        $isDefault = $validated['is_default'] ?? $validated['isDefault'] ?? null;
        if ($isDefault === true) {
            Expedition::where('id', '!=', $id)->update(['is_default' => false]);
        }

        $updateData = [];
        if (isset($validated['name'])) $updateData['name'] = $validated['name'];
        if (isset($validated['code'])) $updateData['code'] = strtolower(trim($validated['code']));
        if (isset($validated['service'])) $updateData['service'] = $validated['service'];
        if (array_key_exists('service_grade', $validated)) $updateData['service_grade'] = $validated['service_grade'];
        if (isset($validated['category'])) $updateData['category'] = $validated['category'];
        if (isset($validated['etd'])) $updateData['etd'] = $validated['etd'];

        if (isset($validated['rate_type']) || isset($validated['rateType'])) {
            $updateData['rate_type'] = $validated['rate_type'] ?? $validated['rateType'];
        }
        if (isset($validated['base_cost']) || isset($validated['baseRate'])) {
            $updateData['base_cost'] = (float) ($validated['base_cost'] ?? $validated['baseRate']);
        }
        if (isset($validated['cost'])) {
            $updateData['cost'] = (float) $validated['cost'];
        }
        if (isset($validated['is_free'])) {
            $updateData['is_free'] = (bool) $validated['is_free'];
        }
        if (isset($validated['is_active']) || isset($validated['isActive'])) {
            $updateData['is_active'] = (bool) ($validated['is_active'] ?? $validated['isActive']);
        }
        if ($isDefault !== null) {
            $updateData['is_default'] = (bool) $isDefault;
        }
        if (array_key_exists('badge', $validated)) {
            $updateData['badge'] = $validated['badge'];
        }
        if (array_key_exists('description', $validated)) {
            $updateData['description'] = $validated['description'];
        }
        if (isset($validated['tracking_support']) || isset($validated['trackingSupport'])) {
            $updateData['tracking_support'] = (bool) ($validated['tracking_support'] ?? $validated['trackingSupport']);
        }
        if (isset($validated['cod_support']) || isset($validated['codSupport'])) {
            $updateData['cod_support'] = (bool) ($validated['cod_support'] ?? $validated['codSupport']);
        }

        $expedition->update($updateData);

        return response()->json([
            'message' => "Ekspedisi '{$expedition->name}' berhasil diperbarui.",
            'data' => new ExpeditionResource($expedition->fresh()),
        ]);
    }

    /**
     * Set expedition as default.
     */
    public function setDefault(int $id): JsonResponse
    {
        $expedition = Expedition::findOrFail($id);

        Expedition::where('id', '!=', $id)->update(['is_default' => false]);
        $expedition->update([
            'is_default' => true,
            'is_active' => true,
        ]);

        return response()->json([
            'message' => "Ekspedisi '{$expedition->name}' berhasil dijadikan ekspedisi utama.",
            'data' => new ExpeditionResource($expedition->fresh()),
        ]);
    }

    /**
     * Delete an expedition.
     */
    public function destroy(int $id): JsonResponse
    {
        $expedition = Expedition::findOrFail($id);

        if ($expedition->is_default) {
            return response()->json([
                'message' => 'Tidak dapat menghapus ekspedisi default. Silakan ubah ekspedisi utama terlebih dahulu.',
            ], 422);
        }

        $name = $expedition->name;
        $expedition->delete();

        return response()->json([
            'message' => "Ekspedisi '{$name}' berhasil dihapus.",
        ]);
    }

    /**
     * Calculate shipping cost based on distance and package weight using Indonesian courier matrix / RajaOngkir.
     */
    public function calculateCost(Request $request, \App\Services\ShippingRateService $rateService): JsonResponse
    {
        $validated = $request->validate([
            'address_id' => ['nullable', 'integer', 'exists:shipping_addresses,id'],
            'latitude' => ['nullable', 'numeric'],
            'longitude' => ['nullable', 'numeric'],
            'city' => ['nullable', 'string', 'max:100'],
            'district' => ['nullable', 'string', 'max:100'],
            'weight_kg' => ['nullable', 'numeric', 'min:0.01'],
            'category' => ['nullable', 'string'],
        ]);

        $latitude = $validated['latitude'] ?? null;
        $longitude = $validated['longitude'] ?? null;
        $city = $validated['city'] ?? null;
        $district = $validated['district'] ?? null;

        if (!empty($validated['address_id'])) {
            $address = \App\Models\ShippingAddress::find($validated['address_id']);
            if ($address) {
                $latitude = $latitude ?? $address->latitude;
                $longitude = $longitude ?? $address->longitude;
                $city = $city ?? $address->city;
                $district = $district ?? $address->district;
            }
        }

        $weightKg = (float) ($validated['weight_kg'] ?? 1.0);
        $category = $validated['category'] ?? null;

        $calculation = $rateService->calculateRates(
            $latitude ? (float) $latitude : null,
            $longitude ? (float) $longitude : null,
            $weightKg,
            $city,
            $category,
            $district
        );

        return response()->json([
            'status' => 'success',
            'message' => 'Estimasi biaya kirim berhasil dikalkulasi.',
            'data' => $calculation,
        ]);
    }

    /**
     * Track package delivery status using api.co.id or courier history.
     */
    public function track(Request $request, string $resi, \App\Services\ShippingRateService $rateService): JsonResponse
    {
        $trackingData = $rateService->trackPackage($resi);

        return response()->json([
            'status' => 'success',
            'message' => 'Pelacakan status paket berhasil diambil.',
            'data' => $trackingData,
        ]);
    }

    /**
     * Internal helper to retrieve category list.
     */
    protected function getCategoriesList(): array
    {
        return [
            'Semua',
            'Reguler',
            'Instan & Same Day',
            'Next Day',
            'Kargo',
        ];
    }
}

