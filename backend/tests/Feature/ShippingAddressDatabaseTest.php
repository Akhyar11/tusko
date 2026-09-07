<?php

namespace Tests\Feature;

use App\Models\ShippingAddress;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class ShippingAddressDatabaseTest extends TestCase
{
    use RefreshDatabase;

    public function test_shipping_addresses_table_has_expected_columns(): void
    {
        $this->assertTrue(Schema::hasTable('shipping_addresses'));
        $this->assertTrue(Schema::hasColumns('shipping_addresses', [
            'id',
            'user_id',
            'label',
            'recipient_name',
            'phone',
            'full_address',
            'district',
            'city',
            'province',
            'postal_code',
            'notes',
            'is_default',
            'created_at',
            'updated_at',
        ]));
    }

    public function test_can_create_shipping_address_for_user(): void
    {
        $user = User::factory()->create();

        $address = ShippingAddress::create([
            'user_id' => $user->id,
            'label' => 'Rumah',
            'recipient_name' => 'Akhyar Ramadan',
            'phone' => '081234567890',
            'full_address' => 'Jl. Sudirman No. 45, RT 02 / RW 05',
            'district' => 'Kebayoran Baru',
            'city' => 'Jakarta Selatan',
            'province' => 'DKI Jakarta',
            'postal_code' => '12190',
            'notes' => 'Pagar warna hitam',
            'is_default' => true,
        ]);

        $this->assertDatabaseHas('shipping_addresses', [
            'id' => $address->id,
            'recipient_name' => 'Akhyar Ramadan',
            'city' => 'Jakarta Selatan',
            'is_default' => true,
        ]);

        $this->assertEquals($user->id, $address->user->id);
        $this->assertCount(1, $user->shippingAddresses);
        $this->assertEquals($address->id, $user->defaultShippingAddress->id);
    }

    public function test_mark_as_default_unsets_other_defaults_for_same_user(): void
    {
        $user = User::factory()->create();

        $addr1 = ShippingAddress::create([
            'user_id' => $user->id,
            'label' => 'Rumah',
            'recipient_name' => 'User A',
            'phone' => '081234567890',
            'full_address' => 'Alamat 1',
            'city' => 'Jakarta Selatan',
            'province' => 'DKI Jakarta',
            'postal_code' => '12190',
            'is_default' => true,
        ]);

        $addr2 = ShippingAddress::create([
            'user_id' => $user->id,
            'label' => 'Kantor',
            'recipient_name' => 'User A',
            'phone' => '081234567890',
            'full_address' => 'Alamat 2',
            'city' => 'Jakarta Pusat',
            'province' => 'DKI Jakarta',
            'postal_code' => '10210',
            'is_default' => false,
        ]);

        $this->assertTrue($addr1->fresh()->is_default);
        $this->assertFalse($addr2->fresh()->is_default);

        // Switch default to addr2
        $addr2->markAsDefault();

        $this->assertFalse($addr1->fresh()->is_default);
        $this->assertTrue($addr2->fresh()->is_default);
        $this->assertEquals($addr2->id, $user->fresh()->defaultShippingAddress->id);
    }

    public function test_deleting_user_cascades_to_shipping_addresses(): void
    {
        $user = User::factory()->create();

        $address = ShippingAddress::create([
            'user_id' => $user->id,
            'label' => 'Rumah',
            'recipient_name' => 'User B',
            'phone' => '081234567890',
            'full_address' => 'Alamat Rumah',
            'city' => 'Bandung',
            'province' => 'Jawa Barat',
            'postal_code' => '40111',
        ]);

        $this->assertDatabaseHas('shipping_addresses', ['id' => $address->id]);

        $user->delete();

        $this->assertDatabaseMissing('shipping_addresses', ['id' => $address->id]);
    }
}
