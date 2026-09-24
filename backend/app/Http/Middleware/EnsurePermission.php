<?php

namespace App\Http\Middleware;

use App\Models\Permission;
use App\Models\Role;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsurePermission
{
    /**
     * Pastikan pengguna memiliki salah satu permission yang diminta (T24.1).
     *
     * Admin selalu diizinkan. Permission diambil dari peran pengguna
     * (`users.role` + pivot `user_roles`) via tabel `role_permissions`.
     */
    public function handle(Request $request, Closure $next, string ...$permissions): Response
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

        if ($user->role === 'admin') {
            return $next($request);
        }

        if ($permissions === []) {
            return $next($request);
        }

        $granted = $this->permissionCodes($user);

        foreach ($permissions as $permission) {
            if (in_array($permission, $granted, true)) {
                return $next($request);
            }
        }

        return response()->json([
            'message' => 'Akses ditolak. Anda tidak memiliki izin yang diperlukan.',
        ], 403);
    }

    /**
     * @return array<int, string>
     */
    private function permissionCodes($user): array
    {
        $roleIds = Role::query()
            ->where('name', $user->role)
            ->pluck('id')
            ->merge($user->roles()->pluck('roles.id'))
            ->unique()
            ->values();

        if ($roleIds->isEmpty()) {
            return [];
        }

        return Permission::query()
            ->whereHas('roles', fn ($query) => $query->whereIn('roles.id', $roleIds))
            ->pluck('code')
            ->all();
    }
}
