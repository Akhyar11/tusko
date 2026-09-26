<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Vendor;
use App\Models\VendorBill;
use Database\Seeders\MasterReferenceSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class VendorAgingApiTest extends TestCase
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

    private function vendor(): Vendor
    {
        return Vendor::create([
            'code' => 'VND-TEST-01',
            'company_name' => 'Vendor Uji',
            'contact_person' => 'Budi',
            'email' => 'vendor@example.test',
            'phone' => '081200000000',
            'address' => 'Jl. Uji No. 1',
            'is_active' => true,
        ]);
    }

    private function bill(Vendor $vendor, string $number, Carbon $due, float $amount, float $paid = 0): VendorBill
    {
        return VendorBill::create([
            'bill_number' => $number,
            'vendor_id' => $vendor->id,
            'amount' => $amount,
            'paid_amount' => $paid,
            'status' => $paid <= 0 ? 'unpaid' : 'partially_paid',
            'bill_date' => now()->toDateString(),
            'due_date' => $due->toDateString(),
        ]);
    }

    public function test_vendor_aging_buckets_outstanding_by_due_date(): void
    {
        $this->actingAsAdmin();
        $vendor = $this->vendor();

        $this->bill($vendor, 'BILL-001', now()->addDays(10), 100000);
        $this->bill($vendor, 'BILL-002', now()->subDays(15), 100000);
        $this->bill($vendor, 'BILL-003', now()->subDays(45), 100000);
        $this->bill($vendor, 'BILL-004', now()->subDays(75), 100000);
        $this->bill($vendor, 'BILL-005', now()->subDays(120), 100000);
        // Lunas -> tidak masuk aging.
        $this->bill($vendor, 'BILL-006', now()->subDays(10), 100000, 100000);

        $response = $this->getJson('/api/reports/vendor-aging')->assertStatus(200);

        $this->assertSame(100000.0, (float) $response->json('data.buckets.current'));
        $this->assertSame(100000.0, (float) $response->json('data.buckets.1_30'));
        $this->assertSame(100000.0, (float) $response->json('data.buckets.31_60'));
        $this->assertSame(100000.0, (float) $response->json('data.buckets.61_90'));
        $this->assertSame(100000.0, (float) $response->json('data.buckets.over_90'));
        $this->assertSame(500000.0, (float) $response->json('data.total_outstanding'));
        $this->assertCount(5, $response->json('data.bills'));
        $this->assertSame(500000.0, (float) $response->json('data.by_vendor.0.total_outstanding'));
    }

    public function test_vendor_aging_uses_outstanding_after_partial_payment(): void
    {
        $this->actingAsAdmin();
        $vendor = $this->vendor();
        $this->bill($vendor, 'BILL-P1', now()->subDays(5), 200000, 50000);

        $response = $this->getJson('/api/reports/vendor-aging')->assertStatus(200);

        $this->assertSame(150000.0, (float) $response->json('data.total_outstanding'));
    }

    public function test_non_admin_is_forbidden(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'customer', 'is_active' => true]));
        $this->getJson('/api/reports/vendor-aging')->assertStatus(403);
    }

    public function test_guest_is_unauthorized(): void
    {
        $this->getJson('/api/reports/vendor-aging')->assertStatus(401);
    }
}
