<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\Transaction;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TransactionApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_get_transaction_list_with_stats(): void
    {
        // 1 Income settled
        Transaction::create([
            'transaction_number' => 'TRX/20260908/IN-1001',
            'type' => 'income',
            'category' => 'order_payment',
            'category_label' => 'Pembayaran Pesanan',
            'amount' => 500000,
            'description' => 'Pembayaran pesanan INV/001',
            'payment_method' => 'BCA Virtual Account',
            'status' => 'settled',
            'customer_name' => 'Budi Santoso',
        ]);

        // 1 Expense settled
        Transaction::create([
            'transaction_number' => 'TRX/20260908/EX-1002',
            'type' => 'expense',
            'category' => 'shipping_fee',
            'category_label' => 'Ongkos Kirim Kurir',
            'amount' => 20000,
            'description' => 'Ongkir SiCepat',
            'payment_method' => 'Saldo Ekspedisi',
            'status' => 'settled',
        ]);

        // 1 Income pending
        Transaction::create([
            'transaction_number' => 'TRX/20260908/IN-1003',
            'type' => 'income',
            'category' => 'order_payment',
            'category_label' => 'Pembayaran Pesanan',
            'amount' => 300000,
            'description' => 'Menunggu transfer Bank Mandiri',
            'payment_method' => 'Transfer Mandiri',
            'status' => 'pending',
            'customer_name' => 'Citra Dewi',
        ]);

        $response = $this->getJson('/api/transactions');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data',
                'stats' => [
                    'total_income',
                    'total_expense',
                    'net_cashflow',
                    'total_pending',
                    'settled_count',
                    'total_count',
                ],
                'categories',
                'meta' => [
                    'current_page',
                    'total',
                ],
            ])
            ->assertJsonPath('stats.total_income', 500000)
            ->assertJsonPath('stats.total_expense', 20000)
            ->assertJsonPath('stats.net_cashflow', 480000)
            ->assertJsonPath('stats.total_pending', 300000)
            ->assertJsonPath('stats.settled_count', 2)
            ->assertJsonPath('stats.total_count', 3);
    }

    public function test_can_filter_transactions_by_tab_and_type(): void
    {
        Transaction::create([
            'transaction_number' => 'TRX/20260908/IN-2001',
            'type' => 'income',
            'category' => 'capital_deposit',
            'amount' => 1000000,
            'description' => 'Setoran modal kas',
            'status' => 'settled',
        ]);

        Transaction::create([
            'transaction_number' => 'TRX/20260908/EX-2002',
            'type' => 'expense',
            'category' => 'operational',
            'amount' => 50000,
            'description' => 'Beli lakban dan bubble wrap',
            'status' => 'settled',
        ]);

        $incomeRes = $this->getJson('/api/transactions?tab=income');
        $incomeRes->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.type', 'income');

        $expenseRes = $this->getJson('/api/transactions?type=expense');
        $expenseRes->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.type', 'expense');
    }

    public function test_can_filter_transactions_by_category(): void
    {
        Transaction::create([
            'transaction_number' => 'TRX/20260908/EX-3001',
            'type' => 'expense',
            'category' => 'shipping_fee',
            'amount' => 15000,
            'description' => 'Ongkir JNE',
            'status' => 'settled',
        ]);

        Transaction::create([
            'transaction_number' => 'TRX/20260908/EX-3002',
            'type' => 'expense',
            'category' => 'operational',
            'amount' => 25000,
            'description' => 'Kemasan dus',
            'status' => 'settled',
        ]);

        $response = $this->getJson('/api/transactions?category=shipping_fee');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.category', 'shipping_fee');
    }

    public function test_can_search_transactions(): void
    {
        $order = Order::create([
            'order_number' => 'INV/20260908/TK/SEARCH123',
            'recipient_name' => 'Doni Salman',
            'full_address' => 'Bandung Barat',
            'expedition_name' => 'JNE',
            'expedition_service' => 'REG',
            'subtotal' => 200000,
            'shipping_cost' => 10000,
            'grand_total' => 210000,
            'status' => 'pending',
            'payment_status' => 'pending',
        ]);

        Transaction::create([
            'transaction_number' => 'TRX/20260908/IN-4001',
            'order_id' => $order->id,
            'type' => 'income',
            'category' => 'order_payment',
            'amount' => 210000,
            'description' => 'Pembayaran pesanan Doni',
            'status' => 'settled',
            'customer_name' => 'Doni Salman',
        ]);

        Transaction::create([
            'transaction_number' => 'TRX/20260908/EX-4002',
            'type' => 'expense',
            'category' => 'operational',
            'amount' => 50000,
            'description' => 'Beli ATK nota toko',
            'status' => 'settled',
        ]);

        // Search by order_number
        $searchOrderRes = $this->getJson('/api/transactions?search=SEARCH123');
        $searchOrderRes->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.order_number', 'INV/20260908/TK/SEARCH123');

        // Search by description keyword
        $searchDescRes = $this->getJson('/api/transactions?search=ATK');
        $searchDescRes->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.description', 'Beli ATK nota toko');
    }

    public function test_can_get_single_transaction_detail(): void
    {
        $tx = Transaction::create([
            'transaction_number' => 'TRX/20260908/IN-5001',
            'type' => 'income',
            'category' => 'capital_deposit',
            'category_label' => 'Modal / Setoran Kas',
            'amount' => 2000000,
            'description' => 'Setoran modal kas awal',
            'payment_method' => 'Transfer Bank',
            'status' => 'settled',
            'customer_name' => 'Owner',
        ]);

        $byId = $this->getJson("/api/transactions/{$tx->id}");
        $byId->assertStatus(200)
            ->assertJsonPath('data.id', $tx->id)
            ->assertJsonPath('data.transaction_number', 'TRX/20260908/IN-5001');

        $byTrxNum = $this->getJson("/api/transactions/{$tx->transaction_number}");
        $byTrxNum->assertStatus(200)
            ->assertJsonPath('data.id', $tx->id);
    }

    public function test_can_store_manual_transaction(): void
    {
        $payload = [
            'type' => 'expense',
            'category' => 'operational',
            'amount' => 75000,
            'description' => 'Pembelian lakban coklat & bubble wrap ekstra tebal',
            'payment_method' => 'Kas Toko / QRIS',
            'notes' => 'Nota toko fisik no #4491',
        ];

        $response = $this->postJson('/api/transactions', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('data.type', 'expense')
            ->assertJsonPath('data.category', 'operational')
            ->assertJsonPath('data.amount', 75000)
            ->assertJsonPath('data.status', 'settled');

        $this->assertDatabaseHas('transactions', [
            'category' => 'operational',
            'amount' => 75000,
            'description' => 'Pembelian lakban coklat & bubble wrap ekstra tebal',
        ]);
    }

    public function test_can_get_transaction_categories(): void
    {
        $response = $this->getJson('/api/transactions/categories');

        $response->assertStatus(200)
            ->assertJsonStructure(['data'])
            ->assertJsonFragment(['id' => 'shipping_fee', 'label' => 'Ongkos Kirim Kurir']);
    }
}
