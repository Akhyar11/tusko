<?php

namespace Tests\Feature;

use App\Models\ChartOfAccount;
use App\Models\FinancialLedgerEntry;
use App\Models\Transaction;
use App\Models\User;
use App\Models\Vendor;
use App\Models\VendorBill;
use Database\Seeders\MasterReferenceSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ReportExportCsvTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(MasterReferenceSeeder::class);
        Sanctum::actingAs(User::factory()->create(['role' => 'admin', 'is_active' => true]));
    }

    private function seedLedger(): void
    {
        $transaction = Transaction::create([
            'transaction_number' => 'TRX-EXPORT-001',
            'type' => 'income',
            'category' => 'sales',
            'category_label' => 'Penjualan',
            'amount' => 100000,
            'description' => 'Uji ekspor',
            'status' => 'settled',
        ]);

        $entry = function (string $code, float $debit, float $credit) use ($transaction) {
            FinancialLedgerEntry::create([
                'transaction_id' => $transaction->id,
                'chart_of_account_id' => ChartOfAccount::where('account_code', $code)->value('id'),
                'debit' => $debit,
                'credit' => $credit,
            ]);
        };

        $entry('1100', 100000, 0);
        $entry('4100', 0, 100000);
        $entry('5100', 40000, 0);
        $entry('1300', 0, 40000);
    }

    private function seedVendorBill(): void
    {
        $vendor = Vendor::create([
            'code' => 'VND-EXPORT-01',
            'company_name' => 'Vendor Ekspor',
            'contact_person' => 'Budi',
            'email' => 'vendor@example.test',
            'phone' => '081200000000',
            'address' => 'Jl. Uji No. 1',
            'is_active' => true,
        ]);

        VendorBill::create([
            'bill_number' => 'BILL-EXPORT-001',
            'vendor_id' => $vendor->id,
            'amount' => 100000,
            'paid_amount' => 0,
            'status' => 'unpaid',
            'bill_date' => now()->toDateString(),
            'due_date' => now()->subDays(20)->toDateString(),
        ]);
    }

    public function test_income_statement_csv_export(): void
    {
        $this->seedLedger();

        $response = $this->get('/api/reports/income-statement?format=csv');
        $response->assertStatus(200);
        $this->assertStringContainsString('text/csv', $response->headers->get('content-type'));

        $content = $response->streamedContent();
        $this->assertStringContainsString('Kelompok', $content);
        $this->assertStringContainsString('Laba Bersih', $content);
        $this->assertStringContainsString('60000', $content);
    }

    public function test_trial_balance_csv_export(): void
    {
        $this->seedLedger();

        $response = $this->get('/api/reports/trial-balance?format=csv');
        $response->assertStatus(200);
        $content = $response->streamedContent();
        $this->assertStringContainsString('Nama Akun', $content);
        $this->assertStringContainsString('4100', $content);
    }

    public function test_vendor_aging_csv_export(): void
    {
        $this->seedVendorBill();

        $response = $this->get('/api/reports/vendor-aging?format=csv');
        $response->assertStatus(200);
        $content = $response->streamedContent();
        $this->assertStringContainsString('Nomor Tagihan', $content);
        $this->assertStringContainsString('BILL-EXPORT-001', $content);
        $this->assertStringContainsString('1_30', $content);
    }
}
