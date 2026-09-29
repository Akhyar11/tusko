<?php

namespace App\Http\Controllers\Api;

use App\Models\SocialAccount;
use App\Models\User;
use App\Services\ActivityLogService;
use App\Services\CartService;
use App\Services\GoogleAuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Throwable;

/**
 * GoogleAuthController — login sosial Google (T41.4/T41.5).
 *
 * Alur: redirect (whitelist + state) -> callback (buat/link user, merge cart,
 * audit) -> one-time code -> exchange (Sanctum token). Mewarisi AuthController
 * untuk memakai ulang `formatUserResponse` (tanpa duplikasi).
 */
class GoogleAuthController extends AuthController
{
    private const STATE_PREFIX = 'google_oauth_state:';

    private const CODE_PREFIX = 'google_login_code:';

    /**
     * Konfigurasi login sosial untuk FE (GET /api/auth/config).
     */
    public function config(GoogleAuthService $google): JsonResponse
    {
        return response()->json([
            'data' => [
                'google_enabled' => $google->isConfigured(),
            ],
        ]);
    }

    /**
     * Mulai OAuth: validasi tujuan balik, simpan state, arahkan ke Google.
     */
    public function redirect(Request $request, GoogleAuthService $google): RedirectResponse|JsonResponse
    {
        if (! $google->isConfigured()) {
            return response()->json(['message' => 'Login Google belum dikonfigurasi admin.'], 422);
        }

        $data = $request->validate([
            'redirect_uri' => ['required', 'string', 'max:255'],
            'session_id' => ['nullable', 'string', 'max:100'],
        ], [
            'redirect_uri.required' => 'Tujuan balik (redirect_uri) wajib diisi.',
        ]);

        if (! $google->isAllowedRedirectUri($data['redirect_uri'])) {
            return response()->json(['message' => 'Tujuan balik tidak diizinkan.'], 422);
        }

        $state = Str::random(48);

        Cache::put(self::STATE_PREFIX . $state, [
            'redirect_uri' => $data['redirect_uri'],
            'session_id' => $data['session_id'] ?? null,
        ], now()->addMinutes(10));

        $google->applyConfig();

        return Socialite::driver('google')->stateless()->with(['state' => $state])->redirect();
    }

    /**
     * Callback Google: buat/link user, merge keranjang, audit, balik dengan one-time code.
     */
    public function callback(
        Request $request,
        GoogleAuthService $google,
        CartService $cartService,
        ActivityLogService $activityLog
    ): RedirectResponse|JsonResponse {
        if (! $google->isConfigured()) {
            return response()->json(['message' => 'Login Google belum dikonfigurasi admin.'], 422);
        }

        $state = (string) $request->query('state', '');
        $payload = $state !== '' ? Cache::pull(self::STATE_PREFIX . $state) : null;

        if (! is_array($payload) || empty($payload['redirect_uri'])) {
            return response()->json(['message' => 'Sesi login Google tidak valid atau kedaluwarsa.'], 422);
        }

        $redirectUri = (string) $payload['redirect_uri'];
        $sessionId = $payload['session_id'] ?? null;

        if (! $google->isAllowedRedirectUri($redirectUri)) {
            return response()->json(['message' => 'Tujuan balik tidak diizinkan.'], 422);
        }

        $google->applyConfig();

        try {
            $googleUser = Socialite::driver('google')->stateless()->user();
        } catch (Throwable $e) {
            report($e);

            return $this->redirectWithError($redirectUri, 'Gagal memverifikasi akun Google.');
        }

        $email = strtolower(trim((string) $googleUser->getEmail()));

        if ($email === '') {
            return $this->redirectWithError($redirectUri, 'Email Google tidak tersedia.');
        }

        $user = User::where('email', $email)->first();

        if ($user && ! $user->is_active) {
            return $this->redirectWithError($redirectUri, 'Akun Anda dinonaktifkan. Hubungi admin toko.');
        }

        $isNew = false;

        if (! $user) {
            $user = User::create([
                'name' => $googleUser->getName() ?: Str::before($email, '@'),
                'email' => $email,
                'password' => Hash::make(Str::random(40)),
                'role' => 'customer',
                'is_active' => true,
            ]);
            $user->markEmailAsVerified();
            $isNew = true;
        }

        SocialAccount::updateOrCreate(
            ['provider' => 'google', 'provider_user_id' => (string) $googleUser->getId()],
            [
                'user_id' => $user->id,
                'email' => $email,
                'name' => $googleUser->getName(),
                'avatar' => $googleUser->getAvatar(),
            ]
        );

        $cartService->mergeGuestCart($user, is_string($sessionId) ? $sessionId : null);

        $activityLog->log('auth.google_login', $user, [
            'provider' => 'google',
            'is_new' => $isNew,
            'email' => $email,
        ], $user->id, $request->ip());

        $code = Str::random(64);

        Cache::put(self::CODE_PREFIX . hash('sha256', $code), [
            'user_id' => $user->id,
        ], now()->addSeconds(60));

        return redirect()->away($this->appendQuery($redirectUri, ['code' => $code]));
    }

    /**
     * Tukar one-time code menjadi Sanctum token (POST /api/auth/google/exchange).
     */
    public function exchange(Request $request): JsonResponse
    {
        $data = $request->validate([
            'code' => ['required', 'string', 'max:200'],
        ], [
            'code.required' => 'Kode login Google wajib diisi.',
        ]);

        $payload = Cache::pull(self::CODE_PREFIX . hash('sha256', $data['code']));

        if (! is_array($payload) || empty($payload['user_id'])) {
            return response()->json(['message' => 'Kode login Google tidak valid atau kedaluwarsa.'], 422);
        }

        $user = User::find($payload['user_id']);

        if (! $user) {
            return response()->json(['message' => 'Akun tidak ditemukan.'], 422);
        }

        if (! $user->is_active) {
            return response()->json(['message' => 'Akun Anda dinonaktifkan. Hubungi admin toko.'], 403);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Login berhasil.',
            'user' => $this->formatUserResponse($user),
            'token' => $token,
            'token_type' => 'Bearer',
        ]);
    }

    private function redirectWithError(string $redirectUri, string $message): RedirectResponse
    {
        return redirect()->away($this->appendQuery($redirectUri, ['error' => $message]));
    }

    /**
     * @param  array<string, string>  $params
     */
    private function appendQuery(string $uri, array $params): string
    {
        $separator = str_contains($uri, '?') ? '&' : '?';

        return $uri . $separator . http_build_query($params);
    }
}
