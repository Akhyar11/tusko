<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Voucher;
use App\Models\VoucherTarget;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class VoucherController extends Controller
{
    /**
     * Dapatkan daftar kupon dan voucher aktif.
     */
    public function index(Request $request): JsonResponse
    {
        $vouchers = Voucher::active()
            ->orderBy('id', 'asc')
            ->get();

        return response()->json([
            'data' => $vouchers,
        ]);
    }

    /**
     * Klaim atau validasi voucher dengan kode tertentu.
     */
    public function claim(Request $request): JsonResponse
    {
        $request->validate([
            'code' => 'required|string',
        ]);

        $code = strtoupper(trim($request->input('code')));
        $voucher = Voucher::active()->where('code', $code)->first();

        if (!$voucher) {
            return response()->json([
                'message' => "Voucher dengan kode \"{$code}\" tidak ditemukan atau sudah kedaluwarsa.",
            ], 404);
        }

        return response()->json([
            'message' => "Voucher \"{$voucher->title}\" berhasil diklaim.",
            'data' => $voucher,
        ]);
    }

    /**
     * Daftar voucher untuk admin (server-side: pencarian, filter, sorting, paginasi).
     */
    public function adminIndex(Request $request): JsonResponse
    {
        $query = Voucher::query()->withCount('usages');

        $search = $request->input('search') ?? $request->input('q');
        if (! empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('code', 'like', "%{$search}%")
                  ->orWhere('title', 'like', "%{$search}%");
            });
        }

        if ($request->filled('is_active') && $request->input('is_active') !== 'all') {
            $query->where('is_active', filter_var($request->input('is_active'), FILTER_VALIDATE_BOOLEAN));
        }

        if ($request->filled('discount_type') && $request->input('discount_type') !== 'all') {
            $query->where('discount_type', $request->input('discount_type'));
        }

        $sortBy = $request->input('sort_by', 'id');
        $allowedSorts = ['id', 'code', 'title', 'discount_value', 'min_purchase', 'used_count', 'quota', 'expires_at', 'created_at'];
        $sortDir = strtolower((string) $request->input('sort_dir', 'desc')) === 'asc' ? 'asc' : 'desc';
        $query->orderBy(in_array($sortBy, $allowedSorts, true) ? $sortBy : 'id', $sortDir);

        if ($request->boolean('all')) {
            $vouchers = $query->with('targets')->get();

            return response()->json([
                'data' => $vouchers,
                'total' => $vouchers->count(),
            ]);
        }

        $perPage = min((int) ($request->input('per_page') ?: 15), 100);

        return response()->json($query->with('targets')->paginate($perPage));
    }

    /**
     * Buat voucher baru (admin) + sinkronisasi cakupan target.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $this->validateVoucherPayload($request);

        $voucher = DB::transaction(function () use ($validated) {
            $targets = $validated['targets'] ?? [];
            unset($validated['targets']);

            $voucher = Voucher::create($validated);
            $this->syncTargets($voucher, $targets);

            return $voucher;
        });

        return response()->json([
            'message' => 'Voucher berhasil ditambahkan.',
            'data' => $voucher->load('targets'),
        ], 201);
    }

    /**
     * Detail voucher (admin).
     */
    public function show(string $id): JsonResponse
    {
        $voucher = Voucher::with('targets')->withCount('usages')->findOrFail($id);

        return response()->json(['data' => $voucher]);
    }

    /**
     * Perbarui voucher (admin) + ganti cakupan target bila dikirim.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $voucher = Voucher::findOrFail($id);
        $validated = $this->validateVoucherPayload($request, $voucher);

        DB::transaction(function () use ($voucher, $validated) {
            $targets = $validated['targets'] ?? null;
            unset($validated['targets']);

            $voucher->update($validated);

            if ($targets !== null) {
                $voucher->targets()->delete();
                $this->syncTargets($voucher, $targets);
            }
        });

        return response()->json([
            'message' => 'Voucher berhasil diperbarui.',
            'data' => $voucher->fresh()->load('targets'),
        ]);
    }

    /**
     * Hapus voucher (admin).
     */
    public function destroy(string $id): JsonResponse
    {
        $voucher = Voucher::findOrFail($id);
        $voucher->delete();

        return response()->json([
            'message' => 'Voucher berhasil dihapus.',
        ]);
    }

    /**
     * Validasi payload create/update voucher (satu sumber aturan).
     *
     * @return array<string, mixed>
     */
    private function validateVoucherPayload(Request $request, ?Voucher $voucher = null): array
    {
        if ($request->filled('code')) {
            $request->merge(['code' => strtoupper(trim((string) $request->input('code')))]);
        }

        $uniqueCode = Rule::unique('vouchers', 'code');
        if ($voucher) {
            $uniqueCode = $uniqueCode->ignore($voucher->id);
        }

        $required = $voucher ? 'sometimes' : 'required';

        $validated = $request->validate([
            'code' => [$required, 'string', 'max:50', $uniqueCode],
            'title' => [$required, 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'badge' => ['nullable', 'string', 'max:50'],
            'discount_type' => [$required, 'string', 'in:fixed,percent'],
            'discount_value' => [$required, 'numeric', 'min:0'],
            'min_purchase' => ['nullable', 'numeric', 'min:0'],
            'max_discount' => ['nullable', 'numeric', 'min:0'],
            'quota' => ['nullable', 'integer', 'min:1'],
            'per_user_limit' => ['nullable', 'integer', 'min:1'],
            'is_free_shipping' => ['nullable', 'boolean'],
            'stackable' => ['nullable', 'boolean'],
            'expires_at' => ['nullable', 'date'],
            'is_active' => ['nullable', 'boolean'],
            'targets' => ['nullable', 'array'],
            'targets.*.target_type' => ['required', 'string', 'in:all,product,variant,category'],
            'targets.*.target_id' => ['nullable', 'integer'],
        ]);

        if (isset($validated['targets'])) {
            foreach ($validated['targets'] as $index => $target) {
                if ($target['target_type'] !== 'all' && empty($target['target_id'])) {
                    throw ValidationException::withMessages([
                        "targets.{$index}.target_id" => ['Target ID wajib diisi untuk tipe cakupan ini.'],
                    ]);
                }
            }
        }

        return $validated;
    }

    /**
     * Tulis ulang baris cakupan target voucher.
     *
     * @param  array<int, array{target_type: string, target_id?: int|null}>  $targets
     */
    private function syncTargets(Voucher $voucher, array $targets): void
    {
        foreach ($targets as $target) {
            VoucherTarget::create([
                'voucher_id' => $voucher->id,
                'target_type' => $target['target_type'],
                'target_id' => $target['target_type'] === 'all' ? null : (int) $target['target_id'],
            ]);
        }
    }
}
