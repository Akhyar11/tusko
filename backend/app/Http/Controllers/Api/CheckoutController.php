<?php

namespace App\Http\Controllers\Api;

use App\Exceptions\InsufficientStockException;
use App\Http\Controllers\Api\Concerns\AuthorizesOrderAccess;
use App\Http\Controllers\Api\Concerns\VerifiesTurnstile;
use App\Http\Controllers\Controller;
use App\Http\Requests\CheckoutRequest;
use App\Http\Resources\OrderResource;
use App\Models\Cart;
use App\Models\Expedition;
use App\Models\ExpeditionService;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\ShippingAddress;
use App\Services\InventoryService;
use App\Services\IntegrationService;
use App\Services\ShippingRateService;
use App\Services\VoucherService;
use App\Services\WarehouseAllocationService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class CheckoutController extends Controller
{
    use AuthorizesOrderAccess;
    use VerifiesTurnstile;

    public function __construct(
        private readonly InventoryService $inventoryService,
        private readonly VoucherService $voucherService,
        private readonly IntegrationService $integrations,
        private readonly WarehouseAllocationService $warehouseAllocation,
        private readonly ShippingRateService $shippingRate
    ) {
    }
    /**
     * Process checkout and save order to database.
     */
    public function checkout(CheckoutRequest $request): JsonResponse
    {
        // T35.5d: gerbang anti-bot SEBELUM logika apa pun (fail closed bila aktif).
        $this->requireTurnstile($request, 'checkout');

        $user = $request->user();
        $sessionId = $request->input('session_id')
            ?: $request->header('X-Session-ID')
            ?: $request->cookie('cart_session')
            ?: ($user ? null : (string) Str::uuid());

        $order = DB::transaction(function () use ($request, $user, $sessionId) {
            // 1. Normalisasi item yang akan di-checkout (dari request atau keranjang aktif).
            //    Hanya identitas + kuantitas yang diambil dari input client; seluruh
            //    nilai harga/berat/poin TIDAK pernah dipercaya dari client (T28.1).
            $rawItems = [];
            $cartToClear = null;

            if ($request->has('items') && is_array($request->input('items')) && count($request->input('items')) > 0) {
                foreach ($request->input('items') as $item) {
                    $rawItems[] = [
                        'product_id' => $item['product_id'],
                        'product_variant_id' => $item['product_variant_id'] ?? null,
                        'quantity' => (int) $item['quantity'],
                        'notes' => $item['notes'] ?? null,
                    ];
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
                    $rawItems[] = [
                        'product_id' => $cartItem->product_id,
                        'product_variant_id' => $cartItem->product_variant_id,
                        'quantity' => (int) $cartItem->quantity,
                        'notes' => $cartItem->notes,
                    ];
                }
            }

            // 1b. Server menghitung ULANG harga & subtotal dari DB (produk/varian).
            $checkoutItemsData = [];
            $totalWeight = 0.0;
            $subtotal = 0.0;
            $totalLoyaltyPointsEarned = 0;
            $hasFreeShippingItem = false;

            foreach ($rawItems as $rawItem) {
                $product = Product::lockForUpdate()->findOrFail($rawItem['product_id']);

                $variant = null;
                if (! empty($rawItem['product_variant_id'])) {
                    $variant = ProductVariant::lockForUpdate()->findOrFail($rawItem['product_variant_id']);

                    if ((int) $variant->product_id !== (int) $product->id) {
                        throw ValidationException::withMessages([
                            'items' => ["Varian tidak sesuai dengan produk '{$product->name}'."],
                        ]);
                    }
                }

                $qty = max(1, (int) $rawItem['quantity']);

                // T06.9: tandai bila salah satu produk bergratis ongkir.
                if ($product->free_shipping) {
                    $hasFreeShippingItem = true;
                }

                // Harga otoritatif: harga varian bila ada, selain itu harga produk (dari DB).
                $itemPrice = (float) ($variant && $variant->price !== null ? $variant->price : $product->price);

                // Stok otoritatif (D1) dari inventory_balances.
                $availableStock = $this->inventoryService->availableStock($product, $variant);
                if ($availableStock < $qty) {
                    throw ValidationException::withMessages([
                        'items' => ["Stok produk '{$product->name}' tidak mencukupi (sisa: {$availableStock})."],
                    ]);
                }

                $itemSubtotal = round($itemPrice * $qty, 2);
                $rawWeight = (float) ($variant?->weight_grams ?: ($product->weight ?? 1000));
                $weightPerUnit = $rawWeight >= 10 ? ($rawWeight / 1000) : $rawWeight;
                $earnedPoints = $product->calculatePointsEarned($itemPrice) * $qty;

                $checkoutItemsData[] = [
                    'product' => $product,
                    'variant' => $variant,
                    'product_id' => $product->id,
                    'product_variant_id' => $variant?->id,
                    'product_name' => $product->name,
                    'product_slug' => $product->slug,
                    'product_image' => $product->image_url,
                    'product_price' => $itemPrice,
                    'product_weight' => $weightPerUnit,
                    'quantity' => $qty,
                    'subtotal' => $itemSubtotal,
                    'points_earned' => $earnedPoints,
                    'notes' => $rawItem['notes'],
                ];

                $subtotal += $itemSubtotal;
                $totalWeight += ($weightPerUnit * $qty);
                $totalLoyaltyPointsEarned += $earnedPoints;
            }

            // 1c. T06.6: tentukan gudang pemenuh (alokasi D1) untuk fulfillment.
            $fulfillmentWarehouseId = null;
            if (! empty($checkoutItemsData)) {
                $first = $checkoutItemsData[0];
                $allocation = $this->warehouseAllocation->allocate(
                    (int) $first['product_id'],
                    $first['product_variant_id'] ? (int) $first['product_variant_id'] : null,
                    (int) $first['quantity']
                );
                $fulfillmentWarehouseId = $allocation?->warehouse_id;
            }
            if (! $fulfillmentWarehouseId) {
                $fulfillmentWarehouseId = \App\Models\Warehouse::query()->where('is_primary', true)->value('id');
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

            // 3. Resolve Expedition / ExpeditionService (multi-layanan, T06.5)
            $expeditionId = $request->input('expedition_id');
            $expeditionServiceId = $request->input('expedition_service_id');

            // T06.11: kode wilayah tujuan untuk tarif LIVE (dari alamat tersimpan / request).
            $destinationDistrictCode = $addressId
                ? ($savedAddress->district_code ?? null)
                : $request->input('destination_district_code');
            $destinationSubdistrict = $addressId
                ? ($savedAddress->subdistrict_code ?? null)
                : $request->input('subdistrict_destination');

            // T06.11: konteks tarif LIVE (berat gram + tujuan + nilai barang).
            $liveRateContext = [
                'weight_grams' => max(1, (int) round($totalWeight * 1000)),
                'destination_district_code' => $destinationDistrictCode,
                'subdistrict_destination' => $destinationSubdistrict,
                'item_value' => (int) round($subtotal),
            ];

            if ($expeditionServiceId) {
                $service = ExpeditionService::with('expedition')->findOrFail($expeditionServiceId);
                $expedition = $service->expedition;
                $expeditionId = $expedition?->id;
                $expeditionName = $expedition?->name;
                $expeditionService = $service->service_name ?: $service->service_code;
                $expeditionEtd = $service->etd_days;
                $chargedWeight = max(1, (int) ceil($totalWeight));
                // T28.2: ongkir otoritatif dari tarif layanan (client `shipping_cost` diabaikan).
                $fallbackCost = (float) (($service->per_kg_rate ?? 0) > 0
                    ? ($service->per_kg_rate * $chargedWeight)
                    : ($service->base_rate ?? 0));
                // T06.11: utamakan tarif LIVE KiriminAja (server-authoritative), fallback DB.
                $liveCost = $this->shippingRate->rateFor(
                    (string) ($expedition?->code ?? ''),
                    (string) ($service->service_code ?? ''),
                    $liveRateContext
                );
                $shippingCost = $liveCost ?? $fallbackCost;
            } elseif ($expeditionId) {
                $expedition = Expedition::findOrFail($expeditionId);
                $expeditionName = $expedition->name;
                $expeditionService = $expedition->service;
                $expeditionEtd = $expedition->etd;
                $chargedWeight = max(1, (int) ceil($totalWeight));
                // T28.2: ongkir otoritatif dari tarif ekspedisi (client `shipping_cost` diabaikan).
                $fallbackCost = $expedition->is_free ? 0.0 : (float) ($expedition->cost * $chargedWeight);
                // T06.11: utamakan tarif LIVE KiriminAja (server-authoritative), fallback DB.
                $liveCost = $expedition->is_free ? 0.0 : $this->shippingRate->rateFor(
                    (string) ($expedition->code ?? ''),
                    (string) ($expedition->service ?? ''),
                    $liveRateContext
                );
                $shippingCost = $liveCost ?? $fallbackCost;
            } else {
                $expeditionName = $request->input('expedition_name');
                $expeditionService = $request->input('expedition_service');
                $expeditionEtd = $request->input('expedition_etd', '2-3 hari');
                $shippingCost = (float) ($request->input('shipping_cost') ?: 0);
            }

            // 4. Financial breakdown (T28.2: server-authoritative — diskon dihitung server dari kupon;
            //    `discount_amount` dari client DIABAIKAN).
            $insuranceCost = (float) ($request->input('insurance_cost') ?: 0);
            // G6: biaya jasa aplikasi diambil dari konfigurasi Admin (`integrations`), bukan hardcode.
            $serviceFee = (float) ($this->integrations->get('store.service_fee', 0) ?? 0);
            $couponCode = $request->input('coupon_code');
            $discountAmount = 0.0;
            $freeShipping = false;

            if ($couponCode) {
                $validation = $this->voucherService->validate(
                    $couponCode,
                    array_map(fn ($item) => [
                        'product_id' => $item['product_id'],
                        'product_variant_id' => $item['product_variant_id'],
                        'quantity' => $item['quantity'],
                    ], $checkoutItemsData),
                    $subtotal,
                    $user
                );

                if (! ($validation['valid'] ?? false)) {
                    throw ValidationException::withMessages([
                        'coupon_code' => [$validation['message'] ?? 'Voucher tidak valid.'],
                    ]);
                }

                $discountAmount = (float) ($validation['discount_amount'] ?? 0);

                if (! empty($validation['free_shipping'])) {
                    $freeShipping = true;
                }
            }

            // T06.10: gratis ongkir otomatis bila subtotal mencapai ambang (setting Admin, G6).
            $freeShippingThreshold = (float) ($this->integrations->get('shipping.free_shipping_min_purchase', 0) ?? 0);
            if ($freeShippingThreshold > 0 && $subtotal >= $freeShippingThreshold) {
                $freeShipping = true;
            }

            // T06.9: gratis ongkir bila salah satu produk ditandai gratis ongkir.
            if ($hasFreeShippingItem) {
                $freeShipping = true;
            }

            // T06.11(a): biaya kurir yang DITANGGUNG merchant (subsidi) dicatat sebelum di-nihilkan.
            $shippingSubsidy = $freeShipping ? $shippingCost : 0.0;
            if ($freeShipping) {
                $shippingCost = 0.0;
            }

            // 4b. Tukar poin loyalitas (T08.4/T28.2 tahap 2) — server-authoritative.
            $pointsRedeemed = 0;
            $pointsDiscount = 0.0;
            if ($user && $request->filled('loyalty_points_redeemed')) {
                $requestedPoints = max(0, (int) $request->input('loyalty_points_redeemed'));
                $pointsRedeemed = min($requestedPoints, (int) $user->points);

                if ($pointsRedeemed > 0) {
                    // Nilai tukar poin dari konfigurasi Admin (G6), default 1 rupiah/poin.
                    $redeemValue = (float) ($this->integrations->get('loyalty.points_redeem_value', 1) ?? 1);
                    $maxRedeemable = max(0, $subtotal + $shippingCost + $insuranceCost + $serviceFee - $discountAmount);
                    $pointsDiscount = min($pointsRedeemed * $redeemValue, $maxRedeemable);
                }
            }

            $grandTotal = max(0, $subtotal + $shippingCost + $insuranceCost + $serviceFee - $discountAmount - $pointsDiscount);

            // 5. Payment details
            $paymentMethod = $request->input('payment_method', 'midtrans');
            $paymentChannel = $request->input('payment_channel', 'bca_va');
            $vaNumber = (string) config('midtrans.va_prefix', '8808') . mt_rand(1000000000, 9999999999);

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
                'loyalty_points_earned' => $totalLoyaltyPointsEarned,
                'loyalty_points_redeemed' => $pointsRedeemed,
                'coupon_code' => $couponCode,
                'notes' => $request->input('notes'),
                'expires_at' => Carbon::now()->addHours(24),
            ]);

            // `expedition_service_id` dikelola di luar mass-assignment (Order fillable milik A2).
            if ($expeditionServiceId) {
                $order->forceFill(['expedition_service_id' => $expeditionServiceId])->save();
            }

            // T06.6: simpan gudang pemenuh hasil alokasi (D1).
            if ($fulfillmentWarehouseId) {
                $order->forceFill(['warehouse_id' => $fulfillmentWarehouseId])->save();
            }

            // T06.10: catat subsidi ongkir (biaya kurir yang ditanggung merchant).
            if ($shippingSubsidy > 0) {
                $order->forceFill(['shipping_subsidy' => $shippingSubsidy])->save();
            }

            // 6b. T15.1b: catat pemakaian voucher (kuota + voucher_usages) saat order dibuat.
            if ($couponCode) {
                $this->voucherService->redeemForOrder($order, $couponCode, $user);
            }

            // 6c. T08.4/T31: potong poin loyalitas yang ditukar + catat ledger.
            if ($user && $pointsRedeemed > 0) {
                $customer = \App\Models\User::lockForUpdate()->find($user->id);
                if ($customer) {
                    $customer->decrement('points', $pointsRedeemed);
                    \App\Models\LoyaltyPointsLedger::create([
                        'user_id' => $customer->id,
                        'type' => 'redeemed',
                        'points' => -$pointsRedeemed,
                        'balance_after' => (int) $customer->fresh()->points,
                        'reference_type' => 'order',
                        'reference_id' => $order->order_number,
                        'description' => "Penukaran {$pointsRedeemed} poin untuk pesanan {$order->order_number}",
                    ]);

                    // T34.14: jurnal liabilitas poin ditukar (idempoten).
                    try {
                        app(\App\Services\JournalMappingService::class)->postPointsRedeemed($order, $pointsRedeemed, $redeemValue ?? 1);
                    } catch (\Throwable $e) {
                        \Illuminate\Support\Facades\Log::warning('postPointsRedeemed gagal: ' . $e->getMessage());
                    }
                }
            }

            // 7. Create OrderItems & Decrement Stock
            foreach ($checkoutItemsData as $itemData) {
                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $itemData['product_id'],
                    'product_variant_id' => $itemData['product_variant_id'],
                    'product_name' => $itemData['product_name'],
                    'product_slug' => $itemData['product_slug'],
                    'product_image' => $itemData['product_image'],
                    'product_price' => $itemData['product_price'],
                    'product_weight' => $itemData['product_weight'],
                    'quantity' => $itemData['quantity'],
                    'subtotal' => $itemData['subtotal'],
                    'points_earned' => $itemData['points_earned'] ?? 0,
                    'notes' => $itemData['notes'],
                ]);

                // D1 (T12.6): pengurangan stok otoritatif via InventoryService
                // (inventory_balances + stock_mutations + sinkron agregat).
                try {
                    $this->inventoryService->decrease(
                        $itemData['product'],
                        (int) $itemData['quantity'],
                        [
                            'reference_type' => 'order',
                            'reference_id' => $order->order_number,
                            'notes' => "Pengurangan stok otomatis untuk pesanan {$order->order_number}",
                            'created_by' => 'Checkout System',
                        ],
                        $itemData['variant']
                    );
                } catch (InsufficientStockException $exception) {
                    throw ValidationException::withMessages([
                        'items' => ["Stok produk '{$itemData['product_name']}' tidak mencukupi (tersedia: {$exception->available()})."],
                    ]);
                }
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

        // Send order confirmation email via OrderEmailService
        $recipientEmail = $order->user?->email ?: $request->input('email');
        if ($recipientEmail) {
            app(\App\Services\OrderEmailService::class)->sendOrderConfirmation($order, $recipientEmail);
        }

        return response()->json([
            'message' => 'Pesanan berhasil dibuat.',
            'data' => new OrderResource($order),
        ], 201);
    }

    /**
     * Konfigurasi biaya checkout (publik) — T08.3/G6: FE TIDAK hardcode biaya.
     */
    public function config(): JsonResponse
    {
        return response()->json([
            'data' => [
                'service_fee' => (float) ($this->integrations->get('store.service_fee', 0) ?? 0),
                'insurance_cost' => (float) ($this->integrations->get('store.insurance_cost', 0) ?? 0),
                'points_redeem_value' => (float) ($this->integrations->get('loyalty.points_redeem_value', 1) ?? 1),
                'free_shipping_min_purchase' => (float) ($this->integrations->get('shipping.free_shipping_min_purchase', 0) ?? 0),
            ],
        ]);
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
    public function getSnapToken(Request $request, string $idOrOrderNumber): JsonResponse
    {
        $order = Order::with('items')
            ->where('id', $idOrOrderNumber)
            ->orWhere('order_number', $idOrOrderNumber)
            ->firstOrFail();

        // T27.1: anti-IDOR — hanya pemilik/admin/guest sesi terkait.
        $this->ensureOrderAccess($request, $order);

        $midtransService = app(\App\Services\MidtransService::class);
        $result = $midtransService->createSnapToken($order);

        return response()->json([
            'message' => 'Snap Token berhasil dibuat.',
            'data' => [
                'order_number' => $order->order_number,
                'snap_token' => $result['token'],
                'redirect_url' => $result['redirect_url'],
                'client_key' => $midtransService->clientKey() ?: null,
                'is_production' => $midtransService->isProduction(),
                'snap_js_url' => $midtransService->snapJsUrl() ?: null,
            ],
        ]);
    }

    /**
     * T07.9: buat charge Core API (VA/Mandiri/QRIS) untuk order + instruksi bayar.
     */
    public function charge(Request $request, string $idOrOrderNumber): JsonResponse
    {
        $validated = $request->validate([
            'payment_method' => 'required|string|in:bca_va,bni_va,bri_va,mandiri_va,qris',
        ]);

        $order = Order::with('items')
            ->where('id', $idOrOrderNumber)
            ->orWhere('order_number', $idOrOrderNumber)
            ->firstOrFail();

        // T27.1: anti-IDOR — hanya pemilik/admin/guest sesi terkait.
        $this->ensureOrderAccess($request, $order);

        $midtransService = app(\App\Services\MidtransService::class);
        $result = $midtransService->createCharge($order, $validated['payment_method']);

        if (! $result['success']) {
            $http = (int) $result['http_status'];
            $message = (string) ($result['raw']['message'] ?? '');
            // Konfigurasi belum lengkap / error validasi Midtrans -> 422 (tidak di-retry FE).
            $status = (str_contains(strtolower($message), 'belum dikonfigurasi') || ($http >= 400 && $http < 500))
                ? 422
                : 502;

            return response()->json([
                'message' => $message ?: 'Gagal membuat transaksi pembayaran.',
                'errors' => ['payment_method' => [$result['raw']['status_message'] ?? 'Charge Midtrans gagal.']],
            ], $status);
        }

        $order->refresh();

        return response()->json([
            'message' => 'Instruksi pembayaran berhasil dibuat.',
            'data' => [
                'order_number' => $order->order_number,
                'payment_status' => $order->payment_status,
                'payment_channel' => $order->payment_channel,
                'midtrans_payment_type' => $order->midtrans_payment_type,
                'transaction_id' => $order->midtrans_transaction_id,
                'va_number' => $order->va_number,
                'biller_code' => $order->midtrans_biller_code,
                'bill_key' => $order->midtrans_bill_key,
                'qr_string' => $order->midtrans_qr_string,
                'qr_url' => $order->midtrans_qr_url,
                'payment_expires_at' => $order->payment_expires_at?->toIso8601String(),
            ],
        ]);
    }

    /**
     * T07.10: rekonsiliasi status pembayaran dari Midtrans (manual "Cek Status").
     */
    public function syncPayment(Request $request, string $idOrOrderNumber): JsonResponse
    {
        $order = Order::with('items')
            ->where('id', $idOrOrderNumber)
            ->orWhere('order_number', $idOrOrderNumber)
            ->orWhere('midtrans_order_id', $idOrOrderNumber)
            ->firstOrFail();

        $this->ensureOrderAccess($request, $order);

        $service = app(\App\Services\MidtransService::class);
        $result = $service->getStatus($order);

        if (! $result['success']) {
            return response()->json([
                'message' => $result['raw']['status_message'] ?? 'Gagal mengambil status pembayaran.',
            ], 422);
        }

        $txStatus = strtolower((string) ($result['raw']['transaction_status'] ?? ''));
        $fraud = (string) ($result['raw']['fraud_status'] ?? '');
        $mapped = \App\Services\MidtransService::mapStatus($txStatus, $fraud);
        $transactionId = (string) ($result['raw']['transaction_id'] ?? $order->midtrans_transaction_id);
        $paymentType = (string) ($result['raw']['payment_type'] ?? $order->midtrans_payment_type);

        if ($mapped === 'paid' && $order->payment_status !== 'paid') {
            $order->markAsPaid($paymentType ?: 'midtrans', $transactionId ?: null);
        } elseif (in_array($mapped, ['cancelled', 'expired', 'failed'], true)
            && $order->payment_status !== $mapped
            && $order->status !== 'cancelled') {
            $order->update([
                'status' => $mapped === 'failed' ? 'failed' : 'cancelled',
                'payment_status' => $mapped,
                'cancelled_at' => now(),
            ]);
        }

        if ($transactionId) {
            \App\Models\Payment::updateOrCreate(
                ['order_id' => $order->id, 'reference' => $transactionId],
                [
                    'method' => 'midtrans',
                    'channel' => $paymentType ?: $order->payment_channel,
                    'amount' => (float) $order->grand_total,
                    'status' => $mapped,
                    'paid_at' => $mapped === 'paid' ? ($order->paid_at ?? now()) : null,
                ]
            );
        }

        return response()->json([
            'message' => 'Status pembayaran disinkronkan.',
            'data' => new \App\Http\Resources\OrderResource($order->fresh(['items'])),
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

        $sent = app(\App\Services\OrderEmailService::class)->sendOrderConfirmation($order, $recipientEmail);

        if (! $sent) {
            return response()->json([
                'message' => 'Gagal mengirim email konfirmasi pesanan.',
            ], 500);
        }

        return response()->json([
            'message' => "Email konfirmasi pesanan berhasil dikirim ke {$recipientEmail}.",
            'data' => [
                'order_number' => $order->order_number,
                'recipient_email' => $recipientEmail,
            ],
        ]);
    }
}
