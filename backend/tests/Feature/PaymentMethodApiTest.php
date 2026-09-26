<?php

namespace Tests\Feature;

use App\Services\IntegrationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * T07.6 — Payment methods API (katalog dinamis untuk checkout).
 */
class PaymentMethodApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_returns_manual_methods_from_integrations_and_excludes_midtrans_when_disabled(): void
    {
        app(IntegrationService::class)->set(
            'payment.manual_banks',
            json_encode([['code' => 'BCA', 'bank_name' => 'BCA', 'account_number' => '123', 'account_holder' => 'PT Tusko']]),
            'payment'
        );

        $response = $this->getJson('/api/payment-methods')->assertOk();

        $response->assertJsonPath('data.midtrans_enabled', false);
        $response->assertJsonPath('data.manual_banks.0.code', 'BCA');

        $categories = collect($response->json('data.categories'));
        $methods = $categories->flatMap(fn ($c) => $c['methods']);

        $this->assertTrue($methods->contains(fn ($m) => $m['type'] === 'manual'), 'manual method missing');
        $this->assertFalse($methods->contains(fn ($m) => $m['type'] === 'midtrans'), 'midtrans method should be excluded');
    }

    public function test_includes_midtrans_methods_when_configured(): void
    {
        app(IntegrationService::class)->set('payment.midtrans_server_key', 'SB-Mid-server-TEST', 'payment', true);

        $response = $this->getJson('/api/payment-methods')->assertOk();

        $response->assertJsonPath('data.midtrans_enabled', true);

        $methods = collect($response->json('data.categories'))->flatMap(fn ($c) => $c['methods']);
        $this->assertTrue($methods->contains(fn ($m) => $m['id'] === 'bca_va'), 'BCA VA missing');
        $this->assertTrue($methods->contains(fn ($m) => $m['id'] === 'qris'), 'QRIS missing');
    }
}
