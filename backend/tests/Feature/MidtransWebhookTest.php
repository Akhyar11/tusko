<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MidtransWebhookTest extends TestCase
{
    use RefreshDatabase;

    protected function generateSignature(string $orderId, string $statusCode, string $grossAmount): string
    {
        $serverKey = config('midtrans.server_key');
        return hash('sha512', $orderId . $statusCode . $grossAmount . $serverKey);
    }

    public function test_webhook_settlement_marks_order_as_paid(): void
    {
        $order = Order::factory()->create([
            'order_number' => 'INV/20260907/TK/100001',
            'grand_total' => 250000,
            'status' => 'pending',
            'payment_status' => 'pending',
        ]);

        $signature = $this->generateSignature($order->order_number, '200', '250000.00');

        $payload = [
            'order_id' => $order->order_number,
            'status_code' => '200',
            'gross_amount' => '250000.00',
            'signature_key' => $signature,
            'transaction_status' => 'settlement',
            'transaction_id' => 'midtrans-trx-998877',
            'payment_type' => 'bank_transfer',
            'va_numbers' => [
                ['bank' => 'bca', 'va_number' => '88081234567890'],
            ],
        ];

        $response = $this->postJson('/api/webhooks/midtrans', $payload);

        $response->assertOk()
            ->assertJsonPath('data.status', 'processing')
            ->assertJsonPath('data.payment_status', 'paid');

        $order->refresh();
        $this->assertEquals('processing', $order->status);
        $this->assertEquals('paid', $order->payment_status);
        $this->assertEquals('midtrans-trx-998877', $order->midtrans_transaction_id);
        $this->assertNotNull($order->paid_at);
    }

    public function test_webhook_capture_with_accept_fraud_status_marks_order_as_paid(): void
    {
        $order = Order::factory()->create([
            'order_number' => 'INV/20260907/TK/100002',
            'grand_total' => 100000,
            'status' => 'pending',
            'payment_status' => 'pending',
        ]);

        $signature = $this->generateSignature($order->order_number, '200', '100000.00');

        $payload = [
            'order_id' => $order->order_number,
            'status_code' => '200',
            'gross_amount' => '100000.00',
            'signature_key' => $signature,
            'transaction_status' => 'capture',
            'fraud_status' => 'accept',
            'transaction_id' => 'midtrans-cc-12345',
            'payment_type' => 'credit_card',
        ];

        $response = $this->postJson('/api/webhooks/midtrans', $payload);

        $response->assertOk()
            ->assertJsonPath('data.status', 'processing')
            ->assertJsonPath('data.payment_status', 'paid');

        $order->refresh();
        $this->assertEquals('processing', $order->status);
        $this->assertEquals('paid', $order->payment_status);
    }

    public function test_webhook_expire_cancels_order_and_restores_product_stock(): void
    {
        $product = Product::factory()->create(['stock' => 5]);

        $order = Order::factory()->create([
            'order_number' => 'INV/20260907/TK/100003',
            'grand_total' => 150000,
            'status' => 'pending',
            'payment_status' => 'pending',
        ]);

        OrderItem::factory()->create([
            'order_id' => $order->id,
            'product_id' => $product->id,
            'quantity' => 2,
        ]);

        $signature = $this->generateSignature($order->order_number, '200', '150000.00');

        $payload = [
            'order_id' => $order->order_number,
            'status_code' => '200',
            'gross_amount' => '150000.00',
            'signature_key' => $signature,
            'transaction_status' => 'expire',
            'transaction_id' => 'midtrans-trx-expired',
            'payment_type' => 'qris',
        ];

        $response = $this->postJson('/api/webhooks/midtrans', $payload);

        $response->assertOk()
            ->assertJsonPath('data.status', 'cancelled')
            ->assertJsonPath('data.payment_status', 'expired');

        $order->refresh();
        $this->assertEquals('cancelled', $order->status);
        $this->assertEquals('expired', $order->payment_status);

        // Product stock restored from 5 -> 7
        $this->assertEquals(7, $product->fresh()->stock);
    }

    public function test_webhook_rejects_invalid_signature(): void
    {
        $order = Order::factory()->create([
            'order_number' => 'INV/20260907/TK/100004',
        ]);

        $payload = [
            'order_id' => $order->order_number,
            'status_code' => '200',
            'gross_amount' => '100000.00',
            'signature_key' => 'invalid-tampered-signature',
            'transaction_status' => 'settlement',
        ];

        $response = $this->postJson('/api/webhooks/midtrans', $payload);

        $response->assertStatus(403);
    }

    public function test_webhook_returns_404_for_unknown_order(): void
    {
        $fakeOrderNumber = 'INV/20260907/TK/999999';
        $signature = $this->generateSignature($fakeOrderNumber, '200', '100000.00');

        $payload = [
            'order_id' => $fakeOrderNumber,
            'status_code' => '200',
            'gross_amount' => '100000.00',
            'signature_key' => $signature,
            'transaction_status' => 'settlement',
        ];

        $response = $this->postJson('/api/webhooks/midtrans', $payload);

        $response->assertStatus(404);
    }
}
