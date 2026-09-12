<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductDetailResource;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use App\Models\StockMutation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class ProductController extends Controller
{
    /**
     * Display a listing of products with filtering, searching, sorting, and metrics summary.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Product::query()->with(['category', 'images']);

        // Filter status aktif / inaktif
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        } elseif ($request->has('active') && $request->active !== 'all') {
            $query->where('active', filter_var($request->active, FILTER_VALIDATE_BOOLEAN));
        } elseif (!$request->has('status') && !$request->has('active') && !$request->boolean('include_inactive')) {
            $query->where('active', true)->where('status', 'active');
        }

        // Pencarian kata kunci pada nama, SKU, atau deskripsi
        $search = $request->input('search') ?? $request->input('q');
        if (!empty($search)) {
            $query->search($search);
        }

        // Filter berdasarkan kategori
        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        } elseif ($request->filled('category') && $request->category !== 'all') {
            $query->byCategory($request->category);
        }

        // Filter status stok (low_stock, out_of_stock, safe)
        if ($request->filled('stock_status')) {
            match ($request->stock_status) {
                'low', 'low_stock' => $query->lowStock(),
                'out_of_stock', 'empty' => $query->outOfStock(),
                'safe', 'in_stock' => $query->safeStock(),
                default => null,
            };
        }

        // Filter rentang harga
        if ($request->filled('min_price')) {
            $query->where('price', '>=', (float) $request->min_price);
        }
        if ($request->filled('max_price')) {
            $query->where('price', '<=', (float) $request->max_price);
        }

        // Sorting urutan data
        $sortBy = $request->get('sort_by', 'latest');
        match ($sortBy) {
            'price_asc' => $query->orderBy('price', 'asc'),
            'price_desc' => $query->orderBy('price', 'desc'),
            'name_asc' => $query->orderBy('name', 'asc'),
            'name_desc' => $query->orderBy('name', 'desc'),
            'stock_asc' => $query->orderBy('stock', 'asc'),
            'stock_desc' => $query->orderBy('stock', 'desc'),
            'best_selling', 'popular' => $query->orderBy('sold_count', 'desc'),
            'rating' => $query->orderBy('rating', 'desc'),
            'oldest' => $query->orderBy('created_at', 'asc'),
            default => $query->orderBy('created_at', 'desc'),
        };

        // Pagination
        $perPage = min((int) $request->get('per_page', 12), 100);
        $products = $query->paginate($perPage);

        // Ringkasan metrik inventaris produk
        $summary = [
            'total_sku' => Product::count(),
            'total_stock' => (int) Product::sum('stock'),
            'low_stock_count' => Product::lowStock()->count(),
            'active_count' => Product::where('active', true)->where('status', 'active')->count(),
            'total_asset_value' => (float) (Product::selectRaw('SUM(stock * cost_price) as val')->value('val') ?: 0),
        ];

        return response()->json([
            'status' => 'success',
            'message' => 'Daftar produk berhasil dimuat',
            'data' => ProductResource::collection($products),
            'summary' => $summary,
            'meta' => [
                'current_page' => $products->currentPage(),
                'last_page' => $products->lastPage(),
                'per_page' => $products->perPage(),
                'total' => $products->total(),
            ]
        ]);
    }


    /**
     * Display the specified product by ID or slug.
     */
    public function show(string $idOrSlug): JsonResponse
    {
        $product = Product::with(['category.parent', 'images'])
            ->where(function ($q) use ($idOrSlug) {
                if (is_numeric($idOrSlug)) {
                    $q->where('id', (int) $idOrSlug)->orWhere('slug', $idOrSlug);
                } else {
                    $q->where('slug', $idOrSlug);
                }
            })
            ->first();

        if (!$product) {
            return response()->json([
                'status' => 'error',
                'message' => 'Produk tidak ditemukan'
            ], 404);
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Detail produk berhasil dimuat',
            'data' => new ProductDetailResource($product)
        ]);
    }

    /**
     * Store a newly created product in database.
     */
    public function store(Request $request): JsonResponse
    {
        // Normalisasi camelCase dari frontend React
        if ($request->has('categoryId') && !$request->has('category_id')) {
            $request->merge(['category_id' => $request->input('categoryId')]);
        }
        if ($request->has('originalPrice') && !$request->has('original_price')) {
            $request->merge(['original_price' => $request->input('originalPrice')]);
        }
        if ($request->has('costPrice') && !$request->has('cost_price')) {
            $request->merge(['cost_price' => $request->input('costPrice')]);
        }
        if ($request->has('stockMinimum') && !$request->has('stock_minimum')) {
            $request->merge(['stock_minimum' => $request->input('stockMinimum')]);
        }
        if ($request->has('imageUrl') && !$request->has('image_url')) {
            $request->merge(['image_url' => $request->input('imageUrl')]);
        }
        if ($request->has('galleryUrls') && !$request->has('images')) {
            $request->merge(['images' => $request->input('galleryUrls')]);
        }
        if ($request->has('specList') && !$request->has('specifications')) {
            $specArray = [];
            foreach ($request->input('specList') as $item) {
                if (is_array($item) && !empty($item['key'])) {
                    $specArray[$item['key']] = $item['value'] ?? '';
                }
            }
            $request->merge(['specifications' => $specArray]);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'category_id' => 'required|exists:categories,id',
            'sku' => 'nullable|string|max:100|unique:products,sku',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'original_price' => 'nullable|numeric|min:0',
            'cost_price' => 'nullable|numeric|min:0',
            'stock' => 'nullable|integer|min:0',
            'stock_minimum' => 'nullable|integer|min:0',
            'weight' => 'nullable|integer|min:1',
            'warehouse_bin' => 'nullable|string|max:100',
            'image_url' => 'nullable|string',
            'status' => 'nullable|string|in:active,inactive,draft',
            'active' => 'nullable|boolean',
            'specifications' => 'nullable',
            'variants' => 'nullable',
            'images' => 'nullable|array',
            'images.*' => 'string',
        ], [
            'name.required' => 'Nama produk wajib diisi.',
            'category_id.required' => 'Kategori produk wajib dipilih.',
            'category_id.exists' => 'Kategori yang dipilih tidak valid.',
            'price.required' => 'Harga produk wajib diisi.',
            'price.min' => 'Harga produk tidak boleh negatif.',
            'sku.unique' => 'SKU produk sudah digunakan.',
        ]);

        // Generate unique slug
        $baseSlug = Str::slug($validated['name']);
        $slug = $baseSlug ?: 'produk';
        $counter = 1;
        while (Product::where('slug', $slug)->exists()) {
            $slug = "{$baseSlug}-" . $counter++;
        }

        // Generate guaranteed unique SKU if empty
        if (!empty($validated['sku'])) {
            $sku = strtoupper(trim($validated['sku']));
        } else {
            $catPrefix = strtoupper(substr(preg_replace('/[^A-Za-z0-9]/', '', $slug), 0, 4)) ?: 'PRD';
            $seq = 1;
            $sku = 'TSK-' . $catPrefix . '-' . str_pad($seq, 3, '0', STR_PAD_LEFT);
            while (Product::where('sku', $sku)->exists()) {
                $seq++;
                $sku = 'TSK-' . $catPrefix . '-' . str_pad($seq, 3, '0', STR_PAD_LEFT);
            }
        }

        $status = $validated['status'] ?? 'active';
        $active = isset($validated['active']) ? (bool) $validated['active'] : ($status === 'active');

        $product = Product::create([
            'category_id' => $validated['category_id'],
            'name' => $validated['name'],
            'slug' => $slug,
            'sku' => $sku,
            'description' => $validated['description'] ?? null,
            'price' => $validated['price'],
            'original_price' => $validated['original_price'] ?? null,
            'cost_price' => $validated['cost_price'] ?? round($validated['price'] * 0.65),
            'stock' => $validated['stock'] ?? 0,
            'stock_minimum' => $validated['stock_minimum'] ?? 5,
            'min_stock' => $validated['stock_minimum'] ?? 5,
            'weight' => $validated['weight'] ?? 500,
            'warehouse_bin' => $validated['warehouse_bin'] ?? 'Gudang Utama',
            'image_url' => $validated['image_url'] ?? null,
            'status' => $status,
            'active' => $active,
            'specifications' => $validated['specifications'] ?? null,
            'variants' => $validated['variants'] ?? null,
            'rating' => 5.00,
            'sold_count' => 0,
            'last_restock_at' => ($validated['stock'] ?? 0) > 0 ? now() : null,
        ]);

        // Simpan galeri gambar produk
        if (!empty($validated['images']) && is_array($validated['images'])) {
            foreach ($validated['images'] as $idx => $imgUrl) {
                if (!empty($imgUrl)) {
                    $product->images()->create([
                        'image_url' => $imgUrl,
                        'sort_order' => $idx,
                    ]);
                }
            }
        }

        // Catat mutasi stok masuk awal
        if ($product->stock > 0) {
            StockMutation::create([
                'product_id' => $product->id,
                'type' => 'in',
                'quantity' => $product->stock,
                'stock_before' => 0,
                'stock_after' => $product->stock,
                'reference_type' => 'initial_inventory',
                'reference_id' => $product->sku,
                'notes' => 'Stok awal saat penambahan produk baru',
                'created_by' => $request->user()?->name ?? 'Admin',
            ]);
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Produk baru berhasil ditambahkan.',
            'data' => new ProductResource($product->load(['category', 'images'])),
        ], 201);
    }

    /**
     * Update the specified product in database.
     */
    public function update(Request $request, string $idOrSlug): JsonResponse
    {
        $product = Product::where(function ($q) use ($idOrSlug) {
            if (is_numeric($idOrSlug)) {
                $q->where('id', (int) $idOrSlug)->orWhere('slug', $idOrSlug);
            } else {
                $q->where('slug', $idOrSlug);
            }
        })->first();

        if (!$product) {
            return response()->json([
                'status' => 'error',
                'message' => 'Produk tidak ditemukan.',
            ], 404);
        }

        // Normalisasi camelCase dari frontend React
        if ($request->has('categoryId') && !$request->has('category_id')) {
            $request->merge(['category_id' => $request->input('categoryId')]);
        }
        if ($request->has('originalPrice') && !$request->has('original_price')) {
            $request->merge(['original_price' => $request->input('originalPrice')]);
        }
        if ($request->has('costPrice') && !$request->has('cost_price')) {
            $request->merge(['cost_price' => $request->input('costPrice')]);
        }
        if ($request->has('stockMinimum') && !$request->has('stock_minimum')) {
            $request->merge(['stock_minimum' => $request->input('stockMinimum')]);
        }
        if ($request->has('imageUrl') && !$request->has('image_url')) {
            $request->merge(['image_url' => $request->input('imageUrl')]);
        }
        if ($request->has('galleryUrls') && !$request->has('images')) {
            $request->merge(['images' => $request->input('galleryUrls')]);
        }
        if ($request->has('specList') && !$request->has('specifications')) {
            $specArray = [];
            foreach ($request->input('specList') as $item) {
                if (is_array($item) && !empty($item['key'])) {
                    $specArray[$item['key']] = $item['value'] ?? '';
                }
            }
            $request->merge(['specifications' => $specArray]);
        }

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'category_id' => 'sometimes|required|exists:categories,id',
            'sku' => ['nullable', 'string', 'max:100', Rule::unique('products', 'sku')->ignore($product->id)],
            'description' => 'nullable|string',
            'price' => 'sometimes|required|numeric|min:0',
            'original_price' => 'nullable|numeric|min:0',
            'cost_price' => 'nullable|numeric|min:0',
            'stock' => 'nullable|integer|min:0',
            'stock_minimum' => 'nullable|integer|min:0',
            'weight' => 'nullable|integer|min:1',
            'warehouse_bin' => 'nullable|string|max:100',
            'image_url' => 'nullable|string',
            'status' => 'nullable|string|in:active,inactive,draft',
            'active' => 'nullable|boolean',
            'specifications' => 'nullable',
            'variants' => 'nullable',
            'images' => 'nullable|array',
            'images.*' => 'string',
        ], [
            'name.required' => 'Nama produk wajib diisi.',
            'category_id.exists' => 'Kategori yang dipilih tidak valid.',
            'price.required' => 'Harga produk wajib diisi.',
            'price.min' => 'Harga produk tidak boleh negatif.',
            'sku.unique' => 'SKU produk sudah digunakan oleh produk lain.',
        ]);

        // Perbarui slug jika nama berubah
        if (!empty($validated['name']) && $validated['name'] !== $product->name) {
            $baseSlug = Str::slug($validated['name']);
            $slug = $baseSlug ?: 'produk';
            $counter = 1;
            while (Product::where('slug', $slug)->where('id', '!=', $product->id)->exists()) {
                $slug = "{$baseSlug}-" . $counter++;
            }
            $product->slug = $slug;
            $product->name = $validated['name'];
        }

        // Perbarui mutasi stok jika nilai stock diubah
        if (array_key_exists('stock', $validated)) {
            $newStock = (int) $validated['stock'];
            $stockDiff = $newStock - $product->stock;
            if ($stockDiff !== 0) {
                StockMutation::create([
                    'product_id' => $product->id,
                    'type' => $stockDiff > 0 ? 'in' : 'out',
                    'quantity' => abs($stockDiff),
                    'stock_before' => $product->stock,
                    'stock_after' => $newStock,
                    'reference_type' => 'adjustment',
                    'reference_id' => $product->sku,
                    'notes' => 'Penyesuaian stok melalui pembaruan produk',
                    'created_by' => $request->user()?->name ?? 'Admin',
                ]);
                if ($stockDiff > 0) {
                    $product->last_restock_at = now();
                }
            }
            $product->stock = $newStock;
        }

        if (array_key_exists('category_id', $validated)) {
            $product->category_id = $validated['category_id'];
        }
        if (array_key_exists('sku', $validated)) {
            $product->sku = strtoupper(trim($validated['sku']));
        }
        if (array_key_exists('description', $validated)) {
            $product->description = $validated['description'];
        }
        if (array_key_exists('price', $validated)) {
            $product->price = $validated['price'];
        }
        if (array_key_exists('original_price', $validated)) {
            $product->original_price = $validated['original_price'];
        }
        if (array_key_exists('cost_price', $validated)) {
            $product->cost_price = $validated['cost_price'];
        }
        if (array_key_exists('stock_minimum', $validated)) {
            $product->stock_minimum = $validated['stock_minimum'];
            $product->min_stock = $validated['stock_minimum'];
        }
        if (array_key_exists('weight', $validated)) {
            $product->weight = $validated['weight'];
        }
        if (array_key_exists('warehouse_bin', $validated)) {
            $product->warehouse_bin = $validated['warehouse_bin'];
        }
        if (array_key_exists('image_url', $validated)) {
            $product->image_url = $validated['image_url'];
        }
        if (array_key_exists('status', $validated)) {
            $product->status = $validated['status'];
            $product->active = ($validated['status'] === 'active');
        }
        if (array_key_exists('active', $validated)) {
            $product->active = (bool) $validated['active'];
            if (!$request->has('status')) {
                $product->status = $product->active ? 'active' : 'inactive';
            }
        }
        if (array_key_exists('specifications', $validated)) {
            $product->specifications = $validated['specifications'];
        }
        if (array_key_exists('variants', $validated)) {
            $product->variants = $validated['variants'];
        }

        $product->save();

        // Sync gambar galeri jika dikirim
        if ($request->has('images') || $request->has('galleryUrls')) {
            $imagesList = $validated['images'] ?? [];
            $product->images()->delete();
            foreach ($imagesList as $idx => $imgUrl) {
                if (!empty($imgUrl)) {
                    $product->images()->create([
                        'image_url' => $imgUrl,
                        'sort_order' => $idx,
                    ]);
                }
            }
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Produk berhasil diperbarui.',
            'data' => new ProductResource($product->fresh(['category', 'images'])),
        ]);
    }

    /**
     * Remove the specified product from storage or deactivate it.
     */
    public function destroy(Request $request, string $idOrSlug): JsonResponse
    {
        $product = Product::where(function ($q) use ($idOrSlug) {
            if (is_numeric($idOrSlug)) {
                $q->where('id', (int) $idOrSlug)->orWhere('slug', $idOrSlug);
            } else {
                $q->where('slug', $idOrSlug);
            }
        })->first();

        if (!$product) {
            return response()->json([
                'status' => 'error',
                'message' => 'Produk tidak ditemukan.',
            ], 404);
        }

        // Jika request meminta nonaktifkan saja tanpa hapus permanen
        if ($request->boolean('deactivate_only') || $request->input('action') === 'deactivate') {
            $product->update([
                'status' => 'inactive',
                'active' => false,
            ]);

            return response()->json([
                'status' => 'success',
                'message' => "Produk '{$product->name}' berhasil dinonaktifkan dari katalog toko.",
                'data' => new ProductResource($product->fresh(['category', 'images'])),
            ]);
        }

        $deletedId = $product->id;
        $deletedName = $product->name;
        $deletedSku = $product->sku;

        $product->delete();

        return response()->json([
            'status' => 'success',
            'message' => "Produk '{$deletedName}' ({$deletedSku}) berhasil dihapus permanen.",
            'deleted_id' => $deletedId,
        ]);
    }

    /**
     * Toggle product active/inactive status quickly.
     */
    public function toggleStatus(Request $request, string $idOrSlug): JsonResponse
    {
        $product = Product::where(function ($q) use ($idOrSlug) {
            if (is_numeric($idOrSlug)) {
                $q->where('id', (int) $idOrSlug)->orWhere('slug', $idOrSlug);
            } else {
                $q->where('slug', $idOrSlug);
            }
        })->first();

        if (!$product) {
            return response()->json([
                'status' => 'error',
                'message' => 'Produk tidak ditemukan.',
            ], 404);
        }

        $newActive = !$product->active;
        $product->update([
            'active' => $newActive,
            'status' => $newActive ? 'active' : 'inactive',
        ]);

        $statusText = $newActive ? 'diaktifkan' : 'dinonaktifkan';

        return response()->json([
            'status' => 'success',
            'message' => "Status produk '{$product->name}' berhasil {$statusText}.",
            'data' => new ProductResource($product->fresh(['category', 'images'])),
        ]);
    }
}



