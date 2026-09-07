<?php

namespace Tests\Feature;

use App\Models\ShippingAddress;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ShippingAddressApiTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
    }

    public function test_can_list_user_shipping_addresses(): void
    {
        Sanctum::actingAs($this->user);

        ShippingAddress::create([
            'user_id' => $this->user->id,
            'label' => 'Rumah',
            'recipient_name' => 'Budi Santoso',
            'phone' => '081234567890',
            'full_address' => 'Jl. Merdeka No. 10',
            'city' => 'Jakarta Selatan',
            'province' => 'DKI Jakarta',
            'postal_code' => '12190',
            'is_default' => true,
        ]);

        $response = $this->getJson('/api/addresses');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.recipient_name', 'Budi Santoso')
            ->assertJsonPath('data.0.city', 'Jakarta Selatan')
            ->assertJsonPath('data.0.is_default', true);
    }

    public function test_can_save_new_shipping_address(): void
    {
        Sanctum::actingAs($this->user);

        $payload = [
            'label' => 'Kantor',
            'recipient_name' => 'Akhyar Ramadan',
            'phone' => '081298765432',
            'full_address' => 'Gedung Wisma 46 Lt. 12',
            'district' => 'Tanah Abang',
            'city' => 'Jakarta Pusat',
            'province' => 'DKI Jakarta',
            'postal_code' => '10220',
            'notes' => 'Titip di resepsionis lantai dasar',
            'is_default' => true,
        ];

        $response = $this->postJson('/api/addresses', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('message', 'Alamat pengiriman berhasil disimpan.')
            ->assertJsonPath('data.recipient_name', 'Akhyar Ramadan')
            ->assertJsonPath('data.label', 'Kantor')
            ->assertJsonPath('data.is_default', true);

        $this->assertDatabaseHas('shipping_addresses', [
            'user_id' => $this->user->id,
            'recipient_name' => 'Akhyar Ramadan',
            'city' => 'Jakarta Pusat',
            'is_default' => true,
        ]);
    }

    public function test_store_address_validates_required_fields(): void
    {
        Sanctum::actingAs($this->user);

        $response = $this->postJson('/api/addresses', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors([
                'recipient_name',
                'phone',
                'full_address',
                'city',
                'province',
                'postal_code',
            ]);
    }

    public function test_can_update_shipping_address(): void
    {
        Sanctum::actingAs($this->user);

        $address = ShippingAddress::create([
            'user_id' => $this->user->id,
            'label' => 'Rumah',
            'recipient_name' => 'Nama Lama',
            'phone' => '08111111111',
            'full_address' => 'Alamat Lama',
            'city' => 'Surabaya',
            'province' => 'Jawa Timur',
            'postal_code' => '60111',
            'is_default' => false,
        ]);

        $updateResponse = $this->putJson("/api/addresses/{$address->id}", [
            'label' => 'Rumah Baru',
            'recipient_name' => 'Nama Baru',
            'phone' => '08222222222',
            'full_address' => 'Alamat Baru No. 99',
            'city' => 'Surabaya',
            'province' => 'Jawa Timur',
            'postal_code' => '60112',
            'is_default' => true,
        ]);

        $updateResponse->assertStatus(200)
            ->assertJsonPath('message', 'Alamat pengiriman berhasil diperbarui.')
            ->assertJsonPath('data.recipient_name', 'Nama Baru')
            ->assertJsonPath('data.label', 'Rumah Baru')
            ->assertJsonPath('data.is_default', true);

        $this->assertEquals('Nama Baru', $address->fresh()->recipient_name);
        $this->assertTrue($address->fresh()->is_default);
    }

    public function test_can_set_default_shipping_address(): void
    {
        Sanctum::actingAs($this->user);

        $addr1 = ShippingAddress::create([
            'user_id' => $this->user->id,
            'label' => 'Alamat 1',
            'recipient_name' => 'User',
            'phone' => '081234567890',
            'full_address' => 'Jl. Satu No. 1',
            'city' => 'Bandung',
            'province' => 'Jawa Barat',
            'postal_code' => '40111',
            'is_default' => true,
        ]);

        $addr2 = ShippingAddress::create([
            'user_id' => $this->user->id,
            'label' => 'Alamat 2',
            'recipient_name' => 'User',
            'phone' => '081234567890',
            'full_address' => 'Jl. Dua No. 2',
            'city' => 'Bandung',
            'province' => 'Jawa Barat',
            'postal_code' => '40112',
            'is_default' => false,
        ]);

        $response = $this->postJson("/api/addresses/{$addr2->id}/set-default");

        $response->assertStatus(200)
            ->assertJsonPath('data.id', $addr2->id)
            ->assertJsonPath('data.is_default', true);

        $this->assertFalse($addr1->fresh()->is_default);
        $this->assertTrue($addr2->fresh()->is_default);
    }

    public function test_can_delete_shipping_address(): void
    {
        Sanctum::actingAs($this->user);

        $address = ShippingAddress::create([
            'user_id' => $this->user->id,
            'label' => 'Rumah',
            'recipient_name' => 'User Hapus',
            'phone' => '081234567890',
            'full_address' => 'Alamat Hapus',
            'city' => 'Semarang',
            'province' => 'Jawa Tengah',
            'postal_code' => '50111',
        ]);

        $deleteResponse = $this->deleteJson("/api/addresses/{$address->id}");

        $deleteResponse->assertStatus(200)
            ->assertJsonPath('message', 'Alamat pengiriman berhasil dihapus.');

        $this->assertDatabaseMissing('shipping_addresses', ['id' => $address->id]);
    }
}
