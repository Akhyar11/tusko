<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthLoginLogoutTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_login_with_valid_credentials(): void
    {
        $user = User::create([
            'name' => 'Budi Santoso',
            'email' => 'budi@example.com',
            'phone' => '08123456789',
            'password' => Hash::make('password123'),
            'role' => 'customer',
            'is_active' => true,
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'budi@example.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'message',
                'user' => [
                    'id',
                    'name',
                    'email',
                    'phone',
                    'role',
                    'points',
                    'membership_tier',
                    'is_active',
                ],
                'token',
                'token_type',
            ])
            ->assertJson([
                'message' => 'Login berhasil.',
                'user' => [
                    'id' => $user->id,
                    'email' => 'budi@example.com',
                    'name' => 'Budi Santoso',
                ],
                'token_type' => 'Bearer',
            ]);

        $this->assertNotEmpty($response->json('token'));
    }

    public function test_user_can_login_using_phone_number(): void
    {
        User::create([
            'name' => 'Dewi Lestari',
            'email' => 'dewi@example.com',
            'phone' => '085711223344',
            'password' => Hash::make('rahasia123'),
            'role' => 'customer',
            'is_active' => true,
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => '085711223344',
            'password' => 'rahasia123',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Login berhasil.',
                'user' => [
                    'email' => 'dewi@example.com',
                    'phone' => '085711223344',
                ],
            ]);
    }

    public function test_login_fails_with_wrong_password(): void
    {
        User::create([
            'name' => 'Budi Santoso',
            'email' => 'budi@example.com',
            'password' => Hash::make('password123'),
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'budi@example.com',
            'password' => 'wrongpassword',
        ]);

        $response->assertStatus(401)
            ->assertJson([
                'message' => 'Email atau kata sandi yang Anda masukkan tidak valid.',
            ]);
    }

    public function test_login_fails_for_inactive_user(): void
    {
        User::create([
            'name' => 'User Nonaktif',
            'email' => 'inactive@example.com',
            'password' => Hash::make('password123'),
            'is_active' => false,
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'inactive@example.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(403)
            ->assertJson([
                'message' => 'Akun Anda telah dinonaktifkan. Silakan hubungi admin toko.',
            ]);
    }

    public function test_authenticated_user_can_get_profile_me(): void
    {
        $user = User::create([
            'name' => 'Siti Aminah',
            'email' => 'siti@example.com',
            'password' => Hash::make('password123'),
            'points' => 50,
        ]);

        $token = $user->createToken('test_token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/auth/me');

        $response->assertStatus(200)
            ->assertJson([
                'user' => [
                    'id' => $user->id,
                    'email' => 'siti@example.com',
                    'points' => 50,
                ],
            ]);
    }

    public function test_authenticated_user_can_logout_and_revoke_token(): void
    {
        $user = User::create([
            'name' => 'Budi Santoso',
            'email' => 'budi@example.com',
            'password' => Hash::make('password123'),
        ]);

        $token = $user->createToken('logout_test_token')->plainTextToken;

        $this->assertCount(1, $user->tokens);

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/auth/logout');

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Berhasil keluar dari akun.',
            ]);

        $this->assertCount(0, $user->fresh()->tokens);
    }
}
