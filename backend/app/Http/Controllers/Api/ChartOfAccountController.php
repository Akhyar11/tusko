<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ChartOfAccount;
use Illuminate\Http\JsonResponse;

use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ChartOfAccountController extends Controller
{
    /**
     * Daftar akun (Chart of Accounts) dengan filter & server-side pagination.
     */
    public function index(Request $request): JsonResponse
    {
        $query = ChartOfAccount::query();

        if ($request->filled('search')) {
            $search = trim((string) $request->input('search'));
            $query->where(function ($q) use ($search) {
                $q->where('account_code', 'like', "%{$search}%")
                    ->orWhere('account_name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($request->filled('account_type')) {
            $query->where('account_type', $request->input('account_type'));
        }

        if ($request->has('is_active') && $request->input('is_active') !== '' && $request->input('is_active') !== null) {
            $query->where('is_active', filter_var($request->input('is_active'), FILTER_VALIDATE_BOOLEAN));
        }

        // Jika dipanggil untuk dropdown form tanpa pagination
        if ($request->boolean('all') || (!$request->has('page') && !$request->has('per_page'))) {
            $accounts = (clone $query)->orderBy('account_code')->get();

            return response()->json([
                'data' => $accounts->map(fn ($acc) => $this->transformAccount($acc)),
            ]);
        }

        // KPI Ringkasan
        $summary = [
            'total_count' => ChartOfAccount::count(),
            'active_count' => ChartOfAccount::where('is_active', true)->count(),
            'asset_count' => ChartOfAccount::where('account_type', 'asset')->count(),
            'liability_count' => ChartOfAccount::where('account_type', 'liability')->count(),
            'equity_count' => ChartOfAccount::where('account_type', 'equity')->count(),
            'revenue_count' => ChartOfAccount::where('account_type', 'revenue')->count(),
            'expense_count' => ChartOfAccount::where('account_type', 'expense')->count(),
        ];

        $sortBy = $request->input('sort_by', 'account_code');
        $sortDir = strtolower((string) $request->input('sort_dir', 'asc')) === 'desc' ? 'desc' : 'asc';
        $allowedSorts = ['account_code', 'account_name', 'account_type', 'is_active', 'created_at'];
        if (!in_array($sortBy, $allowedSorts, true)) {
            $sortBy = 'account_code';
        }

        $perPage = min(max((int) $request->input('per_page', 25), 5), 100);
        $paginated = $query->withCount(['ledgerEntries', 'financialAccounts'])
            ->orderBy($sortBy, $sortDir)
            ->paginate($perPage);

        return response()->json([
            'data' => collect($paginated->items())->map(fn ($acc) => $this->transformAccount($acc)),
            'meta' => [
                'current_page' => $paginated->currentPage(),
                'last_page' => $paginated->lastPage(),
                'per_page' => $paginated->perPage(),
                'total' => $paginated->total(),
            ],
            'summary' => $summary,
        ]);
    }

    /**
     * Tambah akun COA baru.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'account_code' => ['required', 'string', 'max:20', 'unique:chart_of_accounts,account_code'],
            'account_name' => ['required', 'string', 'max:150'],
            'account_type' => ['required', 'string', 'in:asset,liability,equity,revenue,expense'],
            'description' => ['nullable', 'string', 'max:500'],
            'is_active' => ['boolean'],
        ]);

        $account = ChartOfAccount::create([
            'account_code' => trim($validated['account_code']),
            'account_name' => trim($validated['account_name']),
            'account_type' => $validated['account_type'],
            'description' => $validated['description'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
        ]);

        return response()->json([
            'message' => 'Akun Chart of Account berhasil ditambahkan.',
            'data' => $this->transformAccount($account),
        ], 201);
    }

    /**
     * Detail akun COA.
     */
    public function show(int $id): JsonResponse
    {
        $account = ChartOfAccount::withCount(['ledgerEntries', 'financialAccounts'])->findOrFail($id);

        return response()->json([
            'data' => $this->transformAccount($account),
        ]);
    }

    /**
     * Perbarui akun COA.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $account = ChartOfAccount::findOrFail($id);
        $isSystem = in_array($account->account_code, ChartOfAccount::SYSTEM_ACCOUNTS, true);

        $rules = [
            'account_name' => ['required', 'string', 'max:150'],
            'account_type' => ['required', 'string', 'in:asset,liability,equity,revenue,expense'],
            'description' => ['nullable', 'string', 'max:500'],
            'is_active' => ['boolean'],
        ];

        if (!$isSystem) {
            $rules['account_code'] = ['required', 'string', 'max:20', Rule::unique('chart_of_accounts', 'account_code')->ignore($account->id)];
        }

        $validated = $request->validate($rules);

        $updateData = [
            'account_name' => trim($validated['account_name']),
            'account_type' => $validated['account_type'],
            'description' => $validated['description'] ?? null,
            'is_active' => $validated['is_active'] ?? $account->is_active,
        ];

        if (!$isSystem && isset($validated['account_code'])) {
            $updateData['account_code'] = trim($validated['account_code']);
        }

        $account->update($updateData);

        return response()->json([
            'message' => 'Akun Chart of Account berhasil diperbarui.',
            'data' => $this->transformAccount($account->fresh(['ledgerEntries', 'financialAccounts'])),
        ]);
    }

    /**
     * Hapus akun COA (dengan proteksi akun sistem dan entitas terkait).
     */
    public function destroy(int $id): JsonResponse
    {
        $account = ChartOfAccount::withCount(['ledgerEntries', 'financialAccounts'])->findOrFail($id);

        if (in_array($account->account_code, ChartOfAccount::SYSTEM_ACCOUNTS, true)) {
            return response()->json([
                'message' => "Akun {$account->account_code} ({$account->account_name}) adalah akun inti sistem Tusko dan tidak dapat dihapus.",
            ], 422);
        }

        if ($account->ledger_entries_count > 0) {
            return response()->json([
                'message' => "Akun {$account->account_code} tidak dapat dihapus karena telah memiliki {$account->ledger_entries_count} riwayat pencatatan jurnal buku besar.",
            ], 422);
        }

        if ($account->financial_accounts_count > 0) {
            return response()->json([
                'message' => "Akun {$account->account_code} tidak dapat dihapus karena tertaut pada {$account->financial_accounts_count} rekening kas/bank aktif.",
            ], 422);
        }

        $account->delete();

        return response()->json([
            'message' => 'Akun Chart of Account berhasil dihapus.',
        ]);
    }

    /**
     * Toggle status aktif/nonaktif akun COA.
     */
    public function toggleStatus(int $id): JsonResponse
    {
        $account = ChartOfAccount::findOrFail($id);
        $account->is_active = !$account->is_active;
        $account->save();

        $statusText = $account->is_active ? 'diaktifkan' : 'dinonaktifkan';

        return response()->json([
            'message' => "Akun {$account->account_code} berhasil {$statusText}.",
            'data' => $this->transformAccount($account),
        ]);
    }

    /**
     * Transform data account untuk format respons konsisten.
     *
     * @param  \App\Models\ChartOfAccount  $account
     * @return array<string, mixed>
     */
    private function transformAccount(ChartOfAccount $account): array
    {
        return [
            'id' => $account->id,
            'account_code' => $account->account_code,
            'account_name' => $account->account_name,
            'account_type' => $account->account_type,
            'description' => $account->description,
            'is_active' => (bool) $account->is_active,
            'is_system' => in_array($account->account_code, ChartOfAccount::SYSTEM_ACCOUNTS, true),
            'ledger_entries_count' => (int) ($account->ledger_entries_count ?? 0),
            'financial_accounts_count' => (int) ($account->financial_accounts_count ?? 0),
            'created_at' => $account->created_at?->toIso8601String(),
            'updated_at' => $account->updated_at?->toIso8601String(),
        ];
    }
}
