<?php

namespace Tests\Feature;

use App\Models\Vendor;
use App\Models\VendorBill;
use App\Services\FileStorageService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class PrivateStorageTest extends TestCase
{
    use RefreshDatabase;

    public function test_default_and_private_disks_are_distinct(): void
    {
        $this->assertSame(config('filesystems.default'), FileStorageService::disk());
        $this->assertSame(config('filesystems.private_disk'), FileStorageService::privateDisk());
        $this->assertNotSame(FileStorageService::disk(), FileStorageService::privateDisk());
    }

    public function test_store_private_saves_to_private_disk_only(): void
    {
        $file = UploadedFile::fake()->create('proof.pdf', 10, 'application/pdf');

        $result = FileStorageService::storePrivate($file, 'testing/private');

        $this->assertNotEmpty($result['path']);
        $this->assertSame('private', $result['disk']);
        $this->assertTrue(Storage::disk('private')->exists($result['path']));
        $this->assertFalse(Storage::disk(FileStorageService::disk())->exists($result['path']));

        Storage::disk('private')->delete($result['path']);
    }

    public function test_store_base64_private_does_not_expose_public_url(): void
    {
        $dataUri = 'data:application/pdf;base64,' . base64_encode('%PDF-1.4 dummy');

        $result = FileStorageService::storeBase64Private($dataUri, 'testing/private-b64');

        $this->assertNotEmpty($result['path']);
        $this->assertArrayNotHasKey('url', $result);
        $this->assertTrue(Storage::disk('private')->exists($result['path']));

        Storage::disk('private')->delete($result['path']);
    }

    public function test_temporary_url_returns_signed_url_for_private_file(): void
    {
        $file = UploadedFile::fake()->create('invoice.pdf', 10, 'application/pdf');
        $result = FileStorageService::storePrivate($file, 'testing/private-url');

        $url = FileStorageService::temporaryUrl($result['path']);

        $this->assertNotNull($url);
        $this->assertStringContainsString('signature=', $url);

        $this->assertTrue(FileStorageService::deletePrivate($result['path']));
        $this->assertFalse(Storage::disk('private')->exists($result['path']));
    }

    public function test_vendor_bill_invoice_url_endpoint_returns_temporary_url(): void
    {
        $vendor = Vendor::create([
            'code' => 'VND/24092026/901',
            'company_name' => 'Vendor Storage',
            'contact_person' => 'Kontak',
            'phone' => '0812000000',
            'address' => 'Jl. Storage',
        ]);

        $file = UploadedFile::fake()->create('invoice.pdf', 10, 'application/pdf');
        $stored = FileStorageService::storePrivate($file, 'bills/invoices');

        $bill = VendorBill::create([
            'bill_number' => 'BILL/STORAGE/001',
            'vendor_id' => $vendor->id,
            'amount' => 100000,
            'status' => 'unpaid',
            'bill_date' => now()->toDateString(),
            'due_date' => now()->addDays(30)->toDateString(),
            'invoice_file_path' => $stored['path'],
            'invoice_file_name' => 'invoice.pdf',
            'invoice_file_mime' => 'application/pdf',
        ]);

        $response = $this->getJson("/api/vendor-bills/{$bill->id}/invoice-url");

        $response->assertStatus(200)
            ->assertJsonPath('data.invoice_file_name', 'invoice.pdf');

        $this->assertNotNull($response->json('data.invoice_url'));
        $this->assertStringContainsString('signature=', $response->json('data.invoice_url'));

        Storage::disk('private')->delete($stored['path']);
    }
}
