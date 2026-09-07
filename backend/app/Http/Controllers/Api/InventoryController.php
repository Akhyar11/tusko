<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\InventoryProductResource;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InventoryController extends Controller
{
    /**
     * Tampilkan daftar produk stok inventaris dengan filter dan KPI ringkasan.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Product::query()->with(['category', 'images']);

        // 1. Filter Status Stok (safe, low, out_of_stock)
        $stockFilter = $request->query('stock_status', $request->query('status', 'all'));
        if ($stockFilter === 'safe') {
            $query->safeStock();
        } elseif ($stockFilter === 'low') {
            $query->lowStock();
        } elseif ($stockFilter === 'out_of_stock') {
            $query->outOfStock();
        }

        // 2. Filter Kategori
        if ($request->filled('category_id') && $request->category_id !== 'all') {
            $query->where('category_id', $request->category_id);
        } elseif ($request->filled('category') && $request->category !== 'all') {
            $query->whereHas('category', function ($q) use ($request) {
                $q->where('slug', $request->category)
                  ->orWhere('name', $request->category);
            });
        }

        // 3. Filter Pencarian (Nama, SKU, Lokasi Rak Gudang)
        if ($request->filled('search')) {
            $search = trim($request->search);
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('sku', 'like', "%{$search}%")
                  ->orWhere('warehouse_bin', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // 4. Pengurutan (Sorting)
        $sort = $request->query('sort', 'latest');
        match ($sort) {
            'stock_asc' => $query->orderBy('stock', 'asc'),
            'stock_desc' => $query->orderBy('stock', 'desc'),
            'name_asc' => $query->orderBy('name', 'asc'),
            'name_desc' => $query->orderBy('name', 'desc'),
            'price_asc' => $query->orderBy('price', 'asc'),
            'price_desc' => $query->orderBy('price', 'desc'),
            default => $query->latest(),
        };

        // 5. Kalkulasi KPI Inventaris Keseluruhan
        $allProducts = Product::all();
        $totalItems = 0;
        $totalAssetCost = 0.0;
        $totalRetailValue = 0.0;
        $safeStockCount = 0;
        $lowStockCount = 0;
        $outOfStockCount = 0;

        foreach ($allProducts as $p) {
            $totalItems += (int) $p->stock;
            $cost = (float) ($p->cost_price ?: ($p->price * 0.65));
            $totalAssetCost += $p->stock * $cost;
            $totalRetailValue += $p->stock * (float) $p->price;

            if ($p->isOutOfStock()) {
                $outOfStockCount++;
            } elseif ($p->isLowStock()) {
                $lowStockCount++;
            } else {
                $safeStockCount++;
            }
        }

        $stats = [
            'sku_count' => $allProducts->count(),
            'total_items' => $totalItems,
            'total_asset_cost' => round($totalAssetCost, 2),
            'total_retail_value' => round($totalRetailValue, 2),
            'safe_stock_count' => $safeStockCount,
            'low_stock_count' => $lowStockCount,
            'out_of_stock_count' => $outOfStockCount,
        ];

        // 6. Pagination
        $perPage = min(100, max(1, (int) $request->query('per_page', 15)));
        $products = $query->paginate($perPage);

        // Kategori untuk dropdown filter
        $categories = Category::select(['id', 'name', 'slug'])->get();

        return response()->json([
            'status' => 'success',
            'data' => InventoryProductResource::collection($products),
            'stats' => $stats,
            'categories' => $categories,
            'meta' => [
                'current_page' => $products->currentPage(),
                'last_page' => $products->lastPage(),
                'per_page' => $products->perPage(),
                'total' => $products->total(),
            ],
        ]);
    }

    /**
     * Tampilkan detail stok produk tertentu berserta mutasi stoknya.
     */
    public function show(string $idOrSku): JsonResponse
    {
        $product = Product::with(['category', 'images', 'stockMutations'])
            ->where(function ($q) use ($idOrSku) {
                if (is_numeric($idOrSku)) {
                    $q->where('id', (int) $idOrSku)->orWhere('sku', $idOrSku);
                } else {
                    $q->where('sku', $idOrSku)->orWhere('slug', $idOrSku);
                }
            })
            ->firstOrFail();

        return response()->json([
            'status' => 'success',
            'data' => new InventoryProductResource($product),
            'mutations' => \App\Http\Resources\StockMutationResource::collection($product->stockMutations),
        ]);
    }

    /**
     * Tambah stok produk (restock) disertai pencatatan riwayat mutasi.
     */
    public function addStock(Request $request, ?string $idOrSku = null): JsonResponse
    {
        $targetIdOrSku = $idOrSku ?: $request->input('product_id');

        if (!$targetIdOrSku) {
            return response()->json([
                'status' => 'error',
                'message' => 'ID atau SKU produk wajib disertakan.',
                'errors' => ['product_id' => ['Produk wajib dipilih.']],
            ], 422);
        }

        $product = Product::with(['category', 'images'])
            ->where(function ($q) use ($targetIdOrSku) {
                if (is_numeric($targetIdOrSku)) {
                    $q->where('id', (int) $targetIdOrSku)->orWhere('sku', $targetIdOrSku);
                } else {
                    $q->where('sku', $targetIdOrSku)->orWhere('slug', $targetIdOrSku);
                }
            })
            ->firstOrFail();

        $validated = $request->validate([
            'quantity' => 'required|integer|min:1',
            'cost_price' => 'nullable|numeric|min:0',
            'supplier' => 'nullable|string|max:255',
            'po_number' => 'nullable|string|max:100',
            'warehouse_bin' => 'nullable|string|max:100',
            'notes' => 'nullable|string|max:500',
            'operator' => 'nullable|string|max:100',
            'sync_to_cashflow' => 'nullable|boolean',
        ]);

        return \Illuminate\Support\Facades\DB::transaction(function () use ($product, $validated) {
            $quantity = (int) $validated['quantity'];
            $stockBefore = (int) $product->stock;
            $stockAfter = $stockBefore + $quantity;

            $updateData = [
                'stock' => $stockAfter,
                'last_restock_at' => \Carbon\Carbon::now(),
            ];

            if (isset($validated['cost_price']) && $validated['cost_price'] !== null) {
                $updateData['cost_price'] = $validated['cost_price'];
            }
            if (!empty($validated['warehouse_bin'])) {
                $updateData['warehouse_bin'] = $validated['warehouse_bin'];
            }

            $product->update($updateData);

            $poNumber = $validated['po_number'] ?? ('PO/' . date('Ymd') . '/' . mt_rand(1000, 9999));
            $supplier = $validated['supplier'] ?? null;
            $notes = $validated['notes'] ?? ("Penerimaan barang masuk +{$quantity} unit" . ($supplier ? " dari {$supplier}" : ''));
            $operator = $validated['operator'] ?? 'Admin Gudang';

            $mutation = \App\Models\StockMutation::create([
                'product_id' => $product->id,
                'type' => 'in',
                'quantity' => $quantity,
                'stock_before' => $stockBefore,
                'stock_after' => $stockAfter,
                'reference_type' => 'manual_restock',
                'reference_id' => $poNumber,
                'notes' => $notes,
                'created_by' => $operator,
            ]);

            // Sinkronisasi otomatis ke buku kas pengeluaran jika diminta
            $syncCashflow = filter_var($validated['sync_to_cashflow'] ?? false, FILTER_VALIDATE_BOOLEAN);
            $cost = (float) ($validated['cost_price'] ?? ($product->cost_price ?? 0));
            $totalCost = $quantity * $cost;

            if ($syncCashflow && $totalCost > 0) {
                \App\Models\Transaction::create([
                    'transaction_number' => \App\Models\Transaction::generateTransactionNumber('expense'),
                    'type' => 'expense',
                    'category' => 'restock',
                    'category_label' => 'Pengadaan Stok Produk',
                    'amount' => $totalCost,
                    'description' => "Pengadaan restock {$quantity}x {$product->name} (PO: {$mutation->reference_id})",
                    'payment_method' => 'Kas Toko / Pengadaan Supplier',
                    'status' => 'settled',
                    'customer_name' => $supplier ?: 'Supplier Gudang',
                    'notes' => $notes,
                ]);
            }

            return response()->json([
                'status' => 'success',
                'message' => "Berhasil menambahkan +{$quantity} unit stok untuk {$product->name}.",
                'data' => [
                    'product' => new InventoryProductResource($product->fresh(['category', 'images'])),
                    'mutation' => new \App\Http\Resources\StockMutationResource($mutation->load('product')),
                ],
            ], 200);
        });
    }

    /**
     * Tampilkan riwayat log mutasi pergerakan stok.
     */
    public function mutations(Request $request, ?string $idOrSku = null): JsonResponse
    {
        $query = \App\Models\StockMutation::with('product')->latest();

        $targetIdOrSku = $idOrSku ?: $request->query('product_id');
        if ($targetIdOrSku) {
            $query->whereHas('product', function ($q) use ($targetIdOrSku) {
                if (is_numeric($targetIdOrSku)) {
                    $q->where('id', (int) $targetIdOrSku)->orWhere('sku', $targetIdOrSku);
                } else {
                    $q->where('sku', $targetIdOrSku)->orWhere('slug', $targetIdOrSku);
                }
            });
        }

        if ($request->filled('type') && in_array($request->type, ['in', 'out', 'adjustment'])) {
            $query->where('type', $request->type);
        }

        if ($request->filled('search')) {
            $search = trim($request->search);
            $query->where(function ($q) use ($search) {
                $q->where('reference_id', 'like', "%{$search}%")
                  ->orWhere('notes', 'like', "%{$search}%")
                  ->orWhere('created_by', 'like', "%{$search}%")
                  ->orWhereHas('product', function ($pq) use ($search) {
                      $pq->where('name', 'like', "%{$search}%")
                         ->orWhere('sku', 'like', "%{$search}%");
                  });
            });
        }

        $perPage = min(100, max(1, (int) $request->query('per_page', 20)));
        $mutations = $query->paginate($perPage);

        return response()->json([
            'status' => 'success',
            'data' => \App\Http\Resources\StockMutationResource::collection($mutations),
            'meta' => [
                'current_page' => $mutations->currentPage(),
                'last_page' => $mutations->lastPage(),
                'per_page' => $mutations->perPage(),
                'total' => $mutations->total(),
            ],
        ]);
    }

    /**
     * Kurangi stok produk disertai validasi stok mencukupi dan pencatatan riwayat mutasi.
     */
    public function reduceStock(Request $request, ?string $idOrSku = null): JsonResponse
    {
        $targetIdOrSku = $idOrSku ?: $request->input('product_id');

        if (!$targetIdOrSku) {
            return response()->json([
                'status' => 'error',
                'message' => 'ID atau SKU produk wajib disertakan.',
                'errors' => ['product_id' => ['Produk wajib dipilih.']],
            ], 422);
        }

        $product = Product::with(['category', 'images'])
            ->where(function ($q) use ($targetIdOrSku) {
                if (is_numeric($targetIdOrSku)) {
                    $q->where('id', (int) $targetIdOrSku)->orWhere('sku', $targetIdOrSku);
                } else {
                    $q->where('sku', $targetIdOrSku)->orWhere('slug', $targetIdOrSku);
                }
            })
            ->firstOrFail();

        $validated = $request->validate([
            'quantity' => 'required|integer|min:1',
            'reason' => 'nullable|string|in:damage,sample,expired,loss,manual_sale,other',
            'reference' => 'nullable|string|max:100',
            'notes' => 'nullable|string|max:500',
            'operator' => 'nullable|string|max:100',
        ]);

        $quantity = (int) $validated['quantity'];
        $currentStock = (int) $product->stock;

        // Validasi ketersediaan stok
        if ($quantity > $currentStock) {
            return response()->json([
                'status' => 'error',
                'message' => "Jumlah pengurangan ({$quantity} unit) melebihi stok yang tersedia ({$currentStock} unit).",
                'errors' => [
                    'quantity' => ["Jumlah tidak boleh melebihi stok yang tersedia ({$currentStock} unit)."],
                ],
            ], 422);
        }

        return \Illuminate\Support\Facades\DB::transaction(function () use ($product, $validated, $quantity, $currentStock) {
            $stockBefore = $currentStock;
            $stockAfter = $stockBefore - $quantity;

            $product->update([
                'stock' => $stockAfter,
            ]);

            $reasonLabels = [
                'damage' => 'Barang Rusak / Cacat Produksi',
                'sample' => 'Sampel Display & Promosi',
                'expired' => 'Kedaluwarsa / Masa Simpan Habis',
                'loss' => 'Selisih Fisik / Kehilangan Opname',
                'manual_sale' => 'Penjualan Offline / Luar Sistem Online',
                'other' => 'Pengurangan Stok Manual',
            ];

            $reasonKey = $validated['reason'] ?? 'other';
            $reasonLabel = $reasonLabels[$reasonKey] ?? 'Pengurangan Stok';
            $reference = $validated['reference'] ?? ('BA-DED/' . date('Ymd') . '/' . mt_rand(1000, 9999));
            $operator = $validated['operator'] ?? 'Admin Gudang';
            $notes = $validated['notes'] ?? "Pengurangan stok -{$quantity} unit ({$reasonLabel})";

            $mutation = \App\Models\StockMutation::create([
                'product_id' => $product->id,
                'type' => 'out',
                'quantity' => $quantity,
                'stock_before' => $stockBefore,
                'stock_after' => $stockAfter,
                'reference_type' => 'manual_reduce',
                'reference_id' => $reference,
                'notes' => $notes,
                'created_by' => $operator,
            ]);

            return response()->json([
                'status' => 'success',
                'message' => "Berhasil mengurangi -{$quantity} unit dari stok {$product->name}.",
                'data' => [
                    'product' => new InventoryProductResource($product->fresh(['category', 'images'])),
                    'mutation' => new \App\Http\Resources\StockMutationResource($mutation->load('product')),
                ],
            ], 200);
        });
    }

    /**
     * API produk stok menipis dan habis untuk widget alert dashboard admin.
     */
    public function lowStockAlerts(Request $request): JsonResponse
    {
        $typeFilter = $request->query('type', 'all'); // 'all' | 'out_of_stock' | 'low_stock'
        $limit = $request->query('limit') ? (int) $request->query('limit') : null;

        $allProducts = Product::with(['category', 'images'])->get();

        $outOfStockCount = 0;
        $lowStockCount = 0;
        $totalSuggestedUnits = 0;
        $totalEstimatedBudget = 0.0;
        $criticalItems = [];

        foreach ($allProducts as $p) {
            $isOutOfStock = $p->stock <= 0;
            $min = $p->effective_stock_minimum;
            $isLow = $p->stock > 0 && $p->stock <= $min;
            $cost = (float) ($p->cost_price ?: ($p->price * 0.65));

            if ($isOutOfStock || $isLow) {
                if ($isOutOfStock) {
                    $outOfStockCount++;
                    $suggestedUnits = max(10, $min * 2);
                } else {
                    $lowStockCount++;
                    $suggestedUnits = max(5, ($min * 2) - $p->stock);
                }

                $estimatedBudget = $suggestedUnits * $cost;
                $totalSuggestedUnits += $suggestedUnits;
                $totalEstimatedBudget += $estimatedBudget;

                $shouldInclude = false;
                if ($typeFilter === 'out_of_stock' && $isOutOfStock) {
                    $shouldInclude = true;
                } elseif ($typeFilter === 'low_stock' && $isLow) {
                    $shouldInclude = true;
                } elseif ($typeFilter === 'all') {
                    $shouldInclude = true;
                }

                if ($shouldInclude) {
                    $criticalItems[] = [
                        'id' => $p->id,
                        'sku' => $p->sku ?: ('TSK-SKU-' . str_pad((string) $p->id, 5, '0', STR_PAD_LEFT)),
                        'name' => $p->name,
                        'slug' => $p->slug,
                        'category_name' => $p->category?->name,
                        'image_url' => $p->image_url ?: ($p->images->first()?->image_url),
                        'stock' => (int) $p->stock,
                        'stock_minimum' => $min,
                        'cost_price' => $cost,
                        'selling_price' => (float) $p->price,
                        'warehouse_bin' => $p->warehouse_bin ?: 'Gudang Utama',
                        'status' => $isOutOfStock ? 'out_of_stock' : 'low',
                        'is_out_of_stock' => $isOutOfStock,
                        'is_low_stock' => $isLow,
                        'suggested_reorder_units' => $suggestedUnits,
                        'estimated_reorder_budget' => round($estimatedBudget, 2),
                    ];
                }
            }
        }

        // Urutkan: out_of_stock terlebih dahulu, lalu stok paling sedikit
        usort($criticalItems, function ($a, $b) {
            if ($a['stock'] === $b['stock']) {
                return $b['stock_minimum'] <=> $a['stock_minimum'];
            }
            return $a['stock'] <=> $b['stock'];
        });

        if ($limit && count($criticalItems) > $limit) {
            $criticalItems = array_slice($criticalItems, 0, $limit);
        }

        $totalCritical = $outOfStockCount + $lowStockCount;

        return response()->json([
            'status' => 'success',
            'data' => $criticalItems,
            'summary' => [
                'out_of_stock_count' => $outOfStockCount,
                'low_stock_count' => $lowStockCount,
                'total_critical' => $totalCritical,
                'total_suggested_units' => $totalSuggestedUnits,
                'total_estimated_budget' => round($totalEstimatedBudget, 2),
                'is_safe' => $totalCritical === 0,
            ],
        ]);
    }
}
