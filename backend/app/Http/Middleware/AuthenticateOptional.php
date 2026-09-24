<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

/**
 * Autentikasi opsional (Sanctum): resolve user dari API token Bearer bila ada,
 * tetapi TIDAK menolak tamu (guest). Dipakai route yang menerima keduanya
 * (keranjang, checkout) sehingga controller cukup memakai `$request->user()`.
 */
class AuthenticateOptional
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->user()) {
            $user = Auth::guard('sanctum')->user();

            if ($user) {
                $request->setUserResolver(fn () => $user);
            }
        }

        return $next($request);
    }
}
