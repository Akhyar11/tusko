<?php

namespace App\Services;

use App\Models\Cart;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class CartService
{
    /**
     * Gabungkan keranjang guest (berdasarkan session_id) ke keranjang milik user.
     *
     * Item dengan produk + varian yang sama akan dijumlahkan kuantitasnya,
     * item unik dipindahkan ke keranjang user, lalu keranjang guest dihapus.
     *
     * @return bool true bila ada keranjang guest yang digabungkan.
     */
    public function mergeGuestCart(?User $user, ?string $sessionId): bool
    {
        if (! $user || ! $sessionId) {
            return false;
        }

        return DB::transaction(function () use ($user, $sessionId) {
            $guestCart = Cart::query()
                ->where('session_id', $sessionId)
                ->whereNull('user_id')
                ->with('items')
                ->first();

            if (! $guestCart || $guestCart->items->isEmpty()) {
                if ($guestCart) {
                    $guestCart->delete();
                }

                return false;
            }

            $userCart = Cart::firstOrCreate(['user_id' => $user->id]);

            foreach ($guestCart->items as $guestItem) {
                // Skema cart_items unik per (cart_id, product_id), sehingga
                // penggabungan dicocokkan berdasarkan produk.
                $existingItem = $userCart->items()
                    ->where('product_id', $guestItem->product_id)
                    ->first();

                if ($existingItem) {
                    $existingItem->update([
                        'quantity' => (int) $existingItem->quantity + (int) $guestItem->quantity,
                        'notes' => $existingItem->notes ?: $guestItem->notes,
                    ]);

                    $guestItem->delete();
                } else {
                    $guestItem->update(['cart_id' => $userCart->id]);
                }
            }

            $guestCart->delete();

            return true;
        });
    }
}
