<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\ActivityLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function __construct(private readonly ActivityLogService $activityLog)
    {
    }

    /**
     * Daftar pengguna (server-side: pencarian, filter, sorting, paginasi) — T38.1.
     */
    public function index(Request $request): JsonResponse
    {
        $query = User::query()->with('roles:id,name,display_name');

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        if ($request->filled('name')) {
            $query->where('name', 'like', '%' . $request->input('name') . '%');
        }

        if ($request->filled('email')) {
            $query->where('email', 'like', '%' . $request->input('email') . '%');
        }

        if ($request->filled('phone')) {
            $query->where('phone', 'like', '%' . $request->input('phone') . '%');
        }

        if ($request->filled('role') && $request->input('role') !== 'all') {
            $query->where('role', $request->input('role'));
        }

        if ($request->filled('role_id') && $request->input('role_id') !== 'all') {
            $roleId = (int) $request->input('role_id');
            $query->whereHas('roles', fn ($q) => $q->where('roles.id', $roleId));
        }

        if ($request->has('is_active') && $request->input('is_active') !== 'all') {
            $query->where('is_active', filter_var($request->input('is_active'), FILTER_VALIDATE_BOOLEAN));
        }

        if ($request->has('email_verified') && $request->input('email_verified') !== 'all') {
            filter_var($request->input('email_verified'), FILTER_VALIDATE_BOOLEAN)
                ? $query->whereNotNull('email_verified_at')
                : $query->whereNull('email_verified_at');
        }

        $sortBy = $request->input('sort_by', 'created_at');
        $sortDir = strtolower((string) $request->input('sort_dir', 'desc')) === 'asc' ? 'asc' : 'desc';
        $allowedSorts = ['name', 'email', 'role', 'is_active', 'points', 'created_at', 'id'];
        $query->orderBy(in_array($sortBy, $allowedSorts, true) ? $sortBy : 'created_at', $sortDir);

        if ($request->boolean('all')) {
            $users = $query->get()->map(fn (User $user) => $this->formatUser($user));

            return response()->json([
                'data' => $users,
                'total' => $users->count(),
            ]);
        }

        $perPage = min((int) ($request->input('per_page') ?: 15), 100);
        $paginated = $query->paginate($perPage);
        $paginated->through(fn (User $user) => $this->formatUser($user));

        return response()->json($paginated);
    }

    /**
     * Detail pengguna — T38.1.
     */
    public function show(User $user): JsonResponse
    {
        return response()->json([
            'data' => $this->formatUser($user->load('roles:id,name,display_name')),
        ]);
    }

    /**
     * Tambah pengguna baru (akun) — T38.1. Assign role dilakukan via endpoint terpisah (T38.2).
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $this->validateUser($request);

        $user = User::create([
            'name' => $validated['name'],
            'email' => strtolower(trim($validated['email'])),
            'phone' => $validated['phone'] ?? null,
            'password' => Hash::make($validated['password']),
            'role' => 'customer',
            'is_active' => $validated['is_active'] ?? true,
            'gender' => $validated['gender'] ?? null,
            'birth_date' => $validated['birth_date'] ?? null,
        ]);

        $this->activityLog->log('user.created', $user, [
            'email' => $user->email,
            'role' => $user->role,
        ]);

        return response()->json([
            'message' => "Akun '{$user->name}' berhasil ditambahkan.",
            'data' => $this->formatUser($user->load('roles:id,name,display_name')),
        ], 201);
    }

    /**
     * Perbarui data akun pengguna — T38.1.
     */
    public function update(Request $request, User $user): JsonResponse
    {
        $validated = $this->validateUser($request, $user);

        if (array_key_exists('is_active', $validated)
            && !$validated['is_active']
            && $user->id === $request->user()->id) {
            return response()->json([
                'message' => 'Anda tidak dapat menonaktifkan akun Anda sendiri.',
            ], 422);
        }

        $user->name = $validated['name'] ?? $user->name;
        $user->email = array_key_exists('email', $validated)
            ? strtolower(trim($validated['email']))
            : $user->email;
        if (array_key_exists('phone', $validated)) {
            $user->phone = $validated['phone'];
        }
        if (!empty($validated['password'])) {
            $user->password = Hash::make($validated['password']);
        }
        if (array_key_exists('is_active', $validated)) {
            $user->is_active = (bool) $validated['is_active'];
        }
        if (array_key_exists('gender', $validated)) {
            $user->gender = $validated['gender'];
        }
        if (array_key_exists('birth_date', $validated)) {
            $user->birth_date = $validated['birth_date'];
        }

        $user->save();

        $this->activityLog->log('user.updated', $user, [
            'changes' => array_keys($validated),
        ]);

        return response()->json([
            'message' => "Akun '{$user->name}' berhasil diperbarui.",
            'data' => $this->formatUser($user->fresh('roles:id,name,display_name')),
        ]);
    }

    /**
     * Hapus pengguna — T38.1.
     */
    public function destroy(Request $request, User $user): JsonResponse
    {
        if ($user->id === $request->user()->id) {
            return response()->json([
                'message' => 'Anda tidak dapat menghapus akun Anda sendiri.',
            ], 422);
        }

        $name = $user->name;
        $this->activityLog->log('user.deleted', $user, [
            'email' => $user->email,
            'role' => $user->role,
        ]);
        $user->delete();

        return response()->json([
            'message' => "Akun '{$name}' berhasil dihapus.",
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function validateUser(Request $request, ?User $user = null): array
    {
        $required = $user ? 'sometimes' : 'required';

        return $request->validate([
            'name' => [$required, 'string', 'max:255'],
            'email' => [
                $required, 'string', 'email', 'max:255',
                Rule::unique('users', 'email')->ignore($user?->id),
            ],
            'phone' => ['nullable', 'string', 'max:30'],
            'password' => [$user ? 'nullable' : 'required', 'string', 'min:6'],
            'is_active' => ['nullable', 'boolean'],
            'gender' => ['nullable', 'string', Rule::in(['male', 'female', 'other'])],
            'birth_date' => ['nullable', 'date'],
        ], [
            'name.required' => 'Nama lengkap wajib diisi.',
            'email.required' => 'Alamat email wajib diisi.',
            'email.email' => 'Format alamat email tidak valid.',
            'email.unique' => 'Alamat email sudah terdaftar.',
            'password.required' => 'Kata sandi wajib diisi.',
            'password.min' => 'Kata sandi minimal 6 karakter.',
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function formatUser(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'avatar' => $user->avatar,
            'role' => $user->role,
            'is_active' => (bool) $user->is_active,
            'points' => (int) $user->points,
            'membership_tier' => $user->membership_tier ?: 'Member',
            'email_verified_at' => $user->email_verified_at,
            'roles' => $user->relationLoaded('roles')
                ? $user->roles->map(fn ($role) => [
                    'id' => $role->id,
                    'name' => $role->name,
                    'display_name' => $role->display_name,
                ])->values()->all()
                : [],
            'role_ids' => $user->relationLoaded('roles')
                ? $user->roles->pluck('id')->map(fn ($id) => (int) $id)->values()->all()
                : [],
            'created_at' => $user->created_at,
            'updated_at' => $user->updated_at,
        ];
    }
}
