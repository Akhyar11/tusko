<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\GoodsReceivingNoteResource;
use App\Http\Resources\PurchaseOrderResource;
use App\Http\Resources\VendorBillResource;
use App\Models\GoodsReceivingItem;
use App\Models\GoodsReceivingNote;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderItem;
use App\Models\StockMutation;
use App\Models\Vendor;
use App\Models\VendorBill;
use App\Models\Warehouse;
use App\Services\IdentityCodeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PurchaseOrderController extends Controller
{
    /**
     * Display a listing of purchase orders.
     */
    public function index(Request $request): JsonResponse
    {
        $query = PurchaseOrder::query()->with(['vendor', 'warehouse', 'items.product', 'items.variant']);

        $vendorId = $request->input('vendor_id');
        if (!empty($vendorId) && $vendorId !== 'all') {
            $query->where('vendor_id', $vendorId);
        }

        $status = $request->input('status', $request->input('statusFilter'));
        if (!empty($status) && $status !== 'all') {
            $query->where('status', $status);
        }

        $warehouse = $request->input('warehouse_id', $request->input('warehouseFilter'));
        if (!empty($warehouse) && $warehouse !== 'all') {
            $query->where('warehouse_id', $warehouse);
        }

        $search = trim((string) $request->input('search', $request->input('searchQuery', '')));
        if ($search !== '') {
            $query->where('po_number', 'like', "%{$search}%");
        }

        $vendorSearch = trim((string) $request->input('vendor_search', $request->input('vendorSearchQuery', '')));
        if ($vendorSearch !== '') {
            $query->whereHas('vendor', function ($vq) use ($vendorSearch) {
                $vq->where('company_name', 'like', "%{$vendorSearch}%")
                    ->orWhere('code', 'like', "%{$vendorSearch}%");
            });
        }

        $orderDateStart = $request->input('order_date_start', $request->input('orderDateStart'));
        if (!empty($orderDateStart)) {
            $query->whereDate('order_date', '>=', $orderDateStart);
        }

        $orderDateEnd = $request->input('order_date_end', $request->input('orderDateEnd'));
        if (!empty($orderDateEnd)) {
            $query->whereDate('order_date', '<=', $orderDateEnd);
        }

        $deliveryStart = $request->input('delivery_date_start', $request->input('deliveryDateStart'));
        if (!empty($deliveryStart)) {
            $query->whereDate('expected_delivery_date', '>=', $deliveryStart);
        }

        $deliveryEnd = $request->input('delivery_date_end', $request->input('deliveryDateEnd'));
        if (!empty($deliveryEnd)) {
            $query->whereDate('expected_delivery_date', '<=', $deliveryEnd);
        }

        $minAmount = $request->input('min_amount', $request->input('minAmount'));
        if ($minAmount !== null && $minAmount !== '') {
            $query->where('total_amount', '>=', (float) $minAmount);
        }

        $maxAmount = $request->input('max_amount', $request->input('maxAmount'));
        if ($maxAmount !== null && $maxAmount !== '') {
            $query->where('total_amount', '<=', (float) $maxAmount);
        }

        $sortBy = $request->input('sort_by', 'created_at');
        $sortDir = $request->input('sort_dir', $request->input('sort_direction', 'desc'));
        $allowedSorts = ['id', 'po_number', 'total_amount', 'order_date', 'expected_delivery_date', 'status', 'created_at'];
        if (in_array($sortBy, $allowedSorts, true)) {
            $query->orderBy($sortBy, $sortDir === 'asc' ? 'asc' : 'desc');
        } else {
            $query->latest();
        }

        $perPage = max(1, min(100, (int) $request->input('per_page', 10)));
        $paginated = $query->paginate($perPage);

        return response()->json([
            'status' => 'success',
            'data' => PurchaseOrderResource::collection($paginated->items()),
            'meta' => [
                'current_page' => $paginated->currentPage(),
                'last_page' => $paginated->lastPage(),
                'per_page' => $paginated->perPage(),
                'total' => $paginated->total(),
            ],
        ]);
    }

    /**
     * Store a newly created purchase order.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'vendor_id' => 'required|exists:vendors,id',
            'warehouse_id' => 'nullable|exists:warehouses,id',
            'status' => 'nullable|in:draft,approved',
            'expected_delivery_date' => 'nullable|date',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.product_variant_id' => 'nullable|exists:product_variants,id',
            'items.*.ordered_quantity' => 'required|integer|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
        ], [
            'vendor_id.required' => 'Mitra vendor/supplier wajib dipilih.',
            'items.required' => 'Item pemesanan stok wajib diisi minimal 1 item.',
            'items.*.ordered_quantity.min' => 'Jumlah pesanan minimal 1 unit.',
        ]);

        $warehouseId = $validated['warehouse_id'] ?? Warehouse::first()?->id ?? 1;

        $dateStr = now()->format('Ym');
        $count = PurchaseOrder::whereYear('created_at', now()->year)
            ->whereMonth('created_at', now()->month)
            ->count() + 1;
        $poNumber = sprintf('PO-%s-%03d', $dateStr, $count);

        return DB::transaction(function () use ($validated, $warehouseId, $poNumber, $request) {
            $totalAmount = 0;
            $itemsData = [];

            foreach ($validated['items'] as $item) {
                $subtotal = $item['ordered_quantity'] * $item['unit_price'];
                $totalAmount += $subtotal;
                $itemsData[] = [
                    'product_id' => $item['product_id'],
                    'product_variant_id' => $item['product_variant_id'] ?? null,
                    'ordered_quantity' => $item['ordered_quantity'],
                    'received_quantity' => 0,
                    'unit_price' => $item['unit_price'],
                    'subtotal' => $subtotal,
                ];
            }

            $po = PurchaseOrder::create([
                'po_number' => $poNumber,
                'vendor_id' => $validated['vendor_id'],
                'warehouse_id' => $warehouseId,
                'status' => $validated['status'] ?? 'approved',
                'total_amount' => $totalAmount,
                'order_date' => now()->toDateString(),
                'expected_delivery_date' => $validated['expected_delivery_date'] ?? null,
                'created_by' => $request->user()?->id,
                'approved_by' => ($validated['status'] ?? 'approved') === 'approved' ? $request->user()?->id : null,
                'notes' => $validated['notes'] ?? null,
            ]);

            foreach ($itemsData as $it) {
                $po->items()->create($it);
            }

            $po->load(['vendor', 'warehouse', 'items.product', 'items.variant']);

            return response()->json([
                'status' => 'success',
                'message' => 'Purchase Order berhasil diterbitkan.',
                'data' => new PurchaseOrderResource($po),
            ], 201);
        });
    }

    /**
     * Display the specified purchase order.
     */
    public function show(string $idOrPoNumber): JsonResponse
    {
        $po = PurchaseOrder::with([
            'vendor',
            'warehouse',
            'items.product',
            'items.variant',
            'receivingNotes.items.product',
            'receivingNotes.items.variant',
        ])->where(function ($q) use ($idOrPoNumber) {
            if (is_numeric($idOrPoNumber)) {
                $q->where('id', (int) $idOrPoNumber)->orWhere('po_number', $idOrPoNumber);
            } else {
                $q->where('po_number', $idOrPoNumber);
            }
        })->first();

        if (!$po) {
            return response()->json([
                'status' => 'error',
                'message' => 'Purchase Order tidak ditemukan.',
            ], 404);
        }

        return response()->json([
            'status' => 'success',
            'data' => new PurchaseOrderResource($po),
        ]);
    }

    /**
     * Receive goods from a Purchase Order (GRN) and update stocks.
     */
    public function receive(Request $request, string $idOrPoNumber): JsonResponse
    {
        $po = PurchaseOrder::with(['items.product', 'items.variant', 'vendor'])
            ->where(function ($q) use ($idOrPoNumber) {
                if (is_numeric($idOrPoNumber)) {
                    $q->where('id', (int) $idOrPoNumber)->orWhere('po_number', $idOrPoNumber);
                } else {
                    $q->where('po_number', $idOrPoNumber);
                }
            })->first();

        if (!$po) {
            return response()->json([
                'status' => 'error',
                'message' => 'Purchase Order tidak ditemukan.',
            ], 404);
        }

        if ($po->status === 'cancelled') {
            return response()->json([
                'status' => 'error',
                'message' => 'Tidak dapat menerima barang untuk PO yang telah dibatalkan.',
            ], 422);
        }

        $validated = $request->validate([
            'delivery_order_number' => 'nullable|string',
            'notes' => 'nullable|string',
            'accepted_quantities' => 'nullable|array', // key: item_id, val: accepted_qty
            'accepted_quantities.*' => 'nullable|integer|min:0',
            'rejected_quantities' => 'nullable|array', // key: item_id, val: rejected_qty (rusak/hilang)
            'rejected_quantities.*' => 'nullable|integer|min:0',
            'rejection_reasons' => 'nullable|array', // key: item_id, val: alasan
            'rejection_reasons.*' => 'nullable|string|max:255',
        ]);

        $acceptedInput = $validated['accepted_quantities'] ?? [];
        $rejectedInput = $validated['rejected_quantities'] ?? [];
        $reasonInput = $validated['rejection_reasons'] ?? [];

        // Validasi kuantitas SEBELUM transaksi agar tidak ada perubahan parsial.
        $plan = [];
        foreach ($po->items as $item) {
            $remaining = max(0, (int) $item->ordered_quantity - (int) $item->received_quantity);
            $acceptedQty = array_key_exists($item->id, $acceptedInput)
                ? max(0, (int) $acceptedInput[$item->id])
                : $remaining;
            $rejectedQty = array_key_exists($item->id, $rejectedInput)
                ? max(0, (int) $rejectedInput[$item->id])
                : 0;

            if (($acceptedQty + $rejectedQty) > $remaining) {
                return response()->json([
                    'status' => 'error',
                    'message' => "Total diterima + ditolak tidak boleh melebihi sisa pesanan ({$remaining} unit).",
                    'errors' => [
                        'accepted_quantities' => ["Jumlah diterima + ditolak melebihi sisa pesanan ({$remaining} unit)."],
                    ],
                ], 422);
            }

            $plan[$item->id] = [
                'accepted' => $acceptedQty,
                'rejected' => $rejectedQty,
                'reason' => $reasonInput[$item->id] ?? null,
            ];
        }

        return DB::transaction(function () use ($po, $validated, $plan, $request) {
            $dateStr = now()->format('Ym');
            $grnCount = GoodsReceivingNote::whereYear('created_at', now()->year)
                ->whereMonth('created_at', now()->month)
                ->count() + 1;
            $grnNumber = sprintf('GRN-%s-%03d', $dateStr, $grnCount);

            $deliveryOrderNumber = trim((string) ($validated['delivery_order_number'] ?? ''));
            if ($deliveryOrderNumber === '') {
                $deliveryOrderNumber = IdentityCodeService::generate(
                    GoodsReceivingNote::class,
                    'DO',
                    'delivery_order_number'
                );
            }

            $grn = GoodsReceivingNote::create([
                'grn_number' => $grnNumber,
                'purchase_order_id' => $po->id,
                'warehouse_id' => $po->warehouse_id,
                'received_by' => $request->user()?->id,
                'received_date' => now()->toDateString(),
                'delivery_order_number' => $deliveryOrderNumber,
                'status' => 'verified',
                'notes' => $validated['notes'] ?? null,
            ]);

            $totalBillAmount = 0;
            $allReceived = true;
            $hasRejection = false;

            foreach ($po->items as $item) {
                $acceptedQty = $plan[$item->id]['accepted'];
                $rejectedQty = $plan[$item->id]['rejected'];
                $remaining = max(0, (int) $item->ordered_quantity - (int) $item->received_quantity);

                if ($acceptedQty < $remaining) {
                    $allReceived = false;
                }
                if ($rejectedQty > 0) {
                    $hasRejection = true;
                }

                $item->received_quantity += $acceptedQty;
                $item->save();

                $totalBillAmount += ($acceptedQty * (float) $item->unit_price);

                // Create GRN item
                GoodsReceivingItem::create([
                    'grn_id' => $grn->id,
                    'product_id' => $item->product_id,
                    'product_variant_id' => $item->product_variant_id,
                    'accepted_quantity' => $acceptedQty,
                    'rejected_quantity' => $rejectedQty,
                    'rejection_reason' => $plan[$item->id]['reason'],
                    'unit_cost' => $item->unit_price,
                    'notes' => $validated['notes'] ?? null,
                ]);

                if ($acceptedQty > 0) {
                    // Update Stock: Variant if present, else Product (Self-Variant)
                    if ($item->product_variant_id) {
                        $variant = ProductVariant::find($item->product_variant_id);
                        if ($variant) {
                            $stockBefore = $variant->stock;
                            $variant->increment('stock', $acceptedQty);
                            $variant->update(['current_cogs' => $item->unit_price]);

                            // Recalculate parent product total stock
                            $parentProduct = Product::find($item->product_id);
                            if ($parentProduct) {
                                $parentProduct->recalculateTotalStockFromVariants();
                                $parentProduct->update(['last_restock_at' => now()]);
                            }

                            // Log stock mutation
                            StockMutation::create([
                                'product_id' => $item->product_id,
                                'type' => 'in',
                                'quantity' => $acceptedQty,
                                'stock_before' => $stockBefore,
                                'stock_after' => $variant->stock,
                                'reference_type' => 'purchase_order',
                                'reference_id' => $po->po_number,
                                'notes' => "Penerimaan PO #{$po->po_number} (Varian: {$variant->variant_name})",
                                'created_by' => $request->user()?->name ?? 'Admin Gudang',
                            ]);
                        }
                    } else {
                        $product = Product::find($item->product_id);
                        if ($product) {
                            $stockBefore = $product->stock;
                            $product->increment('stock', $acceptedQty);
                            $product->update([
                                'cost_price' => $item->unit_price,
                                'last_restock_at' => now(),
                            ]);

                            // Log stock mutation
                            StockMutation::create([
                                'product_id' => $product->id,
                                'type' => 'in',
                                'quantity' => $acceptedQty,
                                'stock_before' => $stockBefore,
                                'stock_after' => $product->stock,
                                'reference_type' => 'purchase_order',
                                'reference_id' => $po->po_number,
                                'notes' => "Penerimaan PO #{$po->po_number} (Single SKU / Unit Utama)",
                                'created_by' => $request->user()?->name ?? 'Admin Gudang',
                            ]);
                        }
                    }
                }
            }

            // Create Vendor Bill
            $billCount = VendorBill::whereYear('created_at', now()->year)
                ->whereMonth('created_at', now()->month)
                ->count() + 1;
            $billNumber = sprintf('BILL-%s-%03d', $dateStr, $billCount);

            $termsDays = $po->vendor?->payment_terms_days ?? 30;
            $bill = VendorBill::create([
                'bill_number' => $billNumber,
                'vendor_id' => $po->vendor_id,
                'purchase_order_id' => $po->id,
                'grn_id' => $grn->id,
                'amount' => $totalBillAmount,
                'paid_amount' => 0.00,
                'status' => 'unpaid',
                'bill_date' => now()->toDateString(),
                'due_date' => now()->addDays($termsDays)->toDateString(),
            ]);

            if ($hasRejection) {
                $grn->update(['status' => 'discrepancy']);
            }

            $po->status = $allReceived ? 'received' : 'partially_received';
            $po->save();

            $po->load(['vendor', 'warehouse', 'items.product', 'items.variant', 'receivingNotes.items']);

            return response()->json([
                'status' => 'success',
                'message' => $hasRejection
                    ? 'Penerimaan barang diproses dengan catatan barang rusak/hilang. Stok & tagihan hanya dihitung dari barang diterima.'
                    : 'Penerimaan barang berhasil diproses dan stok telah diperbarui.',
                'data' => [
                    'purchase_order' => new PurchaseOrderResource($po),
                    'grn' => new GoodsReceivingNoteResource($grn->load(['items.product', 'items.variant', 'purchaseOrder.vendor', 'warehouse', 'receiver'])),
                    'bill' => new VendorBillResource($bill->load(['vendor', 'purchaseOrder', 'receivingNote'])),
                ],
            ]);
        });
    }

    /**
     * Cancel a purchase order.
     */
    public function cancel(string $idOrPoNumber): JsonResponse
    {
        $po = PurchaseOrder::where(function ($q) use ($idOrPoNumber) {
            if (is_numeric($idOrPoNumber)) {
                $q->where('id', (int) $idOrPoNumber)->orWhere('po_number', $idOrPoNumber);
            } else {
                $q->where('po_number', $idOrPoNumber);
            }
        })->first();

        if (!$po) {
            return response()->json([
                'status' => 'error',
                'message' => 'Purchase Order tidak ditemukan.',
            ], 404);
        }

        if (in_array($po->status, ['received', 'partially_received'], true)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Purchase Order yang sudah diterima tidak dapat dibatalkan.',
            ], 422);
        }

        $po->update(['status' => 'cancelled']);

        $po->load(['vendor', 'warehouse', 'items.product', 'items.variant']);

        return response()->json([
            'status' => 'success',
            'message' => 'Purchase Order berhasil dibatalkan.',
            'data' => new PurchaseOrderResource($po),
        ]);
    }

    /**
     * Approve / Authorize a purchase order.
     */
    public function approve(Request $request, string $idOrPoNumber): JsonResponse
    {
        $po = PurchaseOrder::where(function ($q) use ($idOrPoNumber) {
            if (is_numeric($idOrPoNumber)) {
                $q->where('id', (int) $idOrPoNumber)->orWhere('po_number', $idOrPoNumber);
            } else {
                $q->where('po_number', $idOrPoNumber);
            }
        })->first();

        if (!$po) {
            return response()->json([
                'status' => 'error',
                'message' => 'Purchase Order tidak ditemukan.',
            ], 404);
        }

        if ($po->status !== 'draft') {
            return response()->json([
                'status' => 'error',
                'message' => "Hanya dokumen Purchase Order berstatus Draft yang dapat disetujui. Status saat ini: {$po->status}.",
            ], 422);
        }

        $po->update([
            'status' => 'approved',
            'approved_by' => $request->user()?->id,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => "Purchase Order {$po->po_number} berhasil diotorisasi.",
            'data' => new PurchaseOrderResource($po->fresh(['vendor', 'warehouse', 'items.product', 'items.variant'])),
        ]);
    }
}
