<?php

namespace Tests\Feature;

use App\Services\IntegrationService;
use App\Services\MidtransService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * T07/T21/T36 — resolusi konfigurasi Midtrans.
 *
 * Key registry KANONIK (`payment.midtrans_server_key`, dst. — ditulis Admin UI)
 * WAJIB terbaca `MidtransService`; key legacy (`midtrans.server_key`) & env tetap
 * didukung sebagai fallback.
 */
class MidtransConfigTest extends TestCase
{
    use RefreshDatabase;

    public function test_service_reads_admin_registry_keys(): void
    {
        $integrations = app(IntegrationService::class);
        $integrations->set('payment.midtrans_server_key', 'SB-Mid-server-ADMIN', 'payment', true);
        $integrations->set('payment.midtrans_client_key', 'SB-Mid-client-ADMIN', 'payment', true);
        $service = app(MidtransService::class);

        $this->assertTrue($service->isConfigured());
        $this->assertSame('SB-Mid-client-ADMIN', $service->clientKey());
        $this->assertFalse($service->isProduction());
    }

    public function test_legacy_integration_keys_still_supported(): void
    {
        app(IntegrationService::class)->set('midtrans.server_key', 'SB-Mid-server-LEGACY', 'midtrans', true);

        $this->assertTrue(app(MidtransService::class)->isConfigured());
    }


}
