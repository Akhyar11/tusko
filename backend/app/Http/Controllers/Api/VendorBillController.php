<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\VendorBillResource;
use App\Models\VendorBill;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VendorBillController extends Controller
{
    /**
     * Tampilkan daftar Tagihan Vendor (Bills) dengan filter server-side.
     */
    public function index(Request $request): JsonResponse
    {
        $query = VendorBill::query()->with(['vendor', 'purchaseOrder', 'receivingNote']);

        $search = trim((string) $request->input('search', $request->input('searchQuery', '')));
        if ($search !== '') {
            $query->where('bill_number', 'like', "%{$search}%");
        }

        $poSearch = trim((string) $request->input('po_search', $request->input('poSearchQuery', '')));
        if ($poSearch !== '') {
            $query->whereHas('purchaseOrder', function ($pq) use ($poSearch) {
                $pq->where('po_number', 'like', "%{$poSearch}%");
            });
        }

        $vendorSearch = trim((string) $request->input('vendor_search', $request->input('vendorSearchQuery', '')));
        if ($vendorSearch !== '') {
            $query->whereHas('vendor', function ($vq) use ($vendorSearch) {
                $vq->where('company_name', 'like', "%{$vendorSearch}%")
                    ->orWhere('code', 'like', "%{$vendorSearch}%");
            });
        }

        $status = $request->input('status', $request->input('statusFilter'));
        if (!empty($status) && $status !== 'all') {
            $query->where('status', $status);
        }

        $billStart = $request->input('bill_date_start', $request->input('billDateStart'));
        if (!empty($billStart)) {
            $query->whereDate('bill_date', '>=', $billStart);
        }

        $billEnd = $request->input('bill_date_end', $request->input('billDateEnd'));
        if (!empty($billEnd)) {
            $query->whereDate('bill_date', '<=', $billEnd);
        }

        $dueStart = $request->input('due_date_start', $request->input('dueDateStart'));
        if (!empty($dueStart)) {
            $query->whereDate('due_date', '>=', $dueStart);
        }

        $dueEnd = $request->input('due_date_end', $request->input('dueDateEnd'));
        if (!empty($dueEnd)) {
            $query->whereDate('due_date', '<=', $dueEnd);
        }

        $minAmount = $request->input('min_amount', $request->input('minAmount'));
        if ($minAmount !== null && $minAmount !== '') {
            $query->where('amount', '>=', (float) $minAmount);
        }

        $maxAmount = $request->input('max_amount', $request->input('maxAmount'));
        if ($maxAmount !== null && $maxAmount !== '') {
            $query->where('amount', '<=', (float) $maxAmount);
        }

        $sortBy = $request->input('sort_by', 'due_date');
        $sortDir = $request->input('sort_dir', $request->input('sort_direction', 'asc'));
        $allowedSorts = ['id', 'bill_number', 'amount', 'paid_amount', 'bill_date', 'due_date', 'status', 'created_at'];
        if (in_array($sortBy, $allowedSorts, true)) {
            $query->orderBy($sortBy, $sortDir === 'asc' ? 'asc' : 'desc');
        } else {
            $query->orderBy('due_date', 'asc');
        }

        $perPage = max(1, min(100, (int) $request->input('per_page', 10)));
        $paginated = $query->paginate($perPage);

        return response()->json([
            'status' => 'success',
            'data' => VendorBillResource::collection($paginated->items()),
            'meta' => [
                'current_page' => $paginated->currentPage(),
                'last_page' => $paginated->lastPage(),
                'per_page' => $paginated->perPage(),
                'total' => $paginated->total(),
            ],
        ]);
    }

    /**
     * Tandai tagihan vendor sebagai lunas.
     */
    public function pay(string $id): JsonResponse
    {
        $bill = VendorBill::with(['vendor', 'purchaseOrder', 'receivingNote'])->findOrFail($id);

        $bill->update([
            'paid_amount' => $bill->amount,
            'status' => 'paid',
        ]);

        return response()->json([
            'status' => 'success',
            'message' => "Tagihan {$bill->bill_number} berhasil dilunasi.",
            'data' => new VendorBillResource($bill->fresh(['vendor', 'purchaseOrder', 'receivingNote'])),
        ]);
    }
}
