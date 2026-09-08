<?php

namespace Tests\Feature;

use Database\Seeders\UserSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_seeder_populates_default_customer_and_admin(): void
    {
        $this->seed(UserSeeder::class);

        // 1. Verify Budi Pratama (Customer Prototype)
        $this->assertDatabaseHas('users', [
            'email' => 'budi.pratama@gmail.com',
            'name' => 'Budi Pratama',
            'role' => 'customer',
            'membership_tier' => 'Gold Member',
        ]);

        // 2. Verify Budi can login with seeded password
        $customerLogin = $this->postJson('/api/auth/login', [
            'email' => 'budi.pratama@gmail.com',
            'password' => 'TuskoSport2026!',
        ]);

        $customerLogin->assertStatus(200)
            ->assertJson([
                'message' => 'Login berhasil.',
                'user' => [
                    'email' => 'budi.pratama@gmail.com',
                    'name' => 'Budi Pratama',
                    'membership_tier' => 'Gold Member',
                ],
                'token_type' => 'Bearer',
            ]);

        $this->assertNotEmpty($customerLogin->json('token'));
        $this->assertNotNull($customerLogin->json('user.default_address'));

        // 3. Verify Admin Tusko can login
        $adminLogin = $this->postJson('/api/auth/login', [
            'email' => 'admin@tusko.com',
            'password' => 'admin123',
        ]);

        $adminLogin->assertStatus(200)
            ->assertJson([
                'message' => 'Login berhasil.',
                'user' => [
                    'email' => 'admin@tusko.com',
                    'name' => 'Admin Tusko Official',
                    'role' => 'admin',
                ],
            ]);

        $this->assertNotEmpty($adminLogin->json('token'));
    }
}
