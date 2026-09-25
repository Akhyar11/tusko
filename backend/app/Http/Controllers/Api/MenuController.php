<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Menu;
use App\Models\Role;
use App\Services\MenuService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

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
     * Daftar menu admin (server-side: cari, filter, sort, paginasi) — T37.6.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Menu::query()->with('roles:id,name,display_name');

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('label', 'like', "%{$search}%")
                    ->orWhere('sublabel', 'like', "%{$search}%")
                    ->orWhere('path_prefix', 'like', "%{$search}%")
                    ->orWhere('view_key', 'like', "%{$search}%")
                    ->orWhere('section', 'like', "%{$search}%");
            });
        }

        if ($request->filled('pathSearch')) {
            $query->where('path_prefix', 'like', '%' . $request->input('pathSearch') . '%');
        }

        if ($request->filled('environment') && $request->input('environment') !== 'all') {
            $query->where('environment', $request->input('environment'));
        }

        if ($request->filled('section') && $request->input('section') !== 'all') {
            $query->where('section', $request->input('section'));
        }

        if ($request->has('is_active') && $request->input('is_active') !== 'all') {
            $query->where('is_active', filter_var($request->input('is_active'), FILTER_VALIDATE_BOOLEAN));
        }

        if ($request->has('feature_flag') && $request->input('feature_flag') !== 'all') {
            $hasFlag = filter_var($request->input('feature_flag'), FILTER_VALIDATE_BOOLEAN);
            $hasFlag ? $query->whereNotNull('feature_flag') : $query->whereNull('feature_flag');
        }

        $sortBy = $request->input('sort_by', 'sort_order');
        $sortDir = $request->input('sort_dir') === 'desc' ? 'desc' : 'asc';
        $allowedSorts = ['label', 'path_prefix', 'environment', 'section', 'sort_order', 'is_active', 'created_at', 'id'];

        $query->orderBy(
            in_array($sortBy, $allowedSorts, true) ? $sortBy : 'sort_order',
            $sortDir
        );

        $perPage = min((int) ($request->input('per_page') ?: 10), 100);
        $paginated = $query->paginate($perPage);
        $paginated->through(fn (Menu $menu) => $this->formatMenu($menu, true));

        return response()->json($paginated);
    }

    /**
     * Detail satu menu — T37.6.
     */
    public function show(Menu $menu): JsonResponse
    {
        return response()->json([
            'status' => 'success',
            'data' => $this->formatMenu($menu->load('roles:id,name,display_name'), true),
        ]);
    }

    /**
     * Tambah menu baru + assign ke role — T37.6.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $this->validateMenu($request);
        $roleIds = $this->normalizeRoleIds($validated);
        unset($validated['role_ids']);

        $menu = DB::transaction(function () use ($validated, $roleIds) {
            $menu = Menu::create($validated);
            $this->syncRoles($menu, $roleIds);

            return $menu;
        });

        return response()->json([
            'status' => 'success',
            'message' => "Menu '{$menu->label}' berhasil ditambahkan.",
            'data' => $this->formatMenu($menu->fresh('roles'), true),
        ], 201);
    }

    /**
     * Ubah menu + sinkronisasi role — T37.6.
     */
    public function update(Request $request, Menu $menu): JsonResponse
    {
        $validated = $this->validateMenu($request, $menu);
        $roleIds = $this->normalizeRoleIds($validated);
        unset($validated['role_ids']);

        DB::transaction(function () use ($menu, $validated, $roleIds) {
            $menu->update($validated);
            $this->syncRoles($menu, $roleIds);
        });

        return response()->json([
            'status' => 'success',
            'message' => "Menu '{$menu->label}' berhasil diperbarui.",
            'data' => $this->formatMenu($menu->fresh('roles'), true),
        ]);
    }

    /**
     * Hapus menu — T37.6.
     */
    public function destroy(Menu $menu): JsonResponse
    {
        $label = $menu->label;
        $menu->delete();

        return response()->json([
            'status' => 'success',
            'message' => "Menu '{$label}' berhasil dihapus.",
        ]);
    }

    /**
     * Aktif/nonaktifkan menu — T37.6.
     */
    public function toggleStatus(Menu $menu): JsonResponse
    {
        $menu->update(['is_active' => !$menu->is_active]);

        return response()->json([
            'status' => 'success',
            'message' => "Menu '{$menu->label}' " . ($menu->is_active ? 'diaktifkan' : 'dinonaktifkan') . '.',
            'data' => $this->formatMenu($menu->fresh('roles'), true),
        ]);
    }

    /**
     * Opsi role untuk penugasan menu — T37.6.
     */
    public function roleOptions(): JsonResponse
    {
        $roles = Role::query()
            ->orderBy('display_name')
            ->get(['id', 'name', 'display_name']);

        return response()->json([
            'status' => 'success',
            'data' => $roles,
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function validateMenu(Request $request, ?Menu $menu = null): array
    {
        return $request->validate([
            'parent_id' => ['nullable', 'integer', Rule::exists('menus', 'id')],
            'environment' => ['required', 'string', Rule::in(['admin', 'storefront'])],
            'section' => ['nullable', 'string', 'max:100'],
            'label' => ['required', 'string', 'max:150'],
            'sublabel' => ['nullable', 'string', 'max:200'],
            'path_prefix' => [
                'required', 'string', 'max:190', 'starts_with:/',
                Rule::unique('menus', 'path_prefix')
                    ->where(fn ($query) => $query->where('environment', $request->input('environment')))
                    ->ignore($menu?->id),
            ],
            'view_key' => ['nullable', 'string', 'max:100'],
            'icon' => ['nullable', 'string', 'max:100'],
            'feature_flag' => ['nullable', 'string', 'max:150'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
            'role_ids' => ['nullable', 'array'],
            'role_ids.*' => ['integer', Rule::exists('roles', 'id')],
        ], [
            'label.required' => 'Label menu wajib diisi.',
            'environment.required' => 'Environment menu wajib dipilih.',
            'environment.in' => 'Environment menu tidak valid.',
            'path_prefix.required' => 'Path prefix wajib diisi.',
            'path_prefix.starts_with' => 'Path prefix wajib diawali dengan tanda "/".',
            'path_prefix.unique' => 'Path prefix sudah dipakai menu lain pada environment ini.',
        ]);
    }

    /**
     * @param  array<string, mixed>  $validated
     * @return array<int, int>
     */
    private function normalizeRoleIds(array $validated): array
    {
        return array_map('intval', $validated['role_ids'] ?? []);
    }

    /**
     * Assign role hanya relevan untuk menu admin (storefront publik tanpa role).
     *
     * @param  array<int, int>  $roleIds
     */
    private function syncRoles(Menu $menu, array $roleIds): void
    {
        if ($menu->environment !== 'admin') {
            if ($menu->roles()->exists()) {
                $menu->roles()->sync([]);
            }

            return;
        }

        $menu->roles()->sync($roleIds);
    }

    /**
     * @return array<string, mixed>
     */
    private function formatMenu(Menu $menu, bool $withRoles = false): array
    {
        $data = [
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
            'is_active' => (bool) $menu->is_active,
        ];

        if ($withRoles) {
            $roles = $menu->relationLoaded('roles')
                ? $menu->roles
                : $menu->roles()->get(['roles.id', 'roles.name', 'roles.display_name']);

            $data['role_ids'] = $roles->pluck('id')->map(fn ($id) => (int) $id)->values()->all();
            $data['roles'] = $roles->map(fn (Role $role) => [
                'id' => $role->id,
                'name' => $role->name,
                'display_name' => $role->display_name,
            ])->values()->all();
        }

        return $data;
    }
}
