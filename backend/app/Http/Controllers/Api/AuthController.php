<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Registrasi pengguna baru.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function register(Request $request): JsonResponse
    {
        // Mendukung penamaan passwordConfirmation dari camelCase React frontend
        if ($request->has('passwordConfirmation') && !$request->has('password_confirmation')) {
            $request->merge(['password_confirmation' => $request->input('passwordConfirmation')]);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email',
            'password' => 'required|string|min:6|confirmed',
            'phone' => 'nullable|string|max:30',
            'role' => 'nullable|string|in:customer,admin',
            'avatar' => 'nullable|string',
            'gender' => 'nullable|string|max:20',
            'birth_date' => 'nullable|date',
        ], [
            'name.required' => 'Nama lengkap wajib diisi.',
            'email.required' => 'Alamat email wajib diisi.',
            'email.email' => 'Format alamat email tidak valid.',
            'email.unique' => 'Alamat email sudah terdaftar.',
            'password.required' => 'Kata sandi wajib diisi.',
            'password.min' => 'Kata sandi minimal 6 karakter.',
            'password.confirmed' => 'Konfirmasi kata sandi tidak cocok.',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => strtolower(trim($validated['email'])),
            'password' => Hash::make($validated['password']),
            'phone' => $validated['phone'] ?? null,
            'role' => $validated['role'] ?? 'customer',
            'avatar' => $validated['avatar'] ?? null,
            'gender' => $validated['gender'] ?? null,
            'birth_date' => $validated['birth_date'] ?? null,
            'points' => 0,
            'membership_tier' => 'Member',
            'is_active' => true,
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Registrasi berhasil.',
            'user' => $this->formatUserResponse($user),
            'token' => $token,
            'token_type' => 'Bearer',
        ], 201);
    }

    /**
     * Autentikasi dan login pengguna.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function login(Request $request): JsonResponse
    {
        $loginInput = $request->input('email') ?? $request->input('login');

        $request->validate([
            'email' => 'required_without:login',
            'password' => 'required|string',
        ], [
            'email.required_without' => 'Alamat email atau nomor handphone wajib diisi.',
            'password.required' => 'Kata sandi wajib diisi.',
        ]);

        $loginIdentifier = trim($loginInput);

        $user = User::where('email', strtolower($loginIdentifier))
            ->orWhere('phone', $loginIdentifier)
            ->first();

        if (!$user || !Hash::check($request->input('password'), $user->password)) {
            return response()->json([
                'message' => 'Email atau kata sandi yang Anda masukkan tidak valid.',
            ], 401);
        }

        if (!$user->is_active) {
            return response()->json([
                'message' => 'Akun Anda telah dinonaktifkan. Silakan hubungi admin toko.',
            ], 403);
        }

        // Generate Sanctum token
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Login berhasil.',
            'user' => $this->formatUserResponse($user),
            'token' => $token,
            'token_type' => 'Bearer',
        ]);
    }

    /**
     * Logout pengguna dan cabut token akses.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user && $user->currentAccessToken()) {
            $user->currentAccessToken()->delete();
        }

        return response()->json([
            'message' => 'Berhasil keluar dari akun.',
        ]);
    }

    /**
     * Dapatkan data profil pengguna saat ini.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'user' => $this->formatUserResponse($user),
        ]);
    }

    /**
     * Ubah profil dan biodata pengguna yang sedang login.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();

        // Normalisasi penamaan camelCase dari React frontend
        if ($request->has('birthDate') && !$request->has('birth_date')) {
            $request->merge(['birth_date' => $request->input('birthDate')]);
        }
        if ($request->has('oldPassword') && !$request->has('old_password')) {
            $request->merge(['old_password' => $request->input('oldPassword')]);
        }
        if ($request->has('currentPassword') && !$request->has('old_password')) {
            $request->merge(['old_password' => $request->input('currentPassword')]);
        }
        if ($request->has('newPassword') && !$request->has('password')) {
            $request->merge(['password' => $request->input('newPassword')]);
        }
        if ($request->has('confirmPassword') && !$request->has('password_confirmation')) {
            $request->merge(['password_confirmation' => $request->input('confirmPassword')]);
        }

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => ['sometimes', 'required', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'phone' => 'nullable|string|max:30',
            'avatar' => 'nullable|string',
            'gender' => 'nullable|string|max:20',
            'birth_date' => 'nullable|date',
            'old_password' => 'nullable|string',
            'password' => 'nullable|string|min:6|confirmed',
        ], [
            'name.required' => 'Nama lengkap tidak boleh kosong.',
            'email.required' => 'Alamat email tidak boleh kosong.',
            'email.email' => 'Format alamat email tidak valid.',
            'email.unique' => 'Alamat email sudah digunakan oleh akun lain.',
            'password.min' => 'Kata sandi baru minimal 6 karakter.',
            'password.confirmed' => 'Konfirmasi kata sandi baru tidak cocok.',
        ]);

        // Verifikasi pergantian kata sandi
        if (!empty($validated['password'])) {
            $oldPassword = $request->input('old_password');
            if (empty($oldPassword)) {
                return response()->json([
                    'message' => 'Kata sandi saat ini wajib diisi untuk mengubah kata sandi.',
                    'errors' => [
                        'old_password' => ['Kata sandi saat ini wajib diisi.'],
                    ],
                ], 422);
            }

            if (!Hash::check($oldPassword, $user->password)) {
                return response()->json([
                    'message' => 'Kata sandi saat ini yang Anda masukkan salah.',
                    'errors' => [
                        'old_password' => ['Kata sandi saat ini tidak cocok.'],
                    ],
                ], 422);
            }

            $user->password = Hash::make($validated['password']);
        }

        if (array_key_exists('name', $validated)) {
            $user->name = $validated['name'];
        }
        if (array_key_exists('email', $validated)) {
            $user->email = strtolower(trim($validated['email']));
        }
        if (array_key_exists('phone', $validated)) {
            $user->phone = $validated['phone'];
        }
        if (array_key_exists('avatar', $validated)) {
            $user->avatar = $validated['avatar'];
        }
        if (array_key_exists('gender', $validated)) {
            $user->gender = $validated['gender'];
        }
        if (array_key_exists('birth_date', $validated)) {
            $user->birth_date = $validated['birth_date'];
        }

        $user->save();

        return response()->json([
            'message' => 'Profil berhasil diperbarui.',
            'user' => $this->formatUserResponse($user),
        ]);
    }

    /**
     * Format payload respon pengguna yang konsisten.
     *
     * @param User $user
     * @return array
     */
    protected function formatUserResponse(User $user): array
    {
        $defaultAddress = $user->defaultShippingAddress()->first() ?? $user->shippingAddresses()->first();

        $formattedAddress = $defaultAddress ? [
            'id' => $defaultAddress->id,
            'label' => $defaultAddress->label,
            'recipient_name' => $defaultAddress->recipient_name,
            'phone' => $defaultAddress->phone,
            'full_address' => $defaultAddress->full_address,
            'city' => $defaultAddress->city,
            'province' => $defaultAddress->province,
            'postal_code' => $defaultAddress->postal_code,
            'is_default' => (bool) $defaultAddress->is_default,
        ] : null;

        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'avatar' => $user->avatar,
            'gender' => $user->gender,
            'birth_date' => $user->birth_date?->format('Y-m-d'),
            'points' => (int) $user->points,
            'membership_tier' => $user->membership_tier,
            'role' => $user->role,
            'is_active' => (bool) $user->is_active,
            'default_address' => $formattedAddress,
            'defaultAddress' => $formattedAddress,
            'created_at' => $user->created_at,
            'updated_at' => $user->updated_at,
        ];
    }
}


