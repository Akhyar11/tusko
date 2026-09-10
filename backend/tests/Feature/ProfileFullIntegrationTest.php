<?php

namespace Tests\Feature;

use App\Models\ShippingAddress;
use App\Models\User;
use App\Models\Voucher;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class ProfileFullIntegrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_fetch_active_vouchers(): void
    {
        Voucher::create([
            'code' => 'TUSKOVIBES150',
            'title' => 'POTONGAN RP 150.000',
            'description' => 'Diskon sepatu',
            'badge' => 'DISKON SPESIAL',
            'discount_type' => 'fixed',
            'discount_value' => 150000,
            'min_purchase' => 750000,
            'is_active' => true,
        ]);

        $response = $this->getJson('/api/vouchers');
        $response->assertStatus(200)
            ->assertJsonPath('data.0.code', 'TUSKOVIBES150');
    }

    public function test_can_update_profile(): void
    {
        $user = User::factory()->create([
            'email' => 'atlet@tusko.com',
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->putJson('/api/auth/profile', [
                'name' => 'Budi Pratama Atlet',
                'phone' => '081234567890',
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('user.name', 'Budi Pratama Atlet')
            ->assertJsonPath('user.phone', '081234567890')
            ->assertJsonStructure(['user' => ['stats']]);

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'name' => 'Budi Pratama Atlet',
        ]);
    }

    public function test_can_update_password_via_dedicated_endpoint(): void
    {
        $user = User::factory()->create([
            'password' => Hash::make('oldpassword123'),
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/auth/password', [
                'old_password' => 'oldpassword123',
                'password' => 'newsecretpass456',
                'password_confirmation' => 'newsecretpass456',
            ]);

        $response->assertStatus(200)
            ->assertJson(['message' => 'Kata sandi berhasil diperbarui.']);

        $user->refresh();
        $this->assertTrue(Hash::check('newsecretpass456', $user->password));
    }

    public function test_can_list_and_manage_active_sessions(): void
    {
        $user = User::factory()->create();
        $token1 = $user->createToken('Chrome Desktop');
        $token2 = $user->createToken('Mobile App');

        $response = $this->withHeader('Authorization', 'Bearer ' . $token1->plainTextToken)
            ->getJson('/api/auth/sessions');

        $response->assertStatus(200)
            ->assertJsonStructure(['data']);

        // Revoke other sessions
        $revokeResponse = $this->withHeader('Authorization', 'Bearer ' . $token1->plainTextToken)
            ->deleteJson('/api/auth/sessions/other');

        $revokeResponse->assertStatus(200);
        $this->assertEquals(1, $user->tokens()->count());
    }

    public function test_shipping_address_supports_coordinates(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('auth_token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/addresses', [
                'label' => 'Kantor Pusat',
                'recipient_name' => 'Budi Pratama',
                'phone' => '081234567890',
                'full_address' => 'SCBD Sudirman',
                'city' => 'Jakarta Selatan',
                'province' => 'DKI Jakarta',
                'postal_code' => '12190',
                'lat' => -6.2289,
                'lng' => 106.8272,
                'is_default' => true,
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.latitude', -6.2289)
            ->assertJsonPath('data.longitude', 106.8272)
            ->assertJsonPath('data.lat', -6.2289)
            ->assertJsonPath('data.lng', 106.8272);
    }
}
