<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderReturn;
use App\Models\ReturnItem;
use App\Services\ActivityLogService;
use App\Services\IdentityCodeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ReturnController extends Controller
{
    public function __construct(private readonly ActivityLogService $activityLog)
    {
    }

    /**
     * Daftar retur — pelanggan melihat miliknya, admin melihat semua (server-side) — T29.2.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = OrderReturn::query()->with(['order:id,order_number,grand_total', 'user:id,name,email'])->withCount('items');

        if (!$user->isAdmin()) {
            $query->where('user_id', $user->id);
        }

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('return_number', 'like', "%{$search}%")
                    ->orWhereHas('order', fn ($o) => $o->where('order_number', 'like', "%{$search}%"));
            });
        }

        if ($request->filled('status') && $request->input('status') !== 'all') {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('userSearch')) {
            $us = $request->input('userSearch');
            $query->whereHas('user', fn ($u) => $u->where('name', 'like', "%{$us}%")->orWhere('email', 'like', "%{$us}%"));
        }

        if ($request->filled('requested_from')) {
            $query->whereDate('requested_at', '>=', $request->input('requested_from'));
        }
        if ($request->filled('requested_to')) {
            $query->whereDate('requested_at', '<=', $request->input('requested_to'));
        }

        $sortBy = $request->input('sort_by', 'created_at');
        $sortDir = strtolower((string) $request->input('sort_dir', 'desc')) === 'asc' ? 'asc' : 'desc';
        $allowedSorts = ['created_at', 'requested_at', 'refund_amount', 'status', 'id'];
        $query->orderBy(in_array($sortBy, $allowedSorts, true) ? $sortBy : 'created_at', $sortDir);

        $perPage = min(100, max(1, (int) ($request->input('per_page') ?: 15)));
        $paginated = $query->paginate($perPage);
        $paginated->through(fn (OrderReturn $return) => $this->formatReturn($return));

        return response()->json($paginated);
    }

    /**
     * Detail retur — pemilik atau admin — T29.2.
     */
    public function show(Request $request, string $idOrNumber): JsonResponse
    {
        $return = $this->findReturn($idOrNumber);

        $user = $request->user();
        if (!$user->isAdmin() && $return->user_id !== $user->id) {
            return response()->json(['message' => 'Akses ditolak.'], 403);
        }

        return response()->json([
            'data' => $this->formatReturn($return->load(['order', 'user', 'items.product', 'items.variant', 'items.orderItem', 'approver', 'refunder'])),
        ]);
    }

    /**
     * Ajukan retur (pembeli) — T29.2.
     */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'order_id' => ['required', 'integer', 'exists:orders,id'],
            'reason' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.order_item_id' => ['required', 'integer', 'exists:order_items,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'items.*.reason' => ['nullable', 'string', 'max:255'],
            'items.*.condition' => ['nullable', 'string', 'max:100'],
        ]);

        $order = Order::query()->whereKey($validated['order_id'])->where('user_id', $user->id)->first();

        if (!$order) {
            return response()->json(['message' => 'Pesanan tidak ditemukan untuk akun Anda.'], 403);
        }

        if (!in_array($order->status, ['delivered', 'completed'], true)) {
            return response()->json(['message' => 'Retur hanya dapat diajukan untuk pesanan yang sudah diterima/selesai.'], 422);
        }

        $orderItems = OrderItem::query()->where('order_id', $order->id)->get()->keyBy('id');

        $return = DB::transaction(function () use ($validated, $user, $order, $orderItems) {
            $return = OrderReturn::create([
                'return_number' => IdentityCodeService::generate(OrderReturn::class, 'RTR', 'return_number'),
                'order_id' => $order->id,
                'user_id' => $user->id,
                'status' => 'pending',
                'reason' => $validated['reason'] ?? null,
                'notes' => $validated['notes'] ?? null,
                'requested_at' => now(),
            ]);

            $refundTotal = 0.0;

            foreach ($validated['items'] as $index => $line) {
                $orderItem = $orderItems->get($line['order_item_id']);

                if (!$orderItem) {
                    throw ValidationException::withMessages([
                        "items.{$index}.order_item_id" => ['Item tidak termasuk pesanan ini.'],
                    ]);
                }

                if ((int) $line['quantity'] > (int) $orderItem->quantity) {
                    throw ValidationException::withMessages([
                        "items.{$index}.quantity" => ['Kuantitas retur melebihi jumlah yang dipesan.'],
                    ]);
                }

                $alreadyReturned = ReturnItem::query()
                    ->where('order_item_id', $orderItem->id)
                    ->whereHas('orderReturn', fn ($q) => $q->whereIn('status', ['pending', 'approved', 'refunded']))
                    ->exists();

                if ($alreadyReturned) {
                    throw ValidationException::withMessages([
                        "items.{$index}.order_item_id" => ['Item ini sudah diajukan pada retur lain.'],
                    ]);
                }

                $unit = (float) ($orderItem->product_price ?: ($orderItem->subtotal / max(1, (int) $orderItem->quantity)));
                $lineRefund = round($unit * (int) $line['quantity'], 2);
                $refundTotal += $lineRefund;

                ReturnItem::create([
                    'return_id' => $return->id,
                    'order_item_id' => $orderItem->id,
                    'product_id' => $orderItem->product_id,
                    'product_variant_id' => $orderItem->product_variant_id ?? null,
                    'quantity' => (int) $line['quantity'],
                    'reason' => $line['reason'] ?? null,
                    'condition' => $line['condition'] ?? null,
                    'refund_amount' => $lineRefund,
                ]);
            }

            $return->update(['refund_amount' => round($refundTotal, 2)]);

            return $return;
        });

        return response()->json([
            'status' => 'success',
            'message' => "Pengajuan retur {$return->return_number} berhasil dikirim.",
            'data' => $this->formatReturn($return->fresh(['order', 'items.product'])),
        ], 201);
    }

    /**
     * Setujui retur (admin) — T29.2.
     */
    public function approve(Request $request, string $idOrNumber): JsonResponse
    {
        $return = $this->findReturn($idOrNumber);

        if ($return->status !== 'pending') {
            return response()->json(['message' => 'Hanya retur berstatus pending yang dapat disetujui.'], 422);
        }

        $return->update([
            'status' => 'approved',
            'approved_at' => now(),
            'approved_by' => $request->user()->id,
        ]);

        $this->activityLog->log('return.approved', $return, ['return_number' => $return->return_number]);

        return response()->json([
            'status' => 'success',
            'message' => "Retur {$return->return_number} disetujui.",
            'data' => $this->formatReturn($return->fresh(['order', 'items.product', 'approver'])),
        ]);
    }

    /**
     * Tolak retur (admin) — T29.2.
     */
    public function reject(Request $request, string $idOrNumber): JsonResponse
    {
        $return = $this->findReturn($idOrNumber);

        if (!in_array($return->status, ['pending', 'approved'], true)) {
            return response()->json(['message' => 'Retur ini tidak dapat ditolak.'], 422);
        }

        $validated = $request->validate([
            'rejection_reason' => ['required', 'string', 'max:500'],
        ], [
            'rejection_reason.required' => 'Alasan penolakan wajib diisi.',
        ]);

        $return->update([
            'status' => 'rejected',
            'rejected_at' => now(),
            'rejected_by' => $request->user()->id,
            'rejection_reason' => $validated['rejection_reason'],
        ]);

        $this->activityLog->log('return.rejected', $return, ['return_number' => $return->return_number]);

        return response()->json([
            'status' => 'success',
            'message' => "Retur {$return->return_number} ditolak.",
            'data' => $this->formatReturn($return->fresh(['order', 'items.product'])),
        ]);
    }

    private function findReturn(string $idOrNumber): OrderReturn
    {
        return OrderReturn::query()
            ->where('id', $idOrNumber)
            ->orWhere('return_number', $idOrNumber)
            ->firstOrFail();
    }

    /**
     * @return array<string, mixed>
     */
    private function formatReturn(OrderReturn $return): array
    {
        return [
            'id' => $return->id,
            'return_number' => $return->return_number,
            'order_id' => $return->order_id,
            'order_number' => $return->order?->order_number,
            'user' => $return->relationLoaded('user') && $return->user ? [
                'id' => $return->user->id,
                'name' => $return->user->name,
                'email' => $return->user->email,
            ] : null,
            'status' => $return->status,
            'reason' => $return->reason,
            'notes' => $return->notes,
            'refund_amount' => (float) $return->refund_amount,
            'refund_method' => $return->refund_method,
            'refund_reference' => $return->refund_reference,
            'items_count' => $return->items_count ?? $return->items()->count(),
            'requested_at' => $return->requested_at,
            'approved_at' => $return->approved_at,
            'rejected_at' => $return->rejected_at,
            'rejection_reason' => $return->rejection_reason,
            'refunded_at' => $return->refunded_at,
            'items' => $return->relationLoaded('items')
                ? $return->items->map(fn (ReturnItem $item) => [
                    'id' => $item->id,
                    'order_item_id' => $item->order_item_id,
                    'product_id' => $item->product_id,
                    'product_name' => $item->relationLoaded('product') ? $item->product?->name : null,
                    'quantity' => $item->quantity,
                    'refund_amount' => (float) $item->refund_amount,
                    'condition' => $item->condition,
                    'restocked' => $item->restocked,
                ])->values()->all()
                : [],
            'created_at' => $return->created_at,
        ];
    }
}
