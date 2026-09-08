<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthRegisterTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_register_successfully(): void
    {
        $payload = [
            'name' => 'Ahmad Rian',
            'email' => 'ahmad.rian@example.com',
            'phone' => '081234567890',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ];

        $response = $this->postJson('/api/auth/register', $payload);

        $response->assertStatus(201)
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
                    'created_at',
                ],
                'token',
                'token_type',
            ])
            ->assertJson([
                'message' => 'Registrasi berhasil.',
                'user' => [
                    'name' => 'Ahmad Rian',
                    'email' => 'ahmad.rian@example.com',
                    'phone' => '081234567890',
                    'role' => 'customer',
                    'points' => 0,
                    'membership_tier' => 'Member',
                    'is_active' => true,
                ],
                'token_type' => 'Bearer',
            ]);

        $this->assertDatabaseHas('users', [
            'email' => 'ahmad.rian@example.com',
            'name' => 'Ahmad Rian',
            'phone' => '081234567890',
            'role' => 'customer',
        ]);

        $this->assertNotEmpty($response->json('token'));
    }

    public function test_user_can_register_with_camel_case_password_confirmation(): void
    {
        $payload = [
            'name' => 'Siti Nurhaliza',
            'email' => 'siti@example.com',
            'password' => 'secret123',
            'passwordConfirmation' => 'secret123',
        ];

        $response = $this->postJson('/api/register', $payload);

        $response->assertStatus(201)
            ->assertJson([
                'user' => [
                    'name' => 'Siti Nurhaliza',
                    'email' => 'siti@example.com',
                ]
            ]);

        $this->assertDatabaseHas('users', [
            'email' => 'siti@example.com',
        ]);
    }

    public function test_registration_validation_required_fields(): void
    {
        $response = $this->postJson('/api/auth/register', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'email', 'password']);
    }

    public function test_registration_fails_if_email_is_already_registered(): void
    {
        User::create([
            'name' => 'User Lama',
            'email' => 'existing@example.com',
            'password' => 'oldpassword',
        ]);

        $payload = [
            'name' => 'User Baru',
            'email' => 'existing@example.com',
            'password' => 'newpassword123',
            'password_confirmation' => 'newpassword123',
        ];

        $response = $this->postJson('/api/auth/register', $payload);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    public function test_registration_fails_if_password_confirmation_does_not_match(): void
    {
        $payload = [
            'name' => 'Test Mismatch',
            'email' => 'mismatch@example.com',
            'password' => 'password123',
            'password_confirmation' => 'different123',
        ];

        $response = $this->postJson('/api/auth/register', $payload);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['password']);
    }

    public function test_registration_fails_if_password_too_short(): void
    {
        $payload = [
            'name' => 'Short Pass',
            'email' => 'short@example.com',
            'password' => '12345',
            'password_confirmation' => '12345',
        ];

        $response = $this->postJson('/api/auth/register', $payload);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['password']);
    }
}
