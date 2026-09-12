<?php

namespace Tests\Feature;

use App\Models\Vendor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class VendorApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_list_vendors_and_search(): void
    {
        Vendor::create([
            'code' => 'VND-001',
            'company_name' => 'PT Tekstil Atletik Prima',
            'contact_person' => 'Budi Santoso',
            'phone' => '021-78901234',
            'address' => 'Cikarang',
            'payment_terms_days' => 30,
            'is_active' => true,
        ]);

        Vendor::create([
            'code' => 'VND-002',
            'company_name' => 'CV Langkah Juara Footwear',
            'contact_person' => 'Siti Rahmawati',
            'phone' => '022-66554433',
            'address' => 'Bandung',
            'payment_terms_days' => 45,
            'is_active' => true,
        ]);

        $response = $this->getJson('/api/vendors');
        $response->assertStatus(200);
        $this->assertCount(2, $response->json('data'));

        // Search by company name
        $searchRes = $this->getJson('/api/vendors?search=Langkah');
        $searchRes->assertStatus(200);
        $this->assertCount(1, $searchRes->json('data'));
        $this->assertEquals('CV Langkah Juara Footwear', $searchRes->json('data.0.company_name'));
    }

    public function test_can_create_vendor_with_auto_generated_code(): void
    {
        $payload = [
            'company_name' => 'PT Tusko Material Global',
            'contact_person' => 'Agus Salim',
            'email' => 'agus@tuskomaterial.com',
            'phone' => '081234567890',
            'address' => 'Kawasan Industri Pulogadung Blok B No. 12, Jakarta Timur',
            'payment_terms_days' => 30,
            'bank_account_info' => 'BCA 1234567890 a.n PT Tusko Material Global',
            'is_active' => true,
        ];

        $response = $this->postJson('/api/vendors', $payload);
        $response->assertStatus(201);
        $this->assertEquals('PT Tusko Material Global', $response->json('data.company_name'));
        $this->assertNotEmpty($response->json('data.code'));

        $this->assertDatabaseHas('vendors', [
            'company_name' => 'PT Tusko Material Global',
            'contact_person' => 'Agus Salim',
        ]);
    }

    public function test_cannot_create_vendor_with_duplicate_code(): void
    {
        Vendor::create([
            'code' => 'VND-DUP',
            'company_name' => 'Vendor Pertama',
            'contact_person' => 'Andi',
            'phone' => '0811111111',
            'address' => 'Jakarta',
        ]);

        $payload = [
            'code' => 'VND-DUP',
            'company_name' => 'Vendor Kedua',
            'contact_person' => 'Budi',
            'phone' => '0822222222',
            'address' => 'Surabaya',
        ];

        $response = $this->postJson('/api/vendors', $payload);
        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['code']);
    }

    public function test_can_show_and_update_vendor(): void
    {
        $vendor = Vendor::create([
            'code' => 'VND-UPD',
            'company_name' => 'CV Sumber Rejeki',
            'contact_person' => 'Dedi',
            'phone' => '0833333333',
            'address' => 'Semarang',
            'payment_terms_days' => 14,
            'is_active' => true,
        ]);

        $showRes = $this->getJson("/api/vendors/{$vendor->id}");
        $showRes->assertStatus(200);
        $this->assertEquals('CV Sumber Rejeki', $showRes->json('data.company_name'));

        $updateRes = $this->putJson("/api/vendors/{$vendor->id}", [
            'company_name' => 'CV Sumber Rejeki Abadi',
            'payment_terms_days' => 45,
        ]);
        $updateRes->assertStatus(200);
        $this->assertEquals('CV Sumber Rejeki Abadi', $updateRes->json('data.company_name'));
        $this->assertEquals(45, $updateRes->json('data.payment_terms_days'));
    }

    public function test_can_toggle_vendor_status(): void
    {
        $vendor = Vendor::create([
            'code' => 'VND-TOGGLE',
            'company_name' => 'PT Vendor Mandiri',
            'contact_person' => 'Eko',
            'phone' => '0844444444',
            'address' => 'Solo',
            'is_active' => true,
        ]);

        $res = $this->postJson("/api/vendors/{$vendor->id}/toggle-status");
        $res->assertStatus(200);
        $this->assertFalse($res->json('data.is_active'));
    }

    public function test_can_delete_vendor_without_relations(): void
    {
        $vendor = Vendor::create([
            'code' => 'VND-DEL',
            'company_name' => 'PT Hapus Cepat',
            'contact_person' => 'Fajar',
            'phone' => '0855555555',
            'address' => 'Malang',
            'is_active' => true,
        ]);

        $res = $this->deleteJson("/api/vendors/{$vendor->id}");
        $res->assertStatus(200);

        $this->assertDatabaseMissing('vendors', [
            'id' => $vendor->id,
        ]);
    }
}
