<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\TransactionResource;
use App\Models\Transaction;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TransactionController extends Controller
{
    /**
     * Daftar kategori standar transaksi keuangan.
     */
    public const CATEGORIES = [
        ['id' => 'all', 'label' => 'Semua Kategori', 'type' => null],
        ['id' => 'order_payment', 'label' => 'Pembayaran Pesanan', 'type' => 'income'],
        ['id' => 'capital_deposit', 'label' => 'Modal / Setoran Kas', 'type' => 'income'],
        ['id' => 'shipping_fee', 'label' => 'Ongkos Kirim Kurir', 'type' => 'expense'],
        ['id' => 'gateway_fee', 'label' => 'Biaya Payment Gateway', 'type' => 'expense'],
        ['id' => 'restock', 'label' => 'Pengadaan Stok Produk', 'type' => 'expense'],
        ['id' => 'operational', 'label' => 'Operasional & Kemasan', 'type' => 'expense'],
        ['id' => 'refund', 'label' => 'Pengembalian Dana', 'type' => 'expense'],
    ];

    /**
     * Tampilkan daftar transaksi keuangan dengan filter, pencarian, dan kalkulasi ringkasan cashflow.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Transaction::with('order');

        // 1. Filter Tab (all, income, expense, pending)
        $tab = $request->query('tab', 'all');
        if ($tab === 'income') {
            $query->where('type', 'income');
        } elseif ($tab === 'expense') {
            $query->where('type', 'expense');
        } elseif ($tab === 'pending') {
            $query->where('status', 'pending');
        }

        // 2. Filter Type eksplisit (income | expense)
        if ($request->filled('type') && in_array($request->query('type'), ['income', 'expense'])) {
            $query->where('type', $request->query('type'));
        }

        // 3. Filter Status (settled, pending, cancelled)
        if ($request->filled('status') && $request->query('status') !== 'all') {
            $query->where('status', $request->query('status'));
        }

        // 4. Filter Kategori
        if ($request->filled('category') && $request->query('category') !== 'all') {
            $query->where('category', $request->query('category'));
        }

        // 5. Filter Rentang Tanggal
        $dateRange = $request->query('date_range', 'all');
        $now = Carbon::now();
        if ($dateRange === '7days') {
            $query->where('created_at', '>=', $now->copy()->subDays(7)->startOfDay());
        } elseif ($dateRange === '30days') {
            $query->where('created_at', '>=', $now->copy()->subDays(30)->startOfDay());
        } elseif ($dateRange === 'this_month') {
            $query->whereYear('created_at', $now->year)
                  ->whereMonth('created_at', $now->month);
        }

        if ($request->filled('start_date') && $request->filled('end_date')) {
            $query->whereBetween('created_at', [
                Carbon::parse($request->query('start_date'))->startOfDay(),
                Carbon::parse($request->query('end_date'))->endOfDay(),
            ]);
        }

        // 6. Filter Pencarian
        if ($request->filled('search')) {
            $search = trim($request->query('search'));
            $query->where(function ($q) use ($search) {
                $q->where('transaction_number', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhere('customer_name', 'like', "%{$search}%")
                  ->orWhere('notes', 'like', "%{$search}%")
                  ->orWhereHas('order', function ($oq) use ($search) {
                      $oq->where('order_number', 'like', "%{$search}%")
                         ->orWhere('recipient_name', 'like', "%{$search}%");
                  });
            });
        }

        // 7. Hitung kalkulasi statistik / ringkasan KPI kas
        $statsQuery = clone $query;
        $totalIncome = (float) (clone $statsQuery)->where('type', 'income')->where('status', 'settled')->sum('amount');
        $totalExpense = (float) (clone $statsQuery)->where('type', 'expense')->where('status', 'settled')->sum('amount');
        $totalPending = (float) (clone $statsQuery)->where('status', 'pending')->sum('amount');
        $settledCount = (clone $statsQuery)->where('status', 'settled')->count();
        $totalCount = (clone $statsQuery)->count();

        $stats = [
            'total_income' => $totalIncome,
            'total_expense' => $totalExpense,
            'net_cashflow' => $totalIncome - $totalExpense,
            'total_pending' => $totalPending,
            'settled_count' => $settledCount,
            'total_count' => $totalCount,
        ];

        // 8. Pengurutan (Sorting)
        $sortBy = $request->query('sort', 'latest');
        switch ($sortBy) {
            case 'oldest':
                $query->oldest();
                break;
            case 'amount_desc':
                $query->orderByDesc('amount');
                break;
            case 'amount_asc':
                $query->orderBy('amount');
                break;
            case 'latest':
            default:
                $query->latest();
                break;
        }

        // 9. Pagination
        $perPage = min(100, max(1, (int) $request->query('per_page', 15)));
        $transactions = $query->paginate($perPage);

        return response()->json([
            'data' => TransactionResource::collection($transactions),
            'stats' => $stats,
            'categories' => self::CATEGORIES,
            'meta' => [
                'current_page' => $transactions->currentPage(),
                'last_page' => $transactions->lastPage(),
                'per_page' => $transactions->perPage(),
                'total' => $transactions->total(),
            ],
        ]);
    }

    /**
     * Tampilkan detail satu transaksi keuangan.
     */
    public function show(string $idOrTransactionNumber): JsonResponse
    {
        $transaction = Transaction::with('order')
            ->where('id', $idOrTransactionNumber)
            ->orWhere('transaction_number', $idOrTransactionNumber)
            ->firstOrFail();

        return response()->json([
            'data' => new TransactionResource($transaction),
        ]);
    }

    /**
     * Simpan transaksi keuangan manual (e.g. setoran modal, operasional, kemasan, dll).
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'type' => 'required|string|in:income,expense',
            'category' => 'required|string|in:order_payment,capital_deposit,shipping_fee,gateway_fee,restock,operational,refund',
            'amount' => 'required|numeric|min:1',
            'description' => 'required|string|max:255',
            'payment_method' => 'nullable|string|max:100',
            'status' => 'nullable|string|in:settled,pending,cancelled',
            'customer_name' => 'nullable|string|max:150',
            'notes' => 'nullable|string|max:500',
            'order_id' => 'nullable|exists:orders,id',
        ]);

        $categoryLabels = [
            'order_payment' => 'Pembayaran Pesanan',
            'capital_deposit' => 'Modal / Setoran Kas',
            'shipping_fee' => 'Ongkos Kirim Kurir',
            'gateway_fee' => 'Biaya Payment Gateway',
            'restock' => 'Pengadaan Stok Produk',
            'operational' => 'Operasional & Kemasan',
            'refund' => 'Pengembalian Dana',
        ];

        $categoryLabel = $categoryLabels[$validated['category']] ?? 'Lain-lain';

        $transaction = Transaction::create([
            'transaction_number' => Transaction::generateTransactionNumber($validated['type']),
            'order_id' => $validated['order_id'] ?? null,
            'type' => $validated['type'],
            'category' => $validated['category'],
            'category_label' => $categoryLabel,
            'amount' => $validated['amount'],
            'description' => $validated['description'],
            'payment_method' => $validated['payment_method'] ?? 'Kas Toko',
            'status' => $validated['status'] ?? 'settled',
            'customer_name' => $validated['customer_name'] ?? 'Admin Toko',
            'notes' => $validated['notes'] ?? null,
        ]);

        return response()->json([
            'message' => 'Transaksi keuangan berhasil dicatat.',
            'data' => new TransactionResource($transaction->fresh('order')),
        ], 201);
    }
}
