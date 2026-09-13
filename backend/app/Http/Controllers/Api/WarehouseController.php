<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TrackingCheckpointLabel;
use App\Models\Warehouse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WarehouseController extends Controller
{
    /**
     * Display a listing of warehouses.
     */
    public function index(): JsonResponse
    {
        $warehouses = Warehouse::orderByDesc('is_primary')->orderBy('id')->get();

        return response()->json([
            'status' => 'success',
            'data' => $warehouses,
        ]);
    }

    /**
     * Get primary warehouse and tracking checkpoint labels.
     */
    public function primary(): JsonResponse
    {
        $warehouse = Warehouse::where('is_primary', true)->first()
            ?? Warehouse::where('is_active', true)->first();

        $trackingLabels = TrackingCheckpointLabel::orderBy('sort_order')->get();

        return response()->json([
            'status' => 'success',
            'data' => [
                'warehouse' => $warehouse,
                'tracking_labels' => $trackingLabels,
            ],
        ]);
    }

    /**
     * Store a newly created warehouse.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'max:50', 'unique:warehouses,code'],
            'name' => ['required', 'string', 'max:150'],
            'address' => ['required', 'string'],
            'city' => ['required', 'string', 'max:100'],
            'province' => ['required', 'string', 'max:100'],
            'postal_code' => ['nullable', 'string', 'max:20'],
            'latitude' => ['nullable', 'numeric'],
            'longitude' => ['nullable', 'numeric'],
            'is_primary' => ['nullable', 'boolean'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        if (!empty($validated['is_primary'])) {
            Warehouse::where('is_primary', true)->update(['is_primary' => false]);
        }

        $warehouse = Warehouse::create([
            'code' => strtoupper($validated['code']),
            'name' => $validated['name'],
            'address' => $validated['address'],
            'city' => $validated['city'],
            'province' => $validated['province'],
            'postal_code' => $validated['postal_code'] ?? null,
            'latitude' => $validated['latitude'] ?? null,
            'longitude' => $validated['longitude'] ?? null,
            'is_primary' => (bool) ($validated['is_primary'] ?? false),
            'is_active' => (bool) ($validated['is_active'] ?? true),
        ]);

        return response()->json([
            'status' => 'success',
            'message' => "Gudang '{$warehouse->name}' berhasil ditambahkan.",
            'data' => $warehouse,
        ], 201);
    }

    /**
     * Display the specified warehouse.
     */
    public function show(int $id): JsonResponse
    {
        $warehouse = Warehouse::findOrFail($id);

        return response()->json([
            'status' => 'success',
            'data' => $warehouse,
        ]);
    }

    /**
     * Update the specified warehouse.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $warehouse = Warehouse::findOrFail($id);

        $validated = $request->validate([
            'code' => ['sometimes', 'string', 'max:50', 'unique:warehouses,code,' . $warehouse->id],
            'name' => ['sometimes', 'string', 'max:150'],
            'address' => ['sometimes', 'string'],
            'city' => ['sometimes', 'string', 'max:100'],
            'province' => ['sometimes', 'string', 'max:100'],
            'postal_code' => ['nullable', 'string', 'max:20'],
            'latitude' => ['nullable', 'numeric'],
            'longitude' => ['nullable', 'numeric'],
            'is_primary' => ['nullable', 'boolean'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        if (!empty($validated['is_primary'])) {
            Warehouse::where('id', '!=', $warehouse->id)->update(['is_primary' => false]);
        }

        $warehouse->update($validated);

        return response()->json([
            'status' => 'success',
            'message' => "Data gudang '{$warehouse->name}' berhasil diperbarui.",
            'data' => $warehouse->fresh(),
        ]);
    }

    /**
     * Set warehouse as primary central warehouse.
     */
    public function setPrimary(int $id): JsonResponse
    {
        $warehouse = Warehouse::findOrFail($id);

        Warehouse::where('id', '!=', $warehouse->id)->update(['is_primary' => false]);
        $warehouse->update([
            'is_primary' => true,
            'is_active' => true,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => "Gudang '{$warehouse->name}' berhasil dijadikan Gudang Pusat utama toko.",
            'data' => $warehouse->fresh(),
        ]);
    }

    /**
     * Update KiriminAja tracking checkpoint labels.
     */
    public function updateTrackingLabels(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'labels' => ['required', 'array'],
            'labels.*.stage_key' => ['required', 'string'],
            'labels.*.custom_label' => ['required', 'string', 'max:255'],
            'labels.*.description_template' => ['nullable', 'string'],
        ]);

        foreach ($validated['labels'] as $item) {
            TrackingCheckpointLabel::where('stage_key', $item['stage_key'])->update([
                'custom_label' => $item['custom_label'],
                'description_template' => $item['description_template'] ?? null,
            ]);
        }

        $updatedLabels = TrackingCheckpointLabel::orderBy('sort_order')->get();

        return response()->json([
            'status' => 'success',
            'message' => 'Label pelacakan KiriminAja berhasil diperbarui.',
            'data' => $updatedLabels,
        ]);
    }
}
