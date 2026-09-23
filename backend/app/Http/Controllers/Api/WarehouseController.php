<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Warehouse;
use App\Services\IdentityCodeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class WarehouseController extends Controller
{
    /**
     * Display a listing of warehouses with search, filters, and pagination.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Warehouse::query()->withCount(['bins', 'inventoryBalances', 'purchaseOrders']);

        // General search across code, name, city, province, address
        $search = $request->input('search') ?? $request->input('q');
        if (!empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%")
                  ->orWhere('city', 'like', "%{$search}%")
                  ->orWhere('province', 'like', "%{$search}%")
                  ->orWhere('address', 'like', "%{$search}%");
            });
        }

        // Specific code search
        if ($request->filled('code')) {
            $code = $request->input('code');
            $query->where('code', 'like', "%{$code}%");
        }

        // Specific city filter
        if ($request->filled('city')) {
            $city = $request->input('city');
            $query->where('city', 'like', "%{$city}%");
        }

        // Filter by active status
        if ($request->has('is_active') && $request->input('is_active') !== 'all') {
            $query->where('is_active', filter_var($request->input('is_active'), FILTER_VALIDATE_BOOLEAN));
        }

        // Filter by primary status (central hub)
        if ($request->has('is_primary') && $request->input('is_primary') !== 'all') {
            $query->where('is_primary', filter_var($request->input('is_primary'), FILTER_VALIDATE_BOOLEAN));
        }

        // Sorting
        $sortBy = $request->input('sort_by', 'name');
        $sortDir = $request->input('sort_dir', 'asc');
        $allowedSorts = ['name', 'code', 'city', 'province', 'is_primary', 'is_active', 'created_at', 'id'];

        if (in_array($sortBy, $allowedSorts, true)) {
            $query->orderBy($sortBy, $sortDir === 'desc' ? 'desc' : 'asc');
        } else {
            $query->orderBy('name', 'asc');
        }

        // Return all if requested (useful for select dropdowns)
        if ($request->boolean('all')) {
            $warehouses = $query->get();
            return response()->json([
                'status' => 'success',
                'data' => $warehouses,
                'total' => $warehouses->count(),
            ]);
        }

        $perPage = min((int) ($request->input('per_page') ?: 10), 100);
        $paginated = $query->paginate($perPage);

        return response()->json($paginated);
    }

    /**
     * Store a newly created warehouse.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'nullable|string|max:50|unique:warehouses,code',
            'address' => 'required|string',
            'city' => 'required|string|max:100',
            'province' => 'required|string|max:100',
            'postal_code' => 'nullable|string|max:20',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
            'is_primary' => 'nullable|boolean',
            'is_active' => 'nullable|boolean',
        ], [
            'name.required' => 'Nama gudang wajib diisi.',
            'code.unique' => 'Kode gudang sudah digunakan oleh fasilitas lain.',
            'address.required' => 'Alamat lengkap gudang wajib diisi.',
            'city.required' => 'Kota/wilayah lokasi gudang wajib diisi.',
            'province.required' => 'Provinsi lokasi gudang wajib diisi.',
        ]);

        if (empty($validated['code'])) {
            $validated['code'] = IdentityCodeService::generate(Warehouse::class, 'WH');
        } else {
            $validated['code'] = strtoupper(trim($validated['code']));
        }

        $validated['is_primary'] = filter_var($request->input('is_primary', false), FILTER_VALIDATE_BOOLEAN);
        $validated['is_active'] = filter_var($request->input('is_active', true), FILTER_VALIDATE_BOOLEAN);

        return DB::transaction(function () use ($validated) {
            if ($validated['is_primary']) {
                Warehouse::where('is_primary', true)->update(['is_primary' => false]);
            }

            $warehouse = Warehouse::create($validated);

            return response()->json([
                'status' => 'success',
                'message' => "Fasilitas gudang '{$warehouse->name}' berhasil ditambahkan.",
                'data' => $warehouse,
            ], 201);
        });
    }

    /**
     * Display the specified warehouse.
     */
    public function show(string $id): JsonResponse
    {
        $warehouse = Warehouse::where('id', $id)
            ->orWhere('code', $id)
            ->withCount(['bins', 'inventoryBalances', 'purchaseOrders'])
            ->with(['bins', 'purchaseOrders' => function ($q) {
                $q->latest()->limit(10);
            }])
            ->firstOrFail();

        return response()->json([
            'status' => 'success',
            'data' => $warehouse,
        ]);
    }

    /**
     * Update the specified warehouse.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $warehouse = Warehouse::where('id', $id)->orWhere('code', $id)->firstOrFail();

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'code' => ['sometimes', 'required', 'string', 'max:50', Rule::unique('warehouses', 'code')->ignore($warehouse->id)],
            'address' => 'sometimes|required|string',
            'city' => 'sometimes|required|string|max:100',
            'province' => 'sometimes|required|string|max:100',
            'postal_code' => 'nullable|string|max:20',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
            'is_primary' => 'nullable|boolean',
            'is_active' => 'nullable|boolean',
        ], [
            'name.required' => 'Nama gudang wajib diisi.',
            'code.unique' => 'Kode gudang sudah digunakan oleh fasilitas lain.',
            'address.required' => 'Alamat lengkap gudang wajib diisi.',
            'city.required' => 'Kota/wilayah lokasi gudang wajib diisi.',
            'province.required' => 'Provinsi lokasi gudang wajib diisi.',
        ]);

        if (isset($validated['code'])) {
            $validated['code'] = strtoupper(trim($validated['code']));
        }

        return DB::transaction(function () use ($warehouse, $validated, $request) {
            if ($request->has('is_primary')) {
                $isPrimary = filter_var($request->input('is_primary'), FILTER_VALIDATE_BOOLEAN);
                $validated['is_primary'] = $isPrimary;
                if ($isPrimary) {
                    Warehouse::where('id', '!=', $warehouse->id)->where('is_primary', true)->update(['is_primary' => false]);
                }
            }

            if ($request->has('is_active')) {
                $validated['is_active'] = filter_var($request->input('is_active'), FILTER_VALIDATE_BOOLEAN);
            }

            $warehouse->update($validated);

            return response()->json([
                'status' => 'success',
                'message' => "Data fasilitas gudang '{$warehouse->name}' berhasil diperbarui.",
                'data' => $warehouse,
            ]);
        });
    }

    /**
     * Toggle active status of the warehouse.
     */
    public function toggleStatus(string $id): JsonResponse
    {
        $warehouse = Warehouse::where('id', $id)->orWhere('code', $id)->firstOrFail();
        $warehouse->is_active = !$warehouse->is_active;
        $warehouse->save();

        $statusText = $warehouse->is_active ? 'diaktifkan' : 'dinonaktifkan';

        return response()->json([
            'status' => 'success',
            'message' => "Status fasilitas gudang '{$warehouse->name}' berhasil {$statusText}.",
            'data' => $warehouse,
        ]);
    }

    /**
     * Remove the specified warehouse.
     */
    public function destroy(string $id): JsonResponse
    {
        $warehouse = Warehouse::where('id', $id)->orWhere('code', $id)->firstOrFail();

        // Check if warehouse is referenced in purchase orders
        if ($warehouse->purchaseOrders()->exists()) {
            return response()->json([
                'status' => 'error',
                'message' => "Gudang '{$warehouse->name}' tidak dapat dihapus karena memiliki riwayat transaksi Purchase Order. Silakan nonaktifkan status gudang sebagai gantinya.",
            ], 422);
        }

        // Check if warehouse has on-hand inventory balances > 0
        if ($warehouse->inventoryBalances()->where('on_hand_stock', '>', 0)->exists()) {
            return response()->json([
                'status' => 'error',
                'message' => "Gudang '{$warehouse->name}' tidak dapat dihapus karena masih memiliki saldo stok fisik barang. Lakukan mutasi pengeluaran stok terlebih dahulu.",
            ], 422);
        }

        $warehouse->delete();

        return response()->json([
            'status' => 'success',
            'message' => "Fasilitas gudang '{$warehouse->name}' berhasil dihapus.",
        ]);
    }
}
