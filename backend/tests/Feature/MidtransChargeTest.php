<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\Payment;
use App\Models\User;
use App\Services\IntegrationService;
use App\Services\MidtransService;
use Database\Seeders\MasterReferenceSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class MidtransChargeTest extends TestCase
{
    use RefreshDatabase;

    private const SERVER_KEY = 'SB-Mid-server-TEST-KEY';

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(MasterReferenceSeeder::class);

        $integrations = app(IntegrationService::class);
        $integrations->set('payment.midtrans_server_key', self::SERVER_KEY, 'payment', true);
        $integrations->set('payment.midtrans_client_key', 'SB-Mid-client-TEST', 'payment', true);
        $integrations->set('payment.midtrans_api_url', 'https://api.sandbox.midtrans.com', 'payment');
    }

    private function order(?User $user = null): Order
    {
        return Order::factory()->create([
            'user_id' => $user?->id,
            'grand_total' => 150000,
            'status' => 'pending',
            'payment_status' => 'pending',
        ]);
    }

    private function fakeCharge(array $body): void
    {
        Http::fake(['api.sandbox.midtrans.com/v2/charge' => Http::response($body, 200)]);
    }

    public function test_charge_bca_va_persists_va_and_pending_payment(): void
    {
        $order = $this->order();
        $this->fakeCharge([
            'status_code' => '201',
            'transaction_id' => 'trx-bca-001',
            'order_id' => $order->order_number,
            'payment_type' => 'bank_transfer',
            'transaction_status' => 'pending',
            'va_numbers' => [['bank' => 'bca', 'va_number' => '12345678901']],
        ]);

        $result = app(MidtransService::class)->createCharge($order, 'bca_va');

        $this->assertTrue($result['success']);
        $fresh = $order->fresh();
        $this->assertSame('12345678901', $fresh->va_number);
        $this->assertSame('bca_va', $fresh->payment_channel);
        $this->assertSame('pending', $fresh->payment_status);
        $this->assertNotNull($fresh->payment_expires_at);

        $payment = Payment::where('order_id', $order->id)->where('reference', 'trx-bca-001')->first();
        $this->assertNotNull($payment);
        $this->assertSame('pending', $payment->status);
    }

    public function test_charge_mandiri_echannel_persists_biller(): void
    {
        $order = $this->order();
        $this->fakeCharge([
            'status_code' => '201',
            'transaction_id' => 'trx-mandiri-001',
            'payment_type' => 'echannel',
            'transaction_status' => 'pending',
            'biller_code' => '70012',
            'bill_key' => '111122223333',
        ]);

        app(MidtransService::class)->createCharge($order, 'mandiri_va');

        $fresh = $order->fresh();
        $this->assertSame('70012', $fresh->midtrans_biller_code);
        $this->assertSame('111122223333', $fresh->midtrans_bill_key);
        $this->assertSame('mandiri_va', $fresh->payment_channel);
    }

    public function test_charge_qris_persists_qr_string_and_url(): void
    {
        $order = $this->order();
        $this->fakeCharge([
            'status_code' => '201',
            'transaction_id' => 'trx-qris-001',
            'payment_type' => 'qris',
            'transaction_status' => 'pending',
            'qr_string' => '00020101021226...',
            'actions' => [
                ['name' => 'generate-qr-code', 'method' => 'GET', 'url' => 'https://api.sandbox.midtrans.com/v2/qris/trx-qris-001/qr-code'],
            ],
        ]);

        app(MidtransService::class)->createCharge($order, 'qris');

        $fresh = $order->fresh();
        $this->assertSame('00020101021226...', $fresh->midtrans_qr_string);
        $this->assertStringContainsString('/qris/trx-qris-001/qr-code', (string) $fresh->midtrans_qr_url);
    }

    public function test_charge_endpoint_returns_instruction(): void
    {
        $user = User::factory()->create(['role' => 'customer', 'is_active' => true]);
        $order = $this->order($user);
        Sanctum::actingAs($user);

        $this->fakeCharge([
            'status_code' => '201',
            'transaction_id' => 'trx-ep-001',
            'payment_type' => 'qris',
            'transaction_status' => 'pending',
            'qr_string' => 'QR-ENDPOINT',
            'actions' => [],
        ]);

        $this->postJson("/api/orders/{$order->id}/charge", ['payment_method' => 'qris'])
            ->assertStatus(200)
            ->assertJsonPath('data.payment_channel', 'qris')
            ->assertJsonPath('data.qr_string', 'QR-ENDPOINT')
            ->assertJsonPath('data.payment_status', 'pending');
    }

    public function test_charge_endpoint_rejects_unsupported_channel(): void
    {
        $user = User::factory()->create(['role' => 'customer', 'is_active' => true]);
        $order = $this->order($user);
        Sanctum::actingAs($user);

        $this->postJson("/api/orders/{$order->id}/charge", ['payment_method' => 'credit_card'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('payment_method');
    }

    public function test_webhook_pending_qris_persists_qr_and_marks_pending(): void
    {
        $order = $this->order();
        $signature = hash('sha512', $order->order_number . '200' . '150000.00' . self::SERVER_KEY);

        $this->postJson('/api/webhooks/midtrans', [
            'order_id' => $order->order_number,
            'status_code' => '200',
            'gross_amount' => '150000.00',
            'signature_key' => $signature,
            'transaction_status' => 'pending',
            'transaction_id' => 'trx-qris-hook',
            'payment_type' => 'qris',
            'qr_string' => 'QR-FROM-HOOK',
        ])->assertOk();

        $fresh = $order->fresh();
        $this->assertSame('qris', $fresh->payment_channel);
        $this->assertSame('QR-FROM-HOOK', $fresh->midtrans_qr_string);
        $this->assertSame('pending', $fresh->payment_status);
    }
}
