<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Vendor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class VendorController extends Controller
{
    /**
     * Display a listing of suppliers/vendors with search and filtering.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Vendor::query()->withCount(['purchaseOrders', 'bills']);

        // Search query (code, company_name, contact_person, email, phone)
        $search = $request->input('search') ?? $request->input('q');
        if (!empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('company_name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%")
                  ->orWhere('contact_person', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        // Filter by active status
        if ($request->has('is_active') && $request->input('is_active') !== 'all') {
            $query->where('is_active', filter_var($request->input('is_active'), FILTER_VALIDATE_BOOLEAN));
        }

        // Sorting
        $sortBy = $request->input('sort_by', 'company_name');
        $sortDir = $request->input('sort_dir', 'asc');
        $allowedSorts = ['company_name', 'code', 'created_at', 'payment_terms_days', 'purchase_orders_count', 'id'];
        
        if (in_array($sortBy, $allowedSorts)) {
            $query->orderBy($sortBy, $sortDir === 'desc' ? 'desc' : 'asc');
        } else {
            $query->orderBy('company_name', 'asc');
        }

        // Return all if requested
        if ($request->boolean('all')) {
            $vendors = $query->get();
            return response()->json([
                'data' => $vendors,
                'total' => $vendors->count(),
            ]);
        }

        $perPage = min((int) ($request->input('per_page') ?: 15), 100);
        $paginated = $query->paginate($perPage);

        return response()->json($paginated);
    }

    /**
     * Store a newly created vendor.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'company_name' => 'required|string|max:255',
            'code' => 'nullable|string|max:50|unique:vendors,code',
            'contact_person' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'required|string|max:50',
            'address' => 'required|string',
            'payment_terms_days' => 'nullable|integer|min:0|max:365',
            'bank_account_info' => 'nullable|string',
            'is_active' => 'nullable|boolean',
        ]);

        if (empty($validated['code'])) {
            $count = Vendor::count() + 1;
            $code = 'VND-' . str_pad($count, 3, '0', STR_PAD_LEFT);
            while (Vendor::where('code', $code)->exists()) {
                $count++;
                $code = 'VND-' . str_pad($count, 3, '0', STR_PAD_LEFT);
            }
            $validated['code'] = $code;
        } else {
            $validated['code'] = strtoupper(trim($validated['code']));
        }

        $validated['is_active'] = $request->input('is_active', true);
        $validated['payment_terms_days'] = $request->input('payment_terms_days', 30);

        $vendor = Vendor::create($validated);

        return response()->json([
            'message' => 'Supplier vendor berhasil ditambahkan.',
            'data' => $vendor,
        ], 201);
    }

    /**
     * Display the specified vendor.
     */
    public function show(string $id): JsonResponse
    {
        $vendor = Vendor::where('id', $id)
            ->orWhere('code', $id)
            ->withCount(['purchaseOrders', 'bills'])
            ->with(['purchaseOrders' => function ($q) {
                $q->latest()->limit(10);
            }, 'bills' => function ($q) {
                $q->latest()->limit(10);
            }])
            ->firstOrFail();

        return response()->json([
            'data' => $vendor,
        ]);
    }

    /**
     * Update the specified vendor.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $vendor = Vendor::where('id', $id)->orWhere('code', $id)->firstOrFail();

        $validated = $request->validate([
            'company_name' => 'sometimes|required|string|max:255',
            'code' => ['sometimes', 'required', 'string', 'max:50', Rule::unique('vendors', 'code')->ignore($vendor->id)],
            'contact_person' => 'sometimes|required|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'sometimes|required|string|max:50',
            'address' => 'sometimes|required|string',
            'payment_terms_days' => 'nullable|integer|min:0|max:365',
            'bank_account_info' => 'nullable|string',
            'is_active' => 'nullable|boolean',
        ]);

        if (isset($validated['code'])) {
            $validated['code'] = strtoupper(trim($validated['code']));
        }

        $vendor->update($validated);

        return response()->json([
            'message' => 'Data supplier vendor berhasil diperbarui.',
            'data' => $vendor,
        ]);
    }

    /**
     * Toggle active status.
     */
    public function toggleStatus(string $id): JsonResponse
    {
        $vendor = Vendor::where('id', $id)->orWhere('code', $id)->firstOrFail();
        $vendor->is_active = !$vendor->is_active;
        $vendor->save();

        return response()->json([
            'message' => 'Status aktif vendor berhasil diperbarui.',
            'data' => $vendor,
        ]);
    }

    /**
     * Remove the specified vendor.
     */
    public function destroy(string $id): JsonResponse
    {
        $vendor = Vendor::where('id', $id)->orWhere('code', $id)->firstOrFail();

        // Check if vendor has purchase orders
        if ($vendor->purchaseOrders()->exists()) {
            return response()->json([
                'message' => 'Vendor tidak dapat dihapus karena memiliki riwayat purchase order. Silakan nonaktifkan status vendor sebagai gantinya.',
            ], 422);
        }

        $vendor->delete();

        return response()->json([
            'message' => 'Supplier vendor berhasil dihapus.',
        ]);
    }
}
