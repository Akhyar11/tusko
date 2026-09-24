<?php

namespace App\Http\Controllers\Api\Concerns;

use App\Models\Order;
use Illuminate\Http\Request;

/**
 * Otorisasi kepemilikan order untuk endpoint pelanggan (anti-IDOR, T27.1).
 */
trait AuthorizesOrderAccess
{
    protected function ensureOrderAccess(Request $request, Order $order): void
    {
        $user = $request->user();

        // Admin bebas mengakses seluruh order.
        if ($user && ($user->role ?? 'customer') === 'admin') {
            return;
        }

        // Pelanggan terautentikasi hanya boleh mengakses order miliknya.
        if ($user && (int) $order->user_id === (int) $user->id) {
            return;
        }

        // Tamu hanya boleh mengakses order milik sesi guest-nya.
        $sessionId = $request->input('session_id') ?: $request->header('X-Session-ID');

        if (!$user && $order->guest_session_id && $sessionId
            && hash_equals((string) $order->guest_session_id, (string) $sessionId)) {
            return;
        }

        abort(404, 'Pesanan tidak ditemukan.');
    }
}
