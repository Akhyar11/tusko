<?php

namespace Tests\Feature;

use App\Services\IntegrationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class ShippingRateApiTest extends TestCase
{
    use RefreshDatabase;

    private function configureShipping(string $provider, string $baseUrl = 'https://shipping.test'): void
    {
        $integrations = app(IntegrationService::class);
        $integrations->set('shipping.provider', $provider, 'shipping');
        $integrations->set('shipping.base_url', $baseUrl, 'shipping');
        $integrations->set('shipping.api_key', 'secret-key', 'shipping', true);
        $integrations->set('store.origin_district_code', '317405', 'store');
        $integrations->set('store.origin_kiriminaja_district_id', '5783', 'store');
    }

    public function test_returns_empty_rates_when_provider_not_configured(): void
    {
        $response = $this->getJson('/api/shipping/rates?origin=Jakarta&destination_district_code=317305&weight=1000');

        $response->assertStatus(200)
            ->assertJson([
                'data' => [],
                'configured' => false,
            ]);
    }

    public function test_requires_origin_when_store_setting_empty(): void
    {
        $response = $this->getJson('/api/shipping/rates?destination_district_code=317305&weight=1000');

        $response->assertStatus(422)
            ->assertJson([
                'message' => 'Kota asal toko belum dikonfigurasi admin.',
            ]);
    }

    public function test_validates_required_weight(): void
    {
        $this->getJson('/api/shipping/rates?destination_district_code=317305')
            ->assertStatus(422)
            ->assertJsonValidationErrors(['weight']);
    }

    public function test_normalizes_apicoid_v2_rates(): void
    {
        $this->configureShipping('apicoid');

        Http::fake([
            'https://shipping.test/*' => Http::response([
                'is_success' => true,
                'data' => [
                    'quote_id' => 'q_8f3c1a',
                    'rates' => [
                        [
                            'courier' => 'JNE',
                            'service' => 'REG',
                            'price' => 10500,
                            'is_cheapest' => true,
                            'etd' => '2-3',
                        ],
                    ],
                ],
            ], 200),
        ]);

        $response = $this->getJson('/api/shipping/rates?origin_district_code=317405&destination_district_code=317305&weight=1000');

        $response->assertStatus(200)
            ->assertJsonPath('configured', true)
            ->assertJsonPath('data.0.courier', 'jne')
            ->assertJsonPath('data.0.service', 'REG')
            ->assertJsonPath('data.0.cost', 10500)
            ->assertJsonPath('data.0.is_cheapest', true)
            ->assertJsonPath('data.0.provider', 'apicoid');

        Http::assertSent(function ($request) {
            $url = $request->url();

            // api.co.id: header x-api-co-id + berat dikonversi ke KILOGRAM.
            return str_contains($url, '/courier/v2/rates')
                && str_contains($url, 'weight=1')
                && str_contains($url, 'origin_district_code=317405')
                && $request->hasHeader('x-api-co-id', 'secret-key');
        });
    }

    public function test_normalizes_kiriminaja_rates(): void
    {
        $this->configureShipping('kiriminaja');

        Http::fake([
            'https://shipping.test/*' => Http::response([
                'status' => true,
                'method' => 'shipping_price',
                'results' => [
                    [
                        'service' => 'jne',
                        'service_name' => 'JNE Express Reguler',
                        'service_type' => 'REG23',
                        'cost' => '12000',
                        'etd' => '2-3',
                    ],
                ],
            ], 200),
        ]);

        $response = $this->getJson('/api/shipping/rates?destination_district_code=5507&weight=2000');

        $response->assertStatus(200)
            ->assertJsonPath('data.0.courier', 'jne')
            ->assertJsonPath('data.0.service', 'REG23')
            ->assertJsonPath('data.0.cost', 12000)
            ->assertJsonPath('data.0.provider', 'kiriminaja');

        Http::assertSent(function ($request) {
            return str_contains($request->url(), '/api/mitra/v6.1/shipping_price')
                && $request->hasHeader('Authorization', 'Bearer secret-key')
                && (int) $request['origin'] === 5783
                && (int) $request['destination'] === 5507
                && (int) $request['weight'] === 2000;
        });
    }

    public function test_returns_empty_rates_when_provider_errors(): void
    {
        $this->configureShipping('apicoid');

        Http::fake([
            'https://shipping.test/*' => Http::response('Internal Error', 500),
        ]);

        $this->getJson('/api/shipping/rates?destination_district_code=317305&weight=1000')
            ->assertStatus(200)
            ->assertJsonPath('data', []);
    }

    public function test_returns_empty_rates_when_destination_district_missing(): void
    {
        $this->configureShipping('apicoid');

        Http::fake();

        $this->getJson('/api/shipping/rates?weight=1000')
            ->assertStatus(200)
            ->assertJsonPath('data', []);
    }
}
