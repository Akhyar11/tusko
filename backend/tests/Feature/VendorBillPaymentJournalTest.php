<?php

namespace Tests\Feature;

use App\Models\FinancialLedgerEntry;
use App\Models\Transaction;
use App\Models\User;
use App\Models\Vendor;
use App\Models\VendorBill;
use App\Models\VendorBillPayment;
use Database\Seeders\MasterReferenceSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class VendorBillPaymentJournalTest extends TestCase
{
    use RefreshDatabase;

    public function test_vendor_bill_payment_posts_balanced_journal(): void
    {
        $this->seed(MasterReferenceSeeder::class);

        $admin = User::factory()->create(['role' => 'admin']);

        $vendor = Vendor::create([
            'code' => 'VND/24092026/801',
            'company_name' => 'Vendor Jurnal',
            'contact_person' => 'Kontak',
            'phone' => '0812000000',
            'address' => 'Jl. Jurnal',
        ]);

        $bill = VendorBill::create([
            'bill_number' => 'BILL/JRN/001',
            'vendor_id' => $vendor->id,
            'amount' => 300000,
            'status' => 'unpaid',
            'bill_date' => now()->toDateString(),
            'due_date' => now()->addDays(30)->toDateString(),
        ]);

        $response = $this->actingAs($admin)->post(
            "/api/vendor-bills/{$bill->id}/payments",
            [
                'amount' => 300000,
                'payment_method' => 'transfer',
                'reference_number' => 'TRF-001',
                'proof_file' => UploadedFile::fake()->image('proof.jpg'),
            ],
            ['Accept' => 'application/json']
        );

        $response->assertStatus(201);

        $payment = VendorBillPayment::where('vendor_bill_id', $bill->id)->firstOrFail();

        $container = Transaction::where('reference_type', 'vendor_bill_payment')
            ->where('reference_id', (string) $payment->id)
            ->firstOrFail();

        $entries = FinancialLedgerEntry::with('account')
            ->where('transaction_id', $container->id)
            ->get();

        $this->assertCount(2, $entries);
        $this->assertEqualsWithDelta(300000.0, (float) $entries->sum('debit'), 0.01);
        $this->assertEqualsWithDelta(300000.0, (float) $entries->sum('credit'), 0.01);

        $codes = $entries->pluck('account.account_code')->sort()->values()->all();
        $this->assertSame(['1200', '2100'], $codes);
    }
}
