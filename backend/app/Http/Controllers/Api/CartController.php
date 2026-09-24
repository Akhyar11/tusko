<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\AddToCartRequest;
use App\Http\Resources\CartResource;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Services\InventoryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CartController extends Controller
{
    /**
     * Resolve existing cart or create a new one based on auth or session.
     */
    protected function resolveCart(Request $request): Cart
    {
        // Rute cart bersifat opsional-autentikasi: gunakan guard Sanctum secara
        // eksplisit agar token Bearer dikenali tanpa menolak tamu (guest).
        $user = $request->user('sanctum');

        if ($user) {
            return Cart::firstOrCreate(['user_id' => $user->id]);
        }

        $sessionId = $request->input('session_id') 
            ?: $request->header('X-Session-ID') 
            ?: $request->cookie('cart_session')
            ?: (string) Str::uuid();

        return Cart::firstOrCreate([
            'session_id' => $sessionId,
            'user_id' => null,
        ]);
    }

    /**
     * Display current cart contents and totals.
     */
    public function index(Request $request): JsonResponse
    {
        $cart = $this->resolveCart($request);
        $cart->load(['items.product.category', 'items.product.images']);

        return response()->json([
            'data' => new CartResource($cart),
        ]);
    }

    /**
     * Add a product to the cart or increment quantity if already present.
     */
    public function addItem(AddToCartRequest $request, InventoryService $inventory): JsonResponse
    {
        $cart = $this->resolveCart($request);
        $productId = (int) $request->input('product_id');
        $quantityToAdd = (int) ($request->input('quantity') ?: 1);
        $notes = $request->input('notes');
        $variantId = $request->input('product_variant_id');

        $product = Product::findOrFail($productId);
        $variant = $variantId ? ProductVariant::findOrFail((int) $variantId) : null;

        if (!$product->active) {
            return response()->json([
                'message' => 'Produk ini sedang tidak aktif dan tidak dapat dibeli.',
            ], 422);
        }

        $existingItem = CartItem::where('cart_id', $cart->id)
            ->where('product_id', $product->id)
            ->first();

        $currentQuantity = $existingItem ? (int) $existingItem->quantity : 0;
        $totalRequested = $currentQuantity + $quantityToAdd;

        // Validasi stok live dari inventory_balances (D1).
        $availableStock = $inventory->availableStock($product, $variant);

        if ($totalRequested > $availableStock) {
            return response()->json([
                'message' => "Stok produk tidak mencukupi. Tersisa {$availableStock} unit di gudang.",
                'available_stock' => $availableStock,
            ], 422);
        }

        if ($existingItem) {
            $existingItem->update([
                'quantity' => $totalRequested,
                'notes' => $notes !== null ? $notes : $existingItem->notes,
                'product_variant_id' => $variant?->id ?? $existingItem->product_variant_id,
            ]);
        } else {
            CartItem::create([
                'cart_id' => $cart->id,
                'product_id' => $product->id,
                'product_variant_id' => $variant?->id,
                'quantity' => $quantityToAdd,
                'notes' => $notes,
            ]);
        }

        $cart->load(['items.product.category', 'items.product.images']);

        return response()->json([
            'message' => 'Produk berhasil ditambahkan ke keranjang belanja.',
            'data' => new CartResource($cart),
        ], 201);
    }

    /**
     * Update quantity and notes for an existing cart item.
     */
    public function updateItem(Request $request, int $id, InventoryService $inventory): JsonResponse
    {
        $request->validate([
            'quantity' => ['required', 'integer', 'min:1'],
            'notes' => ['nullable', 'string', 'max:255'],
            'session_id' => ['nullable', 'string', 'max:100'],
        ]);

        $cart = $this->resolveCart($request);

        $cartItem = CartItem::with(['product', 'variant'])
            ->where('cart_id', $cart->id)
            ->where('id', $id)
            ->firstOrFail();

        $newQuantity = (int) $request->input('quantity');
        $availableStock = $inventory->availableStock($cartItem->product, $cartItem->variant);

        if ($newQuantity > $availableStock) {
            return response()->json([
                'message' => "Jumlah barang melebihi stok yang tersedia ({$availableStock} unit).",
                'available_stock' => $availableStock,
            ], 422);
        }

        $cartItem->update([
            'quantity' => $newQuantity,
            'notes' => $request->has('notes') ? $request->input('notes') : $cartItem->notes,
        ]);

        $cart->load(['items.product.category', 'items.product.images']);

        return response()->json([
            'message' => 'Jumlah barang berhasil diperbarui.',
            'data' => new CartResource($cart),
        ]);
    }

    /**
     * Remove an item from the cart.
     */
    public function removeItem(Request $request, int $id): JsonResponse
    {
        $cart = $this->resolveCart($request);

        $cartItem = CartItem::where('cart_id', $cart->id)
            ->where('id', $id)
            ->firstOrFail();

        $cartItem->delete();

        $cart->load(['items.product.category', 'items.product.images']);

        return response()->json([
            'message' => 'Item berhasil dihapus dari keranjang.',
            'data' => new CartResource($cart),
        ]);
    }

    /**
     * Clear all items in the cart.
     */
    public function clear(Request $request): JsonResponse
    {
        $cart = $this->resolveCart($request);
        $cart->items()->delete();

        $cart->load(['items.product.category', 'items.product.images']);

        return response()->json([
            'message' => 'Semua item di keranjang berhasil dikosongkan.',
            'data' => new CartResource($cart),
        ]);
    }
}
