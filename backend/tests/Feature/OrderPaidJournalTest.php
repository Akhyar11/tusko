<?php

namespace Tests\Feature;

use App\Models\FinancialLedgerEntry;
use App\Models\Order;
use App\Models\Transaction;
use Database\Seeders\MasterReferenceSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrderPaidJournalTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(MasterReferenceSeeder::class);
    }

    public function test_paid_order_posts_revenue_journal_idempotently(): void
    {
        $order = Order::factory()->create([
            'status' => 'processing',
            'payment_status' => 'paid',
            'grand_total' => 150000,
        ]);

        $container = Transaction::where('order_id', $order->id)
            ->where('category', 'order_payment')
            ->first();

        $this->assertNotNull($container, 'transaksi order_payment tidak dibuat');
        $this->assertGreaterThanOrEqual(2, FinancialLedgerEntry::where('transaction_id', $container->id)->count());

        // Idempoten: update ulang tidak menggandakan jurnal.
        $entries = FinancialLedgerEntry::where('transaction_id', $container->id)->count();
        $order->update(['notes' => 'trigger resync']);
        $this->assertSame($entries, FinancialLedgerEntry::where('transaction_id', $container->id)->count());
    }

    public function test_paid_order_with_subsidy_posts_shipping_expense_journal(): void
    {
        $order = Order::factory()->create([
            'status' => 'processing',
            'payment_status' => 'paid',
            'grand_total' => 200000,
            'shipping_cost' => 0,
            'shipping_subsidy' => 15000,
        ]);

        $container = Transaction::where('order_id', $order->id)
            ->where('category', 'shipping_subsidy')
            ->first();

        $this->assertNotNull($container, 'transaksi shipping_subsidy tidak dibuat');
        $this->assertGreaterThanOrEqual(2, FinancialLedgerEntry::where('transaction_id', $container->id)->count());
    }
}
