<?php

namespace Tests\Feature;

use App\Models\Expedition;
use App\Models\ShippingAddress;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ShippingCalculationApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Buat kurir sampel
        Expedition::create([
            'name' => 'JNE Express',
            'code' => 'jne',
            'service' => 'Reguler (REG)',
            'category' => 'Reguler',
            'etd' => '2 - 3 hari',
            'base_cost' => 18000,
            'cost' => 18000,
            'is_free' => false,
            'is_active' => true,
            'is_default' => true,
        ]);

        Expedition::create([
            'name' => 'GoSend',
            'code' => 'gosend',
            'service' => 'Instant (3 Jam)',
            'category' => 'Instan & Same Day',
            'etd' => '3 jam tiba',
            'base_cost' => 20000,
            'cost' => 20000,
            'is_free' => false,
            'is_active' => true,
        ]);

        Expedition::create([
            'name' => 'SiCepat GOKIL',
            'code' => 'sicepat',
            'service' => 'GOKIL Kargo',
            'category' => 'Kargo',
            'etd' => '3 - 5 hari',
            'base_cost' => 45000,
            'cost' => 45000,
            'is_free' => false,
            'is_active' => true,
        ]);
    }

    public function test_can_calculate_shipping_rates_with_direct_coordinates(): void
    {
        // Contoh koordinat Jakarta Selatan (~10km dari Jakarta Pusat)
        $response = $this->postJson('/api/expeditions/calculate-cost', [
            'latitude' => -6.2615,
            'longitude' => 106.8106,
            'weight_kg' => 1.5,
            'city' => 'Jakarta Selatan',
            'district' => 'Kebayoran Baru',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonStructure([
                'status',
                'message',
                'data' => [
                    'origin',
                    'destination',
                    'distance_km',
                    'weight_kg',
                    'provider',
                    'handling_fee',
                    'expeditions',
                ],
            ]);

        $distance = $response->json('data.distance_km');
        $this->assertGreaterThan(0, $distance);
        $this->assertEquals(1000, $response->json('data.handling_fee'));

        $expeditions = $response->json('data.expeditions');
        $this->assertCount(3, $expeditions);
    }

    public function test_can_calculate_shipping_rates_using_saved_shipping_address(): void
    {
        $user = User::factory()->create();
        $address = ShippingAddress::create([
            'user_id' => $user->id,
            'label' => 'Kantor',
            'recipient_name' => 'Budi Santoso',
            'phone' => '081234567890',
            'full_address' => 'Gedung Menara Mandiri, Jl. Jend. Sudirman',
            'district' => 'Kebayoran Baru',
            'city' => 'Jakarta Selatan',
            'province' => 'DKI Jakarta',
            'postal_code' => '12190',
            'latitude' => -6.2255,
            'longitude' => 106.8090,
            'is_default' => true,
        ]);

        $response = $this->postJson('/api/expeditions/calculate-cost', [
            'address_id' => $address->id,
            'weight_kg' => 2.0,
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.destination.city', 'Jakarta Selatan')
            ->assertJsonPath('data.destination.district', 'Kebayoran Baru');

        $this->assertNotNull($response->json('data.distance_km'));
    }

    public function test_can_filter_calculated_rates_by_category(): void
    {
        $response = $this->postJson('/api/expeditions/calculate-cost', [
            'latitude' => -6.2615,
            'longitude' => 106.8106,
            'weight_kg' => 1.0,
            'category' => 'Instan & Same Day',
        ]);

        $response->assertStatus(200);
        $expeditions = $response->json('data.expeditions');
        $this->assertCount(1, $expeditions);
        $this->assertEquals('gosend', $expeditions[0]['code']);
    }

    public function test_can_track_package_delivery_status(): void
    {
        $response = $this->getJson('/api/expeditions/track/JP1234567890');

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonStructure([
                'status',
                'message',
                'data' => [
                    'resi',
                    'status',
                    'status_label',
                    'provider',
                    'history',
                ],
            ]);

        $this->assertEquals('JP1234567890', $response->json('data.resi'));
    }
}
