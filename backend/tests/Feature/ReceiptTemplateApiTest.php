<?php

namespace Tests\Feature;

use App\Models\ReceiptTemplate;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReceiptTemplateApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_get_active_receipt_template(): void
    {
        $response = $this->getJson('/api/templates/receipt');

        $response->assertStatus(200)
            ->assertJsonPath('data.paper_size', '100x150')
            ->assertJsonPath('data.barcode_type', 'code128')
            ->assertJsonPath('data.sender_name', 'Tusko Official Store (Fulfillment Hub)')
            ->assertJsonPath('data.show_items_list', true);

        $this->assertDatabaseHas('receipt_templates', [
            'paper_size' => '100x150',
            'is_default' => true,
        ]);
    }

    public function test_can_update_receipt_template_with_camel_case_keys(): void
    {
        $payload = [
            'paperSize' => '100x100',
            'barcodeType' => 'qrcode',
            'barcodeHeight' => 'large',
            'showItemsList' => false,
            'senderName' => 'Gudang Pusat Surabaya',
            'footerNote' => 'Paket berisi barang mudah pecah, buka di depan kurir.',
        ];

        $response = $this->postJson('/api/templates/receipt', $payload);

        $response->assertStatus(200)
            ->assertJsonPath('message', 'Pengaturan template resi pengiriman berhasil disimpan.')
            ->assertJsonPath('data.paper_size', '100x100')
            ->assertJsonPath('data.barcode_type', 'qrcode')
            ->assertJsonPath('data.barcode_height', 'large')
            ->assertJsonPath('data.show_items_list', false)
            ->assertJsonPath('data.sender_name', 'Gudang Pusat Surabaya');

        $this->assertDatabaseHas('receipt_templates', [
            'paper_size' => '100x100',
            'barcode_type' => 'qrcode',
            'sender_name' => 'Gudang Pusat Surabaya',
        ]);
    }

    public function test_can_reset_receipt_template_to_default(): void
    {
        // First modify the template
        $template = ReceiptTemplate::getActiveTemplate();
        $template->update([
            'paper_size' => 'a4',
            'barcode_type' => 'dual',
            'sender_name' => 'Custom Hub',
        ]);

        $this->assertDatabaseHas('receipt_templates', [
            'paper_size' => 'a4',
        ]);

        // Trigger reset
        $response = $this->postJson('/api/templates/receipt/reset');

        $response->assertStatus(200)
            ->assertJsonPath('data.paper_size', '100x150')
            ->assertJsonPath('data.barcode_type', 'code128')
            ->assertJsonPath('data.sender_name', 'Tusko Official Store (Fulfillment Hub)');

        $this->assertDatabaseHas('receipt_templates', [
            'paper_size' => '100x150',
        ]);
    }
}
