<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Bank;
use App\Models\FinancialAccount;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class BankController extends Controller
{
    /**
     * Daftar bank untuk Master Bank & dropdown form rekening.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Bank::query();

        if ($request->filled('search')) {
            $search = trim((string) $request->input('search'));
            $query->where(function ($q) use ($search) {
                $q->where('code', 'like', "%{$search}%")
                    ->orWhere('name', 'like', "%{$search}%")
                    ->orWhere('notes', 'like', "%{$search}%");
            });
        }

        if ($request->has('is_active') && $request->input('is_active') !== '' && $request->input('is_active') !== null) {
            $query->where('is_active', filter_var($request->input('is_active'), FILTER_VALIDATE_BOOLEAN));
        }

        // Jika dipanggil untuk dropdown form tanpa pagination
        if ($request->boolean('all') || (!$request->has('page') && !$request->has('per_page'))) {
            $banks = (clone $query)->where('is_active', true)->orderBy('name')->get();

            return response()->json([
                'data' => $banks->map(fn ($b) => [
                    'id' => $b->id,
                    'code' => $b->code,
                    'name' => $b->name,
                    'value' => $b->name,
                    'label' => $b->name,
                    'is_active' => (bool) $b->is_active,
                ]),
            ]);
        }

        // Summary KPI
        $summary = [
            'total_count' => Bank::count(),
            'active_count' => Bank::where('is_active', true)->count(),
            'inactive_count' => Bank::where('is_active', false)->count(),
        ];

        $sortBy = $request->input('sort_by', 'name');
        $sortDir = strtolower((string) $request->input('sort_dir', 'asc')) === 'desc' ? 'desc' : 'asc';
        $allowedSorts = ['code', 'name', 'is_active', 'created_at'];
        if (!in_array($sortBy, $allowedSorts, true)) {
            $sortBy = 'name';
        }

        $perPage = min(max((int) $request->input('per_page', 25), 5), 100);
        $paginated = $query->orderBy($sortBy, $sortDir)->paginate($perPage);

        return response()->json([
            'data' => collect($paginated->items())->map(fn ($b) => [
                'id' => $b->id,
                'code' => $b->code,
                'name' => $b->name,
                'is_active' => (bool) $b->is_active,
                'notes' => $b->notes,
                'accounts_count' => FinancialAccount::where('bank_name', $b->name)->count(),
                'created_at' => $b->created_at?->toIso8601String(),
                'updated_at' => $b->updated_at?->toIso8601String(),
            ]),
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
     * Tambah data master bank baru.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'max:50', 'unique:banks,code'],
            'name' => ['required', 'string', 'max:150'],
            'is_active' => ['boolean'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $bank = Bank::create([
            'code' => strtoupper(trim($validated['code'])),
            'name' => trim($validated['name']),
            'is_active' => $validated['is_active'] ?? true,
            'notes' => $validated['notes'] ?? null,
        ]);

        return response()->json([
            'message' => "Master Bank {$bank->name} berhasil ditambahkan.",
            'data' => $bank,
        ], 201);
    }

    /**
     * Detail bank.
     */
    public function show(int $id): JsonResponse
    {
        $bank = Bank::findOrFail($id);

        return response()->json([
            'data' => array_merge($bank->toArray(), [
                'accounts_count' => FinancialAccount::where('bank_name', $bank->name)->count(),
            ]),
        ]);
    }

    /**
     * Perbarui data bank.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $bank = Bank::findOrFail($id);

        $validated = $request->validate([
            'code' => ['required', 'string', 'max:50', Rule::unique('banks', 'code')->ignore($bank->id)],
            'name' => ['required', 'string', 'max:150'],
            'is_active' => ['boolean'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $oldName = $bank->name;
        $newName = trim($validated['name']);

        $bank->update([
            'code' => strtoupper(trim($validated['code'])),
            'name' => $newName,
            'is_active' => $validated['is_active'] ?? $bank->is_active,
            'notes' => $validated['notes'] ?? null,
        ]);

        // Jika nama bank berubah, sinkronkan juga nama bank pada rekening terkait
        if ($oldName !== $newName) {
            FinancialAccount::where('bank_name', $oldName)->update(['bank_name' => $newName]);
        }

        return response()->json([
            'message' => "Master Bank {$bank->name} berhasil diperbarui.",
            'data' => $bank,
        ]);
    }

    /**
     * Hapus master bank.
     */
    public function destroy(int $id): JsonResponse
    {
        $bank = Bank::findOrFail($id);

        $linkedAccountsCount = FinancialAccount::where('bank_name', $bank->name)->count();
        if ($linkedAccountsCount > 0) {
            return response()->json([
                'message' => "Bank {$bank->name} tidak dapat dihapus karena tertaut pada {$linkedAccountsCount} rekening bank operasional. Silakan nonaktifkan statusnya sebagai gantinya.",
            ], 422);
        }

        $bank->delete();

        return response()->json([
            'message' => "Master Bank {$bank->name} berhasil dihapus.",
        ]);
    }

    /**
     * Toggle status aktif bank.
     */
    public function toggleStatus(int $id): JsonResponse
    {
        $bank = Bank::findOrFail($id);
        $bank->is_active = !$bank->is_active;
        $bank->save();

        $statusText = $bank->is_active ? 'diaktifkan' : 'dinonaktifkan';

        return response()->json([
            'message' => "Master Bank {$bank->name} berhasil {$statusText}.",
            'data' => $bank,
        ]);
    }
}
