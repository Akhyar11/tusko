<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\InventoryBalance;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\StockOpname;
use App\Models\StockOpnameItem;
use App\Services\IdentityCodeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StockOpnameController extends Controller
{
    /**
     * Daftar sesi stok opname (filter + pagination server-side).
     */
    public function index(Request $request): JsonResponse
    {
        $query = StockOpname::with('warehouse')->withCount('items');

        if ($request->filled('status') && $request->query('status') !== 'all') {
            $query->where('status', $request->query('status'));
        }

        if ($request->filled('warehouse_id')) {
            $query->where('warehouse_id', $request->query('warehouse_id'));
        }

        if ($request->filled('search')) {
            $search = trim((string) $request->query('search'));
            $query->where('opname_number', 'like', "%{$search}%");
        }

        match ($request->query('sort', 'latest')) {
            'oldest' => $query->oldest(),
            default => $query->latest(),
        };

        $perPage = min(100, max(1, (int) $request->query('per_page', 15)));
        $opnames = $query->paginate($perPage);

        return response()->json([
            'status' => 'success',
            'data' => $opnames->items(),
            'meta' => [
                'current_page' => $opnames->currentPage(),
                'last_page' => $opnames->lastPage(),
                'per_page' => $opnames->perPage(),
                'total' => $opnames->total(),
            ],
        ]);
    }

    /**
     * Buat sesi stok opname beserta input fisik awal (snapshot stok sistem).
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'warehouse_id' => 'required|exists:warehouses,id',
            'notes' => 'nullable|string|max:500',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.product_variant_id' => 'nullable|exists:product_variants,id',
            'items.*.physical_stock' => 'required|integer|min:0',
            'items.*.notes' => 'nullable|string|max:255',
        ]);

        $opname = DB::transaction(function () use ($validated, $request) {
            $opname = StockOpname::create([
                'opname_number' => IdentityCodeService::generate(StockOpname::class, 'SO', 'opname_number'),
                'warehouse_id' => $validated['warehouse_id'],
                'status' => 'draft',
                'conducted_by' => $request->user()?->id,
                'conducted_at' => now(),
                'notes' => $validated['notes'] ?? null,
            ]);

            foreach ($validated['items'] as $item) {
                $variantId = $item['product_variant_id'] ?? null;
                $systemStock = $this->systemStock((int) $validated['warehouse_id'], (int) $item['product_id'], $variantId ? (int) $variantId : null);

                StockOpnameItem::create([
                    'stock_opname_id' => $opname->id,
                    'product_id' => $item['product_id'],
                    'product_variant_id' => $variantId,
                    'system_stock' => $systemStock,
                    'physical_stock' => $item['physical_stock'],
                    'difference' => (int) $item['physical_stock'] - $systemStock,
                    'notes' => $item['notes'] ?? null,
                ]);
            }

            return $opname;
        });

        return response()->json([
            'status' => 'success',
            'message' => "Sesi opname {$opname->opname_number} berhasil dibuat.",
            'data' => $opname->load(['warehouse', 'items.product', 'items.variant']),
        ], 201);
    }

    /**
     * Detail sesi stok opname.
     */
    public function show(string $idOrNumber): JsonResponse
    {
        $opname = StockOpname::with(['warehouse', 'items.product', 'items.variant', 'conductor', 'approver'])
            ->where('id', $idOrNumber)
            ->orWhere('opname_number', $idOrNumber)
            ->firstOrFail();

        return response()->json([
            'status' => 'success',
            'data' => $opname,
        ]);
    }

    /**
     * Ajukan sesi opname untuk proses persetujuan (draft -> in_progress).
     */
    public function submit(Request $request, string $idOrNumber): JsonResponse
    {
        $opname = StockOpname::where('id', $idOrNumber)
            ->orWhere('opname_number', $idOrNumber)
            ->firstOrFail();

        if ($opname->status !== 'draft') {
            return response()->json([
                'status' => 'error',
                'message' => 'Hanya sesi opname berstatus draft yang dapat diajukan.',
            ], 422);
        }

        $opname->update([
            'status' => 'in_progress',
            'conducted_by' => $request->user()?->id ?? $opname->conducted_by,
            'conducted_at' => now(),
        ]);

        return response()->json([
            'status' => 'success',
            'message' => "Sesi opname {$opname->opname_number} diajukan untuk persetujuan.",
            'data' => $opname->fresh(['warehouse', 'items']),
        ]);
    }

    /**
     * Snapshot stok sistem pada gudang (fallback ke stok agregat legacy).
     */
    private function systemStock(int $warehouseId, int $productId, ?int $variantId): int
    {
        $balance = InventoryBalance::query()
            ->where('warehouse_id', $warehouseId)
            ->where('product_id', $productId)
            ->when($variantId, fn ($query) => $query->where('product_variant_id', $variantId))
            ->when(!$variantId, fn ($query) => $query->whereNull('product_variant_id'))
            ->sum('on_hand_stock');

        if ((int) $balance > 0) {
            return (int) $balance;
        }

        if ($variantId) {
            return (int) (ProductVariant::find($variantId)?->stock ?? 0);
        }

        return (int) (Product::find($productId)?->stock ?? 0);
    }
}
