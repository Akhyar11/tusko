<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Warehouse;
use App\Models\WarehouseBin;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class WarehouseBinController extends Controller
{
    /**
     * Daftar rak/bin pada sebuah gudang (server-side search + pagination).
     */
    public function index(Request $request, string $idOrCode): JsonResponse
    {
        $warehouse = $this->resolveWarehouse($idOrCode);

        $query = WarehouseBin::query()
            ->where('warehouse_id', $warehouse->id)
            ->withCount('inventoryBalances');

        if ($request->filled('search')) {
            $search = trim((string) $request->query('search'));
            $query->where(function ($q) use ($search) {
                $q->where('bin_code', 'like', "%{$search}%")
                    ->orWhere('zone', 'like', "%{$search}%");
            });
        }

        if ($request->filled('zone')) {
            $query->where('zone', $request->query('zone'));
        }

        match ($request->query('sort', 'latest')) {
            'code_asc' => $query->orderBy('bin_code'),
            'code_desc' => $query->orderByDesc('bin_code'),
            'oldest' => $query->oldest(),
            default => $query->latest(),
        };

        $perPage = min(100, max(1, (int) $request->query('per_page', 15)));
        $bins = $query->paginate($perPage);

        return response()->json([
            'status' => 'success',
            'data' => $bins->items(),
            'meta' => [
                'current_page' => $bins->currentPage(),
                'last_page' => $bins->lastPage(),
                'per_page' => $bins->perPage(),
                'total' => $bins->total(),
            ],
        ]);
    }

    /**
     * Tambah rak/bin baru pada gudang.
     */
    public function store(Request $request, string $idOrCode): JsonResponse
    {
        $warehouse = $this->resolveWarehouse($idOrCode);

        $validated = $request->validate([
            'bin_code' => [
                'required',
                'string',
                'max:100',
                Rule::unique('warehouse_bins', 'bin_code')->where('warehouse_id', $warehouse->id),
            ],
            'zone' => 'nullable|string|max:100',
            'notes' => 'nullable|string|max:500',
        ]);

        $bin = WarehouseBin::create([
            'warehouse_id' => $warehouse->id,
            'bin_code' => $validated['bin_code'],
            'zone' => $validated['zone'] ?? null,
            'notes' => $validated['notes'] ?? null,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => "Rak {$bin->bin_code} berhasil ditambahkan.",
            'data' => $bin,
        ], 201);
    }

    /**
     * Perbarui rak/bin.
     */
    public function update(Request $request, string $idOrCode, string $binId): JsonResponse
    {
        $warehouse = $this->resolveWarehouse($idOrCode);
        $bin = WarehouseBin::where('warehouse_id', $warehouse->id)->findOrFail($binId);

        $validated = $request->validate([
            'bin_code' => [
                'sometimes',
                'required',
                'string',
                'max:100',
                Rule::unique('warehouse_bins', 'bin_code')
                    ->where('warehouse_id', $warehouse->id)
                    ->ignore($bin->id),
            ],
            'zone' => 'nullable|string|max:100',
            'notes' => 'nullable|string|max:500',
        ]);

        $bin->update($validated);

        return response()->json([
            'status' => 'success',
            'message' => "Rak {$bin->bin_code} berhasil diperbarui.",
            'data' => $bin->fresh(),
        ]);
    }

    /**
     * Hapus rak/bin (ditolak bila masih direferensikan saldo stok).
     */
    public function destroy(string $idOrCode, string $binId): JsonResponse
    {
        $warehouse = $this->resolveWarehouse($idOrCode);
        $bin = WarehouseBin::where('warehouse_id', $warehouse->id)->findOrFail($binId);

        if ($bin->inventoryBalances()->exists()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Rak tidak dapat dihapus karena masih memiliki saldo stok terkait.',
            ], 422);
        }

        $bin->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Rak berhasil dihapus.',
        ]);
    }

    private function resolveWarehouse(string $idOrCode): Warehouse
    {
        return Warehouse::where('id', $idOrCode)
            ->orWhere('code', $idOrCode)
            ->firstOrFail();
    }
}
