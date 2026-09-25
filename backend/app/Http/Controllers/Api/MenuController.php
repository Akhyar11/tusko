<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Menu;
use App\Services\MenuService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MenuController extends Controller
{
    public function __construct(private readonly MenuService $menus)
    {
    }

    /**
     * Menu efektif user yang sedang login (T37.4).
     *
     * - `admin`     : menu area admin yang diizinkan role user (butuh login).
     * - `storefront`: menu storefront publik (juga tersedia untuk tamu).
     */
    public function forUser(Request $request): JsonResponse
    {
        $user = $request->user();

        $admin = $user
            ? $this->menus->adminMenusFor($user)->map(fn (Menu $menu) => $this->formatMenu($menu))->values()
            : collect();

        $storefront = $this->menus->storefrontMenus()
            ->map(fn (Menu $menu) => $this->formatMenu($menu))
            ->values();

        return response()->json([
            'data' => [
                'admin' => $admin,
                'storefront' => $storefront,
            ],
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function formatMenu(Menu $menu): array
    {
        return [
            'id' => $menu->id,
            'parent_id' => $menu->parent_id,
            'environment' => $menu->environment,
            'section' => $menu->section,
            'label' => $menu->label,
            'sublabel' => $menu->sublabel,
            'path_prefix' => $menu->path_prefix,
            'view_key' => $menu->view_key,
            'icon' => $menu->icon,
            'feature_flag' => $menu->feature_flag,
            'sort_order' => $menu->sort_order,
        ];
    }
}
