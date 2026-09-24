<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\VendorBillPaymentResource;
use App\Http\Resources\VendorBillResource;
use App\Models\Transaction;
use App\Models\VendorBill;
use App\Models\VendorBillPayment;
use App\Services\FileStorageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

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

        $invoiceStatus = $request->input('invoice_status', $request->input('invoiceStatus'));
        if ($invoiceStatus === 'attached') {
            $query->whereNotNull('invoice_file_path');
        } elseif ($invoiceStatus === 'missing') {
            $query->whereNull('invoice_file_path');
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
     * Tampilkan detail satu tagihan vendor beserta rincian item & riwayat pembayaran.
     */
    public function show(string $id): JsonResponse
    {
        $bill = VendorBill::with([
            'vendor',
            'purchaseOrder',
            'receivingNote.items.product',
            'receivingNote.items.variant',
            'payments.creator',
        ])->findOrFail($id);

        return response()->json([
            'status' => 'success',
            'data' => new VendorBillResource($bill),
        ]);
    }

    /**
     * Daftar riwayat pembayaran tagihan.
     */
    public function payments(string $id): JsonResponse
    {
        $bill = VendorBill::findOrFail($id);

        return response()->json([
            'status' => 'success',
            'data' => VendorBillPaymentResource::collection(
                $bill->payments()->with('creator')->latest('paid_at')->latest('id')->get()
            ),
        ]);
    }

    /**
     * Catat pembayaran tagihan vendor (boleh sebagian) beserta bukti bayar.
     */
    public function storePayment(Request $request, string $id): JsonResponse
    {
        $bill = VendorBill::with(['vendor', 'purchaseOrder', 'receivingNote'])->findOrFail($id);

        if ($bill->status === 'paid') {
            return response()->json([
                'status' => 'error',
                'message' => 'Tagihan ini sudah lunas.',
            ], 422);
        }

        $validated = $request->validate([
            'amount' => 'required|numeric|min:1',
            'payment_method' => 'required|string|max:100',
            'reference_number' => 'nullable|string|max:100',
            'paid_at' => 'nullable|date',
            'notes' => 'nullable|string|max:500',
            'proof_file' => 'required|file|mimes:jpg,jpeg,png,pdf|max:5120',
        ]);

        $outstanding = max(0, (float) $bill->amount - (float) $bill->paid_amount);
        if ((float) $validated['amount'] > $outstanding + 0.001) {
            return response()->json([
                'status' => 'error',
                'message' => 'Nominal pembayaran melebihi sisa hutang tagihan.',
                'errors' => [
                    'amount' => ['Nominal tidak boleh melebihi sisa hutang (Rp ' . number_format($outstanding, 0, ',', '.') . ').'],
                ],
            ], 422);
        }

        $proofFile = $request->file('proof_file');
        $proofStored = FileStorageService::storePrivate($proofFile, 'bills/payments');

        $result = DB::transaction(function () use ($bill, $validated, $request, $proofStored, $proofFile) {
            $payment = VendorBillPayment::create([
                'vendor_bill_id' => $bill->id,
                'amount' => (float) $validated['amount'],
                'payment_method' => $validated['payment_method'],
                'reference_number' => $validated['reference_number'] ?? null,
                'paid_at' => $validated['paid_at'] ?? now()->toDateString(),
                'proof_file_path' => $proofStored['path'],
                'proof_file_name' => $proofFile->getClientOriginalName(),
                'proof_file_mime' => $proofFile->getClientMimeType(),
                'notes' => $validated['notes'] ?? null,
                'created_by' => $request->user()?->id,
            ]);

            $this->recalculateBill($bill);

            Transaction::create([
                'transaction_number' => Transaction::generateTransactionNumber('expense'),
                'type' => 'expense',
                'category' => 'vendor_payment',
                'category_label' => 'Pembayaran Hutang Vendor',
                'amount' => (float) $validated['amount'],
                'description' => "Pembayaran tagihan {$bill->bill_number} ({$bill->vendor?->company_name})",
                'payment_method' => $validated['payment_method'],
                'status' => 'settled',
                'customer_name' => $bill->vendor?->company_name,
                'reference_type' => 'vendor_bill_payment',
                'reference_id' => $payment->id,
                'notes' => $validated['notes'] ?? null,
            ]);

            return $payment;
        });

        $bill->refresh()->load(['vendor', 'purchaseOrder', 'receivingNote.items.product', 'receivingNote.items.variant', 'payments.creator']);

        return response()->json([
            'status' => 'success',
            'message' => "Pembayaran tagihan {$bill->bill_number} berhasil dicatat.",
            'data' => [
                'bill' => new VendorBillResource($bill),
                'payment' => new VendorBillPaymentResource($result->load('creator')),
            ],
        ], 201);
    }

    /**
     * Batalkan (void) sebuah pembayaran tagihan dan hitung ulang status tagihan.
     */
    public function destroyPayment(string $id, string $paymentId): JsonResponse
    {
        $bill = VendorBill::with(['vendor', 'purchaseOrder', 'receivingNote'])->findOrFail($id);
        $payment = VendorBillPayment::where('vendor_bill_id', $bill->id)->findOrFail($paymentId);

        DB::transaction(function () use ($bill, $payment) {
            if ($payment->proof_file_path) {
                FileStorageService::deletePrivate($payment->proof_file_path);
            }

            Transaction::where('reference_type', 'vendor_bill_payment')
                ->where('reference_id', $payment->id)
                ->delete();

            $payment->delete();

            $this->recalculateBill($bill);
        });

        $bill->refresh()->load(['vendor', 'purchaseOrder', 'receivingNote.items.product', 'receivingNote.items.variant', 'payments.creator']);

        return response()->json([
            'status' => 'success',
            'message' => "Pembayaran tagihan {$bill->bill_number} berhasil dibatalkan.",
            'data' => new VendorBillResource($bill),
        ]);
    }

    /**
     * URL sementara (presigned) untuk dokumen sensitif tagihan vendor (D7).
     */
    public function invoiceUrl(string $id): JsonResponse
    {
        $bill = VendorBill::with('payments')->findOrFail($id);

        return response()->json([
            'status' => 'success',
            'data' => [
                'invoice_file_name' => $bill->invoice_file_name,
                'invoice_url' => FileStorageService::temporaryUrl($bill->invoice_file_path),
                'payments' => $bill->payments->map(fn ($payment) => [
                    'id' => $payment->id,
                    'proof_file_name' => $payment->proof_file_name,
                    'proof_url' => FileStorageService::temporaryUrl($payment->proof_file_path),
                ])->values(),
            ],
        ]);
    }

    /**
     * Hitung ulang paid_amount & status tagihan dari total pembayaran.
     */
    private function recalculateBill(VendorBill $bill): void
    {
        $paid = (float) $bill->payments()->sum('amount');
        $bill->paid_amount = $paid;

        if ($paid <= 0) {
            $bill->status = 'unpaid';
        } elseif ($paid + 0.001 < (float) $bill->amount) {
            $bill->status = 'partially_paid';
        } else {
            $bill->status = 'paid';
        }

        $bill->save();
    }
}
