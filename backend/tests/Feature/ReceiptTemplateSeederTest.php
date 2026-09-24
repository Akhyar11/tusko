<?php

namespace Tests\Feature;

use Database\Seeders\ReceiptTemplateSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReceiptTemplateSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_receipt_template_seeder_creates_single_default_template(): void
    {
        $this->seed(ReceiptTemplateSeeder::class);

        $this->assertDatabaseCount('receipt_templates', 1);
        $this->assertDatabaseHas('receipt_templates', [
            'name' => 'Thermal Label Standard (100x150mm)',
            'paper_size' => '100x150',
            'barcode_type' => 'code128',
            'is_default' => true,
            'show_items_list' => true,
            'show_sorting_code' => true,
        ]);
    }

    public function test_receipt_template_seeder_is_idempotent(): void
    {
        $this->seed(ReceiptTemplateSeeder::class);
        $this->seed(ReceiptTemplateSeeder::class);

        $this->assertDatabaseCount('receipt_templates', 1);
    }
}
