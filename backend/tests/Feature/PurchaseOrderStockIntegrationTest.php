<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\GoodsReceivingNote;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\PurchaseOrder;
use App\Models\StockMutation;
use App\Models\User;
use App\Models\Vendor;
use App\Models\VendorBill;
use App\Models\Warehouse;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class PurchaseOrderStockIntegrationTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected Category $category;
    protected Vendor $vendor;
    protected Warehouse $warehouse;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->create([
            'role' => 'admin',
        ]);

        $this->category = Category::create([
            'name' => 'Jersey & Apparel',
            'slug' => 'jersey-apparel',
        ]);

        $this->vendor = Vendor::create([
            'code' => 'VND-APL-001',
            'company_name' => 'PT Tekstil Atletik Nusantara',
            'contact_person' => 'Budi Santoso',
            'phone' => '08123456789',
            'address' => 'Bandung, Jawa Barat',
            'payment_terms_days' => 30,
            'is_active' => true,
        ]);

        $this->warehouse = Warehouse::create([
            'code' => 'WH-TEST-01',
            'name' => 'Gudang Pusat Tusko',
            'address' => 'Jl. TB Simatupang No. 88',
            'city' => 'Jakarta Selatan',
            'province' => 'DKI Jakarta',
            'postal_code' => '12430',
            'is_primary' => true,
            'is_active' => true,
        ]);
    }

    public function test_can_create_purchase_order_with_variant_and_single_sku_items(): void
    {
        // 1. Create Product with Variants
        $productWithVariants = Product::create([
            'category_id' => $this->category->id,
            'vendor_id' => $this->vendor->id,
            'name' => 'Tusko Race Singlet Pro',
            'slug' => 'tusko-race-singlet-pro',
            'sku' => 'TSK-SGL-PRO',
            'price' => 250000,
            'cost_price' => 120000,
            'stock' => 0,
        ]);

        $variantS = ProductVariant::create([
            'product_id' => $productWithVariants->id,
            'sku' => 'TSK-SGL-PRO-S',
            'variant_name' => 'Ukuran S',
            'price' => 250000,
            'current_cogs' => 120000,
            'stock' => 0,
            'is_active' => true,
        ]);

        $variantM = ProductVariant::create([
            'product_id' => $productWithVariants->id,
            'sku' => 'TSK-SGL-PRO-M',
            'variant_name' => 'Ukuran M',
            'price' => 250000,
            'current_cogs' => 120000,
            'stock' => 0,
            'is_active' => true,
        ]);

        // 2. Create Single-SKU Product (Self-Variant)
        $singleSkuProduct = Product::create([
            'category_id' => $this->category->id,
            'vendor_id' => $this->vendor->id,
            'name' => 'Tusko Running Cap Aero',
            'slug' => 'tusko-running-cap-aero',
            'sku' => 'TSK-CAP-AERO',
            'price' => 150000,
            'cost_price' => 70000,
            'stock' => 0,
        ]);

        $poPayload = [
            'vendor_id' => $this->vendor->id,
            'warehouse_id' => $this->warehouse->id,
            'expected_delivery_date' => now()->addDays(7)->toDateString(),
            'notes' => 'Pengadaan stok batch awal kompetisi',
            'items' => [
                [
                    'product_id' => $productWithVariants->id,
                    'product_variant_id' => $variantS->id,
                    'ordered_quantity' => 20,
                    'unit_price' => 110000,
                ],
                [
                    'product_id' => $productWithVariants->id,
                    'product_variant_id' => $variantM->id,
                    'ordered_quantity' => 30,
                    'unit_price' => 110000,
                ],
                [
                    'product_id' => $singleSkuProduct->id,
                    'product_variant_id' => null, // Self-variant
                    'ordered_quantity' => 50,
                    'unit_price' => 65000,
                ],
            ],
        ];

        $response = $this->actingAs($this->admin)->postJson('/api/purchase-orders', $poPayload);

        $response->assertStatus(201)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.vendor_id', $this->vendor->id);

        $poId = $response->json('data.id');
        $this->assertDatabaseHas('purchase_orders', [
            'id' => $poId,
            'vendor_id' => $this->vendor->id,
            'status' => 'approved',
            'total_amount' => (20 * 110000) + (30 * 110000) + (50 * 65000), // 2.2M + 3.3M + 3.25M = 8.75M
        ]);

        $this->assertDatabaseCount('purchase_order_items', 3);
    }

    public function test_receiving_po_updates_variant_stocks_and_parent_product_total(): void
    {
        $productWithVariants = Product::create([
            'category_id' => $this->category->id,
            'vendor_id' => $this->vendor->id,
            'name' => 'Tusko Race Singlet Pro',
            'slug' => 'tusko-race-singlet-pro',
            'sku' => 'TSK-SGL-PRO',
            'price' => 250000,
            'cost_price' => 120000,
            'stock' => 0,
        ]);

        $variantS = ProductVariant::create([
            'product_id' => $productWithVariants->id,
            'sku' => 'TSK-SGL-PRO-S',
            'variant_name' => 'Ukuran S',
            'price' => 250000,
            'stock' => 0,
            'is_active' => true,
        ]);

        $variantM = ProductVariant::create([
            'product_id' => $productWithVariants->id,
            'sku' => 'TSK-SGL-PRO-M',
            'variant_name' => 'Ukuran M',
            'price' => 250000,
            'stock' => 0,
            'is_active' => true,
        ]);

        $singleProduct = Product::create([
            'category_id' => $this->category->id,
            'vendor_id' => $this->vendor->id,
            'name' => 'Tusko Running Cap Aero',
            'slug' => 'tusko-running-cap-aero',
            'sku' => 'TSK-CAP-AERO',
            'price' => 150000,
            'cost_price' => 70000,
            'stock' => 0,
        ]);

        $po = PurchaseOrder::create([
            'po_number' => 'PO-202609-TEST-RECV',
            'vendor_id' => $this->vendor->id,
            'warehouse_id' => $this->warehouse->id,
            'status' => 'approved',
            'total_amount' => 8750000,
            'order_date' => now()->toDateString(),
        ]);

        $poItem1 = $po->items()->create([
            'product_id' => $productWithVariants->id,
            'product_variant_id' => $variantS->id,
            'ordered_quantity' => 20,
            'received_quantity' => 0,
            'unit_price' => 110000,
            'subtotal' => 2200000,
        ]);

        $poItem2 = $po->items()->create([
            'product_id' => $productWithVariants->id,
            'product_variant_id' => $variantM->id,
            'ordered_quantity' => 30,
            'received_quantity' => 0,
            'unit_price' => 110000,
            'subtotal' => 3300000,
        ]);

        $poItem3 = $po->items()->create([
            'product_id' => $singleProduct->id,
            'product_variant_id' => null, // Self-variant
            'ordered_quantity' => 50,
            'received_quantity' => 0,
            'unit_price' => 65000,
            'subtotal' => 3250000,
        ]);

        $receivePayload = [
            'delivery_order_number' => 'SJ-VENDOR-2026-99',
            'notes' => 'Penerimaan lengkap kondisi prima',
            'accepted_quantities' => [
                $poItem1->id => 20,
                $poItem2->id => 30,
                $poItem3->id => 50,
            ],
        ];

        $response = $this->actingAs($this->admin)->post(
            "/api/purchase-orders/{$po->id}/receive",
            array_merge($receivePayload, ['invoice_file' => UploadedFile::fake()->image('invoice.jpg')]),
            ['Accept' => 'application/json']
        );

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success');

        // Verify Variant Stocks
        $variantS->refresh();
        $this->assertEquals(20, $variantS->stock);

        $variantM->refresh();
        $this->assertEquals(30, $variantM->stock);

        // Verify Parent Product Total Stock was synchronized
        $productWithVariants->refresh();
        $this->assertEquals(50, $productWithVariants->stock); // 20 + 30

        // Verify Single-SKU Product Stock
        $singleProduct->refresh();
        $this->assertEquals(50, $singleProduct->stock);

        // Verify Stock Mutations
        $this->assertDatabaseHas('stock_mutations', [
            'product_id' => $productWithVariants->id,
            'type' => 'in',
            'quantity' => 20,
            'reference_id' => 'PO-202609-TEST-RECV',
        ]);

        $this->assertDatabaseHas('stock_mutations', [
            'product_id' => $singleProduct->id,
            'type' => 'in',
            'quantity' => 50,
            'reference_id' => 'PO-202609-TEST-RECV',
        ]);

        // Verify GRN and Bill created
        $this->assertDatabaseHas('goods_receiving_notes', [
            'purchase_order_id' => $po->id,
            'delivery_order_number' => 'SJ-VENDOR-2026-99',
        ]);

        $this->assertDatabaseHas('vendor_bills', [
            'purchase_order_id' => $po->id,
            'vendor_id' => $this->vendor->id,
            'amount' => 8750000,
            'status' => 'unpaid',
        ]);

        // Verify PO Status is 'received'
        $po->refresh();
        $this->assertEquals('received', $po->status);
    }

    public function test_can_cancel_approved_purchase_order(): void
    {
        $po = PurchaseOrder::create([
            'po_number' => 'PO-202609-TEST-CANCEL',
            'vendor_id' => $this->vendor->id,
            'warehouse_id' => $this->warehouse->id,
            'status' => 'approved',
            'total_amount' => 1000000,
            'order_date' => now()->toDateString(),
        ]);

        $response = $this->actingAs($this->admin)->postJson("/api/purchase-orders/{$po->id}/cancel");

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.status', 'cancelled');

        $po->refresh();
        $this->assertEquals('cancelled', $po->status);
    }

    public function test_can_approve_draft_purchase_order(): void
    {
        $po = PurchaseOrder::create([
            'po_number' => 'PO-202609-TEST-APPROVE',
            'vendor_id' => $this->vendor->id,
            'warehouse_id' => $this->warehouse->id,
            'status' => 'draft',
            'total_amount' => 2500000,
            'order_date' => now()->toDateString(),
        ]);

        $response = $this->actingAs($this->admin)->postJson("/api/purchase-orders/{$po->id}/approve");

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.status', 'approved');

        $po->refresh();
        $this->assertEquals('approved', $po->status);
        $this->assertEquals($this->admin->id, $po->approved_by);
    }

    public function test_cannot_approve_already_approved_purchase_order(): void
    {
        $po = PurchaseOrder::create([
            'po_number' => 'PO-202609-TEST-ALREADY',
            'vendor_id' => $this->vendor->id,
            'warehouse_id' => $this->warehouse->id,
            'status' => 'approved',
            'total_amount' => 1500000,
            'order_date' => now()->toDateString(),
        ]);

        $response = $this->actingAs($this->admin)->postJson("/api/purchase-orders/{$po->id}/approve");

        $response->assertStatus(422)
            ->assertJsonPath('status', 'error');
    }

    public function test_receiving_writes_authoritative_inventory_balance(): void
    {
        $product = Product::create([
            'category_id' => $this->category->id,
            'vendor_id' => $this->vendor->id,
            'name' => 'Tusko Training Tee',
            'slug' => 'tusko-training-tee',
            'sku' => 'TSK-TEE-BAL',
            'price' => 120000,
            'cost_price' => 60000,
            'stock' => 5,
        ]);

        $po = PurchaseOrder::create([
            'po_number' => 'PO-202609-TEST-BAL',
            'vendor_id' => $this->vendor->id,
            'warehouse_id' => $this->warehouse->id,
            'status' => 'approved',
            'total_amount' => 600000,
            'order_date' => now()->toDateString(),
        ]);

        $item = $po->items()->create([
            'product_id' => $product->id,
            'product_variant_id' => null,
            'ordered_quantity' => 10,
            'received_quantity' => 0,
            'unit_price' => 60000,
            'subtotal' => 600000,
        ]);

        $response = $this->actingAs($this->admin)->post(
            "/api/purchase-orders/{$po->id}/receive",
            [
                'accepted_quantities' => [$item->id => 10],
                'invoice_file' => UploadedFile::fake()->image('invoice-bal.jpg'),
            ],
            ['Accept' => 'application/json']
        );

        $response->assertStatus(200);

        // D1: saldo otoritatif di inventory_balances (stok legacy 5 + terima 10).
        $this->assertDatabaseHas('inventory_balances', [
            'warehouse_id' => $this->warehouse->id,
            'product_id' => $product->id,
            'product_variant_id' => null,
            'on_hand_stock' => 15,
            'available_stock' => 15,
        ]);

        $this->assertEquals(15, (int) $product->fresh()->stock);

        $this->assertDatabaseHas('stock_mutations', [
            'product_id' => $product->id,
            'warehouse_id' => $this->warehouse->id,
            'type' => 'in',
            'quantity' => 10,
            'reference_type' => 'purchase_order',
            'reference_id' => $po->po_number,
        ]);
    }
}
