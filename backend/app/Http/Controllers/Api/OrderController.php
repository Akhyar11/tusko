<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\AuthorizesOrderAccess;
use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Models\OrderStatus;
use App\Models\OrderStatusHistory;
use App\Models\Shipment;
use App\Services\IdentityCodeService;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OrderController extends Controller
{
    use AuthorizesOrderAccess;

    /**
     * Display a listing of orders with comprehensive filters, search, and tab counts.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = Order::with(['items', 'shippingAddress', 'expedition']);

        // 1. Scoping by User / Guest Session
        if ($user && (! $user->role || $user->role !== 'admin')) {
            $query->where('user_id', $user->id);
        } elseif ($request->filled('session_id')) {
            $query->where('guest_session_id', $request->query('session_id'));
        }

        // Base query for counting status tabs before applying status filter
        $countBaseQuery = clone $query;

        // 2. Filter Status Pesanan
        if ($request->filled('status') && $request->query('status') !== 'all') {
            $status = $request->query('status');
            if ($status === 'cancelled') {
                $query->whereIn('status', ['cancelled', 'failed']);
            } else {
                $query->where('status', $status);
            }
        }

        // 3. Filter Status Pembayaran
        if ($request->filled('payment_status') && $request->query('payment_status') !== 'all') {
            $query->where('payment_status', $request->query('payment_status'));
        }

        // 4. Filter Metode Pembayaran
        if ($request->filled('payment_method') && $request->query('payment_method') !== 'all') {
            $query->where('payment_method', $request->query('payment_method'));
        }

        // 5. Filter Ekspedisi Kurir
        if ($request->filled('expedition') && $request->query('expedition') !== 'all') {
            $query->where('expedition_name', 'like', '%' . $request->query('expedition') . '%');
        }

        // 6. Pencarian (Search Query)
        if ($request->filled('search') || $request->filled('q')) {
            $searchTerm = $request->query('search') ?: $request->query('q');
            $query->where(function (Builder $q) use ($searchTerm) {
                $q->where('order_number', 'like', "%{$searchTerm}%")
                  ->orWhere('recipient_name', 'like', "%{$searchTerm}%")
                  ->orWhere('phone', 'like', "%{$searchTerm}%")
                  ->orWhere('phone_number', 'like', "%{$searchTerm}%")
                  ->orWhere('tracking_number', 'like', "%{$searchTerm}%")
                  ->orWhereHas('items', function (Builder $itemQuery) use ($searchTerm) {
                      $itemQuery->where('product_name', 'like', "%{$searchTerm}%");
                  });
            });
        }

        // 7. Filter Rentang Waktu (Date Range)
        if ($request->filled('date_range')) {
            $range = $request->query('date_range');
            $now = Carbon::now();

            switch ($range) {
                case 'today':
                    $query->whereDate('created_at', $now->toDateString());
                    break;
                case '7days':
                    $query->where('created_at', '>=', $now->subDays(7));
                    break;
                case '30days':
                    $query->where('created_at', '>=', $now->subDays(30));
                    break;
                case 'this_month':
                    $query->whereMonth('created_at', $now->month)
                          ->whereYear('created_at', $now->year);
                    break;
            }
        } elseif ($request->filled('date_from') || $request->filled('date_to')) {
            if ($request->filled('date_from')) {
                $query->whereDate('created_at', '>=', $request->query('date_from'));
            }
            if ($request->filled('date_to')) {
                $query->whereDate('created_at', '<=', $request->query('date_to'));
            }
        }

        // 8. Filter Rentang Nominal (Amount Range)
        if ($request->filled('min_total')) {
            $query->where('grand_total', '>=', (float) $request->query('min_total'));
        }
        if ($request->filled('max_total')) {
            $query->where('grand_total', '<=', (float) $request->query('max_total'));
        }

        // 9. Sorting
        $sortBy = $request->query('sort_by', 'latest');
        switch ($sortBy) {
            case 'oldest':
                $query->oldest();
                break;
            case 'highest_amount':
                $query->orderByDesc('grand_total');
                break;
            case 'lowest_amount':
                $query->orderBy('grand_total');
                break;
            case 'latest':
            default:
                $query->latest();
                break;
        }

        // 10. Hitung status counts untuk tab UI
        $statusCounts = [
            'all' => (clone $countBaseQuery)->count(),
            'pending' => (clone $countBaseQuery)->where('status', 'pending')->count(),
            'processing' => (clone $countBaseQuery)->where('status', 'processing')->count(),
            'shipped' => (clone $countBaseQuery)->where('status', 'shipped')->count(),
            'completed' => (clone $countBaseQuery)->where('status', 'completed')->count(),
            'cancelled' => (clone $countBaseQuery)->whereIn('status', ['cancelled', 'failed'])->count(),
        ];

        // 11. Pagination
        $perPage = min(100, max(1, (int) $request->query('per_page', 15)));
        $orders = $query->paginate($perPage);

        return response()->json([
            'data' => OrderResource::collection($orders),
            'status_counts' => $statusCounts,
            'meta' => [
                'current_page' => $orders->currentPage(),
                'last_page' => $orders->lastPage(),
                'per_page' => $orders->perPage(),
                'total' => $orders->total(),
            ],
        ]);
    }

    /**
     * Display the specified single order details.
     */
    public function show(Request $request, string $idOrOrderNumber): JsonResponse
    {
        $order = Order::with(['items', 'shippingAddress', 'expedition', 'transactions', 'statusHistories'])
            ->where('id', $idOrOrderNumber)
            ->orWhere('order_number', $idOrOrderNumber)
            ->firstOrFail();

        // T27.1: anti-IDOR — hanya pemilik/admin/guest sesi terkait.
        $this->ensureOrderAccess($request, $order);

        return response()->json([
            'data' => new OrderResource($order),
        ]);
    }

    /**
     * Update order status with valid state transitions.
     */
    public function updateStatus(Request $request, string $idOrOrderNumber): JsonResponse
    {
        $order = Order::with(['items', 'shippingAddress', 'expedition', 'transactions'])
            ->where('id', $idOrOrderNumber)
            ->orWhere('order_number', $idOrOrderNumber)
            ->firstOrFail();

        $validated = $request->validate([
            'status' => 'required|string|in:pending,processing,shipped,completed,cancelled',
            'tracking_number' => 'nullable|string|max:100',
            'payment_status' => 'nullable|string|in:pending,paid,failed,cancelled,expired',
            'cancellation_reason' => 'nullable|string|max:500',
            'notes' => 'nullable|string|max:500',
        ]);

        $newStatus = $validated['status'];
        $currentStatus = $order->status;

        // Terminal state check
        if (in_array($currentStatus, ['completed', 'cancelled']) && $currentStatus !== $newStatus) {
            return response()->json([
                'message' => "Status pesanan tidak dapat diubah lagi karena pesanan sudah {$currentStatus}.",
            ], 422);
        }

        $updateData = ['status' => $newStatus];

        if ($newStatus === 'shipped') {
            if (empty($validated['tracking_number']) && empty($order->tracking_number)) {
                return response()->json([
                    'message' => 'Nomor resi (tracking number) wajib diisi saat mengubah status menjadi shipped.',
                    'errors' => ['tracking_number' => ['Nomor resi wajib diisi saat pengiriman.']],
                ], 422);
            }
            if (!empty($validated['tracking_number'])) {
                $updateData['tracking_number'] = $validated['tracking_number'];
            }
            $updateData['shipped_at'] = Carbon::now();
        } elseif ($newStatus === 'processing') {
            if (!$order->paid_at) {
                $updateData['paid_at'] = Carbon::now();
            }
            $updateData['payment_status'] = 'paid';
        } elseif ($newStatus === 'completed') {
            $updateData['completed_at'] = Carbon::now();
        } elseif ($newStatus === 'cancelled') {
            $updateData['cancelled_at'] = Carbon::now();
            $updateData['payment_status'] = 'cancelled';
            if (!empty($validated['cancellation_reason'])) {
                $updateData['notes'] = $validated['cancellation_reason'];
            }
        }

        if (isset($validated['payment_status'])) {
            $updateData['payment_status'] = $validated['payment_status'];
        }
        if (isset($validated['notes']) && !isset($updateData['notes'])) {
            $updateData['notes'] = $validated['notes'];
        }

        $previousStatus = $order->status;
        $statusRef = OrderStatus::where('code', $newStatus)->first();
        if ($statusRef) {
            $updateData['status_id'] = $statusRef->id;
        }
        $order->update($updateData);

        // T09.2: catat riwayat SETIAP perubahan status.
        if ($previousStatus !== $newStatus) {
            OrderStatusHistory::create([
                'order_id' => $order->id,
                'status_id' => $statusRef?->id,
                'status_code' => $newStatus,
                'actor_type' => $request->user() ? 'admin' : 'system',
                'actor_id' => $request->user()?->id,
                'notes' => $validated['notes'] ?? $validated['cancellation_reason'] ?? "Status diubah dari {$previousStatus} ke {$newStatus}.",
            ]);
        }

        // Send status change notification email if status changed
        if ($previousStatus !== $newStatus) {
            app(\App\Services\OrderEmailService::class)->sendStatusNotification($order, $previousStatus);
        }

        return response()->json([
            'message' => "Status pesanan {$order->order_number} berhasil diperbarui menjadi {$newStatus}.",
            'data' => new OrderResource($order->fresh(['items', 'shippingAddress', 'expedition', 'transactions'])),
        ]);
    }

    /**
     * Batalkan pesanan oleh pelanggan (pemilik) — T27.3.
     * Hanya pesanan yang belum dibayar & masih `pending` yang dapat dibatalkan sendiri.
     */
    public function cancel(Request $request, string $idOrOrderNumber): JsonResponse
    {
        $order = Order::with(['items', 'shippingAddress', 'expedition', 'transactions'])
            ->where('id', $idOrOrderNumber)
            ->orWhere('order_number', $idOrOrderNumber)
            ->firstOrFail();

        $this->ensureOrderAccess($request, $order);

        if ($order->status !== 'pending') {
            return response()->json([
                'message' => 'Pesanan ini tidak dapat dibatalkan lagi. Hubungi admin atau ajukan retur bila sudah diterima.',
            ], 422);
        }

        if (in_array((string) $order->payment_status, ['paid', 'settlement', 'capture'], true)) {
            return response()->json([
                'message' => 'Pesanan yang sudah dibayar tidak dapat dibatalkan sendiri; silakan ajukan retur/refund.',
            ], 422);
        }

        $validated = $request->validate([
            'cancellation_reason' => ['nullable', 'string', 'max:500'],
        ]);

        $order->update([
            'status' => 'cancelled',
            'payment_status' => 'cancelled',
            'cancelled_at' => Carbon::now(),
            'notes' => $validated['cancellation_reason'] ?? $order->notes,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => "Pesanan {$order->order_number} berhasil dibatalkan.",
            'data' => new OrderResource($order->fresh(['items', 'shippingAddress', 'expedition', 'transactions'])),
        ]);
    }

    /**
     * Konfirmasi penerimaan pesanan oleh pelanggan (pemilik) — T27.3.
     * Hanya pesanan berstatus `shipped`/`delivered` yang dapat diselesaikan.
     */
    public function complete(Request $request, string $idOrOrderNumber): JsonResponse
    {
        $order = Order::with(['items', 'shippingAddress', 'expedition', 'transactions'])
            ->where('id', $idOrOrderNumber)
            ->orWhere('order_number', $idOrOrderNumber)
            ->firstOrFail();

        $this->ensureOrderAccess($request, $order);

        if (!in_array($order->status, ['shipped', 'delivered'], true)) {
            return response()->json([
                'message' => 'Pesanan belum dikirim atau sudah selesai, sehingga belum dapat dikonfirmasi diterima.',
            ], 422);
        }

        $order->update([
            'status' => 'completed',
            'completed_at' => Carbon::now(),
        ]);

        return response()->json([
            'status' => 'success',
            'message' => "Terima kasih! Pesanan {$order->order_number} dikonfirmasi diterima.",
            'data' => new OrderResource($order->fresh(['items', 'shippingAddress', 'expedition', 'transactions'])),
        ]);
    }

    /**
     * Booking pickup kurir → buat `shipments` (waybill, status, pickup_time) (T10.1).
     */
    public function bookPickup(Request $request, string $idOrOrderNumber): JsonResponse
    {
        $order = Order::with(['shipment', 'expedition'])
            ->where('id', $idOrOrderNumber)
            ->orWhere('order_number', $idOrOrderNumber)
            ->firstOrFail();

        if (in_array($order->status, ['pending', 'cancelled'], true)) {
            return response()->json([
                'message' => 'Booking pickup hanya dapat dilakukan untuk pesanan yang sudah diproses/dibayar.',
            ], 422);
        }

        $shipment = DB::transaction(function () use ($order) {
            $existing = Shipment::where('order_id', $order->id)->lockForUpdate()->first();

            if ($existing) {
                return $existing;
            }

            $waybill = IdentityCodeService::generate(Shipment::class, 'RESI', 'waybill_number');

            $shipment = Shipment::create([
                'order_id' => $order->id,
                'expedition_service_id' => $order->expedition_service_id,
                'waybill_number' => $waybill,
                'status' => 'manifested',
                'pickup_time' => now(),
            ]);

            if (empty($order->tracking_number)) {
                $order->forceFill(['tracking_number' => $waybill])->save();
            }

            return $shipment;
        });

        return response()->json([
            'status' => 'success',
            'message' => "Booking pickup berhasil. Nomor resi: {$shipment->waybill_number}.",
            'data' => [
                'shipment_id' => $shipment->id,
                'order_number' => $order->order_number,
                'waybill_number' => $shipment->waybill_number,
                'status' => $shipment->status,
                'pickup_time' => $shipment->pickup_time?->toIso8601String(),
                'expedition_name' => $order->expedition_name,
                'expedition_service' => $order->expedition_service,
            ],
        ]);
    }

    /**
     * Pelacakan pesanan tamu (T27.4) — verifikasi via email atau nomor telepon.
     */
    public function trackGuestOrder(Request $request, string $orderNumber): JsonResponse
    {
        $request->validate([
            'email' => 'nullable|email',
            'phone' => 'nullable|string|max:30',
        ]);

        $email = $request->query('email');
        $phone = $request->query('phone');

        if (!$email && !$phone) {
            return response()->json([
                'message' => 'Email atau nomor telepon wajib disertakan untuk melacak pesanan.',
            ], 422);
        }

        $order = Order::with(['items', 'user'])
            ->where('order_number', $orderNumber)
            ->first();

        if (!$order) {
            abort(404, 'Pesanan tidak ditemukan.');
        }

        $emailMatches = $email && $order->user?->email
            && strcasecmp((string) $order->user->email, (string) $email) === 0;

        $phoneMatches = $phone
            && $this->normalizePhone($order->phone ?: $order->phone_number) === $this->normalizePhone($phone)
            && $this->normalizePhone($phone) !== '';

        if (!$emailMatches && !$phoneMatches) {
            abort(404, 'Pesanan tidak ditemukan.');
        }

        return response()->json([
            'status' => 'success',
            'data' => [
                'order_number' => $order->order_number,
                'status' => $order->status,
                'payment_status' => $order->payment_status,
                'tracking_number' => $order->tracking_number,
                'expedition_name' => $order->expedition_name,
                'expedition_service' => $order->expedition_service,
                'shipped_at' => $order->shipped_at?->toIso8601String(),
                'completed_at' => $order->completed_at?->toIso8601String(),
                'items' => $order->items->map(fn ($item) => [
                    'product_name' => $item->product_name,
                    'quantity' => (int) $item->quantity,
                ])->values(),
            ],
        ]);
    }

    private function normalizePhone(?string $phone): string
    {
        return preg_replace('/\D+/', '', (string) $phone) ?? '';
    }

    /**
     * Send or re-send status update notification email.
     */
    public function sendStatusEmail(Request $request, string $idOrOrderNumber): JsonResponse
    {
        $order = Order::with(['items', 'user', 'shippingAddress', 'expedition'])
            ->where('id', $idOrOrderNumber)
            ->orWhere('order_number', $idOrOrderNumber)
            ->firstOrFail();

        $recipientEmail = $request->input('email');
        $sent = app(\App\Services\OrderEmailService::class)->sendStatusNotification($order, null, $recipientEmail);

        if (! $sent) {
            return response()->json([
                'message' => 'Gagal mengirim email notifikasi status. Pastikan alamat email tersedia dan valid.',
            ], 422);
        }

        return response()->json([
            'message' => "Email notifikasi status pesanan berhasil dikirim.",
            'data' => [
                'order_number' => $order->order_number,
                'status' => $order->status,
            ],
        ]);
    }

    /**
     * Generate or update tracking number and return shipping receipt payload.
     */
    public function generateReceipt(Request $request, string $idOrOrderNumber): JsonResponse
    {
        $order = Order::with(['items', 'shippingAddress', 'expedition'])
            ->where('id', $idOrOrderNumber)
            ->orWhere('order_number', $idOrOrderNumber)
            ->firstOrFail();

        $validated = $request->validate([
            'tracking_number' => 'nullable|string|max:100',
            'shipper_name' => 'nullable|string|max:100',
            'shipper_phone' => 'nullable|string|max:30',
            'shipper_address' => 'nullable|string|max:255',
            'notes' => 'nullable|string|max:500',
            'auto_ship' => 'nullable|boolean',
        ]);

        // Determine tracking number
        $trackingNumber = $validated['tracking_number'] ?? null;
        if (empty($trackingNumber)) {
            if (!empty($order->tracking_number)) {
                $trackingNumber = $order->tracking_number;
            } else {
                $expName = $order->expedition_name ?: ($order->expedition?->name ?? 'JNE');
                $code = strtoupper(substr(preg_replace('/[^a-zA-Z0-9]/', '', $expName), 0, 4)) ?: 'TRK';
                $trackingNumber = Order::generateTrackingNumber($code);
            }
        }

        $updateData = [
            'tracking_number' => $trackingNumber,
        ];

        if (!empty($validated['auto_ship']) && $validated['auto_ship'] === true) {
            $updateData['status'] = 'shipped';
            if (!$order->shipped_at) {
                $updateData['shipped_at'] = Carbon::now();
            }
        }

        if (!empty($validated['notes'])) {
            $updateData['notes'] = $validated['notes'];
        }

        $order->update($updateData);
        $order->refresh();

        $receipt = $this->buildReceiptPayload($order, $validated);

        return response()->json([
            'message' => 'Resi pengiriman berhasil dibuat.',
            'data' => [
                'order' => new OrderResource($order),
                'receipt' => $receipt,
            ],
        ]);
    }

    /**
     * Retrieve shipping receipt data for thermal printing or PDF export.
     */
    public function getReceipt(Request $request, string $idOrOrderNumber): JsonResponse
    {
        $order = Order::with(['items', 'shippingAddress', 'expedition'])
            ->where('id', $idOrOrderNumber)
            ->orWhere('order_number', $idOrOrderNumber)
            ->firstOrFail();

        // T27.1: anti-IDOR — hanya pemilik/admin/guest sesi terkait.
        $this->ensureOrderAccess($request, $order);

        $receipt = $this->buildReceiptPayload($order, []);

        return response()->json([
            'data' => [
                'order' => new OrderResource($order),
                'receipt' => $receipt,
            ],
        ]);
    }

    /**
     * Build standard structured receipt payload.
     */
    protected function buildReceiptPayload(Order $order, array $options = []): array
    {
        $city = $order->city ?: ($order->shippingAddress?->city ?? 'Jakarta Selatan');
        $cleanCity = preg_replace('/[^A-Za-z]/', '', $city);
        $sortCode = !empty($cleanCity) ? strtoupper(substr($cleanCity, 0, 3)) : 'CGK';

        $totalWeight = (float) $order->total_weight;
        if ($totalWeight <= 0) {
            $totalWeight = $order->items->reduce(function ($carry, $item) {
                return $carry + (($item->quantity ?: 1) * 0.5);
            }, 0.5);
        }

        $itemsList = $order->items->map(function ($item) {
            return [
                'id' => $item->id,
                'name' => $item->product_name,
                'quantity' => (int) $item->quantity,
                'price' => (float) ($item->product_price ?? $item->price ?? 0),
                'subtotal' => (float) $item->subtotal,
                'notes' => $item->notes ?? null,
            ];
        })->values()->all();

        return [
            'order_id' => $order->id,
            'order_number' => $order->order_number,
            'tracking_number' => $order->tracking_number,
            'barcode_data' => $order->tracking_number ?: $order->order_number,
            'qrcode_data' => url("/api/orders/{$order->id}/receipt"),
            'sort_code' => $sortCode,
            'expedition' => [
                'id' => $order->expedition_id,
                'name' => $order->expedition_name ?: 'J&T Express',
                'service' => $order->expedition_service ?: 'EZ (Reguler)',
                'etd' => $order->expedition_etd ?: '1-3 hari',
            ],
            'sender' => [
                'store_name' => $options['shipper_name'] ?? 'Tusko Official Store',
                'phone' => $options['shipper_phone'] ?? '0812-3456-7890',
                'address' => $options['shipper_address'] ?? 'Jl. Kemang Raya No. 12, Jakarta Selatan, 12730',
                'city' => 'Jakarta Selatan',
                'sort_code' => 'CGK',
            ],
            'recipient' => [
                'name' => $order->recipient_name ?: ($order->shippingAddress?->recipient_name ?? 'Pembeli Tusko'),
                'phone' => $order->phone ?: $order->phone_number ?: ($order->shippingAddress?->phone ?? '-'),
                'address' => $order->full_address ?: ($order->shippingAddress?->full_address ?? '-'),
                'city' => $order->city ?: ($order->shippingAddress?->city ?? '-'),
                'province' => $order->province ?: ($order->shippingAddress?->province ?? '-'),
                'postal_code' => $order->postal_code ?: ($order->shippingAddress?->postal_code ?? '-'),
            ],
            'package_info' => [
                'total_weight_kg' => round($totalWeight, 2),
                'total_items' => (int) ($order->items->sum('quantity') ?: 1),
                'shipping_cost' => (float) $order->shipping_cost,
                'insurance_cost' => (float) $order->insurance_cost,
                'payment_method' => $order->payment_method,
                'payment_status' => $order->payment_status,
                'is_cod' => false,
                'notes' => $order->notes ?: ($options['notes'] ?? 'Fragile - Jangan Dibanting'),
            ],
            'items' => $itemsList,
            'created_at' => $order->created_at?->toISOString(),
            'generated_at' => Carbon::now()->toISOString(),
        ];
    }
}

