<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class UserMigrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_users_table_has_expected_profile_columns(): void
    {
        $columns = [
            'id',
            'name',
            'email',
            'phone',
            'password',
            'avatar',
            'gender',
            'birth_date',
            'points',
            'membership_tier',
            'role',
            'is_active',
            'remember_token',
            'created_at',
            'updated_at',
        ];

        foreach ($columns as $column) {
            $this->assertTrue(
                Schema::hasColumn('users', $column),
                "Kolom [{$column}] tidak ditemukan pada tabel users."
            );
        }
    }

    public function test_user_creation_with_defaults_and_model_helpers(): void
    {
        $user = User::create([
            'name' => 'Budi Santoso',
            'email' => 'budi@example.com',
            'password' => 'secret123',
            'role' => 'customer',
        ]);

        $this->assertDatabaseHas('users', [
            'email' => 'budi@example.com',
            'points' => 0,
            'membership_tier' => 'Member',
            'is_active' => true,
            'role' => 'customer',
        ]);

        $this->assertTrue($user->isCustomer());
        $this->assertFalse($user->isAdmin());
        $this->assertTrue($user->is_active);
        $this->assertSame(0, $user->points);
    }

    public function test_user_profile_fillable_and_casting(): void
    {
        $user = User::create([
            'name' => 'Admin Utama',
            'email' => 'admin@example.com',
            'password' => 'adminpass',
            'phone' => '08123456789',
            'avatar' => 'https://example.com/avatar.png',
            'gender' => 'laki-laki',
            'birth_date' => '1995-05-20',
            'points' => 150,
            'membership_tier' => 'Gold',
            'role' => 'admin',
            'is_active' => true,
        ]);

        $this->assertTrue($user->isAdmin());
        $this->assertFalse($user->isCustomer());
        $this->assertSame('08123456789', $user->phone);
        $this->assertSame('1995-05-20', $user->birth_date->format('Y-m-d'));
        $this->assertSame(150, $user->points);
        $this->assertSame('Gold', $user->membership_tier);
    }
}
