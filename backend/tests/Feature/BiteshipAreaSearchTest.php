<?php

namespace Tests\Feature;

use App\Services\BiteshipAreaService;
use App\Services\IntegrationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class BiteshipAreaSearchTest extends TestCase
{
    use RefreshDatabase;

    private function configureBiteship(): void
    {
        $integrations = app(IntegrationService::class);
        $integrations->set('shipping.provider', 'biteship', 'shipping');
        $integrations->set('shipping.biteship_base_url', 'https://api.biteship.test', 'shipping');
        $integrations->set('shipping.biteship_api_key', 'biteship_test_key', 'shipping', true);
    }

    public function test_returns_empty_when_not_configured(): void
    {
        $this->getJson('/api/shipping/areas?search=jakarta')
            ->assertStatus(200)
            ->assertJson(['data' => [], 'configured' => false]);
    }

    public function test_validates_minimum_search_length(): void
    {
        $this->getJson('/api/shipping/areas?search=ja')
            ->assertStatus(422)
            ->assertJsonValidationErrors(['search']);
    }

    public function test_searches_and_normalizes_biteship_areas(): void
    {
        $this->configureBiteship();

        Http::fake([
            'https://api.biteship.test/v1/maps/areas*' => Http::response([
                'success' => true,
                'areas' => [
                    [
                        'id' => 'IDNP1',
                        'name' => 'Gambir',
                        'administrative_division_level_1_name' => 'DKI Jakarta',
                        'administrative_division_level_2_name' => 'Jakarta Pusat',
                        'administrative_division_level_3_name' => 'Gambir',
                        'administrative_division_level_4_name' => 'Gambir',
                        'postal_code' => 10110,
                        'country_name' => 'Indonesia',
                    ],
                ],
            ], 200),
        ]);

        $response = $this->getJson('/api/shipping/areas?search=gambir');

        $response->assertStatus(200)
            ->assertJsonPath('configured', true)
            ->assertJsonPath('data.0.id', 'IDNP1')
            ->assertJsonPath('data.0.name', 'Gambir')
            ->assertJsonPath('data.0.city', 'Jakarta Pusat')
            ->assertJsonPath('data.0.postal_code', '10110');

        Http::assertSent(function ($request) {
            return str_contains($request->url(), '/v1/maps/areas')
                && str_contains($request->url(), 'input=gambir')
                && str_contains($request->url(), 'countries=ID')
                && $request->hasHeader('Authorization', 'biteship_test_key');
        });
    }

    public function test_area_service_respects_limit(): void
    {
        $this->configureBiteship();

        Http::fake([
            'https://api.biteship.test/v1/maps/areas*' => Http::response([
                'areas' => array_map(fn ($i) => ['id' => "ID{$i}", 'name' => "Area {$i}"], range(1, 20)),
            ], 200),
        ]);

        $areas = app(BiteshipAreaService::class)->search('area', 'ID', 3);

        $this->assertCount(3, $areas);
    }
}
