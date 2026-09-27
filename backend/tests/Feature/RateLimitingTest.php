<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RateLimitingTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_is_rate_limited_after_five_attempts_per_identity(): void
    {
        $payload = ['email' => 'attacker@example.com', 'password' => 'salah-terus'];

        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/auth/login', $payload)->assertStatus(401);
        }

        $this->postJson('/api/auth/login', $payload)->assertStatus(429);

        // Kunci berbeda (email lain) tidak ikut terblokir.
        $this->postJson('/api/auth/login', [
            'email' => 'lain@example.com',
            'password' => 'salah-terus',
        ])->assertStatus(401);
    }

    public function test_register_is_rate_limited_after_five_attempts(): void
    {
        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/auth/register', [])->assertStatus(422);
        }

        $this->postJson('/api/auth/register', [])->assertStatus(429);
    }

    public function test_checkout_is_rate_limited(): void
    {
        for ($i = 0; $i < 20; $i++) {
            $this->postJson('/api/checkout', [])->assertStatus(422);
        }

        $this->postJson('/api/checkout', [])->assertStatus(429);
    }

    public function test_reset_password_is_rate_limited_after_five_attempts(): void
    {
        $payload = [
            'email' => 'reset@example.com',
            'token' => 'token-palsu',
            'password' => 'password-baru',
            'password_confirmation' => 'password-baru',
        ];

        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/auth/reset-password', $payload)->assertStatus(422);
        }

        $this->postJson('/api/auth/reset-password', $payload)->assertStatus(429);
    }
}
