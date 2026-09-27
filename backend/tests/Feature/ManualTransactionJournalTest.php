<?php

namespace Tests\Feature;

use App\Models\FinancialAccount;
use App\Models\FinancialLedgerEntry;
use App\Models\Order;
use App\Models\Transaction;
use Database\Seeders\MasterReferenceSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ManualTransactionJournalTest extends TestCase
{
    use RefreshDatabase;

    private const INITIAL_BALANCE = 45850000.0;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(MasterReferenceSeeder::class);
    }

    private function primaryAccount(): FinancialAccount
    {
        return FinancialAccount::where('account_number', '8012345678')->firstOrFail();
    }

    private function entriesFor(Transaction $transaction)
    {
        return FinancialLedgerEntry::with('account')
            ->where('transaction_id', $transaction->id)
            ->get();
    }

    private function assertBalanced(Transaction $transaction, float $amount, array $expectedCodes): void
    {
        $entries = $this->entriesFor($transaction);

        $this->assertCount(2, $entries);
        $this->assertEqualsWithDelta($amount, (float) $entries->sum('debit'), 0.01);
        $this->assertEqualsWithDelta($amount, (float) $entries->sum('credit'), 0.01);

        $codes = $entries->pluck('account.account_code')->sort()->values()->all();
        sort($expectedCodes);
        $this->assertSame($expectedCodes, $codes);
    }

    public function test_manual_income_posts_journal_and_updates_account_balance(): void
    {
        $response = $this->postJson('/api/transactions', [
            'type' => 'income',
            'category' => 'capital_deposit',
            'amount' => 5000000,
            'description' => 'Setoran modal pemilik',
            'payment_method' => 'Transfer Bank BCA',
        ]);

        $response->assertStatus(201)->assertJsonPath('data.category', 'capital_deposit');

        $transaction = Transaction::where('category', 'capital_deposit')->firstOrFail();

        // Debit Bank (1200), Kredit Modal Pemilik (3100).
        $this->assertBalanced($transaction, 5000000.0, ['1200', '3100']);

        $this->assertEqualsWithDelta(
            self::INITIAL_BALANCE + 5000000.0,
            (float) $this->primaryAccount()->fresh()->current_balance,
            0.01
        );
    }

    public function test_manual_expense_posts_journal_and_updates_account_balance(): void
    {
        $response = $this->postJson('/api/transactions', [
            'type' => 'expense',
            'category' => 'operational',
            'amount' => 750000,
            'description' => 'Pembelian kemasan & bubble wrap',
            'payment_method' => 'Kas Toko',
        ]);

        $response->assertStatus(201)->assertJsonPath('data.category', 'operational');

        $transaction = Transaction::where('category', 'operational')->firstOrFail();

        // Debit Beban Operasional (6300), Kredit Kas (1100).
        $this->assertBalanced($transaction, 750000.0, ['1100', '6300']);

        $this->assertEqualsWithDelta(
            self::INITIAL_BALANCE - 750000.0,
            (float) $this->primaryAccount()->fresh()->current_balance,
            0.01
        );
    }

    public function test_restock_manual_expense_maps_inventory_account(): void
    {
        $this->postJson('/api/transactions', [
            'type' => 'expense',
            'category' => 'restock',
            'amount' => 300000,
            'description' => 'Pembelian stok tambahan tanpa PO',
            'payment_method' => 'Kas Toko',
        ])->assertStatus(201);

        $transaction = Transaction::where('category', 'restock')->firstOrFail();

        // Debit Persediaan (1300), Kredit Kas (1100).
        $this->assertBalanced($transaction, 300000.0, ['1100', '1300']);
    }

    public function test_transactions_ledger_and_financial_account_stay_consistent(): void
    {
        $payloads = [
            ['type' => 'income', 'category' => 'capital_deposit', 'amount' => 1000000, 'payment_method' => 'Kas Toko', 'description' => 'Setoran kas'],
            ['type' => 'income', 'category' => 'order_payment', 'amount' => 500000, 'payment_method' => 'Kas Toko', 'description' => 'Pembayaran pesanan manual'],
            ['type' => 'expense', 'category' => 'operational', 'amount' => 200000, 'payment_method' => 'Kas Toko', 'description' => 'Operasional'],
            ['type' => 'expense', 'category' => 'restock', 'amount' => 300000, 'payment_method' => 'Kas Toko', 'description' => 'Restock'],
        ];

        foreach ($payloads as $payload) {
            $this->postJson('/api/transactions', $payload)->assertStatus(201);
        }

        // 1. Setiap transaksi manual memiliki jurnal seimbang (debit == kredit == amount).
        foreach (Transaction::where('reference_type', 'manual')->get() as $transaction) {
            $entries = $this->entriesFor($transaction);

            $this->assertCount(2, $entries, "Jurnal transaksi {$transaction->transaction_number} harus 2 baris.");
            $this->assertEqualsWithDelta((float) $transaction->amount, (float) $entries->sum('debit'), 0.01);
            $this->assertEqualsWithDelta((float) $transaction->amount, (float) $entries->sum('credit'), 0.01);
        }

        // 2. Jurnal umum global seimbang.
        $this->assertEqualsWithDelta(
            (float) FinancialLedgerEntry::sum('debit'),
            (float) FinancialLedgerEntry::sum('credit'),
            0.01
        );

        // 3. Saldo rekening = saldo awal + total income - total expense yang tertaut.
        $account = $this->primaryAccount();
        $income = (float) Transaction::where('financial_account_id', $account->id)->where('type', 'income')->sum('amount');
        $expense = (float) Transaction::where('financial_account_id', $account->id)->where('type', 'expense')->sum('amount');

        $this->assertEqualsWithDelta(
            self::INITIAL_BALANCE + $income - $expense,
            (float) $account->fresh()->current_balance,
            0.01
        );
    }

    public function test_shipping_expense_observer_transaction_is_journaled(): void
    {
        $order = Order::create([
            'order_number' => 'INV/JRN/SHIP001',
            'recipient_name' => 'Pelanggan Kirim',
            'full_address' => 'Surabaya',
            'expedition_name' => 'SiCepat',
            'expedition_service' => 'BEST',
            'subtotal' => 300000,
            'shipping_cost' => 22000,
            'grand_total' => 322000,
            'status' => 'processing',
            'payment_status' => 'paid',
        ]);

        $this->patchJson("/api/orders/{$order->id}/status", [
            'status' => 'shipped',
            'tracking_number' => 'SICPAT99887766',
        ])->assertStatus(200);

        $shipping = Transaction::where('order_id', $order->id)
            ->where('category', 'shipping_fee')
            ->firstOrFail();

        // Debit Beban Pengiriman (6100), Kredit Kas (1100).
        $this->assertBalanced($shipping, 22000.0, ['1100', '6100']);
    }

    public function test_cancelled_paid_order_refund_transaction_is_journaled(): void
    {
        $order = Order::create([
            'order_number' => 'INV/JRN/REF001',
            'recipient_name' => 'Pelanggan Refund',
            'full_address' => 'Semarang',
            'expedition_name' => 'JNE',
            'expedition_service' => 'REG',
            'subtotal' => 500000,
            'shipping_cost' => 15000,
            'grand_total' => 515000,
            'status' => 'processing',
            'payment_status' => 'paid',
            'payment_method' => 'kas',
        ]);

        $this->patchJson("/api/orders/{$order->id}/status", [
            'status' => 'cancelled',
            'cancellation_reason' => 'Stok habis mendadak',
        ])->assertStatus(200);

        $refund = Transaction::where('order_id', $order->id)
            ->where('category', 'refund')
            ->firstOrFail();

        // Debit Pendapatan (4100), Kredit Kas (1100).
        $this->assertBalanced($refund, 515000.0, ['1100', '4100']);
    }
}
