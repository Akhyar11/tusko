<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CheckoutRequest;
use App\Http\Resources\OrderResource;
use App\Models\Cart;
use App\Models\Expedition;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ShippingAddress;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class CheckoutController extends Controller
{
    /**
     * Process checkout and save order to database.
     */
    public function checkout(CheckoutRequest $request): JsonResponse
    {
        $user = $request->user();
        $sessionId = $request->input('session_id')
            ?: $request->header('X-Session-ID')
            ?: $request->cookie('cart_session')
            ?: ($user ? null : (string) Str::uuid());

        $order = DB::transaction(function () use ($request, $user, $sessionId) {
            // 1. Resolve items to checkout
            $checkoutItemsData = [];
            $totalWeight = 0.0;
            $subtotal = 0.0;
            $cartToClear = null;

            if ($request->has('items') && is_array($request->input('items')) && count($request->input('items')) > 0) {
                foreach ($request->input('items') as $item) {
                    $product = Product::lockForUpdate()->findOrFail($item['product_id']);

                    if ($product->stock < $item['quantity']) {
                        throw ValidationException::withMessages([
                            'items' => ["Stok produk '{$product->name}' tidak mencukupi (sisa: {$product->stock})."],
                        ]);
                    }

                    $qty = (int) $item['quantity'];
                    $itemPrice = (float) $product->price;
                    $itemSubtotal = $itemPrice * $qty;
                    $weightPerUnit = (float) ($product->weight ?? 1.0);

                    $checkoutItemsData[] = [
                        'product' => $product,
                        'product_id' => $product->id,
                        'product_name' => $product->name,
                        'product_slug' => $product->slug,
                        'product_image' => $product->image_url,
                        'product_price' => $itemPrice,
                        'product_weight' => $weightPerUnit,
                        'quantity' => $qty,
                        'subtotal' => $itemSubtotal,
                        'notes' => $item['notes'] ?? null,
                    ];

                    $subtotal += $itemSubtotal;
                    $totalWeight += ($weightPerUnit * $qty);
                }
            } else {
                // Checkout from active cart
                $cartQuery = Cart::with(['items.product']);
                if ($user) {
                    $cart = $cartQuery->where('user_id', $user->id)->first();
                } elseif ($sessionId) {
                    $cart = $cartQuery->where('session_id', $sessionId)->first();
                } else {
                    $cart = null;
                }

                if (! $cart || $cart->items->isEmpty()) {
                    throw ValidationException::withMessages([
                        'items' => ['Keranjang belanja kosong atau tidak ada produk yang dipilih.'],
                    ]);
                }

                $cartToClear = $cart;

                foreach ($cart->items as $cartItem) {
                    $product = Product::lockForUpdate()->findOrFail($cartItem->product_id);

                    if ($product->stock < $cartItem->quantity) {
                        throw ValidationException::withMessages([
                            'items' => ["Stok produk '{$product->name}' tidak mencukupi (sisa: {$product->stock})."],
                        ]);
                    }

                    $qty = (int) $cartItem->quantity;
                    $itemPrice = (float) $product->price;
                    $itemSubtotal = $itemPrice * $qty;
                    $weightPerUnit = (float) ($product->weight ?? 1.0);

                    $checkoutItemsData[] = [
                        'product' => $product,
                        'product_id' => $product->id,
                        'product_name' => $product->name,
                        'product_slug' => $product->slug,
                        'product_image' => $product->image_url,
                        'product_price' => $itemPrice,
                        'product_weight' => $weightPerUnit,
                        'quantity' => $qty,
                        'subtotal' => $itemSubtotal,
                        'notes' => $cartItem->notes,
                    ];

                    $subtotal += $itemSubtotal;
                    $totalWeight += ($weightPerUnit * $qty);
                }
            }

            // 2. Resolve Shipping Address
            $addressId = $request->input('shipping_address_id');
            if ($addressId) {
                $savedAddress = ShippingAddress::findOrFail($addressId);
                $recipientName = $savedAddress->recipient_name;
                $phone = $savedAddress->phone;
                $fullAddress = $savedAddress->full_address;
                $province = $savedAddress->province;
                $city = $savedAddress->city;
                $district = $savedAddress->district;
                $postalCode = $savedAddress->postal_code;
                $addressLabel = $savedAddress->label;
            } else {
                $recipientName = $request->input('recipient_name');
                $phone = $request->input('phone') ?: $request->input('phone_number');
                $fullAddress = $request->input('full_address');
                $province = $request->input('province');
                $city = $request->input('city');
                $district = $request->input('district');
                $postalCode = $request->input('postal_code');
                $addressLabel = $request->input('address_label', 'Alamat Utama');
            }

            // 3. Resolve Expedition
            $expeditionId = $request->input('expedition_id');
            if ($expeditionId) {
                $expedition = Expedition::findOrFail($expeditionId);
                $expeditionName = $expedition->name;
                $expeditionService = $expedition->service;
                $expeditionEtd = $expedition->etd;
                $chargedWeight = max(1, (int) ceil($totalWeight));
                $shippingCost = $request->has('shipping_cost')
                    ? (float) $request->input('shipping_cost')
                    : ($expedition->is_free ? 0.0 : (float) ($expedition->cost * $chargedWeight));
            } else {
                $expeditionName = $request->input('expedition_name');
                $expeditionService = $request->input('expedition_service');
                $expeditionEtd = $request->input('expedition_etd', '2-3 hari');
                $shippingCost = (float) ($request->input('shipping_cost') ?: 0);
            }

            // 4. Financial breakdown
            $insuranceCost = (float) ($request->input('insurance_cost') ?: 0);
            $serviceFee = (float) ($request->input('service_fee') ?? 1000);
            $discountAmount = (float) ($request->input('discount_amount') ?: 0);
            $grandTotal = max(0, $subtotal + $shippingCost + $insuranceCost + $serviceFee - $discountAmount);

            // 5. Payment details
            $paymentMethod = $request->input('payment_method', 'midtrans');
            $paymentChannel = $request->input('payment_channel', 'bca_va');
            $vaNumber = '8808' . mt_rand(1000000000, 9999999999);

            // 6. Create Order
            $order = Order::create([
                'order_number' => Order::generateOrderNumber(),
                'user_id' => $user?->id,
                'guest_session_id' => $user ? null : $sessionId,
                'status' => 'pending',
                'payment_status' => 'pending',
                'payment_method' => $paymentMethod,
                'payment_channel' => $paymentChannel,
                'va_number' => $vaNumber,
                'shipping_address_id' => $addressId,
                'recipient_name' => $recipientName,
                'phone' => $phone,
                'phone_number' => $phone,
                'full_address' => $fullAddress,
                'province' => $province,
                'city' => $city,
                'district' => $district,
                'postal_code' => $postalCode,
                'address_label' => $addressLabel,
                'expedition_id' => $expeditionId,
                'expedition_name' => $expeditionName,
                'expedition_service' => $expeditionService,
                'expedition_etd' => $expeditionEtd,
                'subtotal' => $subtotal,
                'shipping_cost' => $shippingCost,
                'insurance_cost' => $insuranceCost,
                'service_fee' => $serviceFee,
                'discount_amount' => $discountAmount,
                'grand_total' => $grandTotal,
                'total_weight' => $totalWeight,
                'coupon_code' => $request->input('coupon_code'),
                'notes' => $request->input('notes'),
                'expires_at' => Carbon::now()->addHours(24),
            ]);

            // 7. Create OrderItems & Decrement Stock
            foreach ($checkoutItemsData as $itemData) {
                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $itemData['product_id'],
                    'product_name' => $itemData['product_name'],
                    'product_slug' => $itemData['product_slug'],
                    'product_image' => $itemData['product_image'],
                    'product_price' => $itemData['product_price'],
                    'product_weight' => $itemData['product_weight'],
                    'quantity' => $itemData['quantity'],
                    'subtotal' => $itemData['subtotal'],
                    'notes' => $itemData['notes'],
                ]);

                // Stock decrement and mutation record
                $stockBefore = (int) $itemData['product']->stock;
                $itemData['product']->decrement('stock', $itemData['quantity']);
                $stockAfter = (int) $itemData['product']->fresh()->stock;

                \App\Models\StockMutation::create([
                    'product_id' => $itemData['product_id'],
                    'type' => 'out',
                    'quantity' => $itemData['quantity'],
                    'stock_before' => $stockBefore,
                    'stock_after' => $stockAfter,
                    'reference_type' => 'order',
                    'reference_id' => $order->order_number,
                    'notes' => "Pengurangan stok otomatis untuk pesanan {$order->order_number}",
                    'created_by' => 'Checkout System',
                ]);
            }

            // 8. If checked out from cart, clear cart items
            if ($cartToClear) {
                $cartToClear->items()->delete();
            }

            // 9. Generate Midtrans Snap Token if payment method is midtrans
            if ($order->payment_method === 'midtrans') {
                app(\App\Services\MidtransService::class)->createSnapToken($order);
            }

            return $order;
        });

        $order->load(['items', 'shippingAddress', 'expedition']);

        // Send order confirmation email
        $recipientEmail = $order->user?->email ?: $request->input('email');
        if ($recipientEmail) {
            try {
                \Illuminate\Support\Facades\Mail::to($recipientEmail)->send(new \App\Mail\OrderConfirmationMail($order));
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::warning('Gagal mengirim email konfirmasi pesanan: ' . $e->getMessage());
            }
        }

        return response()->json([
            'message' => 'Pesanan berhasil dibuat.',
            'data' => new OrderResource($order),
        ], 201);
    }

    /**
     * Show single order details by ID or order_number.
     */
    public function show(string $idOrOrderNumber): JsonResponse
    {
        $order = Order::with(['items', 'shippingAddress', 'expedition'])
            ->where('id', $idOrOrderNumber)
            ->orWhere('order_number', $idOrOrderNumber)
            ->firstOrFail();

        return response()->json([
            'data' => new OrderResource($order),
        ]);
    }

    /**
     * List orders with optional filters.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = Order::with(['items'])->latest();

        if ($user) {
            $query->where('user_id', $user->id);
        } elseif ($request->filled('session_id')) {
            $query->where('guest_session_id', $request->query('session_id'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        $orders = $query->paginate(15);

        return response()->json([
            'data' => OrderResource::collection($orders),
            'meta' => [
                'current_page' => $orders->currentPage(),
                'last_page' => $orders->lastPage(),
                'per_page' => $orders->perPage(),
                'total' => $orders->total(),
            ],
        ]);
    }

    /**
     * Generate or re-fetch Midtrans Snap Token for an order.
     */
    public function getSnapToken(string $idOrOrderNumber): JsonResponse
    {
        $order = Order::with('items')
            ->where('id', $idOrOrderNumber)
            ->orWhere('order_number', $idOrOrderNumber)
            ->firstOrFail();

        $midtransService = app(\App\Services\MidtransService::class);
        $result = $midtransService->createSnapToken($order);

        return response()->json([
            'message' => 'Snap Token berhasil dibuat.',
            'data' => [
                'order_number' => $order->order_number,
                'snap_token' => $result['token'],
                'redirect_url' => $result['redirect_url'],
            ],
        ]);
    }

    /**
     * Send or re-send order confirmation email to customer.
     */
    public function sendConfirmationEmail(Request $request, string $idOrOrderNumber): JsonResponse
    {
        $order = Order::with(['items', 'user'])
            ->where('id', $idOrOrderNumber)
            ->orWhere('order_number', $idOrOrderNumber)
            ->firstOrFail();

        $recipientEmail = $request->input('email') ?: $order->user?->email;

        if (! $recipientEmail) {
            return response()->json([
                'message' => 'Alamat email penerima tidak ditemukan. Mohon sertakan email.',
            ], 422);
        }

        \Illuminate\Support\Facades\Mail::to($recipientEmail)->send(new \App\Mail\OrderConfirmationMail($order));

        return response()->json([
            'message' => "Email konfirmasi pesanan berhasil dikirim ke {$recipientEmail}.",
            'data' => [
                'order_number' => $order->order_number,
                'recipient_email' => $recipientEmail,
            ],
        ]);
    }
}
