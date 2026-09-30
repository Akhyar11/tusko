<?php

namespace Tests\Feature;

use App\Services\MidtransService;
use Tests\TestCase;

/**
 * T07.11 — Pemetaan lengkap `transaction_status` Midtrans (termasuk chargeback/failure).
 */
class MidtransStatusMappingTest extends TestCase
{
    public function test_maps_all_midtrans_statuses(): void
    {
        $this->assertSame('paid', MidtransService::mapStatus('capture', 'accept'));
        $this->assertSame('paid', MidtransService::mapStatus('settlement', 'accept'));
        $this->assertSame('challenge', MidtransService::mapStatus('capture', 'challenge'));
        $this->assertSame('pending', MidtransService::mapStatus('pending', ''));

        $this->assertSame('failed', MidtransService::mapStatus('deny', 'deny'));
        $this->assertSame('failed', MidtransService::mapStatus('failure', ''));
        $this->assertSame('expired', MidtransService::mapStatus('expire', ''));
        $this->assertSame('cancelled', MidtransService::mapStatus('cancel', ''));

        $this->assertSame('refunded', MidtransService::mapStatus('refund', ''));
        $this->assertSame('refunded', MidtransService::mapStatus('partial_refund', ''));
        $this->assertSame('refunded', MidtransService::mapStatus('chargeback', ''));
        $this->assertSame('refunded', MidtransService::mapStatus('partial_chargeback', ''));

        // Status tak dikenal tetap aman -> pending.
        $this->assertSame('pending', MidtransService::mapStatus('unknown_status', ''));
    }
}
