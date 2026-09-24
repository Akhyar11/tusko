<?php

namespace Tests\Feature;

use App\Exceptions\UnbalancedJournalException;
use App\Models\FinancialAccount;
use App\Models\FinancialLedgerEntry;
use App\Models\Transaction;
use App\Services\JournalPostingService;
use Database\Seeders\MasterReferenceSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use InvalidArgumentException;
use Tests\TestCase;

class JournalPostingTest extends TestCase
{
    use RefreshDatabase;

    private function service(): JournalPostingService
    {
        return app(JournalPostingService::class);
    }

    private function createTransaction(float $amount = 100000, ?FinancialAccount $account = null): Transaction
    {
        static $sequence = 0;
        $sequence++;

        return Transaction::create([
            'transaction_number' => 'TRX/JRN/' . str_pad((string) $sequence, 3, '0', STR_PAD_LEFT),
            'type' => 'income',
            'category' => 'order_payment',
            'category_label' => 'Pembayaran Pesanan',
            'amount' => $amount,
            'description' => 'Uji jurnal ' . $sequence,
            'financial_account_id' => $account?->id,
        ]);
    }

    private function balancedLines(float $amount = 100000): array
    {
        return [
            ['account_code' => '1100', 'debit' => $amount],
            ['account_code' => '4100', 'credit' => $amount],
        ];
    }

    public function test_posts_balanced_journal_and_updates_financial_account(): void
    {
        $this->seed(MasterReferenceSeeder::class);

        $account = FinancialAccount::create([
            'account_name' => 'Kas Toko Uji',
            'account_number' => '999000111',
            'bank_name' => 'Bank Uji',
            'current_balance' => 0,
        ]);

        $transaction = $this->createTransaction(100000, $account);

        $entries = $this->service()->post($transaction, $this->balancedLines(100000));

        $this->assertCount(2, $entries);
        $this->assertSame(2, FinancialLedgerEntry::where('transaction_id', $transaction->id)->count());
        $this->assertEqualsWithDelta(
            100000.0,
            (float) FinancialLedgerEntry::where('transaction_id', $transaction->id)->sum('debit'),
            0.01
        );
        $this->assertEqualsWithDelta(
            100000.0,
            (float) FinancialLedgerEntry::where('transaction_id', $transaction->id)->sum('credit'),
            0.01
        );
        $this->assertEqualsWithDelta(100000.0, (float) $account->fresh()->current_balance, 0.01);
    }

    public function test_posting_is_idempotent(): void
    {
        $this->seed(MasterReferenceSeeder::class);

        $account = FinancialAccount::create([
            'account_name' => 'Kas Toko Uji 2',
            'account_number' => '999000222',
            'bank_name' => 'Bank Uji',
            'current_balance' => 0,
        ]);

        $transaction = $this->createTransaction(100000, $account);

        $this->service()->post($transaction, $this->balancedLines(100000));
        $this->service()->post($transaction, $this->balancedLines(100000));

        $this->assertSame(2, FinancialLedgerEntry::where('transaction_id', $transaction->id)->count());
        $this->assertEqualsWithDelta(100000.0, (float) $account->fresh()->current_balance, 0.01);
    }

    public function test_rejects_unbalanced_journal(): void
    {
        $this->seed(MasterReferenceSeeder::class);
        $transaction = $this->createTransaction(100000);

        $thrown = null;

        try {
            $this->service()->post($transaction, [
                ['account_code' => '1100', 'debit' => 100000],
                ['account_code' => '4100', 'credit' => 90000],
            ]);
        } catch (UnbalancedJournalException $exception) {
            $thrown = $exception;
        }

        $this->assertInstanceOf(UnbalancedJournalException::class, $thrown);
        $this->assertSame(0, FinancialLedgerEntry::where('transaction_id', $transaction->id)->count());
    }

    public function test_rejects_line_with_both_debit_and_credit(): void
    {
        $this->seed(MasterReferenceSeeder::class);
        $transaction = $this->createTransaction(100000);

        $this->expectException(InvalidArgumentException::class);

        $this->service()->post($transaction, [
            ['account_code' => '1100', 'debit' => 100000, 'credit' => 100000],
            ['account_code' => '4100', 'credit' => 100000],
        ]);
    }

    public function test_endpoint_lists_journal_entries_with_balanced_summary(): void
    {
        $this->seed(MasterReferenceSeeder::class);
        $transaction = $this->createTransaction(100000);

        $this->service()->post($transaction, $this->balancedLines(100000));

        $response = $this->getJson('/api/journal-entries?transaction_id=' . $transaction->id);

        $response->assertStatus(200)
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('summary.is_balanced', true)
            ->assertJsonPath('data.0.transaction_number', $transaction->transaction_number);
    }
}
