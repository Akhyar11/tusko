<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Services\IntegrationService;
use App\Services\MidtransService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class MidtransRefundTest extends TestCase
{
    use RefreshDatabase;

    private function configure(): void
    {
        $integrations = app(IntegrationService::class);
        $integrations->set('midtrans.server_key', 'SB-Mid-server-integration-key', 'midtrans', true);
        $integrations->set('midtrans.client_key', 'SB-Mid-client-integration-key', 'midtrans', false);
        $integrations->set('midtrans.is_production', '0', 'midtrans', false);
        $integrations->set('midtrans.snap_url', 'https://app.sandbox.midtrans.com/snap/v1/transactions', 'midtrans', false);
        $integrations->set('midtrans.refund_url', 'https://api.sandbox.midtrans.com/v2', 'midtrans', false);
    }

    public function test_refund_calls_midtrans_with_integration_credentials(): void
    {
        $this->configure();

        $order = Order::factory()->create([
            'order_number' => 'INV/REFUND/001',
            'grand_total' => 150000,
            'payment_method' => 'midtrans',
            'midtrans_transaction_id' => 'txn-refund-123',
        ]);

        Http::fake([
            'https://api.sandbox.midtrans.com/v2/txn-refund-123/refund' => Http::response([
                'transaction_status' => 'refund',
                'order_id' => $order->order_number,
            ], 200),
        ]);

        $result = app(MidtransService::class)->refund($order, 150000, 'Batal pesanan');

        $this->assertTrue($result['success']);
        $this->assertSame('refund', $result['status']);

        Http::assertSent(function ($request) {
            $authorization = $request->header('Authorization')[0] ?? '';

            return str_contains($request->url(), '/txn-refund-123/refund')
                && $request['amount'] === 150000
                && $authorization === 'Basic ' . base64_encode('SB-Mid-server-integration-key:');
        });
    }

    public function test_refund_returns_failure_on_error_response(): void
    {
        $this->configure();

        $order = Order::factory()->create([
            'order_number' => 'INV/REFUND/002',
            'payment_method' => 'midtrans',
            'midtrans_transaction_id' => 'txn-refund-456',
        ]);

        Http::fake([
            '*' => Http::response(['status_message' => 'Refund failed'], 500),
        ]);

        $result = app(MidtransService::class)->refund($order, 10000);

        $this->assertFalse($result['success']);
        $this->assertSame('failed', $result['status']);
    }

    public function test_signature_uses_integration_server_key(): void
    {
        $this->configure();

        $service = app(MidtransService::class);

        $orderId = 'INV/SIG/001';
        $statusCode = '200';
        $grossAmount = '150000.00';
        $signature = hash('sha512', $orderId . $statusCode . $grossAmount . 'SB-Mid-server-integration-key');

        $this->assertTrue($service->verifySignature($orderId, $statusCode, $grossAmount, $signature));
    }
}
