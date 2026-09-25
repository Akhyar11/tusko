<?php

namespace Tests\Feature;

use App\Models\ChartOfAccount;
use App\Models\FinancialLedgerEntry;
use App\Models\Transaction;
use App\Models\User;
use Database\Seeders\MasterReferenceSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class FinancialReportApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(MasterReferenceSeeder::class);
    }

    private function actingAsAdmin(): User
    {
        $admin = User::factory()->create(['role' => 'admin', 'is_active' => true]);
        Sanctum::actingAs($admin);

        return $admin;
    }

    private function seedLedger(): void
    {
        $transaction = Transaction::create([
            'transaction_number' => 'TRX-TEST-001',
            'type' => 'income',
            'category' => 'sales',
            'category_label' => 'Penjualan',
            'amount' => 100000,
            'description' => 'Penjualan uji laporan',
            'status' => 'settled',
        ]);

        $entry = function (string $code, float $debit, float $credit) use ($transaction) {
            $account = ChartOfAccount::where('account_code', $code)->firstOrFail();
            FinancialLedgerEntry::create([
                'transaction_id' => $transaction->id,
                'chart_of_account_id' => $account->id,
                'debit' => $debit,
                'credit' => $credit,
            ]);
        };

        // Seimbang: Kas +100k (D), Pendapatan 100k (K); HPP 40k (D), Persediaan 40k (K).
        $entry('1100', 100000, 0);
        $entry('4100', 0, 100000);
        $entry('5100', 40000, 0);
        $entry('1300', 0, 40000);
    }

    public function test_trial_balance_returns_per_account_balances(): void
    {
        $this->actingAsAdmin();
        $this->seedLedger();

        $response = $this->getJson('/api/reports/trial-balance')->assertStatus(200);

        $lines = collect($response->json('data'));
        $revenue = $lines->firstWhere('account_code', '4100');
        $expense = $lines->firstWhere('account_code', '5100');

        $this->assertSame(-100000.0, (float) $revenue['balance']);
        $this->assertSame(40000.0, (float) $expense['balance']);
        $this->assertSame(140000.0, (float) $response->json('summary.total_debit'));
        $this->assertSame(140000.0, (float) $response->json('summary.total_credit'));
    }

    public function test_income_statement_computes_net_income(): void
    {
        $this->actingAsAdmin();
        $this->seedLedger();

        $response = $this->getJson('/api/reports/income-statement')->assertStatus(200);

        $this->assertSame(100000.0, (float) $response->json('data.total_revenue'));
        $this->assertSame(40000.0, (float) $response->json('data.total_expense'));
        $this->assertSame(60000.0, (float) $response->json('data.net_income'));
    }

    public function test_non_admin_is_forbidden(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'customer', 'is_active' => true]));

        $this->getJson('/api/reports/trial-balance')->assertStatus(403);
        $this->getJson('/api/reports/income-statement')->assertStatus(403);
    }

    public function test_guest_is_unauthorized(): void
    {
        $this->getJson('/api/reports/trial-balance')->assertStatus(401);
    }
}
