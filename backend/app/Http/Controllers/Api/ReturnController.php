<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LoyaltyPointsLedger;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderReturn;
use App\Models\ReturnItem;
use App\Services\ActivityLogService;
use App\Services\IdentityCodeService;
use App\Services\InventoryService;
use App\Services\JournalMappingService;
use App\Services\MidtransService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ReturnController extends Controller
{
    public function __construct(
        private readonly ActivityLogService $activityLog,
        private readonly InventoryService $inventory,
        private readonly MidtransService $midtrans,
        private readonly JournalMappingService $journalMapping
    ) {
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

    /**
     * Proses refund retur (admin): Midtrans/manual + stok kembali + poin reversal
     * + jurnal balik via T34.1 (T29.3) + audit log.
     */
    public function refund(Request $request, string $idOrNumber): JsonResponse
    {
        $return = $this->findReturn($idOrNumber);

        if ($return->status !== 'approved') {
            return response()->json(['message' => 'Hanya retur berstatus approved yang dapat direfund.'], 422);
        }

        $validated = $request->validate([
            'refund_method' => ['required', 'string', 'in:midtrans,manual'],
            'refund_reference' => ['nullable', 'string', 'max:150'],
            'reason' => ['nullable', 'string', 'max:255'],
        ], [
            'refund_method.required' => 'Metode refund wajib dipilih.',
            'refund_method.in' => 'Metode refund tidak valid.',
        ]);

        $order = $return->order()->with('user')->firstOrFail();
        $amount = (float) $return->refund_amount;
        $reference = $validated['refund_reference'] ?? null;

        if ($validated['refund_method'] === 'midtrans') {
            if (!$this->midtrans->isConfigured()) {
                return response()->json(['message' => 'Midtrans belum dikonfigurasi. Gunakan refund manual.'], 422);
            }

            $result = $this->midtrans->refund($order, $amount, $validated['reason'] ?? null);
            if (!($result['success'] ?? false)) {
                return response()->json([
                    'message' => 'Refund Midtrans gagal: ' . ($result['raw']['message'] ?? 'tidak diketahui'),
                ], 422);
            }
            $reference = $result['refund_key'];
        }

        DB::transaction(function () use ($return, $order, $validated, $reference, $request, $amount) {
            // 1. Kembalikan stok otoritatif (D1) + kartu stok.
            foreach ($return->items()->with('product', 'variant')->get() as $item) {
                if ($item->restocked || !$item->product) {
                    continue;
                }

                $this->inventory->increase($item->product, (int) $item->quantity, [
                    'reference_type' => 'return',
                    'reference_id' => $return->return_number,
                    'notes' => "Restock retur {$return->return_number}",
                    'created_by' => $request->user()->id,
                ], $item->variant);

                $item->update(['restocked' => true]);
            }

            // 2. Reversal poin loyalitas.
            $customer = $order->user;
            if ($customer) {
                $earned = (int) $order->loyalty_points_earned;
                if ($earned > 0) {
                    $deduct = min((int) $customer->points, $earned);
                    if ($deduct > 0) {
                        $customer->decrement('points', $deduct);
                        LoyaltyPointsLedger::create([
                            'user_id' => $customer->id,
                            'type' => 'reversal',
                            'points' => -$deduct,
                            'balance_after' => (int) $customer->fresh()->points,
                            'reference_type' => 'return',
                            'reference_id' => $return->return_number,
                            'description' => "Reversal poin retur {$return->return_number}",
                        ]);
                    }
                }

                $redeemed = (int) $order->loyalty_points_redeemed;
                if ($redeemed > 0) {
                    $customer->increment('points', $redeemed);
                    LoyaltyPointsLedger::create([
                        'user_id' => $customer->id,
                        'type' => 'refund',
                        'points' => $redeemed,
                        'balance_after' => (int) $customer->fresh()->points,
                        'reference_type' => 'return',
                        'reference_id' => $return->return_number,
                        'description' => "Pengembalian poin retur {$return->return_number}",
                    ]);
                }
            }

            // 3. Jurnal balik (T34.1).
            $this->journalMapping->postRefund($order, $amount);

            // 4. Tandai retur selesai.
            $return->update([
                'status' => 'refunded',
                'refunded_at' => now(),
                'refunded_by' => $request->user()->id,
                'refund_method' => $validated['refund_method'],
                'refund_reference' => $reference,
            ]);

            $this->activityLog->log('return.refunded', $return, [
                'return_number' => $return->return_number,
                'amount' => $amount,
                'method' => $validated['refund_method'],
            ]);
        });

        return response()->json([
            'status' => 'success',
            'message' => "Retur {$return->return_number} berhasil direfund.",
            'data' => $this->formatReturn($return->fresh(['order', 'items.product', 'refunder'])),
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
