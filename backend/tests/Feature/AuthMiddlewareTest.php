<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class AuthMiddlewareTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Route::middleware(['auth:sanctum', 'admin'])->get('/api/test-admin-only', function () {
            return response()->json(['status' => 'admin_ok']);
        });

        Route::middleware(['auth:sanctum', 'active'])->get('/api/test-active-only', function () {
            return response()->json(['status' => 'active_ok']);
        });

        Route::middleware(['auth:sanctum', 'role:admin,superadmin'])->get('/api/test-role-only', function () {
            return response()->json(['status' => 'role_ok']);
        });
    }

    public function test_guest_cannot_access_protected_admin_route(): void
    {
        $response = $this->getJson('/api/test-admin-only');
        $response->assertStatus(401);
    }

    public function test_regular_customer_cannot_access_admin_route(): void
    {
        $customer = User::create([
            'name' => 'Budi Customer',
            'email' => 'customer@example.com',
            'password' => 'secret123',
            'role' => 'customer',
            'is_active' => true,
        ]);

        $token = $customer->createToken('test_token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/test-admin-only');

        $response->assertStatus(403)
            ->assertJson([
                'message' => 'Akses ditolak. Endpoint ini khusus untuk administrator.',
            ]);
    }

    public function test_admin_user_can_access_admin_route(): void
    {
        $admin = User::create([
            'name' => 'Pak Admin',
            'email' => 'admin@example.com',
            'password' => 'adminpass',
            'role' => 'admin',
            'is_active' => true,
        ]);

        $token = $admin->createToken('admin_token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/test-admin-only');

        $response->assertStatus(200)
            ->assertJson(['status' => 'admin_ok']);
    }

    public function test_inactive_user_cannot_access_active_route(): void
    {
        $inactiveUser = User::create([
            'name' => 'User Nonaktif',
            'email' => 'blocked@example.com',
            'password' => 'secret123',
            'role' => 'customer',
            'is_active' => false,
        ]);

        $token = $inactiveUser->createToken('blocked_token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/test-active-only');

        $response->assertStatus(403)
            ->assertJson([
                'message' => 'Akun Anda telah dinonaktifkan. Silakan hubungi administrator toko.',
            ]);
    }

    public function test_role_middleware_allows_authorized_role(): void
    {
        $admin = User::create([
            'name' => 'Super User',
            'email' => 'super@example.com',
            'password' => 'secret123',
            'role' => 'admin',
            'is_active' => true,
        ]);

        $token = $admin->createToken('role_token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/test-role-only');

        $response->assertStatus(200)
            ->assertJson(['status' => 'role_ok']);
    }
}
