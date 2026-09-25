<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use Database\Seeders\MasterReferenceSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class UserManagementApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(MasterReferenceSeeder::class);
    }

    private function actingAsAdmin(): User
    {
        $admin = User::factory()->create(['role' => 'admin', 'is_active' => true]);
        Sanctum::actingAs($admin);

        return $admin;
    }

    private function payload(array $override = []): array
    {
        return array_merge([
            'name' => 'Pengguna Uji',
            'email' => 'pengguna-' . uniqid() . '@example.test',
            'phone' => '081200000000',
            'password' => 'password123',
            'is_active' => true,
        ], $override);
    }

    public function test_admin_can_list_users_with_pagination(): void
    {
        $this->actingAsAdmin();
        User::factory()->count(3)->create();

        $response = $this->getJson('/api/admin/users?per_page=100')->assertStatus(200);

        $this->assertGreaterThanOrEqual(4, $response->json('total'));
        $this->assertArrayHasKey('roles', $response->json('data.0'));
    }

    public function test_admin_can_filter_users_by_search_role_and_status(): void
    {
        $this->actingAsAdmin();
        $target = User::factory()->create(['name' => 'Budi Khusus', 'email' => 'budi.khusus@example.test', 'role' => 'customer']);

        $search = $this->getJson('/api/admin/users?search=Budi Khusus')->assertStatus(200);
        $this->assertSame(1, $search->json('total'));

        $byRole = $this->getJson('/api/admin/users?role=admin')->assertStatus(200);
        foreach ($byRole->json('data') as $row) {
            $this->assertSame('admin', $row['role']);
        }

        $byPivot = $this->getJson('/api/admin/users?role_id=' . Role::where('name', 'customer')->value('id') . '&per_page=100')->assertStatus(200);
        $this->assertTrue(collect($byPivot->json('data'))->pluck('id')->contains($target->id));

        $inactive = $this->getJson('/api/admin/users?is_active=0&per_page=100')->assertStatus(200);
        foreach ($inactive->json('data') as $row) {
            $this->assertFalse($row['is_active']);
        }
    }

    public function test_admin_can_create_user_and_pivot_is_synced(): void
    {
        $this->actingAsAdmin();

        $response = $this->postJson('/api/admin/users', $this->payload(['name' => 'Akun Baru']))->assertStatus(201);

        $user = User::where('email', $response->json('data.email'))->firstOrFail();
        $this->assertSame('Akun Baru', $user->name);
        $this->assertSame('customer', $user->role);
        $this->assertSame(['customer'], $user->roles()->pluck('roles.name')->all());
        $this->assertDatabaseHas('activity_logs', ['action' => 'user.created', 'subject_id' => $user->id]);
    }

    public function test_create_validates_unique_email_and_password(): void
    {
        $this->actingAsAdmin();
        $existing = User::factory()->create();

        $this->postJson('/api/admin/users', $this->payload(['email' => $existing->email]))
            ->assertStatus(422)
            ->assertJsonValidationErrors('email');

        $this->postJson('/api/admin/users', $this->payload(['password' => '']))
            ->assertStatus(422)
            ->assertJsonValidationErrors('password');
    }

    public function test_admin_can_update_user(): void
    {
        $this->actingAsAdmin();
        $user = User::factory()->create(['name' => 'Nama Lama', 'is_active' => true]);

        $response = $this->putJson("/api/admin/users/{$user->id}", [
            'name' => 'Nama Baru',
            'is_active' => false,
        ])->assertStatus(200);

        $response->assertJsonPath('data.name', 'Nama Baru');
        $user->refresh();
        $this->assertSame('Nama Baru', $user->name);
        $this->assertFalse($user->is_active);
        $this->assertDatabaseHas('activity_logs', ['action' => 'user.updated', 'subject_id' => $user->id]);
    }

    public function test_admin_cannot_deactivate_or_delete_self(): void
    {
        $admin = $this->actingAsAdmin();

        $this->putJson("/api/admin/users/{$admin->id}", ['is_active' => false])
            ->assertStatus(422);

        $this->deleteJson("/api/admin/users/{$admin->id}")
            ->assertStatus(422);
    }

    public function test_admin_can_delete_user(): void
    {
        $this->actingAsAdmin();
        $user = User::factory()->create();

        $this->deleteJson("/api/admin/users/{$user->id}")->assertStatus(200);
        $this->assertDatabaseMissing('users', ['id' => $user->id]);
        $this->assertDatabaseHas('activity_logs', ['action' => 'user.deleted']);
    }

    public function test_non_admin_is_forbidden(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'customer', 'is_active' => true]));

        $this->getJson('/api/admin/users')->assertStatus(403);
        $this->postJson('/api/admin/users', $this->payload())->assertStatus(403);
    }

    public function test_guest_is_unauthorized(): void
    {
        $this->getJson('/api/admin/users')->assertStatus(401);
    }
}
