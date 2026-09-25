<?php

namespace App\Services;

use App\Models\Menu;
use App\Models\Role;
use App\Models\User;
use App\Services\Settings\SettingsService;
use Illuminate\Support\Collection;

/**
 * MenuService — resolusi menu efektif seorang user (T37.4).
 *
 * Satu sumber kebenaran: menu admin per-role (`environment='admin'` via pivot
 * `role_menus`) + menu storefront publik (`environment='storefront'`), keduanya
 * difilter `is_active` dan `feature_flag` (T36.16). Dipakai oleh `menu.access`
 * (T37.5) dan endpoint `GET /api/auth/menus` (T37.4).
 */
class MenuService
{
    public function __construct(private readonly SettingsService $settings)
    {
    }

    /**
     * Menu admin yang boleh diakses user (gabungan seluruh role-nya).
     *
     * @return Collection<int, Menu>
     */
    public function adminMenusFor(User $user): Collection
    {
        $roleIds = $this->roleIdsFor($user);

        if ($roleIds->isEmpty()) {
            return collect();
        }

        return Menu::query()
            ->forEnvironment('admin')
            ->active()
            ->whereHas('roles', fn ($query) => $query->whereIn('roles.id', $roleIds))
            ->orderBy('sort_order')
            ->get()
            ->reject(fn (Menu $menu) => $this->flagDisabled($menu))
            ->values();
    }

    /**
     * Menu storefront publik (tanpa role).
     *
     * @return Collection<int, Menu>
     */
    public function storefrontMenus(): Collection
    {
        return Menu::query()
            ->forEnvironment('storefront')
            ->active()
            ->orderBy('sort_order')
            ->get()
            ->reject(fn (Menu $menu) => $this->flagDisabled($menu))
            ->values();
    }

    /**
     * Apakah menu dinonaktifkan oleh feature flag (default registry).
     */
    public function flagDisabled(Menu $menu): bool
    {
        return !empty($menu->feature_flag)
            && $this->settings->get($menu->feature_flag) === false;
    }

    /**
     * Seluruh role ID user: `users.role` + pivot `user_roles`.
     *
     * @return Collection<int, int>
     */
    public function roleIdsFor(User $user): Collection
    {
        return Role::query()
            ->where('name', $user->role)
            ->pluck('id')
            ->merge($user->roles()->pluck('roles.id'))
            ->unique()
            ->values();
    }
}
