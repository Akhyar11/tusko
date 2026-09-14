<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
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
        $query = PurchaseOrder::with(['vendor', 'warehouse', 'items.product', 'items.variant']);

        if ($request->filled('vendor_id')) {
            $query->where('vendor_id', $request->input('vendor_id'));
        }

        if ($request->filled('status') && $request->input('status') !== 'all') {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('search')) {
            $search = trim($request->input('search'));
            $query->where(function ($q) use ($search) {
                $q->where('po_number', 'like', "%{$search}%")
                    ->orWhereHas('vendor', function ($vq) use ($search) {
                        $vq->where('company_name', 'like', "%{$search}%")
                            ->orWhere('code', 'like', "%{$search}%");
                    });
            });
        }

        $sortBy = $request->input('sort_by', 'created_at');
        $sortDir = $request->input('sort_dir', 'desc');
        $allowedSorts = ['id', 'po_number', 'total_amount', 'order_date', 'status', 'created_at'];
        if (in_array($sortBy, $allowedSorts, true)) {
            $query->orderBy($sortBy, $sortDir === 'asc' ? 'asc' : 'desc');
        } else {
            $query->latest();
        }

        $perPage = max(1, min(100, (int) $request->input('per_page', 10)));
        $paginated = $query->paginate($perPage);

        return response()->json([
            'status' => 'success',
            'data' => $paginated->items(),
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
                'status' => 'approved',
                'total_amount' => $totalAmount,
                'order_date' => now()->toDateString(),
                'expected_delivery_date' => $validated['expected_delivery_date'] ?? null,
                'created_by' => $request->user()?->id,
                'notes' => $validated['notes'] ?? null,
            ]);

            foreach ($itemsData as $it) {
                $po->items()->create($it);
            }

            $po->load(['vendor', 'warehouse', 'items.product', 'items.variant']);

            return response()->json([
                'status' => 'success',
                'message' => 'Purchase Order berhasil diterbitkan.',
                'data' => $po,
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
            'data' => $po,
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
        ]);

        return DB::transaction(function () use ($po, $validated, $request) {
            $dateStr = now()->format('Ym');
            $grnCount = GoodsReceivingNote::whereYear('created_at', now()->year)
                ->whereMonth('created_at', now()->month)
                ->count() + 1;
            $grnNumber = sprintf('GRN-%s-%03d', $dateStr, $grnCount);

            $grn = GoodsReceivingNote::create([
                'grn_number' => $grnNumber,
                'purchase_order_id' => $po->id,
                'warehouse_id' => $po->warehouse_id,
                'received_by' => $request->user()?->id,
                'received_date' => now()->toDateString(),
                'delivery_order_number' => $validated['delivery_order_number'] ?? ('DO-' . substr((string) time(), -6)),
                'status' => 'verified',
                'notes' => $validated['notes'] ?? null,
            ]);

            $totalBillAmount = 0;
            $allReceived = true;

            foreach ($po->items as $item) {
                $acceptedQty = isset($validated['accepted_quantities'][$item->id])
                    ? max(0, (int) $validated['accepted_quantities'][$item->id])
                    : $item->ordered_quantity;

                if ($acceptedQty < $item->ordered_quantity) {
                    $allReceived = false;
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
                    'rejected_quantity' => 0,
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

            $po->status = $allReceived ? 'received' : 'partially_received';
            $po->save();

            $po->load(['vendor', 'warehouse', 'items.product', 'items.variant', 'receivingNotes.items']);

            return response()->json([
                'status' => 'success',
                'message' => 'Penerimaan barang berhasil diproses dan stok telah diperbarui.',
                'data' => [
                    'purchase_order' => $po,
                    'grn' => $grn->load('items'),
                    'bill' => $bill,
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

        return response()->json([
            'status' => 'success',
            'message' => 'Purchase Order berhasil dibatalkan.',
            'data' => $po,
        ]);
    }
}
