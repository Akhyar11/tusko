<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PaymentMethod;
use App\Services\IntegrationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PaymentMethodController extends Controller
{
    /**
     * Katalog metode pembayaran untuk checkout (T07.6, T07.12) — dari master DB (G6).
     */
    public function index(IntegrationService $integrations): JsonResponse
    {
        $midtransEnabled = (bool) $integrations->get('payment.midtrans_server_key');

        $methods = PaymentMethod::active()
            ->when(! $midtransEnabled, fn ($query) => $query->where('type', '!=', 'midtrans'))
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        $grouped = [];
        foreach ($methods as $method) {
            $key = $method->category ?: 'Lainnya';
            if (! isset($grouped[$key])) {
                $grouped[$key] = [
                    'key' => $key,
                    'label' => $key . ($method->type === 'midtrans' ? ' (Verifikasi Otomatis Midtrans)' : ''),
                    'methods' => [],
                ];
            }
            $grouped[$key]['methods'][] = $this->formatCatalogMethod($method);
        }
        $categories = array_values($grouped);

        // Rekening bank manual dinamis dari konfigurasi Admin (`integrations`).
        $raw = $integrations->get('payment.manual_banks');
        $decoded = is_string($raw) ? json_decode($raw, true) : $raw;
        $banks = is_array($decoded) ? array_values($decoded) : [];

        if ($banks !== []) {
            $categories[] = [
                'key' => 'Transfer Bank Manual',
                'label' => 'Transfer Bank Manual (Verifikasi Penjual)',
                'methods' => array_map(
                    fn ($bank, $index) => [
                        'id' => 'manual_' . ($bank['code'] ?? $bank['bank_code'] ?? $index),
                        'name' => 'Transfer ' . ($bank['bank_name'] ?? $bank['bank'] ?? $bank['name'] ?? 'Bank') . ' Manual',
                        'code' => $bank['code'] ?? $bank['bank_code'] ?? null,
                        'type' => 'manual',
                        'icon' => 'Building2',
                        'fee' => $bank['fee'] ?? 0,
                        'fee_percent' => 0,
                        'fee_fixed' => (float) ($bank['fee'] ?? 0),
                        'badge' => 'Manual Verifikasi',
                        'description' => 'Transfer ke rekening resmi toko, konfirmasi diproses 1x24 jam',
                    ],
                    $banks,
                    array_keys($banks)
                ),
            ];
        }

        return response()->json([
            'data' => [
                'categories' => $categories,
                'midtrans_enabled' => $midtransEnabled,
                'manual_banks' => $banks,
            ],
        ]);
    }

    /**
     * Daftar master metode pembayaran untuk admin (paginated).
     */
    public function adminIndex(Request $request): JsonResponse
    {
        $query = PaymentMethod::query();

        if ($request->filled('search')) {
            $search = trim((string) $request->input('search'));
            $query->where(function ($q) use ($search) {
                $q->where('code', 'like', "%{$search}%")
                    ->orWhere('name', 'like', "%{$search}%")
                    ->orWhere('category', 'like', "%{$search}%");
            });
        }

        if ($request->filled('type')) {
            $query->where('type', $request->input('type'));
        }

        if ($request->has('is_active') && $request->input('is_active') !== '' && $request->input('is_active') !== null) {
            $query->where('is_active', filter_var($request->input('is_active'), FILTER_VALIDATE_BOOLEAN));
        }

        $summary = [
            'total_count' => PaymentMethod::count(),
            'active_count' => PaymentMethod::where('is_active', true)->count(),
            'midtrans_count' => PaymentMethod::where('type', 'midtrans')->count(),
            'manual_count' => PaymentMethod::where('type', 'manual')->count(),
        ];

        $sortBy = $request->input('sort_by', 'sort_order');
        $sortDir = strtolower((string) $request->input('sort_dir', 'asc')) === 'desc' ? 'desc' : 'asc';
        $allowedSorts = ['code', 'name', 'category', 'type', 'fee_percent', 'fee_fixed', 'is_active', 'sort_order', 'created_at'];
        if (! in_array($sortBy, $allowedSorts, true)) {
            $sortBy = 'sort_order';
        }

        $perPage = min(max((int) $request->input('per_page', 25), 5), 100);
        $paginated = $query->orderBy($sortBy, $sortDir)->paginate($perPage);

        return response()->json([
            'data' => collect($paginated->items())->map(fn ($m) => $this->formatRow($m)),
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
     * Tambah metode pembayaran (kode semantik, bukan sequence identitas).
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'max:64', 'regex:/^[a-z0-9_]+$/', 'unique:payment_methods,code'],
            'name' => ['required', 'string', 'max:150'],
            'category' => ['nullable', 'string', 'max:64'],
            'type' => ['required', Rule::in(['midtrans', 'manual'])],
            'icon' => ['nullable', 'string', 'max:64'],
            'badge' => ['nullable', 'string', 'max:64'],
            'description' => ['nullable', 'string', 'max:500'],
            'fee_percent' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'fee_fixed' => ['nullable', 'numeric', 'min:0'],
            'is_active' => ['boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ]);

        $method = PaymentMethod::create([
            'code' => strtolower(trim($validated['code'])),
            'name' => trim($validated['name']),
            'category' => $validated['category'] ?? 'Lainnya',
            'type' => $validated['type'],
            'icon' => $validated['icon'] ?? null,
            'badge' => $validated['badge'] ?? null,
            'description' => $validated['description'] ?? null,
            'fee_percent' => $validated['fee_percent'] ?? 0,
            'fee_fixed' => $validated['fee_fixed'] ?? 0,
            'is_active' => $validated['is_active'] ?? true,
            'sort_order' => $validated['sort_order'] ?? 0,
        ]);

        return response()->json([
            'message' => "Metode pembayaran {$method->name} berhasil ditambahkan.",
            'data' => $this->formatRow($method),
        ], 201);
    }

    /**
     * Detail metode pembayaran.
     */
    public function show(int $id): JsonResponse
    {
        $method = PaymentMethod::findOrFail($id);

        return response()->json(['data' => $this->formatRow($method)]);
    }

    /**
     * Ubah metode pembayaran.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $method = PaymentMethod::findOrFail($id);

        $validated = $request->validate([
            'code' => ['required', 'string', 'max:64', 'regex:/^[a-z0-9_]+$/', Rule::unique('payment_methods', 'code')->ignore($method->id)],
            'name' => ['required', 'string', 'max:150'],
            'category' => ['nullable', 'string', 'max:64'],
            'type' => ['required', Rule::in(['midtrans', 'manual'])],
            'icon' => ['nullable', 'string', 'max:64'],
            'badge' => ['nullable', 'string', 'max:64'],
            'description' => ['nullable', 'string', 'max:500'],
            'fee_percent' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'fee_fixed' => ['nullable', 'numeric', 'min:0'],
            'is_active' => ['boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ]);

        $method->update([
            'code' => strtolower(trim($validated['code'])),
            'name' => trim($validated['name']),
            'category' => $validated['category'] ?? $method->category,
            'type' => $validated['type'],
            'icon' => $validated['icon'] ?? null,
            'badge' => $validated['badge'] ?? null,
            'description' => $validated['description'] ?? null,
            'fee_percent' => $validated['fee_percent'] ?? 0,
            'fee_fixed' => $validated['fee_fixed'] ?? 0,
            'is_active' => $validated['is_active'] ?? $method->is_active,
            'sort_order' => $validated['sort_order'] ?? $method->sort_order,
        ]);

        return response()->json([
            'message' => "Metode pembayaran {$method->name} berhasil diperbarui.",
            'data' => $this->formatRow($method->fresh()),
        ]);
    }

    /**
     * Hapus metode pembayaran.
     */
    public function destroy(int $id): JsonResponse
    {
        $method = PaymentMethod::findOrFail($id);
        $name = $method->name;
        $method->delete();

        return response()->json(['message' => "Metode pembayaran {$name} berhasil dihapus."]);
    }

    /**
     * Toggle status aktif.
     */
    public function toggleStatus(int $id): JsonResponse
    {
        $method = PaymentMethod::findOrFail($id);
        $method->update(['is_active' => ! $method->is_active]);

        return response()->json([
            'message' => "Metode pembayaran {$method->name} " . ($method->is_active ? 'diaktifkan.' : 'dinonaktifkan.'),
            'data' => $this->formatRow($method->fresh()),
        ]);
    }

    private function formatCatalogMethod(PaymentMethod $method): array
    {
        return [
            'id' => $method->code,
            'name' => $method->name,
            'code' => $method->code,
            'type' => $method->type,
            'icon' => $method->icon,
            'fee' => (float) $method->fee_fixed,
            'fee_percent' => (float) $method->fee_percent,
            'fee_fixed' => (float) $method->fee_fixed,
            'badge' => $method->badge,
            'description' => $method->description,
        ];
    }

    private function formatRow(PaymentMethod $method): array
    {
        return [
            'id' => $method->id,
            'code' => $method->code,
            'name' => $method->name,
            'category' => $method->category,
            'type' => $method->type,
            'icon' => $method->icon,
            'badge' => $method->badge,
            'description' => $method->description,
            'fee_percent' => (float) $method->fee_percent,
            'fee_fixed' => (float) $method->fee_fixed,
            'is_active' => (bool) $method->is_active,
            'sort_order' => (int) $method->sort_order,
            'created_at' => $method->created_at?->toIso8601String(),
            'updated_at' => $method->updated_at?->toIso8601String(),
        ];
    }
}
