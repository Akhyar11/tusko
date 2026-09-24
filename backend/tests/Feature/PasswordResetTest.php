<?php

namespace Tests\Feature;

use App\Models\User;
use App\Notifications\ResetPasswordNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Tests\TestCase;

class PasswordResetTest extends TestCase
{
    use RefreshDatabase;

    public function test_forgot_password_sends_reset_notification_to_registered_user(): void
    {
        Notification::fake();

        $user = User::factory()->create([
            'email' => 'reset@example.com',
        ]);

        $response = $this->postJson('/api/auth/forgot-password', [
            'email' => 'reset@example.com',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Jika email tersebut terdaftar, kami telah mengirimkan tautan reset kata sandi.',
            ]);

        Notification::assertSentTo($user, ResetPasswordNotification::class);
        $this->assertDatabaseHas('password_reset_tokens', [
            'email' => 'reset@example.com',
        ]);
    }

    public function test_reset_notification_url_points_to_configured_frontend(): void
    {
        Notification::fake();

        config()->set('app.frontend_url', 'https://storefront.tusko.test');

        $user = User::factory()->create([
            'email' => 'link@example.com',
        ]);

        $this->postJson('/api/auth/forgot-password', [
            'email' => 'link@example.com',
        ])->assertStatus(200);

        Notification::assertSentTo($user, ResetPasswordNotification::class, function (ResetPasswordNotification $notification) use ($user) {
            $mail = $notification->toMail($user);

            $this->assertStringStartsWith(
                'https://storefront.tusko.test/reset-password?',
                $mail->actionUrl
            );
            $this->assertStringContainsString('token=' . $notification->token, $mail->actionUrl);
            $this->assertStringContainsString('email=link%40example.com', $mail->actionUrl);

            return true;
        });
    }

    public function test_forgot_password_returns_generic_message_for_unknown_email(): void
    {
        Notification::fake();

        $response = $this->postJson('/api/auth/forgot-password', [
            'email' => 'tidak-ada@example.com',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Jika email tersebut terdaftar, kami telah mengirimkan tautan reset kata sandi.',
            ]);

        Notification::assertNothingSent();
        $this->assertDatabaseCount('password_reset_tokens', 0);
    }

    public function test_forgot_password_validates_email_input(): void
    {
        $response = $this->postJson('/api/auth/forgot-password', [
            'email' => 'bukan-email',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    public function test_user_can_reset_password_with_valid_token(): void
    {
        $user = User::factory()->create([
            'email' => 'budi@example.com',
            'password' => Hash::make('password123'),
        ]);

        $user->createToken('old_device');
        $this->assertCount(1, $user->tokens);

        $token = Password::broker()->createToken($user);

        $response = $this->postJson('/api/auth/reset-password', [
            'token' => $token,
            'email' => 'budi@example.com',
            'password' => 'passwordBaru123',
            'password_confirmation' => 'passwordBaru123',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Kata sandi berhasil direset. Silakan masuk dengan kata sandi baru Anda.',
            ]);

        $this->assertTrue(Hash::check('passwordBaru123', $user->fresh()->password));
        $this->assertDatabaseMissing('password_reset_tokens', [
            'email' => 'budi@example.com',
        ]);

        // Seluruh token API lama harus dicabut setelah reset.
        $this->assertCount(0, $user->fresh()->tokens);
    }

    public function test_reset_password_fails_with_invalid_token(): void
    {
        $user = User::factory()->create([
            'email' => 'budi@example.com',
            'password' => Hash::make('password123'),
        ]);

        Password::broker()->createToken($user);

        $response = $this->postJson('/api/auth/reset-password', [
            'token' => 'token-palsu',
            'email' => 'budi@example.com',
            'password' => 'passwordBaru123',
            'password_confirmation' => 'passwordBaru123',
        ]);

        $response->assertStatus(422)
            ->assertJson([
                'message' => 'Tautan reset kata sandi tidak valid atau telah kedaluwarsa.',
            ]);

        $this->assertTrue(Hash::check('password123', $user->fresh()->password));
    }

    public function test_reset_password_requires_confirmed_password(): void
    {
        $user = User::factory()->create([
            'email' => 'budi@example.com',
        ]);

        $token = Password::broker()->createToken($user);

        $response = $this->postJson('/api/auth/reset-password', [
            'token' => $token,
            'email' => 'budi@example.com',
            'password' => 'passwordBaru123',
            'password_confirmation' => 'tidak-cocok',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['password']);
    }
}
