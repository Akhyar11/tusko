<?php

namespace Tests\Feature;

use App\Models\ChartOfAccount;
use App\Models\FinancialAccount;
use App\Models\Transaction;
use Database\Seeders\MasterReferenceSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FinancialAccountManagementTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(MasterReferenceSeeder::class);
        FinancialAccount::query()->delete();
    }

    public function test_can_list_accounts_with_stats_and_filters(): void
    {
        $cashCoa = ChartOfAccount::where('account_code', '1100')->first();
        $bankCoa = ChartOfAccount::where('account_code', '1200')->first();

        FinancialAccount::create([
            'type' => 'cash',
            'chart_of_account_id' => $cashCoa->id,
            'account_name' => 'Kasir Utama Senayan',
            'current_balance' => 5000000,
            'is_active' => true,
        ]);

        FinancialAccount::create([
            'type' => 'bank',
            'chart_of_account_id' => $bankCoa->id,
            'account_name' => 'BCA Operasional PT Tusko',
            'bank_name' => 'BCA',
            'account_number' => '8012345678',
            'account_holder' => 'PT Tusko Niaga',
            'current_balance' => 25000000,
            'is_active' => true,
        ]);

        FinancialAccount::create([
            'type' => 'bank',
            'chart_of_account_id' => $bankCoa->id,
            'account_name' => 'Bank Mandiri Cadangan',
            'bank_name' => 'Bank Mandiri',
            'account_number' => '1300098765432',
            'account_holder' => 'PT Tusko Niaga',
            'current_balance' => 0,
            'is_active' => false,
        ]);

        // 1. All list
        $res = $this->getJson('/api/financial-accounts');
        $res->assertStatus(200);
        $res->assertJsonPath('stats.total_count', 3);
        $res->assertJsonPath('stats.active_count', 2);
        $res->assertJsonPath('stats.inactive_count', 1);
        $this->assertEquals(30000000, $res->json('stats.total_balance'));

        // 2. Filter by type=cash
        $cashRes = $this->getJson('/api/financial-accounts?type=cash');
        $cashRes->assertStatus(200);
        $cashRes->assertJsonPath('stats.total_count', 1);
        $this->assertEquals('Kasir Utama Senayan', $cashRes->json('data.0.account_name'));

        // 3. Filter by type=bank
        $bankRes = $this->getJson('/api/financial-accounts?type=bank');
        $bankRes->assertStatus(200);
        $bankRes->assertJsonPath('stats.total_count', 2);

        // 4. Search
        $searchRes = $this->getJson('/api/financial-accounts?search=Mandiri');
        $searchRes->assertStatus(200);
        $searchRes->assertJsonPath('stats.total_count', 1);
        $this->assertEquals('Bank Mandiri Cadangan', $searchRes->json('data.0.account_name'));
    }

    public function test_can_create_cash_account_with_opening_balance_and_auto_journal(): void
    {
        $payload = [
            'type' => 'cash',
            'account_name' => 'Brankas Kasir Store 1',
            'opening_balance' => 10000000,
            'notes' => 'Kas awal operasional kasir baru',
            'is_active' => true,
        ];

        $res = $this->postJson('/api/financial-accounts', $payload);
        $res->assertStatus(201);
        $this->assertEquals('Brankas Kasir Store 1', $res->json('data.account_name'));
        $this->assertEquals(10000000, $res->json('data.current_balance'));

        // Verify account mapped to COA 1100 automatically
        $account = FinancialAccount::find($res->json('data.id'));
        $this->assertNotNull($account->chartOfAccount);
        $this->assertEquals('1100', $account->chartOfAccount->account_code);

        // Verify opening capital transaction created
        $trx = Transaction::where('financial_account_id', $account->id)->first();
        $this->assertNotNull($trx);
        $this->assertEquals('capital_deposit', $trx->category);
        $this->assertEquals(10000000, $trx->amount);

        // Verify journal ledger entries (Debit 1100, Kredit 3100)
        $this->assertDatabaseHas('financial_ledger_entries', [
            'transaction_id' => $trx->id,
            'debit' => 10000000,
            'credit' => 0,
        ]);
        $this->assertDatabaseHas('financial_ledger_entries', [
            'transaction_id' => $trx->id,
            'debit' => 0,
            'credit' => 10000000,
        ]);
    }

    public function test_bank_account_requires_bank_name_and_account_number(): void
    {
        $payload = [
            'type' => 'bank',
            'account_name' => 'Rekening Giro Baru',
            'opening_balance' => 5000000,
        ];

        $res = $this->postJson('/api/financial-accounts', $payload);
        $res->assertStatus(422);
    }

    public function test_can_transfer_balance_between_accounts_atomically(): void
    {
        $cashCoa = ChartOfAccount::where('account_code', '1100')->first();
        $bankCoa = ChartOfAccount::where('account_code', '1200')->first();

        $bank = FinancialAccount::create([
            'type' => 'bank',
            'chart_of_account_id' => $bankCoa->id,
            'account_name' => 'BCA Operasional',
            'bank_name' => 'BCA',
            'account_number' => '1122334455',
            'current_balance' => 20000000,
            'is_active' => true,
        ]);

        $cash = FinancialAccount::create([
            'type' => 'cash',
            'chart_of_account_id' => $cashCoa->id,
            'account_name' => 'Kas Kecil Kantor',
            'current_balance' => 1000000,
            'is_active' => true,
        ]);

        $transferPayload = [
            'from_account_id' => $bank->id,
            'to_account_id' => $cash->id,
            'amount' => 5000000,
            'notes' => 'Pencairan cek tarik tunai untuk kas kecil',
        ];

        $res = $this->postJson('/api/financial-accounts/transfer', $transferPayload);
        $res->assertStatus(200);

        $bank->refresh();
        $cash->refresh();

        $this->assertEquals(15000000, (float) $bank->current_balance);
        $this->assertEquals(6000000, (float) $cash->current_balance);

        // Verify transaction logged
        $this->assertDatabaseHas('transactions', [
            'financial_account_id' => $bank->id,
            'category_label' => 'Transfer Antar Rekening',
            'amount' => 5000000,
        ]);
    }

    public function test_cannot_delete_account_with_transactions(): void
    {
        $cash = FinancialAccount::create([
            'type' => 'cash',
            'account_name' => 'Kasir Toko',
            'current_balance' => 1000000,
            'is_active' => true,
        ]);

        Transaction::create([
            'transaction_number' => 'TRX/TEST/001',
            'financial_account_id' => $cash->id,
            'type' => 'income',
            'category' => 'capital_deposit',
            'category_label' => 'Modal',
            'amount' => 1000000,
            'description' => 'Test',
            'status' => 'settled',
        ]);

        $delRes = $this->deleteJson("/api/financial-accounts/{$cash->id}");
        $delRes->assertStatus(422);

        $this->assertDatabaseHas('financial_accounts', ['id' => $cash->id]);
    }

    public function test_can_deposit_capital_directly_to_financial_account(): void
    {
        $bankCoa = ChartOfAccount::where('account_code', '1200')->firstOrFail();
        $account = FinancialAccount::create([
            'type' => 'bank',
            'chart_of_account_id' => $bankCoa->id,
            'account_name' => 'BCA Operasional PT Tusko',
            'bank_name' => 'BCA',
            'account_number' => '8012345678',
            'account_holder' => 'PT Tusko Niaga',
            'opening_balance' => 20000000,
            'current_balance' => 20000000,
            'is_active' => true,
        ]);
        $initialBalance = (float) $account->current_balance;

        $response = $this->postJson("/api/financial-accounts/{$account->id}/deposit-capital", [
            'amount' => 15000000,
            'notes' => 'Injeksi modal ekspansi cabang baru',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.transaction.category', 'capital_deposit')
            ->assertJsonPath('data.transaction.amount', 15000000);

        $this->assertEqualsWithDelta(
            $initialBalance + 15000000,
            (float) $account->fresh()->current_balance,
            0.01
        );

        // Verify journal Debit 1200 (BCA), Kredit 3100 (Modal Pemilik)
        $trxId = $response->json('data.transaction.id');
        $this->assertDatabaseHas('financial_ledger_entries', [
            'transaction_id' => $trxId,
            'debit' => 15000000,
            'credit' => 0,
        ]);
        $this->assertDatabaseHas('financial_ledger_entries', [
            'transaction_id' => $trxId,
            'debit' => 0,
            'credit' => 15000000,
        ]);
    }
}
