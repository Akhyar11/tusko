<?php

namespace Tests\Feature;

use App\Services\BiteshipClient;
use App\Services\IntegrationService;
use App\Services\ShippingRateService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class BiteshipRateApiTest extends TestCase
{
    use RefreshDatabase;

    private function configureBiteship(): void
    {
        $integrations = app(IntegrationService::class);
        $integrations->set('shipping.provider', 'biteship', 'shipping');
        $integrations->set('shipping.biteship_base_url', 'https://api.biteship.test', 'shipping');
        $integrations->set('shipping.biteship_api_key', 'biteship_test_key', 'shipping', true);
    }

    private function fakeRates(): void
    {
        Http::fake([
            'https://api.biteship.test/*' => Http::response([
                'success' => true,
                'pricing' => [
                    [
                        'courier_name' => 'JNE',
                        'courier_code' => 'jne',
                        'courier_service_name' => 'JNE Reguler',
                        'courier_service_code' => 'reg',
                        'price' => 12000,
                        'duration' => '2 - 3 days',
                    ],
                    [
                        'courier_name' => 'SiCepat',
                        'courier_code' => 'sicepat',
                        'courier_service_name' => 'SiCepat BEST',
                        'courier_service_code' => 'best',
                        'shipping_fee' => 18000,
                        'duration' => '1 - 2 days',
                    ],
                ],
            ], 200),
        ]);
    }

    public function test_biteship_not_configured_returns_empty(): void
    {
        $this->getJson('/api/shipping/rates?destination_postal_code=12950&weight=1000')
            ->assertStatus(200)
            ->assertJson(['data' => [], 'configured' => false]);
    }

    public function test_normalizes_biteship_rates(): void
    {
        Cache::flush();
        $this->configureBiteship();
        $this->fakeRates();

        $response = $this->getJson('/api/shipping/rates?origin_biteship_area_id=IDNP1&destination_biteship_area_id=IDNP2&weight=1500');

        $response->assertStatus(200)
            ->assertJsonPath('provider', 'biteship')
            ->assertJsonPath('configured', true)
            ->assertJsonPath('data.0.courier', 'jne')
            ->assertJsonPath('data.0.service', 'reg')
            ->assertJsonPath('data.0.cost', 12000)
            ->assertJsonPath('data.0.provider', 'biteship')
            ->assertJsonPath('data.1.courier', 'sicepat')
            ->assertJsonPath('data.1.cost', 18000);

        Http::assertSent(function ($request) {
            return str_contains($request->url(), '/v1/rates/couriers')
                && $request->hasHeader('Authorization', 'biteship_test_key')
                && $request['origin_area_id'] === 'IDNP1'
                && $request['destination_area_id'] === 'IDNP2'
                && (int) $request['items'][0]['weight'] === 1500;
        });
    }

    public function test_falls_back_to_postal_codes_without_area_ids(): void
    {
        Cache::flush();
        $this->configureBiteship();
        $this->fakeRates();

        $this->getJson('/api/shipping/rates?origin_postal_code=12440&destination_postal_code=12950&weight=2000')
            ->assertStatus(200)
            ->assertJsonPath('data.0.cost', 12000);

        Http::assertSent(function ($request) {
            return ($request['origin_postal_code'] ?? null) === '12440'
                && ($request['destination_postal_code'] ?? null) === '12950'
                && ! isset($request['origin_area_id'])
                && ! isset($request['destination_area_id']);
        });
    }

    public function test_rate_for_returns_live_biteship_cost(): void
    {
        Cache::flush();
        $this->configureBiteship();
        $this->fakeRates();

        $cost = app(ShippingRateService::class)->rateFor('jne', 'reg', [
            'weight_grams' => 1000,
            'origin_biteship_area_id' => 'IDNP1',
            'destination_biteship_area_id' => 'IDNP2',
        ]);

        $this->assertSame(12000.0, $cost);
    }

    public function test_biteship_client_is_configuration_aware(): void
    {
        $client = app(BiteshipClient::class);
        $this->assertFalse($client->isConfigured());

        $this->configureBiteship();
        $this->assertTrue($client->isConfigured());
        $this->assertSame('https://api.biteship.test', $client->baseUrl());
        $this->assertSame('biteship_test_key', $client->apiKey());
    }

    public function test_uses_configured_courier_whitelist(): void
    {
        Cache::flush();
        $this->configureBiteship();
        app(IntegrationService::class)->set('shipping.biteship_couriers', 'jne,sicepat', 'shipping');
        $this->fakeRates();

        $this->getJson('/api/shipping/rates?origin_biteship_area_id=IDNP1&destination_biteship_area_id=IDNP2&weight=1000')
            ->assertStatus(200);

        Http::assertSent(fn ($request) => ($request['couriers'] ?? null) === 'jne,sicepat');
    }
}
