<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\IntegrationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class LocationApiTest extends TestCase
{
    use RefreshDatabase;

    private function configureShipping(): void
    {
        $integrations = app(IntegrationService::class);
        $integrations->set('shipping.provider', 'kiriminaja', 'shipping');
        $integrations->set('shipping.base_url', 'https://shipping.test', 'shipping');
        $integrations->set('shipping.api_key', 'secret-key', 'shipping', true);
    }

    private function fakeCoverage(): void
    {
        Http::fake([
            '*api/mitra/kelurahan' => Http::response([
                'status' => true,
                'results' => [
                    ['id' => 46310, 'kelurahan_name' => 'Sidokerto', 'kecamatan_id' => 2275],
                ],
            ], 200),
            '*api/mitra/kecamatan' => Http::response([
                'status' => true,
                'datas' => [
                    ['id' => 2275, 'kecamatan_name' => 'Mojowarno', 'kabupaten_id' => 164],
                ],
            ], 200),
            '*api/mitra/city' => Http::response([
                'status' => true,
                'datas' => [
                    ['id' => 164, 'city_name' => 'Jombang', 'provinsi_id' => 11],
                ],
            ], 200),
            '*api/mitra/province' => Http::response([
                'status' => true,
                'datas' => [
                    ['id' => 11, 'name' => 'Jawa Timur'],
                ],
            ], 200),
        ]);
    }

    public function test_locations_return_empty_when_not_configured(): void
    {
        Http::fake();

        $this->getJson('/api/locations/provinces')
            ->assertStatus(200)
            ->assertJson(['data' => []]);
    }

    public function test_provinces_are_normalized(): void
    {
        $this->configureShipping();
        $this->fakeCoverage();

        $this->getJson('/api/locations/provinces')
            ->assertStatus(200)
            ->assertJsonPath('data.0.id', 11)
            ->assertJsonPath('data.0.name', 'Jawa Timur');
    }

    public function test_cities_districts_subdistricts_hierarchy(): void
    {
        $this->configureShipping();
        $this->fakeCoverage();

        $this->getJson('/api/locations/cities?province_id=11')
            ->assertStatus(200)
            ->assertJsonPath('data.0.name', 'Jombang')
            ->assertJsonPath('data.0.parent_id', 11);

        $this->getJson('/api/locations/districts?city_id=164')
            ->assertStatus(200)
            ->assertJsonPath('data.0.name', 'Mojowarno')
            ->assertJsonPath('data.0.parent_id', 164);

        $this->getJson('/api/locations/subdistricts?district_id=2275')
            ->assertStatus(200)
            ->assertJsonPath('data.0.name', 'Sidokerto')
            ->assertJsonPath('data.0.parent_id', 2275);

        Http::assertSent(fn ($request) => str_contains($request->url(), '/api/mitra/city')
            && (int) $request['provinsi_id'] === 11);
        Http::assertSent(fn ($request) => str_contains($request->url(), '/api/mitra/kecamatan')
            && (int) $request['kabupaten_id'] === 164);
        Http::assertSent(fn ($request) => str_contains($request->url(), '/api/mitra/kelurahan')
            && (int) $request['kecamatan_id'] === 2275);
    }

    public function test_cities_require_province_id(): void
    {
        $this->configureShipping();

        $this->getJson('/api/locations/cities')
            ->assertStatus(422)
            ->assertJsonValidationErrors(['province_id']);
    }

    public function test_shipping_address_stores_location_codes(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $response = $this->postJson('/api/addresses', [
            'recipient_name' => 'Kode Wilayah',
            'phone' => '081200000004',
            'full_address' => 'Jl. Kode No. 1',
            'district' => 'Mojowarno',
            'city' => 'Jombang',
            'province' => 'Jawa Timur',
            'province_code' => '11',
            'city_code' => '164',
            'district_code' => '2275',
            'subdistrict_code' => '46310',
            'postal_code' => '61475',
        ]);

        $response->assertStatus(201);

        $this->assertDatabaseHas('shipping_addresses', [
            'user_id' => $user->id,
            'province_code' => '11',
            'city_code' => '164',
            'district_code' => '2275',
            'subdistrict_code' => '46310',
        ]);
    }
}
