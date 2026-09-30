<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\Shipment;
use App\Services\BiteshipOrderService;
use App\Services\IntegrationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/**
 * T40.14 — Pembatalan order pengiriman Biteship saat pesanan dibatalkan.
 */
class BiteshipCancelOrderTest extends TestCase
{
    use RefreshDatabase;

    private function configureBiteship(): void
    {
        $integrations = app(IntegrationService::class);
        $integrations->set('shipping.provider', 'biteship', 'shipping');
        $integrations->set('shipping.biteship_base_url', 'https://api.biteship.test', 'shipping');
        $integrations->set('shipping.biteship_api_key', 'biteship_test_key', 'shipping', true);
    }

    public function test_cancels_biteship_order_and_marks_shipment_cancelled(): void
    {
        $this->configureBiteship();

        $order = Order::factory()->create(['status' => 'processing', 'payment_status' => 'paid']);

        $shipment = Shipment::create([
            'order_id' => $order->id,
            'provider' => 'biteship',
            'provider_order_id' => 'bsh_cancel_1',
            'provider_status' => 'confirmed',
            'waybill_number' => 'RESI-CANCEL-1',
            'status' => 'manifested',
        ]);

        Http::fake([
            'https://api.biteship.test/*' => Http::response(['status' => 'cancelled'], 200),
        ]);

        $ok = app(BiteshipOrderService::class)->cancelForOrder($order, 'Salah beli');

        $this->assertTrue($ok);
        Http::assertSent(fn ($request) => str_contains($request->url(), '/v1/orders/bsh_cancel_1/cancel'));

        $shipment->refresh();
        $this->assertSame('cancelled', $shipment->provider_status);
        $this->assertSame('cancelled', $shipment->status);
    }

    public function test_skips_cancel_when_no_provider_order_id(): void
    {
        $this->configureBiteship();

        $order = Order::factory()->create(['status' => 'processing', 'payment_status' => 'paid']);

        Shipment::create([
            'order_id' => $order->id,
            'provider' => 'biteship',
            'provider_status' => 'confirmed',
            'waybill_number' => 'RESI-NO-PROVIDER',
            'status' => 'manifested',
        ]);

        Http::fake();

        $this->assertFalse(app(BiteshipOrderService::class)->cancelForOrder($order));
        Http::assertNothingSent();
    }

    public function test_skips_cancel_for_terminal_status(): void
    {
        $this->configureBiteship();

        $order = Order::factory()->create(['status' => 'processing', 'payment_status' => 'paid']);

        Shipment::create([
            'order_id' => $order->id,
            'provider' => 'biteship',
            'provider_order_id' => 'bsh_done_1',
            'provider_status' => 'delivered',
            'waybill_number' => 'RESI-DELIVERED',
            'status' => 'delivered',
        ]);

        Http::fake();

        $this->assertFalse(app(BiteshipOrderService::class)->cancelForOrder($order));
        Http::assertNothingSent();
    }
}
