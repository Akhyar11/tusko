<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreShippingAddressRequest;
use App\Http\Resources\ShippingAddressResource;
use App\Models\ShippingAddress;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ShippingAddressController extends Controller
{
    /**
     * Get or fallback to current user.
     */
    protected function resolveUser(Request $request): User
    {
        $user = auth('sanctum')->user() ?: $request->user();

        return $user ?: User::firstOrCreate(
            ['email' => 'guest@tokoonline.com'],
            ['name' => 'Pengguna Toko', 'password' => bcrypt('password123')]
        );
    }

    /**
     * List all shipping addresses for the user.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $this->resolveUser($request);

        $addresses = ShippingAddress::where('user_id', $user->id)
            ->orderByDesc('is_default')
            ->orderByDesc('id')
            ->get();

        return response()->json([
            'data' => ShippingAddressResource::collection($addresses),
        ]);
    }

    /**
     * Store a new shipping address.
     */
    public function store(StoreShippingAddressRequest $request): JsonResponse
    {
        $user = $this->resolveUser($request);
        $data = $request->validated();

        $existingCount = ShippingAddress::where('user_id', $user->id)->count();
        $isDefault = $existingCount === 0 || ($request->boolean('is_default'));

        $address = ShippingAddress::create([
            ...$data,
            'user_id' => $user->id,
            'is_default' => $isDefault,
        ]);

        if ($isDefault) {
            $address->markAsDefault();
        }

        return response()->json([
            'message' => 'Alamat pengiriman berhasil disimpan.',
            'data' => new ShippingAddressResource($address->fresh()),
        ], 201);
    }

    /**
     * Update an existing shipping address.
     */
    public function update(StoreShippingAddressRequest $request, int $id): JsonResponse
    {
        $user = $this->resolveUser($request);

        $address = ShippingAddress::where('user_id', $user->id)
            ->where('id', $id)
            ->firstOrFail();

        $data = $request->validated();
        $isDefault = $request->boolean('is_default');

        $address->update($data);

        if ($isDefault) {
            $address->markAsDefault();
        }

        return response()->json([
            'message' => 'Alamat pengiriman berhasil diperbarui.',
            'data' => new ShippingAddressResource($address->fresh()),
        ]);
    }

    /**
     * Delete a shipping address.
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $user = $this->resolveUser($request);

        $address = ShippingAddress::where('user_id', $user->id)
            ->where('id', $id)
            ->firstOrFail();

        $wasDefault = $address->is_default;
        $address->delete();

        // If the deleted address was default, set the latest remaining address as default
        if ($wasDefault) {
            $nextDefault = ShippingAddress::where('user_id', $user->id)->first();
            $nextDefault?->markAsDefault();
        }

        return response()->json([
            'message' => 'Alamat pengiriman berhasil dihapus.',
        ]);
    }

    /**
     * Mark an address as the default shipping address.
     */
    public function setDefault(Request $request, int $id): JsonResponse
    {
        $user = $this->resolveUser($request);

        $address = ShippingAddress::where('user_id', $user->id)
            ->where('id', $id)
            ->firstOrFail();

        $address->markAsDefault();

        return response()->json([
            'message' => 'Alamat berhasil dijadikan sebagai alamat utama.',
            'data' => new ShippingAddressResource($address->fresh()),
        ]);
    }
}
