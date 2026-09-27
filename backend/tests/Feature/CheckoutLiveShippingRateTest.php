<?php

namespace Tests\Feature;

use App\Models\Expedition;
use App\Models\Product;
use App\Models\User;
use App\Models\Warehouse;
use App\Services\IntegrationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/**
 * T06.11 — Ongkir server-authoritative dari tarif LIVE KiriminAja + subsidi.
 *
 * Membuktikan server memakai tarif live agregator (bukan tarif DB) saat provider
 * dikonfigurasi, mencatat subsidi biaya kurir yang ditanggung merchant saat gratis
 * ongkir, dan fallback ke tarif DB bila provider belum dikonfigurasi.
 */
class CheckoutLiveShippingRateTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Warehouse::create([
            'code' => 'GDG-LIVE-01',
            'name' => 'Gudang Live',
            'address' => 'Jl. Live',
            'city' => 'Jakarta',
            'province' => 'DKI Jakarta',
            'is_primary' => true,
            'is_active' => true,
        ]);
    }

    private function configureShipping(): void
    {
        $integrations = app(IntegrationService::class);
        $integrations->set('shipping.provider', 'kiriminaja', 'shipping');
        $integrations->set('shipping.base_url', 'https://shipping.test', 'shipping');
        $integrations->set('shipping.api_key', 'secret-key', 'shipping', true);
        $integrations->set('store.origin_kiriminaja_district_id', '1', 'store');
    }

    private function fakeRate(float $cost): void
    {
        Http::fake([
            '*shipping_price' => Http::response([
                'status' => true,
                'results' => [
                    ['service' => 'jne', 'service_type' => 'REG', 'service_name' => 'Reguler', 'cost' => $cost, 'etd' => '2-3'],
                ],
            ], 200),
        ]);
    }

    private function payload(Product $product, Expedition $expedition, string $name, string $phone): array
    {
        return [
            'items' => [['product_id' => $product->id, 'quantity' => 1]],
            'recipient_name' => $name,
            'phone' => $phone,
            'full_address' => 'Jl. Live No. 11',
            'destination_district_code' => '2',
            'expedition_id' => $expedition->id,
            'payment_method' => 'manual_transfer',
            'payment_channel' => 'manual_bca',
            'service_fee' => 0,
        ];
    }

    public function test_live_kiriminaja_rate_is_used_over_db_rate(): void
    {
        $this->configureShipping();
        $this->fakeRate(15000);

        $user = User::factory()->create();
        $product = Product::factory()->create(['name' => 'Produk Live', 'price' => 200000, 'stock' => 10]);
        $expedition = Expedition::factory()->create(['name' => 'JNE', 'code' => 'jne', 'service' => 'REG', 'cost' => 20000]);

        $response = $this->actingAs($user)->postJson(
            '/api/checkout',
            $this->payload($product, $expedition, 'Pembeli Live', '081200000011')
        );

        $response->assertCreated()
            ->assertJsonPath('data.totals.shipping_cost', 15000)
            ->assertJsonPath('data.totals.grand_total', 215000);
    }

    public function test_free_shipping_subsidy_uses_live_rate(): void
    {
        $this->configureShipping();
        $this->fakeRate(15000);

        app(IntegrationService::class)->set('shipping.free_shipping_min_purchase', '150000', 'shipping');

        $user = User::factory()->create();
        $product = Product::factory()->create(['name' => 'Produk Subsidi Live', 'price' => 200000, 'stock' => 10]);
        $expedition = Expedition::factory()->create(['name' => 'JNE', 'code' => 'jne', 'service' => 'REG', 'cost' => 20000]);

        $response = $this->actingAs($user)->postJson(
            '/api/checkout',
            $this->payload($product, $expedition, 'Pembeli Subsidi Live', '081200000012')
        );

        $response->assertCreated()
            ->assertJsonPath('data.totals.shipping_cost', 0)
            ->assertJsonPath('data.totals.shipping_subsidy', 15000)
            ->assertJsonPath('data.totals.grand_total', 200000);
    }

    public function test_falls_back_to_db_rate_when_provider_not_configured(): void
    {
        $user = User::factory()->create();
        $product = Product::factory()->create(['name' => 'Produk Fallback', 'price' => 200000, 'stock' => 10]);
        $expedition = Expedition::factory()->create(['name' => 'JNE', 'code' => 'jne', 'service' => 'REG', 'cost' => 20000]);

        $response = $this->actingAs($user)->postJson(
            '/api/checkout',
            $this->payload($product, $expedition, 'Pembeli Fallback', '081200000013')
        );

        $response->assertCreated()
            ->assertJsonPath('data.totals.shipping_cost', 20000)
            ->assertJsonPath('data.totals.shipping_subsidy', 0);
    }
}
