<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\GoodsReceivingNoteResource;
use App\Models\GoodsReceivingNote;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GoodsReceivingNoteController extends Controller
{
    /**
     * Tampilkan daftar Penerimaan Barang (GRN) dengan filter server-side.
     */
    public function index(Request $request): JsonResponse
    {
        $query = GoodsReceivingNote::query()->with([
            'items.product',
            'items.variant',
            'purchaseOrder.vendor',
            'warehouse',
            'receiver',
        ]);

        $search = trim((string) $request->input('search', $request->input('searchQuery', '')));
        if ($search !== '') {
            $query->where('grn_number', 'like', "%{$search}%");
        }

        $poSearch = trim((string) $request->input('po_search', $request->input('poSearchQuery', '')));
        if ($poSearch !== '') {
            $query->whereHas('purchaseOrder', function ($pq) use ($poSearch) {
                $pq->where('po_number', 'like', "%{$poSearch}%");
            });
        }

        $doQuery = trim((string) $request->input('delivery_order', $request->input('deliveryOrderQuery', '')));
        if ($doQuery !== '') {
            $query->where('delivery_order_number', 'like', "%{$doQuery}%");
        }

        $receiverQuery = trim((string) $request->input('receiver', $request->input('receiverQuery', '')));
        if ($receiverQuery !== '') {
            $query->whereHas('receiver', function ($rq) use ($receiverQuery) {
                $rq->where('name', 'like', "%{$receiverQuery}%");
            });
        }

        $vendor = $request->input('vendor_id', $request->input('vendorFilter'));
        if (!empty($vendor) && $vendor !== 'all') {
            $query->whereHas('purchaseOrder', function ($pq) use ($vendor) {
                $pq->where('vendor_id', $vendor)
                    ->orWhereHas('vendor', function ($vq) use ($vendor) {
                        $vq->where('company_name', $vendor);
                    });
            });
        }

        $status = $request->input('status', $request->input('statusFilter'));
        if (!empty($status) && $status !== 'all') {
            $query->where('status', $status);
        }

        $receivedStart = $request->input('received_date_start', $request->input('receivedDateStart'));
        if (!empty($receivedStart)) {
            $query->whereDate('received_date', '>=', $receivedStart);
        }

        $receivedEnd = $request->input('received_date_end', $request->input('receivedDateEnd'));
        if (!empty($receivedEnd)) {
            $query->whereDate('received_date', '<=', $receivedEnd);
        }

        $minUnits = $request->input('min_units', $request->input('minUnits'));
        $maxUnits = $request->input('max_units', $request->input('maxUnits'));
        $unitsSubquery = '(SELECT COALESCE(SUM(accepted_quantity), 0) FROM goods_receiving_items WHERE goods_receiving_items.grn_id = goods_receiving_notes.id)';
        if ($minUnits !== null && $minUnits !== '') {
            $query->whereRaw("{$unitsSubquery} >= ?", [(int) $minUnits]);
        }
        if ($maxUnits !== null && $maxUnits !== '') {
            $query->whereRaw("{$unitsSubquery} <= ?", [(int) $maxUnits]);
        }

        $sortBy = $request->input('sort_by', 'received_date');
        $sortDir = $request->input('sort_dir', $request->input('sort_direction', 'desc'));
        $allowedSorts = ['id', 'grn_number', 'received_date', 'delivery_order_number', 'status', 'created_at'];
        if (in_array($sortBy, $allowedSorts, true)) {
            $query->orderBy($sortBy, $sortDir === 'asc' ? 'asc' : 'desc');
        } else {
            $query->latest();
        }

        $perPage = max(1, min(100, (int) $request->input('per_page', 10)));
        $paginated = $query->paginate($perPage);

        return response()->json([
            'status' => 'success',
            'data' => GoodsReceivingNoteResource::collection($paginated->items()),
            'meta' => [
                'current_page' => $paginated->currentPage(),
                'last_page' => $paginated->lastPage(),
                'per_page' => $paginated->perPage(),
                'total' => $paginated->total(),
            ],
        ]);
    }

    /**
     * Tampilkan detail satu dokumen GRN.
     */
    public function show(string $id): JsonResponse
    {
        $grn = GoodsReceivingNote::with([
            'items.product',
            'items.variant',
            'purchaseOrder.vendor',
            'warehouse',
            'receiver',
        ])->findOrFail($id);

        return response()->json([
            'status' => 'success',
            'data' => new GoodsReceivingNoteResource($grn),
        ]);
    }
}
