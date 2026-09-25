<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\InventoryBalance;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\StockOpname;
use App\Models\StockOpnameItem;
use App\Services\ActivityLogService;
use App\Services\IdentityCodeService;
use App\Services\InventoryService;
use App\Services\JournalMappingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StockOpnameController extends Controller
{
    public function __construct(
        private readonly InventoryService $inventory,
        private readonly JournalMappingService $journalMapping,
        private readonly ActivityLogService $activityLog
    ) {
    }

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

        if ($request->filled('conducted_from')) {
            $query->whereDate('conducted_at', '>=', $request->query('conducted_from'));
        }

        if ($request->filled('conducted_to')) {
            $query->whereDate('conducted_at', '<=', $request->query('conducted_to'));
        }

        if ($request->filled('items_min')) {
            $query->has('items', '>=', (int) $request->query('items_min'));
        }

        if ($request->filled('items_max')) {
            $query->has('items', '<=', (int) $request->query('items_max'));
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
     * Setujui sesi opname: sesuaikan stok (inventory_balances + stock_mutations)
     * + posting jurnal selisih (T34.1) + audit log (G9) — T25.4.
     */
    public function approve(Request $request, string $idOrNumber): JsonResponse
    {
        $opname = StockOpname::with(['warehouse', 'items.product', 'items.variant'])
            ->where('id', $idOrNumber)
            ->orWhere('opname_number', $idOrNumber)
            ->firstOrFail();

        if ($opname->status !== 'in_progress') {
            return response()->json([
                'status' => 'error',
                'message' => 'Hanya sesi opname berstatus in_progress yang dapat disetujui.',
            ], 422);
        }

        DB::transaction(function () use ($opname, $request) {
            foreach ($opname->items as $item) {
                $difference = (int) $item->difference;
                if ($difference === 0 || !$item->product) {
                    continue;
                }

                $this->inventory->adjust($item->product, $difference, [
                    'warehouse' => $opname->warehouse,
                    'reference_type' => 'stock_opname',
                    'reference_id' => $opname->opname_number,
                    'notes' => "Penyesuaian opname {$opname->opname_number}",
                    'created_by' => $request->user()?->id,
                ], $item->variant);
            }

            $opname->update([
                'status' => 'approved',
                'approved_by' => $request->user()?->id,
                'approved_at' => now(),
            ]);

            $this->journalMapping->postStockOpname($opname->fresh('items'));

            $this->activityLog->log('stock_opname.approved', $opname, [
                'opname_number' => $opname->opname_number,
            ]);
        });

        return response()->json([
            'status' => 'success',
            'message' => "Sesi opname {$opname->opname_number} berhasil disetujui dan stok disesuaikan.",
            'data' => $opname->fresh(['warehouse', 'items.product', 'items.variant', 'approver']),
        ]);
    }

    /**
     * Snapshot stok sistem yang KONSISTEN dengan InventoryService (D1):
     * - bila baris saldo gudang sudah ada → pakai `on_hand_stock` apa adanya (termasuk 0);
     * - bila belum ada → pakai stok legacy yang belum ter-account (`legacy - Σ accounted`),
     *   sama persis dengan nilai awal yang akan dibuat InventoryService saat penyesuaian.
     */
    private function systemStock(int $warehouseId, int $productId, ?int $variantId): int
    {
        $balance = InventoryBalance::query()
            ->where('warehouse_id', $warehouseId)
            ->where('product_id', $productId)
            ->when($variantId, fn ($q) => $q->where('product_variant_id', $variantId))
            ->when(!$variantId, fn ($q) => $q->whereNull('product_variant_id'))
            ->first();

        if ($balance) {
            return (int) $balance->on_hand_stock;
        }

        $accounted = (int) InventoryBalance::query()
            ->where('product_id', $productId)
            ->when($variantId, fn ($q) => $q->where('product_variant_id', $variantId))
            ->when(!$variantId, fn ($q) => $q->whereNull('product_variant_id'))
            ->sum('on_hand_stock');

        $legacy = $variantId
            ? (int) (ProductVariant::find($variantId)?->stock ?? 0)
            : (int) (Product::find($productId)?->stock ?? 0);

        return max(0, $legacy - $accounted);
    }
}
