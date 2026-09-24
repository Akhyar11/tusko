<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\Payment;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class PaymentSchemaTest extends TestCase
{
    use RefreshDatabase;

    public function test_payments_table_has_expected_columns(): void
    {
        $this->assertTrue(Schema::hasColumns('payments', [
            'id', 'order_id', 'method', 'channel', 'amount', 'status',
            'reference', 'paid_at', 'proof', 'notes', 'created_at', 'updated_at',
        ]));
    }

    public function test_order_has_payments_and_latest_payment_relations(): void
    {
        $order = Order::factory()->create();

        $payment = Payment::create([
            'order_id' => $order->id,
            'method' => 'midtrans',
            'channel' => 'bca_va',
            'amount' => 150000,
            'status' => 'paid',
            'reference' => 'TRX-001',
            'paid_at' => now(),
        ]);

        $order->refresh();

        $this->assertCount(1, $order->payments);
        $this->assertTrue($order->latestPayment->is($payment));
        $this->assertTrue($payment->order->is($order));
        $this->assertEquals('150000.00', $payment->amount);
    }

    public function test_reference_is_unique_per_order(): void
    {
        $order = Order::factory()->create();

        Payment::create([
            'order_id' => $order->id,
            'method' => 'midtrans',
            'amount' => 10000,
            'status' => 'paid',
            'reference' => 'DUP-001',
        ]);

        $this->expectException(QueryException::class);

        Payment::create([
            'order_id' => $order->id,
            'method' => 'midtrans',
            'amount' => 10000,
            'status' => 'paid',
            'reference' => 'DUP-001',
        ]);
    }
}
