<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthUpdateProfileTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_update_profile_biodata(): void
    {
        $user = User::create([
            'name' => 'Nama Lama',
            'email' => 'lama@example.com',
            'phone' => '0811111111',
            'password' => Hash::make('password123'),
        ]);

        $token = $user->createToken('test_token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->putJson('/api/auth/profile', [
                'name' => 'Nama Baru',
                'phone' => '0822222222',
                'gender' => 'Laki-laki',
                'birthDate' => '1990-01-15',
                'avatar' => 'https://example.com/new-avatar.jpg',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Profil berhasil diperbarui.',
                'user' => [
                    'id' => $user->id,
                    'name' => 'Nama Baru',
                    'phone' => '0822222222',
                    'gender' => 'Laki-laki',
                    'birth_date' => '1990-01-15',
                    'avatar' => 'https://example.com/new-avatar.jpg',
                ],
            ]);

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'name' => 'Nama Baru',
            'phone' => '0822222222',
            'gender' => 'Laki-laki',
        ]);
    }

    public function test_user_can_keep_own_email_when_updating(): void
    {
        $user = User::create([
            'name' => 'User Tetap',
            'email' => 'tetap@example.com',
            'password' => Hash::make('password123'),
        ]);

        $token = $user->createToken('test_token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->putJson('/api/auth/profile', [
                'name' => 'User Tetap Update',
                'email' => 'tetap@example.com',
            ]);

        $response->assertStatus(200);
    }

    public function test_user_cannot_take_another_users_email(): void
    {
        User::create([
            'name' => 'User Lain',
            'email' => 'other@example.com',
            'password' => Hash::make('password123'),
        ]);

        $user = User::create([
            'name' => 'User Saya',
            'email' => 'saya@example.com',
            'password' => Hash::make('password123'),
        ]);

        $token = $user->createToken('test_token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->putJson('/api/auth/profile', [
                'email' => 'other@example.com',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    public function test_user_can_update_password_with_correct_current_password(): void
    {
        $user = User::create([
            'name' => 'User Password',
            'email' => 'user.pass@example.com',
            'password' => Hash::make('oldsecret123'),
        ]);

        $token = $user->createToken('test_token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->putJson('/api/auth/profile', [
                'oldPassword' => 'oldsecret123',
                'newPassword' => 'newsecret456',
                'confirmPassword' => 'newsecret456',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Profil berhasil diperbarui.',
            ]);

        $this->assertTrue(Hash::check('newsecret456', $user->fresh()->password));
    }

    public function test_update_password_fails_with_wrong_current_password(): void
    {
        $user = User::create([
            'name' => 'User Password',
            'email' => 'user.wrongpass@example.com',
            'password' => Hash::make('oldsecret123'),
        ]);

        $token = $user->createToken('test_token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->putJson('/api/auth/profile', [
                'oldPassword' => 'salah_password',
                'newPassword' => 'newsecret456',
                'confirmPassword' => 'newsecret456',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['old_password']);
    }

    public function test_guest_cannot_update_profile(): void
    {
        $response = $this->putJson('/api/auth/profile', [
            'name' => 'Hacker Name',
        ]);

        $response->assertStatus(401);
    }
}
