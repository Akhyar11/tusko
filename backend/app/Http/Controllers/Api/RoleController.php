<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Services\ActivityLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class RoleController extends Controller
{
    public function __construct(private readonly ActivityLogService $activityLog)
    {
    }

    /**
     * Daftar role (server-side: cari, filter, sort, paginasi) — T24.3.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Role::query()->withCount(['users', 'menus']);

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('display_name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($request->filled('name')) {
            $query->where('name', 'like', '%' . $request->input('name') . '%');
        }

        if ($request->filled('display_name')) {
            $query->where('display_name', 'like', '%' . $request->input('display_name') . '%');
        }

        if ($request->has('is_system') && $request->input('is_system') !== 'all') {
            $query->where('is_system', filter_var($request->input('is_system'), FILTER_VALIDATE_BOOLEAN));
        }

        $sortBy = $request->input('sort_by', 'name');
        $sortDir = strtolower((string) $request->input('sort_dir', 'asc')) === 'desc' ? 'desc' : 'asc';
        $allowedSorts = ['name', 'display_name', 'is_system', 'users_count', 'menus_count', 'created_at', 'id'];
        $query->orderBy(in_array($sortBy, $allowedSorts, true) ? $sortBy : 'name', $sortDir);

        if ($request->boolean('all')) {
            $roles = $query->get()->map(fn (Role $role) => $this->formatRole($role));

            return response()->json([
                'data' => $roles,
                'total' => $roles->count(),
            ]);
        }

        $perPage = min((int) ($request->input('per_page') ?: 15), 100);
        $paginated = $query->paginate($perPage);
        $paginated->through(fn (Role $role) => $this->formatRole($role));

        return response()->json($paginated);
    }

    /**
     * Detail role — T24.3.
     */
    public function show(Role $role): JsonResponse
    {
        return response()->json([
            'data' => $this->formatRole($role->loadCount(['users', 'menus'])),
        ]);
    }

    /**
     * Tambah role baru — T24.3.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $this->validateRole($request);

        $role = Role::create([
            'name' => strtolower(trim($validated['name'])),
            'display_name' => $validated['display_name'],
            'description' => $validated['description'] ?? null,
            'is_system' => false,
        ]);

        $this->activityLog->log('role.created', $role, ['name' => $role->name]);

        return response()->json([
            'message' => "Role '{$role->display_name}' berhasil ditambahkan.",
            'data' => $this->formatRole($role->loadCount(['users', 'menus'])),
        ], 201);
    }

    /**
     * Perbarui role — T24.3.
     */
    public function update(Request $request, Role $role): JsonResponse
    {
        $validated = $this->validateRole($request, $role);

        $newName = strtolower(trim($validated['name'] ?? $role->name));
        if ($role->is_system && $newName !== $role->name) {
            return response()->json([
                'message' => 'Nama role sistem tidak dapat diubah.',
            ], 422);
        }

        $role->name = $newName;
        $role->display_name = $validated['display_name'] ?? $role->display_name;
        if (array_key_exists('description', $validated)) {
            $role->description = $validated['description'];
        }
        $role->save();

        $this->activityLog->log('role.updated', $role, ['name' => $role->name]);

        return response()->json([
            'message' => "Role '{$role->display_name}' berhasil diperbarui.",
            'data' => $this->formatRole($role->fresh()->loadCount(['users', 'menus'])),
        ]);
    }

    /**
     * Hapus role — T24.3. Role sistem / yang masih dipakai tidak dapat dihapus.
     */
    public function destroy(Role $role): JsonResponse
    {
        if ($role->is_system) {
            return response()->json([
                'message' => 'Role sistem tidak dapat dihapus.',
            ], 422);
        }

        $userCount = $role->users()->count();
        if ($userCount > 0) {
            return response()->json([
                'message' => "Role masih dipakai oleh {$userCount} pengguna. Pindahkan akses pengguna terlebih dahulu.",
            ], 422);
        }

        if ($role->menus()->exists()) {
            return response()->json([
                'message' => 'Role masih memiliki akses menu. Cabut akses menu terlebih dahulu.',
            ], 422);
        }

        $displayName = $role->display_name;
        $this->activityLog->log('role.deleted', $role, ['name' => $role->name]);
        $role->delete();

        return response()->json([
            'message' => "Role '{$displayName}' berhasil dihapus.",
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function validateRole(Request $request, ?Role $role = null): array
    {
        $required = $role ? 'sometimes' : 'required';

        return $request->validate([
            'name' => [
                $required, 'string', 'max:50', 'regex:/^[a-zA-Z0-9_]+$/',
                Rule::unique('roles', 'name')->ignore($role?->id),
            ],
            'display_name' => [$required, 'string', 'max:100'],
            'description' => ['nullable', 'string', 'max:500'],
        ], [
            'name.required' => 'Nama role wajib diisi.',
            'name.regex' => 'Nama role hanya boleh berisi huruf, angka, dan garis bawah.',
            'name.unique' => 'Nama role sudah digunakan.',
            'display_name.required' => 'Nama tampilan role wajib diisi.',
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function formatRole(Role $role): array
    {
        return [
            'id' => $role->id,
            'name' => $role->name,
            'display_name' => $role->display_name,
            'description' => $role->description,
            'is_system' => (bool) $role->is_system,
            'users_count' => $role->users_count ?? $role->users()->count(),
            'menus_count' => $role->menus_count ?? $role->menus()->count(),
            'created_at' => $role->created_at,
            'updated_at' => $role->updated_at,
        ];
    }
}
