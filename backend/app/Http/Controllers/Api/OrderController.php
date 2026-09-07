<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OrderController extends Controller
{
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
    public function show(string $idOrOrderNumber): JsonResponse
    {
        $order = Order::with(['items', 'shippingAddress', 'expedition', 'transactions'])
            ->where('id', $idOrOrderNumber)
            ->orWhere('order_number', $idOrOrderNumber)
            ->firstOrFail();

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

        $order->update($updateData);

        return response()->json([
            'message' => "Status pesanan {$order->order_number} berhasil diperbarui menjadi {$newStatus}.",
            'data' => new OrderResource($order->fresh(['items', 'shippingAddress', 'expedition', 'transactions'])),
        ]);
    }
}
