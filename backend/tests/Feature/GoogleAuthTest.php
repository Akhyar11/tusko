<?php

namespace Tests\Feature;

use App\Models\SocialAccount;
use App\Models\User;
use App\Services\Settings\SettingsService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\User as SocialiteUser;
use Mockery;
use Tests\TestCase;

/**
 * T41 — Login Sosial Google (OAuth via Socialite).
 */
class GoogleAuthTest extends TestCase
{
    use RefreshDatabase;

    private function configureGoogle(bool $enabled = true, string $origins = 'https://toko.test'): void
    {
        app(SettingsService::class)->setGroup('auth', [
            'auth.google_enabled' => $enabled,
            'auth.google_client_id' => 'google-client-id',
            'auth.google_client_secret' => 'google-client-secret',
            'auth.google_redirect_url' => 'https://toko.test/api/auth/google/callback',
            'auth.allowed_redirect_origins' => $origins,
        ]);
    }

    private function fakeGoogleUser(string $id = 'g-123', string $email = 'budi.google@gmail.com', string $name = 'Budi Google'): SocialiteUser
    {
        return (new SocialiteUser())->map([
            'id' => $id,
            'email' => $email,
            'name' => $name,
            'avatar' => 'https://lh3.googleusercontent.com/a/avatar.png',
        ]);
    }

    private function mockSocialite(SocialiteUser $socialUser): void
    {
        $provider = Mockery::mock();
        $provider->shouldReceive('stateless')->andReturnSelf();
        $provider->shouldReceive('with')->andReturnSelf();
        $provider->shouldReceive('user')->andReturn($socialUser);
        $provider->shouldReceive('redirect')->andReturn(redirect('https://accounts.google.com/o/oauth2/auth?state=fake'));

        Socialite::shouldReceive('driver')->with('google')->andReturn($provider);
    }

    public function test_config_endpoint_reports_disabled_by_default(): void
    {
        $this->getJson('/api/auth/config')
            ->assertStatus(200)
            ->assertJsonPath('data.google_enabled', false);
    }

    public function test_config_endpoint_reports_enabled_when_configured(): void
    {
        $this->configureGoogle();

        $this->getJson('/api/auth/config')
            ->assertStatus(200)
            ->assertJsonPath('data.google_enabled', true);
    }

    public function test_redirect_rejected_when_not_configured(): void
    {
        $this->getJson('/api/auth/google/redirect?redirect_uri=https://toko.test/auth/callback')
            ->assertStatus(422);
    }

    public function test_redirect_rejected_for_disallowed_origin(): void
    {
        $this->configureGoogle();

        $this->getJson('/api/auth/google/redirect?redirect_uri=https://evil.example.com/auth/callback')
            ->assertStatus(422)
            ->assertJsonPath('message', 'Tujuan balik tidak diizinkan.');
    }

    public function test_redirect_returns_google_redirect_for_allowed_origin(): void
    {
        $this->configureGoogle();
        $this->mockSocialite($this->fakeGoogleUser());

        $response = $this->get('/api/auth/google/redirect?redirect_uri=https://toko.test/auth/callback');

        $response->assertStatus(302);
        $this->assertStringContainsString('accounts.google.com', (string) $response->headers->get('Location'));
    }

    public function test_callback_creates_new_user_and_issues_one_time_code(): void
    {
        $this->configureGoogle();
        $this->mockSocialite($this->fakeGoogleUser());

        Cache::put('google_oauth_state:state-abc', [
            'redirect_uri' => 'https://toko.test/auth/callback',
            'session_id' => null,
        ], now()->addMinutes(10));

        $response = $this->get('/api/auth/google/callback?state=state-abc&code=oauth-code');

        $response->assertStatus(302);
        $location = (string) $response->headers->get('Location');
        $this->assertStringContainsString('https://toko.test/auth/callback?code=', $location);

        $user = User::where('email', 'budi.google@gmail.com')->first();
        $this->assertNotNull($user);
        $this->assertNotNull($user->email_verified_at);
        $this->assertSame('customer', $user->role);
        $this->assertDatabaseHas('social_accounts', [
            'user_id' => $user->id,
            'provider' => 'google',
            'provider_user_id' => 'g-123',
        ]);
        $this->assertDatabaseHas('activity_logs', [
            'action' => 'auth.google_login',
            'subject_id' => $user->id,
        ]);
    }

    public function test_callback_links_existing_user_by_email(): void
    {
        $this->configureGoogle();
        $this->mockSocialite($this->fakeGoogleUser('g-999', 'existing@gmail.com'));

        $existing = User::factory()->create(['email' => 'existing@gmail.com', 'role' => 'customer', 'is_active' => true]);

        Cache::put('google_oauth_state:s2', ['redirect_uri' => 'https://toko.test/auth/callback'], now()->addMinutes(10));

        $this->get('/api/auth/google/callback?state=s2&code=c')->assertStatus(302);

        $this->assertSame(1, User::where('email', 'existing@gmail.com')->count());
        $this->assertDatabaseHas('social_accounts', ['user_id' => $existing->id, 'provider_user_id' => 'g-999']);
    }

    public function test_callback_rejects_invalid_state(): void
    {
        $this->configureGoogle();

        $this->getJson('/api/auth/google/callback?state=nonexistent&code=x')
            ->assertStatus(422);
    }

    public function test_exchange_returns_token_and_is_single_use(): void
    {
        $this->configureGoogle();
        $user = User::factory()->create(['role' => 'customer', 'is_active' => true]);

        Cache::put('google_login_code:' . hash('sha256', 'one-time-code'), ['user_id' => $user->id], now()->addSeconds(60));

        $this->postJson('/api/auth/google/exchange', ['code' => 'one-time-code'])
            ->assertStatus(200)
            ->assertJsonPath('user.id', $user->id)
            ->assertJsonStructure(['token', 'token_type']);

        // Sekali pakai: pemakaian kedua ditolak.
        $this->postJson('/api/auth/google/exchange', ['code' => 'one-time-code'])
            ->assertStatus(422);
    }

    public function test_exchange_rejects_inactive_user(): void
    {
        $this->configureGoogle();
        $user = User::factory()->create(['role' => 'customer', 'is_active' => false]);

        Cache::put('google_login_code:' . hash('sha256', 'code-2'), ['user_id' => $user->id], now()->addSeconds(60));

        $this->postJson('/api/auth/google/exchange', ['code' => 'code-2'])
            ->assertStatus(403);
    }
}
