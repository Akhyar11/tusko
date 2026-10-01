<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SizeChart;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Master Panduan Ukuran (size chart) — per kategori + default fallback.
 *
 * - Publik: resolusi chart untuk kategori produk (dipakai detail produk).
 * - Admin: CRUD master beserta baris konversi.
 */
class SizeChartController extends Controller
{
    public function publicShow(Request $request): JsonResponse
    {
        $categoryId = $request->query('category_id');
        $chart = SizeChart::resolveForCategory($categoryId ? (int) $categoryId : null);

        if (! $chart) {
            return response()->json(['data' => ['name' => null, 'rows' => []]]);
        }

        $chart->load('rows');

        return response()->json([
            'data' => [
                'id' => $chart->id,
                'name' => $chart->name,
                'rows' => $chart->rows->map(fn ($row) => [
                    'uk' => $row->uk,
                    'eur' => $row->eur,
                    'us' => $row->us,
                    'cm' => $row->cm,
                    'raw_size' => $row->raw_size,
                ])->values(),
            ],
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        $query = SizeChart::query()->with('category:id,name')->withCount('rows');

        if ($search = $request->query('search')) {
            $query->where('name', 'like', "%{$search}%");
        }
        if ($categoryId = $request->query('category_id')) {
            $query->where('category_id', $categoryId);
        }
        if ($request->filled('status')) {
            $query->where('is_active', $request->query('status') === 'active');
        }

        $perPage = (int) $request->query('per_page', 10);
        $sortBy = (string) $request->query('sort_by', 'sort_order');
        if (! in_array($sortBy, ['name', 'sort_order', 'created_at', 'is_active', 'is_default'], true)) {
            $sortBy = 'sort_order';
        }
        $sortDir = strtolower((string) $request->query('sort_direction', 'asc')) === 'desc' ? 'desc' : 'asc';
        $paginated = $query->orderBy($sortBy, $sortDir)->orderBy('id')->paginate($perPage);

        return response()->json($paginated);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate($this->rules());
        $rows = $validated['rows'] ?? [];
        unset($validated['rows']);

        $chart = DB::transaction(function () use ($validated, $rows) {
            if (! empty($validated['is_default'])) {
                SizeChart::query()->update(['is_default' => false]);
            }
            $chart = SizeChart::create($validated);
            $this->syncRows($chart, $rows);

            return $chart;
        });

        return response()->json([
            'message' => 'Panduan ukuran berhasil disimpan.',
            'data' => $chart->load('rows'),
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        return response()->json(['data' => SizeChart::with('rows')->findOrFail($id)]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $chart = SizeChart::findOrFail($id);
        $validated = $request->validate($this->rules());
        $rows = $validated['rows'] ?? [];
        unset($validated['rows']);

        DB::transaction(function () use ($chart, $validated, $rows) {
            if (! empty($validated['is_default'])) {
                SizeChart::query()->whereKeyNot($chart->id)->update(['is_default' => false]);
            }
            $chart->update($validated);
            $chart->rows()->delete();
            $this->syncRows($chart, $rows);
        });

        return response()->json([
            'message' => 'Panduan ukuran berhasil diperbarui.',
            'data' => $chart->fresh()->load('rows'),
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        SizeChart::findOrFail($id)->delete();

        return response()->json(['message' => 'Panduan ukuran berhasil dihapus.']);
    }

    private function rules(): array
    {
        return [
            'name' => 'required|string|max:150',
            'category_id' => 'nullable|integer|exists:categories,id',
            'is_default' => 'nullable|boolean',
            'is_active' => 'nullable|boolean',
            'sort_order' => 'nullable|integer|min:0',
            'rows' => 'nullable|array',
            'rows.*.uk' => 'nullable|string|max:50',
            'rows.*.eur' => 'nullable|string|max:50',
            'rows.*.us' => 'nullable|string|max:50',
            'rows.*.cm' => 'nullable|string|max:50',
            'rows.*.raw_size' => 'nullable|string|max:50',
        ];
    }

    private function syncRows(SizeChart $chart, array $rows): void
    {
        foreach (array_values($rows) as $index => $row) {
            $chart->rows()->create([
                'uk' => $row['uk'] ?? null,
                'eur' => $row['eur'] ?? null,
                'us' => $row['us'] ?? null,
                'cm' => $row['cm'] ?? null,
                'raw_size' => $row['raw_size'] ?? null,
                'sort_order' => $index,
            ]);
        }
    }
}
