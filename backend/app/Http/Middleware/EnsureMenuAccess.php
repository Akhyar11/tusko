<?php

namespace App\Http\Middleware;

use App\Models\Menu;
use App\Services\MenuService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * EnsureMenuAccess — guard akses halaman admin berbasis menu per-role (T37.5).
 *
 * User boleh mengakses bila salah satu role-nya memiliki menu admin (`environment='admin'`)
 * yang aktif dan `path_prefix`-nya mencakup path/target yang diminta (prefix match),
 * atau `view_key`-nya sama dengan target. Menu dengan `feature_flag` yang dinonaktifkan
 * (T36.16) tidak dihitung. Menu `environment='storefront'` bersifat publik dan tidak
 * pernah dipakai untuk menggerbangi area admin.
 */
class EnsureMenuAccess
{
    public function __construct(private readonly MenuService $menus)
    {
    }

    /**
     * @param  string  ...$required  Path halaman (mis. `/admin/product/create`) atau `view_key`
     *                               (mis. `products-admin`). Bila kosong, diturunkan dari path request.
     */
    public function handle(Request $request, Closure $next, string ...$required): Response
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

        $targets = $required !== [] ? array_values($required) : [$this->pathFromRequest($request)];

        foreach ($this->menus->adminMenusFor($user) as $menu) {
            foreach ($targets as $target) {
                if ($this->menuCovers($menu, (string) $target)) {
                    return $next($request);
                }
            }
        }

        return response()->json([
            'message' => 'Akses ditolak. Halaman ini tidak tersedia untuk peran Anda.',
        ], 403);
    }

    /**
     * Apakah menu mencakup target (prefix match path, atau exact match view_key).
     */
    private function menuCovers(Menu $menu, string $target): bool
    {
        if ($target === '') {
            return false;
        }

        if ($target[0] !== '/') {
            return $menu->view_key !== null && $menu->view_key === $target;
        }

        $prefix = rtrim((string) $menu->path_prefix, '/');
        if ($prefix === '') {
            return false;
        }

        $path = rtrim($target, '/');
        if ($path === '') {
            $path = '/';
        }

        return $path === $prefix || str_starts_with($path, $prefix . '/');
    }

    /**
     * Turunkan path halaman dari request API (buang segmen `api` di depan).
     */
    private function pathFromRequest(Request $request): string
    {
        $path = '/' . ltrim($request->path(), '/');

        if (str_starts_with($path, '/api/')) {
            return substr($path, 4);
        }

        if ($path === '/api') {
            return '/';
        }

        return $path;
    }
}
