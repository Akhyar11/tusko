<?php

namespace Tests\Feature;

use App\Models\FinancialLedgerEntry;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Transaction;
use App\Services\IntegrationService;
use App\Services\MidtransSnapService;
use Database\Seeders\MasterReferenceSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/**
 * Fee per transaksi Midtrans otomatis via SNAP Transaction History API.
 */
class MidtransSnapFeeSyncTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(MasterReferenceSeeder::class);
    }

    private function configureSnap(): void
    {
        $res = openssl_pkey_new(['private_key_bits' => 2048, 'private_key_type' => OPENSSL_KEYTYPE_RSA]);
        openssl_pkey_export($res, $privateKey);

        $integrations = app(IntegrationService::class);
        $integrations->set('payment.snap_enabled', '1', 'payment');
        $integrations->set('payment.snap_base_url', 'https://snap.test', 'payment');
        $integrations->set('payment.snap_client_id', 'CLIENT-X', 'payment');
        $integrations->set('payment.snap_private_key', $privateKey, 'payment', true);
    }

    public function test_snap_fetches_access_token_and_transaction_history(): void
    {
        $this->configureSnap();

        Http::fake([
            'https://snap.test/v1.0/access-token/b2b' => Http::response(['accessToken' => 'tok-123', 'tokenType' => 'Bearer'], 200),
            'https://snap.test/v1.0/transaction-history-list' => Http::response([
                'responseCode' => '2001200',
                'detailData' => [[
                    'amount' => ['value' => '25000.00', 'currency' => 'IDR'],
                    'type' => 'PAYMENT',
                    'additionalInfo' => [
                        'partnerReferenceNo' => 'INV/20260101/TK/000001',
                        'channel' => 'mandiri_bill',
                        'status' => 'SETTLEMENT',
                        'type' => 'PAYMENT',
                        'fee' => ['value' => '4440.00', 'currency' => 'IDR'],
                    ],
                ]],
            ], 200),
        ]);

        $service = app(MidtransSnapService::class);
        $this->assertTrue($service->isConfigured());
        $this->assertSame('tok-123', $service->accessToken());

        $rows = $service->transactionHistory('2026-01-01T00:00:00+07:00', '2026-01-02T00:00:00+07:00');
        $this->assertCount(1, $rows);
        $this->assertSame('4440.00', $rows[0]['additionalInfo']['fee']['value']);
    }

    public function test_command_syncs_fee_to_payment_transaction_and_journal(): void
    {
        $this->configureSnap();

        $order = Order::factory()->create([
            'order_number' => 'INV/20260101/TK/000777',
            'grand_total' => 25000,
            'status' => 'processing',
            'payment_status' => 'paid',
            'payment_method' => 'midtrans',
            'payment_channel' => 'mandiri_va',
            'recipient_name' => 'Pembeli Uji',
        ]);

        Payment::create([
            'order_id' => $order->id,
            'reference' => $order->order_number,
            'method' => 'midtrans',
            'channel' => 'mandiri_va',
            'amount' => 25000,
            'status' => 'paid',
        ]);

        Transaction::recordOrderPayment($order, 'mandiri_va');

        Http::fake([
            'https://snap.test/v1.0/access-token/b2b' => Http::response(['accessToken' => 'tok-123'], 200),
            'https://snap.test/v1.0/transaction-history-list' => Http::response([
                'responseCode' => '2001200',
                'detailData' => [[
                    'amount' => ['value' => '25000.00', 'currency' => 'IDR'],
                    'type' => 'PAYMENT',
                    'additionalInfo' => [
                        'partnerReferenceNo' => $order->order_number,
                        'channel' => 'mandiri_bill',
                        'status' => 'SETTLEMENT',
                        'type' => 'PAYMENT',
                        'fee' => ['value' => '4440.00', 'currency' => 'IDR'],
                    ],
                ]],
            ], 200),
        ]);

        $this->artisan('midtrans:sync-fees')->assertExitCode(0);

        $this->assertSame(4440.0, (float) Payment::where('order_id', $order->id)->value('fee'));

        $trx = Transaction::where('order_id', $order->id)->where('category', 'order_payment')->firstOrFail();
        $this->assertSame(4440.0, (float) $trx->fee_deducted);
        $this->assertSame(20560.0, (float) $trx->net_amount);

        $gw = Transaction::where('order_id', $order->id)->where('reference_type', 'order_gateway_fee')->firstOrFail();
        $this->assertSame(2, FinancialLedgerEntry::where('transaction_id', $gw->id)->count());
    }

    public function test_command_skips_when_snap_not_configured(): void
    {
        $this->artisan('midtrans:sync-fees')->assertExitCode(0);
    }
}
