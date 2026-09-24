<?php

namespace Tests\Feature;

use App\Models\User;
use App\Notifications\EmailVerificationNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\URL;
use Tests\TestCase;

class EmailVerificationTest extends TestCase
{
    use RefreshDatabase;

    private function signedVerificationUrl(User $user, ?string $hash = null): string
    {
        return URL::temporarySignedRoute('verification.verify', now()->addMinutes(60), [
            'id' => $user->id,
            'hash' => $hash ?? sha1($user->getEmailForVerification()),
        ]);
    }

    public function test_registration_sends_email_verification_notification(): void
    {
        Notification::fake();

        $response = $this->postJson('/api/auth/register', [
            'name' => 'Rian Baru',
            'email' => 'rian.baru@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'user' => [
                    'email' => 'rian.baru@example.com',
                    'email_verified_at' => null,
                ],
            ]);

        $user = User::where('email', 'rian.baru@example.com')->firstOrFail();

        $this->assertNull($user->email_verified_at);
        Notification::assertSentTo($user, EmailVerificationNotification::class);
    }

    public function test_user_can_verify_email_via_signed_url(): void
    {
        $user = User::factory()->unverified()->create();

        $response = $this->getJson($this->signedVerificationUrl($user));

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Alamat email berhasil diverifikasi.',
            ]);

        $this->assertNotNull($user->fresh()->email_verified_at);
    }

    public function test_verification_redirects_browser_to_frontend(): void
    {
        config()->set('app.frontend_url', 'https://storefront.tusko.test');

        $user = User::factory()->unverified()->create();

        $this->get($this->signedVerificationUrl($user))
            ->assertRedirect('https://storefront.tusko.test/email-verified?status=success');

        $this->assertNotNull($user->fresh()->email_verified_at);
    }

    public function test_verification_is_idempotent_for_already_verified_user(): void
    {
        $user = User::factory()->create();

        $this->assertNotNull($user->email_verified_at);

        $this->getJson($this->signedVerificationUrl($user))
            ->assertStatus(200);

        $this->assertNotNull($user->fresh()->email_verified_at);
    }

    public function test_verification_rejects_tampered_signature(): void
    {
        $user = User::factory()->unverified()->create();

        $this->getJson($this->signedVerificationUrl($user) . '&tampered=1')
            ->assertStatus(403);

        $this->assertNull($user->fresh()->email_verified_at);
    }

    public function test_verification_rejects_mismatched_hash(): void
    {
        $user = User::factory()->unverified()->create();

        $response = $this->getJson($this->signedVerificationUrl($user, sha1('email-lain@example.com')));

        $response->assertStatus(403);

        $this->assertNull($user->fresh()->email_verified_at);
    }

    public function test_unverified_user_can_resend_verification_email(): void
    {
        Notification::fake();

        $user = User::factory()->unverified()->create();
        $token = $user->createToken('test_token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/auth/email/resend');

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Tautan verifikasi telah dikirim ulang ke email Anda.',
            ]);

        Notification::assertSentTo($user, EmailVerificationNotification::class);
    }

    public function test_verified_user_resend_returns_already_verified_message(): void
    {
        Notification::fake();

        $user = User::factory()->create();
        $token = $user->createToken('test_token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/auth/email/resend');

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Alamat email Anda sudah terverifikasi.',
            ]);

        Notification::assertNothingSent();
    }

    public function test_resend_verification_requires_authentication(): void
    {
        $this->postJson('/api/auth/email/resend')
            ->assertStatus(401);
    }
}
