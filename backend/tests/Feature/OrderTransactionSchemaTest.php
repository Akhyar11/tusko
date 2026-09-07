<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\Transaction;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class OrderTransactionSchemaTest extends TestCase
{
    use RefreshDatabase;

    public function test_orders_table_has_expected_columns(): void
    {
        $this->assertTrue(Schema::hasTable('orders'));
        $this->assertTrue(Schema::hasColumns('orders', [
            'id',
            'order_number',
            'user_id',
            'status',
            'payment_status',
            'payment_method',
            'shipping_cost',
            'grand_total',
            'expedition_name',
            'tracking_number',
            'created_at',
            'updated_at',
        ]));
    }

    public function test_order_items_table_has_expected_columns(): void
    {
        $this->assertTrue(Schema::hasTable('order_items'));
        $this->assertTrue(Schema::hasColumns('order_items', [
            'id',
            'order_id',
            'product_id',
            'product_name',
            'product_price',
            'quantity',
            'subtotal',
        ]));
    }

    public function test_transactions_table_has_expected_columns(): void
    {
        $this->assertTrue(Schema::hasTable('transactions'));
        $this->assertTrue(Schema::hasColumns('transactions', [
            'id',
            'transaction_number',
            'order_id',
            'type',
            'category',
            'amount',
            'description',
            'payment_method',
            'status',
            'created_at',
            'updated_at',
        ]));
    }

    public function test_order_and_transaction_relationship_works(): void
    {
        $order = Order::create([
            'order_number' => 'INV/20260907/TK/123456',
            'recipient_name' => 'Budi Athlete',
            'full_address' => 'Jl. Merdeka No. 10 Jakarta',
            'expedition_name' => 'J&T Express',
            'expedition_service' => 'EZ Reguler',
            'subtotal' => 200000,
            'shipping_cost' => 15000,
            'grand_total' => 215000,
            'status' => 'pending',
            'payment_status' => 'pending',
            'payment_method' => 'midtrans',
            'payment_channel' => 'BCA Virtual Account',
        ]);

        $incomeTx = Transaction::recordOrderPayment($order);
        $shippingTx = Transaction::recordShippingExpense($order);

        $this->assertDatabaseHas('transactions', [
            'id' => $incomeTx->id,
            'order_id' => $order->id,
            'type' => 'income',
            'category' => 'order_payment',
            'amount' => 215000,
        ]);

        $this->assertDatabaseHas('transactions', [
            'id' => $shippingTx->id,
            'order_id' => $order->id,
            'type' => 'expense',
            'category' => 'shipping_fee',
            'amount' => 15000,
        ]);

        $this->assertCount(2, $order->transactions);
        $this->assertEquals($order->id, $incomeTx->order->id);
    }
}
