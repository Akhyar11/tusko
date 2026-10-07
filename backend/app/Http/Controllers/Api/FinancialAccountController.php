<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ChartOfAccount;
use App\Models\FinancialAccount;
use App\Models\Transaction;
use App\Services\JournalPostingService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class FinancialAccountController extends Controller
{
    public function __construct(private readonly JournalPostingService $journalPosting)
    {
    }

    /**
     * Tampilkan daftar akun kas & bank dengan filter, pencarian, dan kalkulasi ringkasan saldo.
     */
    public function index(Request $request): JsonResponse
    {
        $query = FinancialAccount::with('chartOfAccount');

        // 1. Filter Tipe Akun (cash | bank)
        if ($request->filled('type') && in_array($request->query('type'), ['cash', 'bank'])) {
            $query->where('type', $request->query('type'));
        }

        // 2. Filter Status Aktif
        if ($request->has('is_active') && $request->query('is_active') !== '' && $request->query('is_active') !== 'all') {
            $isActive = filter_var($request->query('is_active'), FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
            if ($isActive !== null) {
                $query->where('is_active', $isActive);
            }
        }

        // 3. Filter Pencarian Teks
        if ($request->filled('search')) {
            $search = trim($request->query('search'));
            $query->where(function ($q) use ($search) {
                $q->where('account_name', 'like', "%{$search}%")
                  ->orWhere('account_number', 'like', "%{$search}%")
                  ->orWhere('bank_name', 'like', "%{$search}%")
                  ->orWhere('account_holder', 'like', "%{$search}%")
                  ->orWhere('notes', 'like', "%{$search}%");
            });
        }

        // 4. Filter COA ID
        if ($request->filled('chart_of_account_id') && $request->query('chart_of_account_id') !== 'all') {
            $query->where('chart_of_account_id', $request->query('chart_of_account_id'));
        }

        // 5. Kalkulasi Statistik / KPI
        $statsQuery = clone $query;
        $allAccounts = $statsQuery->get();
        $totalBalance = (float) $allAccounts->sum('current_balance');
        $activeCount = $allAccounts->where('is_active', true)->count();
        $inactiveCount = $allAccounts->where('is_active', false)->count();
        $totalCount = $allAccounts->count();

        $stats = [
            'total_balance' => $totalBalance,
            'active_count' => $activeCount,
            'inactive_count' => $inactiveCount,
            'total_count' => $totalCount,
        ];

        // Jika minta seluruh data (dropdown / non-paginated)
        if ($request->boolean('all')) {
            $accounts = $query->orderBy('account_name')->get();
            return response()->json([
                'data' => $accounts,
                'stats' => $stats,
            ]);
        }

        // 6. Sorting
        $sortBy = $request->query('sort', 'latest');
        switch ($sortBy) {
            case 'oldest':
                $query->oldest();
                break;
            case 'name_asc':
                $query->orderBy('account_name', 'asc');
                break;
            case 'name_desc':
                $query->orderBy('account_name', 'desc');
                break;
            case 'balance_desc':
                $query->orderByDesc('current_balance');
                break;
            case 'balance_asc':
                $query->orderBy('current_balance', 'asc');
                break;
            case 'latest':
            default:
                $query->latest();
                break;
        }

        // 7. Pagination
        $perPage = min(100, max(1, (int) $request->query('per_page', 15)));
        $paginated = $query->paginate($perPage);

        return response()->json([
            'data' => $paginated->items(),
            'stats' => $stats,
            'meta' => [
                'current_page' => $paginated->currentPage(),
                'last_page' => $paginated->lastPage(),
                'per_page' => $paginated->perPage(),
                'total' => $paginated->total(),
            ],
        ]);
    }

    /**
     * Tampilkan detail satu akun kas/bank.
     */
    public function show(int $id): JsonResponse
    {
        $account = FinancialAccount::with('chartOfAccount')->findOrFail($id);

        $recentTransactions = Transaction::where('financial_account_id', $id)
            ->latest()
            ->take(10)
            ->get();

        return response()->json([
            'data' => $account,
            'recent_transactions' => $recentTransactions,
        ]);
    }

    /**
     * Simpan akun kas/bank baru dan catat setoran modal awal jika ada.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'type' => 'required|in:cash,bank',
            'account_name' => 'required|string|max:100',
            'account_number' => 'nullable|string|max:50',
            'account_holder' => 'nullable|string|max:100',
            'bank_name' => 'nullable|string|max:100',
            'chart_of_account_id' => 'nullable|exists:chart_of_accounts,id',
            'opening_balance' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string|max:500',
            'is_active' => 'nullable|boolean',
        ]);

        if ($validated['type'] === 'bank') {
            if (empty($validated['bank_name'])) {
                return response()->json(['message' => 'Nama bank wajib diisi untuk rekening bank.'], 422);
            }
            if (empty($validated['account_number'])) {
                return response()->json(['message' => 'Nomor rekening wajib diisi untuk rekening bank.'], 422);
            }
        }

        // Fallback mapping Chart of Account bila tidak dipilih
        $chartOfAccountId = $validated['chart_of_account_id'] ?? null;
        if (!$chartOfAccountId) {
            $defaultCoaCode = $validated['type'] === 'bank' ? '1200' : '1100';
            $chartOfAccountId = ChartOfAccount::where('account_code', $defaultCoaCode)->value('id');
        }

        $openingBalance = (float) ($validated['opening_balance'] ?? 0);

        return DB::transaction(function () use ($validated, $chartOfAccountId, $openingBalance) {
            $account = FinancialAccount::create([
                'type' => $validated['type'],
                'chart_of_account_id' => $chartOfAccountId,
                'account_name' => $validated['account_name'],
                'account_number' => $validated['account_number'] ?? null,
                'account_holder' => $validated['account_holder'] ?? null,
                'bank_name' => $validated['bank_name'] ?? null,
                'opening_balance' => $openingBalance,
                'current_balance' => 0,
                'notes' => $validated['notes'] ?? null,
                'is_active' => $validated['is_active'] ?? true,
            ]);

            // Jika ada saldo awal (> 0), catat sebagai transaksi Modal Awal Pemilik & double-entry journal
            if ($openingBalance > 0) {
                $trxNumber = Transaction::generateTransactionNumber('income');
                $transaction = Transaction::create([
                    'transaction_number' => $trxNumber,
                    'order_id' => null,
                    'financial_account_id' => $account->id,
                    'reference_type' => 'manual',
                    'reference_id' => null,
                    'reference_code' => $trxNumber,
                    'type' => 'income',
                    'category' => 'capital_deposit',
                    'category_label' => 'Modal / Setoran Kas',
                    'amount' => $openingBalance,
                    'description' => "Saldo awal akun {$account->account_name}",
                    'payment_method' => $account->account_name,
                    'status' => 'settled',
                    'customer_name' => 'Setoran Modal Pemilik',
                    'notes' => "Pencatatan saldo pembukaan awal untuk akun {$account->account_name}.",
                ]);

                // Jurnal Double-Entry:
                // Debit: Kas/Bank terkait (1100 / 1200)
                // Kredit: Modal Pemilik (3100)
                $targetCoa = ChartOfAccount::find($chartOfAccountId);
                $accountCode = $targetCoa ? $targetCoa->account_code : ($account->type === 'bank' ? '1200' : '1100');

                if (ChartOfAccount::where('account_code', $accountCode)->exists() &&
                    ChartOfAccount::where('account_code', '3100')->exists()) {
                    try {
                        $this->journalPosting->post($transaction, [
                            ['account_code' => $accountCode, 'debit' => $openingBalance],
                            ['account_code' => '3100', 'credit' => $openingBalance],
                        ], "Saldo awal akun {$account->account_name}");
                    } catch (\Throwable $e) {
                        Log::warning("Gagal memposting jurnal saldo awal akun {$account->id}: " . $e->getMessage());
                    }
                }
            }

            return response()->json([
                'message' => "Akun {$account->account_name} berhasil dibuat.",
                'data' => $account->fresh('chartOfAccount'),
            ], 201);
        });
    }

    /**
     * Perbarui data akun kas/bank.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $account = FinancialAccount::findOrFail($id);

        $validated = $request->validate([
            'type' => 'required|in:cash,bank',
            'account_name' => 'required|string|max:100',
            'account_number' => 'nullable|string|max:50',
            'account_holder' => 'nullable|string|max:100',
            'bank_name' => 'nullable|string|max:100',
            'chart_of_account_id' => 'nullable|exists:chart_of_accounts,id',
            'notes' => 'nullable|string|max:500',
            'is_active' => 'nullable|boolean',
        ]);

        if ($validated['type'] === 'bank') {
            if (empty($validated['bank_name'])) {
                return response()->json(['message' => 'Nama bank wajib diisi untuk rekening bank.'], 422);
            }
            if (empty($validated['account_number'])) {
                return response()->json(['message' => 'Nomor rekening wajib diisi untuk rekening bank.'], 422);
            }
        }

        $chartOfAccountId = $validated['chart_of_account_id'] ?? $account->chart_of_account_id;
        if (!$chartOfAccountId) {
            $defaultCoaCode = $validated['type'] === 'bank' ? '1200' : '1100';
            $chartOfAccountId = ChartOfAccount::where('account_code', $defaultCoaCode)->value('id');
        }

        $account->update([
            'type' => $validated['type'],
            'chart_of_account_id' => $chartOfAccountId,
            'account_name' => $validated['account_name'],
            'account_number' => $validated['account_number'] ?? null,
            'account_holder' => $validated['account_holder'] ?? null,
            'bank_name' => $validated['bank_name'] ?? null,
            'notes' => $validated['notes'] ?? null,
            'is_active' => $validated['is_active'] ?? $account->is_active,
        ]);

        return response()->json([
            'message' => "Akun {$account->account_name} berhasil diperbarui.",
            'data' => $account->fresh('chartOfAccount'),
        ]);
    }

    /**
     * Hapus akun kas/bank (dicegah jika sudah memiliki riwayat transaksi / pembayaran).
     */
    public function destroy(int $id): JsonResponse
    {
        $account = FinancialAccount::findOrFail($id);

        $hasTransactions = Transaction::where('financial_account_id', $id)->exists();
        $hasPayments = $account->vendorBillPayments()->exists();

        if ($hasTransactions || $hasPayments) {
            return response()->json([
                'message' => 'Akun tidak dapat dihapus karena sudah memiliki riwayat transaksi kas atau pembayaran vendor. Silakan nonaktifkan akun sebagai gantinya.',
            ], 422);
        }

        $accountName = $account->account_name;
        $account->delete();

        return response()->json([
            'message' => "Akun {$accountName} berhasil dihapus.",
        ]);
    }

    /**
     * Toggle status aktif akun.
     */
    public function toggleStatus(int $id): JsonResponse
    {
        $account = FinancialAccount::findOrFail($id);
        $account->is_active = !$account->is_active;
        $account->save();

        return response()->json([
            'message' => "Status akun {$account->account_name} berhasil diubah menjadi " . ($account->is_active ? 'Aktif' : 'Nonaktif') . '.',
            'data' => $account->load('chartOfAccount'),
        ]);
    }

    /**
     * Transfer saldo antar rekening kas / bank.
     */
    public function transfer(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'from_account_id' => 'required|exists:financial_accounts,id',
            'to_account_id' => 'required|exists:financial_accounts,id|different:from_account_id',
            'amount' => 'required|numeric|min:1',
            'notes' => 'nullable|string|max:500',
            'reference_number' => 'nullable|string|max:100',
        ]);

        $amount = (float) $validated['amount'];

        return DB::transaction(function () use ($validated, $amount) {
            $fromAccount = FinancialAccount::lockForUpdate()->findOrFail($validated['from_account_id']);
            $toAccount = FinancialAccount::lockForUpdate()->findOrFail($validated['to_account_id']);

            if ((float) $fromAccount->current_balance < $amount) {
                return response()->json([
                    'message' => "Saldo akun sumber {$fromAccount->account_name} tidak mencukupi (Tersedia: Rp " . number_format($fromAccount->current_balance, 0, ',', '.') . ").",
                ], 422);
            }

            // Tambah saldo penerima (saldo pengirim akan otomatis dipotong saat posting jurnal transaksi kontainer)
            $toAccount->increment('current_balance', $amount);

            $dateStr = Carbon::now()->format('Ymd');
            $ref = ($validated['reference_number'] ?? null) ?: "TRF/{$dateStr}/" . mt_rand(1000, 9999);

            // Buat transaksi mutasi kas
            $trxNumber = Transaction::generateTransactionNumber('expense');
            $transaction = Transaction::create([
                'transaction_number' => $trxNumber,
                'order_id' => null,
                'financial_account_id' => $fromAccount->id,
                'reference_type' => 'manual',
                'reference_id' => null,
                'reference_code' => $ref,
                'type' => 'expense',
                'category' => 'operational',
                'category_label' => 'Transfer Antar Rekening',
                'amount' => $amount,
                'description' => "Transfer saldo dari {$fromAccount->account_name} ke {$toAccount->account_name}",
                'payment_method' => $fromAccount->account_name,
                'status' => 'settled',
                'customer_name' => 'Internal Toko',
                'notes' => $validated['notes'] ?? "Transfer antar rekening kas/bank ref: {$ref}",
            ]);

            // Double-entry journal: Debit Akun Penerima, Kredit Akun Pengirim
            $fromCoaCode = $fromAccount->chartOfAccount?->account_code ?? ($fromAccount->type === 'bank' ? '1200' : '1100');
            $toCoaCode = $toAccount->chartOfAccount?->account_code ?? ($toAccount->type === 'bank' ? '1200' : '1100');

            if (ChartOfAccount::where('account_code', $fromCoaCode)->exists() &&
                ChartOfAccount::where('account_code', $toCoaCode)->exists()) {
                try {
                    $this->journalPosting->post($transaction, [
                        ['account_code' => $toCoaCode, 'debit' => $amount],
                        ['account_code' => $fromCoaCode, 'credit' => $amount],
                    ], "Transfer dari {$fromAccount->account_name} ke {$toAccount->account_name}");
                } catch (\Throwable $e) {
                    Log::warning("Gagal memposting jurnal transfer rekening: " . $e->getMessage());
                }
            }

            return response()->json([
                'message' => "Transfer sebesar Rp " . number_format($amount, 0, ',', '.') . " dari {$fromAccount->account_name} ke {$toAccount->account_name} berhasil.",
                'data' => [
                    'from_account' => $fromAccount->fresh('chartOfAccount'),
                    'to_account' => $toAccount->fresh('chartOfAccount'),
                    'transaction' => $transaction,
                ],
            ]);
        });
    }

    /**
     * Setor modal pemilik langsung ke rekening kas/bank tertentu.
     */
    public function depositCapital(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:1',
            'notes' => 'nullable|string|max:500',
            'reference_number' => 'nullable|string|max:100',
        ]);

        $amount = (float) $validated['amount'];

        return DB::transaction(function () use ($id, $validated, $amount) {
            $account = FinancialAccount::lockForUpdate()->findOrFail($id);

            $dateStr = Carbon::now()->format('Ymd');
            $ref = ($validated['reference_number'] ?? null) ?: "CAP/{$dateStr}/" . mt_rand(1000, 9999);

            $trxNumber = Transaction::generateTransactionNumber('income');
            $transaction = Transaction::create([
                'transaction_number' => $trxNumber,
                'financial_account_id' => $account->id,
                'reference_type' => 'manual',
                'reference_code' => $ref,
                'type' => 'income',
                'category' => 'capital_deposit',
                'category_label' => 'Modal / Setoran Kas',
                'amount' => $amount,
                'description' => "Setoran modal pemilik ke {$account->account_name}" . (!empty($validated['notes']) ? ": {$validated['notes']}" : ''),
                'payment_method' => $account->type === 'bank' ? ($account->bank_name ?? 'Transfer Bank') : 'Kas Toko',
                'status' => 'settled',
                'customer_name' => 'Pemilik Toko',
                'notes' => $validated['notes'] ?? null,
            ]);

            // Jurnal double-entry: Debit Kas/Bank (Aset), Kredit 3100 (Modal Pemilik)
            $coaCode = $account->chartOfAccount?->account_code
                ?? ($account->type === 'bank' ? '1200' : '1100');

            if (ChartOfAccount::where('account_code', '3100')->exists()) {
                $this->journalPosting->post($transaction, [
                    ['account_code' => $coaCode, 'debit' => $amount],
                    ['account_code' => '3100', 'credit' => $amount],
                ], "Jurnal setoran modal ke {$account->account_name} ({$trxNumber})");
            } else {
                $account->increment('current_balance', $amount);
            }

            return response()->json([
                'message' => "Setoran modal sebesar Rp " . number_format($amount, 0, ',', '.') . " ke rekening {$account->account_name} berhasil dicatat.",
                'data' => [
                    'account' => $account->fresh('chartOfAccount'),
                    'transaction' => $transaction,
                ],
            ], 201);
        });
    }
}

