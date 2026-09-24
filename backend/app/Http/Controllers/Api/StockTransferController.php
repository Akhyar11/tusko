<?php

namespace App\Http\Controllers\Api;

use App\Exceptions\InsufficientStockException;
use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\StockTransfer;
use App\Models\StockTransferItem;
use App\Services\IdentityCodeService;
use App\Services\InventoryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StockTransferController extends Controller
{
    public function __construct(private readonly InventoryService $inventoryService)
    {
    }

    /**
     * Daftar transfer stok antar gudang (server-side filter + pagination).
     */
    public function index(Request $request): JsonResponse
    {
        $query = StockTransfer::with(['fromWarehouse', 'toWarehouse'])
            ->withCount('items');

        if ($request->filled('status') && $request->query('status') !== 'all') {
            $query->where('status', $request->query('status'));
        }

        if ($request->filled('from_warehouse_id')) {
            $query->where('from_warehouse_id', $request->query('from_warehouse_id'));
        }

        if ($request->filled('to_warehouse_id')) {
            $query->where('to_warehouse_id', $request->query('to_warehouse_id'));
        }

        if ($request->filled('search')) {
            $search = trim((string) $request->query('search'));
            $query->where('transfer_number', 'like', "%{$search}%");
        }

        match ($request->query('sort', 'latest')) {
            'oldest' => $query->oldest(),
            default => $query->latest(),
        };

        $perPage = min(100, max(1, (int) $request->query('per_page', 15)));
        $transfers = $query->paginate($perPage);

        return response()->json([
            'status' => 'success',
            'data' => $transfers->items(),
            'meta' => [
                'current_page' => $transfers->currentPage(),
                'last_page' => $transfers->lastPage(),
                'per_page' => $transfers->perPage(),
                'total' => $transfers->total(),
            ],
        ]);
    }

    /**
     * Buat draft transfer stok antar gudang.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'from_warehouse_id' => 'required|exists:warehouses,id',
            'to_warehouse_id' => 'required|exists:warehouses,id|different:from_warehouse_id',
            'notes' => 'nullable|string|max:500',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.product_variant_id' => 'nullable|exists:product_variants,id',
            'items.*.quantity' => 'required|integer|min:1',
        ]);

        $transfer = DB::transaction(function () use ($validated, $request) {
            $transfer = StockTransfer::create([
                'transfer_number' => IdentityCodeService::generate(StockTransfer::class, 'TRF', 'transfer_number'),
                'from_warehouse_id' => $validated['from_warehouse_id'],
                'to_warehouse_id' => $validated['to_warehouse_id'],
                'status' => 'draft',
                'requested_by' => $request->user()?->id,
                'notes' => $validated['notes'] ?? null,
            ]);

            foreach ($validated['items'] as $item) {
                StockTransferItem::create([
                    'stock_transfer_id' => $transfer->id,
                    'product_id' => $item['product_id'],
                    'product_variant_id' => $item['product_variant_id'] ?? null,
                    'quantity' => $item['quantity'],
                ]);
            }

            return $transfer;
        });

        return response()->json([
            'status' => 'success',
            'message' => "Draft transfer {$transfer->transfer_number} berhasil dibuat.",
            'data' => $transfer->load(['fromWarehouse', 'toWarehouse', 'items.product']),
        ], 201);
    }

    /**
     * Detail transfer stok.
     */
    public function show(string $idOrNumber): JsonResponse
    {
        $transfer = StockTransfer::with(['fromWarehouse', 'toWarehouse', 'items.product', 'items.variant', 'requester', 'approver'])
            ->where('id', $idOrNumber)
            ->orWhere('transfer_number', $idOrNumber)
            ->firstOrFail();

        return response()->json([
            'status' => 'success',
            'data' => $transfer,
        ]);
    }

    /**
     * Setujui & eksekusi transfer (pindahkan stok antar gudang secara atomik).
     */
    public function approve(Request $request, string $idOrNumber): JsonResponse
    {
        $transfer = StockTransfer::with(['fromWarehouse', 'toWarehouse', 'items.product', 'items.variant'])
            ->where('id', $idOrNumber)
            ->orWhere('transfer_number', $idOrNumber)
            ->firstOrFail();

        if ($transfer->status !== 'draft') {
            return response()->json([
                'status' => 'error',
                'message' => 'Hanya transfer berstatus draft yang dapat disetujui.',
            ], 422);
        }

        try {
            DB::transaction(function () use ($transfer, $request) {
                foreach ($transfer->items as $item) {
                    $product = $item->product ?: Product::find($item->product_id);
                    $variant = $item->product_variant_id ? ProductVariant::find($item->product_variant_id) : null;

                    if (!$product) {
                        continue;
                    }

                    $this->inventoryService->decrease($product, $item->quantity, [
                        'reference_type' => 'stock_transfer',
                        'reference_id' => $transfer->transfer_number,
                        'notes' => "Transfer keluar ke {$transfer->toWarehouse?->name}",
                        'created_by' => $request->user()?->name ?? 'Admin Gudang',
                        'warehouse' => $transfer->fromWarehouse,
                    ], $variant);

                    $this->inventoryService->increase($product, $item->quantity, [
                        'reference_type' => 'stock_transfer',
                        'reference_id' => $transfer->transfer_number,
                        'notes' => "Transfer masuk dari {$transfer->fromWarehouse?->name}",
                        'created_by' => $request->user()?->name ?? 'Admin Gudang',
                        'warehouse' => $transfer->toWarehouse,
                    ], $variant);
                }

                $transfer->update([
                    'status' => 'completed',
                    'approved_by' => $request->user()?->id,
                ]);
            });
        } catch (InsufficientStockException $exception) {
            return response()->json([
                'status' => 'error',
                'message' => 'Stok gudang asal tidak mencukupi: ' . $exception->getMessage(),
            ], 422);
        }

        return response()->json([
            'status' => 'success',
            'message' => "Transfer {$transfer->transfer_number} berhasil dieksekusi.",
            'data' => $transfer->fresh(['fromWarehouse', 'toWarehouse', 'items.product', 'items.variant']),
        ]);
    }
}
