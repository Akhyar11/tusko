<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsAdmin
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'message' => 'Tidak terautentikasi. Silakan masuk terlebih dahulu.',
            ], 401);
        }

        if (!$user->is_active) {
            return response()->json([
                'message' => 'Akun Anda telah dinonaktifkan. Silakan hubungi administrator toko.',
            ], 403);
        }

        if ($user->role !== 'admin') {
            return response()->json([
                'message' => 'Akses ditolak. Endpoint ini khusus untuk administrator.',
            ], 403);
        }

        return $next($request);
    }
}
