<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\AddToCartRequest;
use App\Http\Resources\CartResource;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Product;
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
        $user = $request->user();

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
    public function addItem(AddToCartRequest $request): JsonResponse
    {
        $cart = $this->resolveCart($request);
        $productId = (int) $request->input('product_id');
        $quantityToAdd = (int) ($request->input('quantity') ?: 1);
        $notes = $request->input('notes');

        $product = Product::findOrFail($productId);

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

        if ($totalRequested > $product->stock) {
            return response()->json([
                'message' => "Stok produk tidak mencukupi. Tersisa {$product->stock} unit di gudang.",
                'available_stock' => $product->stock,
            ], 422);
        }

        if ($existingItem) {
            $existingItem->update([
                'quantity' => $totalRequested,
                'notes' => $notes !== null ? $notes : $existingItem->notes,
            ]);
        } else {
            CartItem::create([
                'cart_id' => $cart->id,
                'product_id' => $product->id,
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
}
