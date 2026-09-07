<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ExpeditionResource;
use App\Models\Expedition;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ExpeditionController extends Controller
{
    /**
     * List all active expeditions with optional category and weight tariff calculation.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Expedition::active();

        if ($request->filled('category') && $request->query('category') !== 'Semua') {
            $query->byCategory($request->query('category'));
        }

        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('service', 'like', "%{$search}%");
            });
        }

        $expeditions = $query->orderBy('id')->get();

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
    public function show(int $id): JsonResponse
    {
        $expedition = Expedition::active()->findOrFail($id);

        return response()->json([
            'data' => new ExpeditionResource($expedition),
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
