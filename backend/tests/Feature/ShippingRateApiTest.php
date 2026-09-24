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
        $integrations->set('store.origin_city', 'Jakarta Selatan', 'store');
    }

    public function test_returns_empty_rates_when_provider_not_configured(): void
    {
        $response = $this->getJson('/api/shipping/rates?origin=Jakarta&destination=Bandung&weight=1000');

        $response->assertStatus(200)
            ->assertJson([
                'data' => [],
                'configured' => false,
            ]);
    }

    public function test_requires_origin_when_store_setting_empty(): void
    {
        $response = $this->getJson('/api/shipping/rates?destination=Bandung&weight=1000');

        $response->assertStatus(422)
            ->assertJson([
                'message' => 'Kota asal toko belum dikonfigurasi admin.',
            ]);
    }

    public function test_validates_required_params(): void
    {
        $this->getJson('/api/shipping/rates')
            ->assertStatus(422)
            ->assertJsonValidationErrors(['destination', 'weight']);
    }

    public function test_normalizes_apicoid_rates(): void
    {
        $this->configureShipping('apicoid');

        Http::fake([
            'https://shipping.test/*' => Http::response([
                'rajaongkir' => [
                    'results' => [
                        [
                            'code' => 'jne',
                            'costs' => [
                                [
                                    'service' => 'REG',
                                    'description' => 'Layanan Reguler',
                                    'cost' => [
                                        ['value' => 18000, 'etd' => '2-3'],
                                    ],
                                ],
                            ],
                        ],
                    ],
                ],
            ], 200),
        ]);

        $response = $this->getJson('/api/shipping/rates?destination=Bandung&weight=1000');

        $response->assertStatus(200)
            ->assertJsonPath('configured', true)
            ->assertJsonPath('data.0.courier', 'jne')
            ->assertJsonPath('data.0.service', 'REG')
            ->assertJsonPath('data.0.cost', 18000)
            ->assertJsonPath('data.0.etd', '2-3')
            ->assertJsonPath('data.0.provider', 'apicoid');

        Http::assertSent(function ($request) {
            return str_contains($request->url(), '/cost')
                && $request->hasHeader('key', 'secret-key')
                && $request['origin'] === 'Jakarta Selatan'
                && $request['destination'] === 'Bandung'
                && $request['weight'] === 1000;
        });
    }

    public function test_normalizes_kiriminaja_rates(): void
    {
        $this->configureShipping('kiriminaja');

        Http::fake([
            'https://shipping.test/*' => Http::response([
                'results' => [
                    [
                        'courier' => 'sicepat',
                        'service' => 'BEST',
                        'description' => 'Same day',
                        'price' => 25000,
                        'etd' => '1-1',
                    ],
                ],
            ], 200),
        ]);

        $response = $this->getJson('/api/shipping/rates?destination=Bandung&weight=2000');

        $response->assertStatus(200)
            ->assertJsonPath('data.0.courier', 'sicepat')
            ->assertJsonPath('data.0.service', 'BEST')
            ->assertJsonPath('data.0.cost', 25000)
            ->assertJsonPath('data.0.provider', 'kiriminaja');

        Http::assertSent(function ($request) {
            return str_contains($request->url(), '/v1/shipping/price')
                && $request->hasHeader('Authorization', 'Bearer secret-key');
        });
    }

    public function test_returns_empty_rates_when_provider_errors(): void
    {
        $this->configureShipping('apicoid');

        Http::fake([
            'https://shipping.test/*' => Http::response('Internal Error', 500),
        ]);

        $this->getJson('/api/shipping/rates?destination=Bandung&weight=1000')
            ->assertStatus(200)
            ->assertJsonPath('data', []);
    }
}
