<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Vendor;
use App\Models\VendorBill;
use App\Models\VendorBillPayment;
use App\Services\FileStorageService;
use App\Services\Settings\SettingsService;
use App\Services\StorageConfigService;
use Database\Seeders\MasterReferenceSeeder;
use Database\Seeders\MenuSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class DynamicStorageSettingsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(MasterReferenceSeeder::class);
        $this->seed(MenuSeeder::class);
    }

    private function admin(): User
    {
        return User::factory()->create(['role' => 'admin', 'is_active' => true]);
    }

    public function test_storage_registry_metadata_contains_all_r2_fields(): void
    {
        Sanctum::actingAs($this->admin());

        $res = $this->getJson('/api/admin/settings/storage');
        $res->assertStatus(200);

        $keys = array_column($res->json('data.fields'), 'key');
        $this->assertContains('storage.disk', $keys);
        $this->assertContains('storage.endpoint', $keys);
        $this->assertContains('storage.key', $keys);
        $this->assertContains('storage.secret', $keys);
        $this->assertContains('storage.region', $keys);
        $this->assertContains('storage.public_bucket', $keys);
        $this->assertContains('storage.private_bucket', $keys);
        $this->assertContains('storage.base_url', $keys);
        $this->assertContains('storage.use_path_style_endpoint', $keys);
    }

    public function test_storage_config_service_applies_settings_dynamically(): void
    {
        app(SettingsService::class)->setGroup('storage', [
            'storage.disk' => 's3',
            'storage.endpoint' => 'https://custom-endpoint.r2.test',
            'storage.key' => 'CUSTOM_KEY',
            'storage.secret' => 'CUSTOM_SECRET',
            'storage.region' => 'auto',
            'storage.public_bucket' => 'custom-public-bucket',
            'storage.private_bucket' => 'custom-private-bucket',
            'storage.base_url' => 'https://cdn.custom.test',
            'storage.use_path_style_endpoint' => true,
        ]);

        $this->assertSame('s3', config('filesystems.default'));
        $this->assertSame('s3_private', config('filesystems.private_disk'));
        $this->assertSame('CUSTOM_KEY', config('filesystems.disks.s3.key'));
        $this->assertSame('CUSTOM_SECRET', config('filesystems.disks.s3.secret'));
        $this->assertSame('custom-public-bucket', config('filesystems.disks.s3.bucket'));
        $this->assertSame('https://cdn.custom.test', config('filesystems.disks.s3.url'));
        $this->assertSame('https://custom-endpoint.r2.test', config('filesystems.disks.s3.endpoint'));
        $this->assertTrue(config('filesystems.disks.s3.use_path_style_endpoint'));

        $this->assertSame('custom-private-bucket', config('filesystems.disks.s3_private.bucket'));
        $this->assertSame('s3', FileStorageService::disk());
        $this->assertSame('s3_private', FileStorageService::privateDisk());
    }

    public function test_storage_secret_is_masked_and_not_overwritten_by_mask(): void
    {
        Sanctum::actingAs($this->admin());

        $this->putJson('/api/admin/settings/storage', [
            'storage.key' => 'INITIAL_KEY',
            'storage.secret' => 'MY_SUPER_SECRET',
        ])->assertStatus(200);

        $getRes = $this->getJson('/api/admin/settings/storage');
        $getRes->assertStatus(200);
        $this->assertSame('********', $getRes->json('data.values')['storage.secret']);

        // Update other field while sending mask as secret
        $this->putJson('/api/admin/settings/storage', [
            'storage.key' => 'UPDATED_KEY',
            'storage.secret' => '********',
        ])->assertStatus(200);

        // Secret should remain intact in service
        $all = app(SettingsService::class)->all('storage');
        $this->assertSame('MY_SUPER_SECRET', $all['storage.secret']);
        $this->assertSame('UPDATED_KEY', $all['storage.key']);
    }

    public function test_vendor_bill_and_payment_resource_return_temporary_urls(): void
    {
        Sanctum::actingAs($this->admin());

        $vendor = Vendor::create([
            'code' => 'VND/001',
            'company_name' => 'PT Vendor R2',
            'contact_person' => 'Budi',
            'phone' => '08123456789',
            'address' => 'Jakarta',
        ]);

        $file = UploadedFile::fake()->create('invoice.pdf', 50, 'application/pdf');
        $storedInvoice = FileStorageService::storePrivate($file, 'bills/invoices');

        $bill = VendorBill::create([
            'bill_number' => 'BILL/TEST/001',
            'vendor_id' => $vendor->id,
            'amount' => 1000000,
            'paid_amount' => 0,
            'status' => 'unpaid',
            'bill_date' => now()->toDateString(),
            'due_date' => now()->addDays(30)->toDateString(),
            'invoice_file_path' => $storedInvoice['path'],
            'invoice_file_name' => 'invoice.pdf',
            'invoice_file_mime' => 'application/pdf',
        ]);

        $proofFile = UploadedFile::fake()->create('proof.pdf', 30, 'application/pdf');
        $storedProof = FileStorageService::storePrivate($proofFile, 'bills/payments');

        $payment = VendorBillPayment::create([
            'vendor_bill_id' => $bill->id,
            'amount' => 1000000,
            'payment_method' => 'Transfer BCA',
            'paid_at' => now()->toDateString(),
            'proof_file_path' => $storedProof['path'],
            'proof_file_name' => 'proof.pdf',
            'proof_file_mime' => 'application/pdf',
        ]);

        $res = $this->getJson("/api/vendor-bills/{$bill->id}");
        $res->assertStatus(200);

        $invoiceUrl = $res->json('data.invoice_file_url');
        $this->assertNotNull($invoiceUrl);

        $payments = $res->json('data.payments');
        $this->assertNotEmpty($payments);
        $this->assertNotNull($payments[0]['proof_file_url']);
    }
}
