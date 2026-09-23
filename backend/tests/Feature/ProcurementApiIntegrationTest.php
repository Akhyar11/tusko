<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\PurchaseOrder;
use App\Models\User;
use App\Models\Vendor;
use App\Models\VendorBill;
use App\Models\Warehouse;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ProcurementApiIntegrationTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected Vendor $vendor;
    protected Warehouse $warehouse;
    protected Product $product;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->create(['role' => 'admin']);

        $category = Category::create([
            'name' => 'Sepatu Lari',
            'slug' => 'sepatu-lari',
        ]);

        $this->vendor = Vendor::create([
            'code' => 'VND-API-001',
            'company_name' => 'PT Vendor API Nusantara',
            'contact_person' => 'Andi',
            'phone' => '081200000000',
            'address' => 'Jakarta',
            'payment_terms_days' => 30,
            'is_active' => true,
        ]);

        $this->warehouse = Warehouse::create([
            'code' => 'WH-API-01',
            'name' => 'Gudang API',
            'address' => 'Jl. API No. 1',
            'city' => 'Jakarta',
            'province' => 'DKI Jakarta',
            'postal_code' => '12345',
            'is_primary' => true,
            'is_active' => true,
        ]);

        $this->product = Product::create([
            'category_id' => $category->id,
            'vendor_id' => $this->vendor->id,
            'name' => 'Tusko API Runner',
            'slug' => 'tusko-api-runner',
            'sku' => 'TSK-API-RUN',
            'price' => 300000,
            'cost_price' => 150000,
            'stock' => 0,
        ]);
    }

    public function test_purchase_order_index_returns_transformed_resource(): void
    {
        $po = PurchaseOrder::create([
            'po_number' => 'PO-202609-API-001',
            'vendor_id' => $this->vendor->id,
            'warehouse_id' => $this->warehouse->id,
            'status' => 'approved',
            'total_amount' => 1500000,
            'order_date' => now()->toDateString(),
        ]);

        $po->items()->create([
            'product_id' => $this->product->id,
            'product_variant_id' => null,
            'ordered_quantity' => 10,
            'received_quantity' => 0,
            'unit_price' => 150000,
            'subtotal' => 1500000,
        ]);

        $response = $this->actingAs($this->admin)->getJson('/api/purchase-orders?search=API-001');

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.0.vendor_name', $this->vendor->company_name)
            ->assertJsonPath('data.0.items.0.product_name', $this->product->name)
            ->assertJsonPath('data.0.items.0.sku', $this->product->sku)
            ->assertJsonPath('meta.total', 1);
    }

    public function test_can_create_draft_purchase_order(): void
    {
        $payload = [
            'vendor_id' => $this->vendor->id,
            'warehouse_id' => $this->warehouse->id,
            'status' => 'draft',
            'items' => [
                [
                    'product_id' => $this->product->id,
                    'product_variant_id' => null,
                    'ordered_quantity' => 5,
                    'unit_price' => 150000,
                ],
            ],
        ];

        $response = $this->actingAs($this->admin)->postJson('/api/purchase-orders', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('data.status', 'draft')
            ->assertJsonPath('data.vendor_name', $this->vendor->company_name);

        $this->assertDatabaseHas('purchase_orders', [
            'id' => $response->json('data.id'),
            'status' => 'draft',
        ]);
    }

    public function test_goods_receiving_notes_index_and_vendor_bill_payment_flow(): void
    {
        $po = PurchaseOrder::create([
            'po_number' => 'PO-202609-API-FLOW',
            'vendor_id' => $this->vendor->id,
            'warehouse_id' => $this->warehouse->id,
            'status' => 'approved',
            'total_amount' => 1500000,
            'order_date' => now()->toDateString(),
        ]);

        $item = $po->items()->create([
            'product_id' => $this->product->id,
            'product_variant_id' => null,
            'ordered_quantity' => 10,
            'received_quantity' => 0,
            'unit_price' => 150000,
            'subtotal' => 1500000,
        ]);

        $this->actingAs($this->admin)->post("/api/purchase-orders/{$po->id}/receive", [
            'delivery_order_number' => 'SJ-API-001',
            'accepted_quantities' => [$item->id => 10],
            'invoice_file' => UploadedFile::fake()->image('invoice.jpg'),
        ], ['Accept' => 'application/json'])->assertStatus(200);

        // GRN index
        $grnResponse = $this->actingAs($this->admin)->getJson('/api/goods-receiving-notes');
        $grnResponse->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.0.po_number', 'PO-202609-API-FLOW')
            ->assertJsonPath('data.0.vendor_name', $this->vendor->company_name)
            ->assertJsonPath('data.0.items.0.accepted_quantity', 10);

        // Bills index
        $billResponse = $this->actingAs($this->admin)->getJson('/api/vendor-bills');
        $billResponse->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.0.po_number', 'PO-202609-API-FLOW')
            ->assertJsonPath('data.0.status', 'unpaid');

        $bill = VendorBill::first();
        $this->assertNotNull($bill);

        // Bayar sebagian (cicilan) dengan bukti transfer.
        $partial = $this->actingAs($this->admin)->post("/api/vendor-bills/{$bill->id}/payments", [
            'amount' => 600000,
            'payment_method' => 'Transfer Bank BCA',
            'reference_number' => 'TRF-001',
            'proof_file' => UploadedFile::fake()->image('bukti-1.jpg'),
        ], ['Accept' => 'application/json']);
        $partial->assertStatus(201);
        $bill->refresh();
        $this->assertEquals('partially_paid', $bill->status);
        $this->assertEquals(600000, (float) $bill->paid_amount);

        // Pelunasan sisa.
        $settle = $this->actingAs($this->admin)->post("/api/vendor-bills/{$bill->id}/payments", [
            'amount' => (float) $bill->amount - 600000,
            'payment_method' => 'Transfer Bank BCA',
            'proof_file' => UploadedFile::fake()->image('bukti-2.jpg'),
        ], ['Accept' => 'application/json']);
        $settle->assertStatus(201);

        $bill->refresh();
        $this->assertEquals('paid', $bill->status);
        $this->assertEquals($bill->amount, $bill->paid_amount);

        // Pembayaran tercatat di Buku Kas sebagai pengeluaran.
        $this->assertDatabaseHas('transactions', [
            'type' => 'expense',
            'category' => 'vendor_payment',
            'reference_type' => 'vendor_bill_payment',
        ]);

        // Tidak boleh overpay tagihan yang sudah lunas.
        $this->actingAs($this->admin)->post("/api/vendor-bills/{$bill->id}/payments", [
            'amount' => 1000,
            'payment_method' => 'Tunai',
            'proof_file' => UploadedFile::fake()->image('bukti-3.jpg'),
        ], ['Accept' => 'application/json'])->assertStatus(422);
    }

    public function test_vendor_bill_index_filters_by_status(): void
    {
        VendorBill::create([
            'bill_number' => 'BILL-202609-API-001',
            'vendor_id' => $this->vendor->id,
            'amount' => 1000000,
            'paid_amount' => 0,
            'status' => 'unpaid',
            'bill_date' => now()->toDateString(),
            'due_date' => now()->addDays(30)->toDateString(),
        ]);

        VendorBill::create([
            'bill_number' => 'BILL-202609-API-002',
            'vendor_id' => $this->vendor->id,
            'amount' => 2000000,
            'paid_amount' => 2000000,
            'status' => 'paid',
            'bill_date' => now()->toDateString(),
            'due_date' => now()->addDays(30)->toDateString(),
        ]);

        $response = $this->actingAs($this->admin)->getJson('/api/vendor-bills?status=unpaid');

        $response->assertStatus(200)
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('data.0.bill_number', 'BILL-202609-API-001');
    }

    public function test_receiving_po_with_rejected_damaged_goods_excludes_them_from_stock_and_bill(): void
    {
        $po = PurchaseOrder::create([
            'po_number' => 'PO-202609-API-REJECT',
            'vendor_id' => $this->vendor->id,
            'warehouse_id' => $this->warehouse->id,
            'status' => 'approved',
            'total_amount' => 1500000,
            'order_date' => now()->toDateString(),
        ]);

        $item = $po->items()->create([
            'product_id' => $this->product->id,
            'product_variant_id' => null,
            'ordered_quantity' => 10,
            'received_quantity' => 0,
            'unit_price' => 150000,
            'subtotal' => 1500000,
        ]);

        $response = $this->actingAs($this->admin)->post("/api/purchase-orders/{$po->id}/receive", [
            'delivery_order_number' => 'SJ-API-REJECT-01',
            'notes' => 'Tiga unit rusak saat pengiriman',
            'accepted_quantities' => [$item->id => 7],
            'rejected_quantities' => [$item->id => 3],
            'rejection_reasons' => [$item->id => 'Barang rusak / pecah saat pengiriman'],
            'invoice_file' => UploadedFile::fake()->image('invoice-reject.jpg'),
        ], ['Accept' => 'application/json']);

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.grn.items.0.accepted_quantity', 7)
            ->assertJsonPath('data.grn.items.0.rejected_quantity', 3)
            ->assertJsonPath('data.grn.items.0.rejection_reason', 'Barang rusak / pecah saat pengiriman')
            ->assertJsonPath('data.bill.amount', 7 * 150000);

        // Stok hanya bertambah sebesar yang diterima (7), bukan 10.
        $this->product->refresh();
        $this->assertEquals(7, $this->product->stock);

        // PO menjadi partially_received karena hanya 7 dari 10 unit masuk stok.
        $po->refresh();
        $this->assertEquals('partially_received', $po->status);

        $this->assertDatabaseHas('goods_receiving_items', [
            'grn_id' => $response->json('data.grn.id'),
            'accepted_quantity' => 7,
            'rejected_quantity' => 3,
        ]);

        $this->assertDatabaseHas('stock_mutations', [
            'product_id' => $this->product->id,
            'type' => 'in',
            'quantity' => 7,
        ]);
    }

    public function test_receiving_po_rejects_quantities_exceeding_remaining_order(): void
    {
        $po = PurchaseOrder::create([
            'po_number' => 'PO-202609-API-OVER',
            'vendor_id' => $this->vendor->id,
            'warehouse_id' => $this->warehouse->id,
            'status' => 'approved',
            'total_amount' => 1500000,
            'order_date' => now()->toDateString(),
        ]);

        $item = $po->items()->create([
            'product_id' => $this->product->id,
            'product_variant_id' => null,
            'ordered_quantity' => 10,
            'received_quantity' => 0,
            'unit_price' => 150000,
            'subtotal' => 1500000,
        ]);

        $response = $this->actingAs($this->admin)->post("/api/purchase-orders/{$po->id}/receive", [
            'accepted_quantities' => [$item->id => 8],
            'rejected_quantities' => [$item->id => 5],
            'invoice_file' => UploadedFile::fake()->image('invoice-over.jpg'),
        ], ['Accept' => 'application/json']);

        $response->assertStatus(422)
            ->assertJsonPath('status', 'error');

        // Tidak ada perubahan stok karena transaksi dibatalkan.
        $this->product->refresh();
        $this->assertEquals(0, $this->product->stock);
        $this->assertDatabaseCount('goods_receiving_notes', 0);
    }

    public function test_receiving_po_generates_canonical_delivery_order_number_when_empty(): void
    {
        $po = PurchaseOrder::create([
            'po_number' => 'PO-202609-API-DO',
            'vendor_id' => $this->vendor->id,
            'warehouse_id' => $this->warehouse->id,
            'status' => 'approved',
            'total_amount' => 1500000,
            'order_date' => now()->toDateString(),
        ]);

        $item = $po->items()->create([
            'product_id' => $this->product->id,
            'product_variant_id' => null,
            'ordered_quantity' => 5,
            'received_quantity' => 0,
            'unit_price' => 150000,
            'subtotal' => 750000,
        ]);

        $response = $this->actingAs($this->admin)->post("/api/purchase-orders/{$po->id}/receive", [
            'accepted_quantities' => [$item->id => 5],
            'invoice_file' => UploadedFile::fake()->image('invoice-do.jpg'),
        ], ['Accept' => 'application/json']);

        $response->assertStatus(200);
        $doNumber = (string) $response->json('data.grn.delivery_order_number');
        $this->assertMatchesRegularExpression(
            '/^DO\/' . now()->format('dmY') . '\/\d{3,}$/',
            $doNumber
        );
        $this->assertDatabaseHas('goods_receiving_notes', ['delivery_order_number' => $doNumber]);
    }

    public function test_next_delivery_order_number_endpoint_returns_canonical_format(): void
    {
        $response = $this->actingAs($this->admin)->getJson('/api/goods-receiving-notes/next-number');

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success');

        $this->assertMatchesRegularExpression(
            '/^DO\/' . now()->format('dmY') . '\/\d{3,}$/',
            (string) $response->json('data.delivery_order_number')
        );
    }

    public function test_receiving_requires_invoice_proof_file(): void
    {
        $po = PurchaseOrder::create([
            'po_number' => 'PO-202609-API-NOFILE',
            'vendor_id' => $this->vendor->id,
            'warehouse_id' => $this->warehouse->id,
            'status' => 'approved',
            'total_amount' => 750000,
            'order_date' => now()->toDateString(),
        ]);

        $item = $po->items()->create([
            'product_id' => $this->product->id,
            'product_variant_id' => null,
            'ordered_quantity' => 5,
            'received_quantity' => 0,
            'unit_price' => 150000,
            'subtotal' => 750000,
        ]);

        $response = $this->actingAs($this->admin)->post("/api/purchase-orders/{$po->id}/receive", [
            'accepted_quantities' => [$item->id => 5],
        ], ['Accept' => 'application/json']);

        $response->assertStatus(422)->assertJsonValidationErrors(['invoice_file']);
        $this->assertDatabaseCount('goods_receiving_notes', 0);
        $this->assertDatabaseCount('vendor_bills', 0);
    }

    public function test_receiving_accepts_editable_bill_amount_and_stores_invoice_proof(): void
    {
        Storage::fake(config('filesystems.default', 'public'));

        $po = PurchaseOrder::create([
            'po_number' => 'PO-202609-API-BILLAMT',
            'vendor_id' => $this->vendor->id,
            'warehouse_id' => $this->warehouse->id,
            'status' => 'approved',
            'total_amount' => 1500000,
            'order_date' => now()->toDateString(),
        ]);

        $item = $po->items()->create([
            'product_id' => $this->product->id,
            'product_variant_id' => null,
            'ordered_quantity' => 10,
            'received_quantity' => 0,
            'unit_price' => 150000,
            'subtotal' => 1500000,
        ]);

        // Barang diterima 6, ditolak 4 (hilang), tetapi vendor menagih PENUH 1.500.000.
        $response = $this->actingAs($this->admin)->post("/api/purchase-orders/{$po->id}/receive", [
            'accepted_quantities' => [$item->id => 6],
            'rejected_quantities' => [$item->id => 4],
            'rejection_reasons' => [$item->id => 'Barang hilang di jalan'],
            'bill_amount' => 1500000,
            'invoice_file' => UploadedFile::fake()->image('invoice-full.jpg'),
        ], ['Accept' => 'application/json']);

        $response->assertStatus(200)
            ->assertJsonPath('data.bill.amount', 1500000);

        $bill = VendorBill::where('purchase_order_id', $po->id)->firstOrFail();
        $this->assertEquals(1500000, (float) $bill->amount);
        $this->assertNotNull($bill->invoice_file_path);
        $this->assertEquals('invoice-full.jpg', $bill->invoice_file_name);
        $this->assertMatchesRegularExpression('/^BILL\/' . now()->format('dmY') . '\/\d{3,}$/', $bill->bill_number);
        Storage::disk(config('filesystems.default', 'public'))->assertExists($bill->invoice_file_path);

        // Stok hanya bertambah dari unit diterima.
        $this->product->refresh();
        $this->assertEquals(6, $this->product->stock);
    }

    public function test_vendor_bill_detail_and_void_payment(): void
    {
        $po = PurchaseOrder::create([
            'po_number' => 'PO-202609-API-VOID',
            'vendor_id' => $this->vendor->id,
            'warehouse_id' => $this->warehouse->id,
            'status' => 'approved',
            'total_amount' => 1500000,
            'order_date' => now()->toDateString(),
        ]);

        $item = $po->items()->create([
            'product_id' => $this->product->id,
            'product_variant_id' => null,
            'ordered_quantity' => 10,
            'received_quantity' => 0,
            'unit_price' => 150000,
            'subtotal' => 1500000,
        ]);

        $this->actingAs($this->admin)->post("/api/purchase-orders/{$po->id}/receive", [
            'accepted_quantities' => [$item->id => 10],
            'invoice_file' => UploadedFile::fake()->image('invoice-void.jpg'),
        ], ['Accept' => 'application/json'])->assertStatus(200);

        $bill = VendorBill::where('purchase_order_id', $po->id)->firstOrFail();

        // Detail tagihan memuat rincian item & riwayat pembayaran.
        $detail = $this->actingAs($this->admin)->getJson("/api/vendor-bills/{$bill->id}");
        $detail->assertStatus(200)
            ->assertJsonPath('data.items.0.accepted_quantity', 10)
            ->assertJsonPath('data.has_invoice', true);

        // Catat pembayaran sebagian.
        $pay = $this->actingAs($this->admin)->post("/api/vendor-bills/{$bill->id}/payments", [
            'amount' => 500000,
            'payment_method' => 'Transfer Bank',
            'proof_file' => UploadedFile::fake()->image('pay.jpg'),
        ], ['Accept' => 'application/json']);
        $pay->assertStatus(201);
        $paymentId = $pay->json('data.payment.id');

        $bill->refresh();
        $this->assertEquals('partially_paid', $bill->status);

        // Void pembayaran -> status kembali unpaid & transaksi kas terhapus.
        $this->actingAs($this->admin)->deleteJson("/api/vendor-bills/{$bill->id}/payments/{$paymentId}")
            ->assertStatus(200);

        $bill->refresh();
        $this->assertEquals('unpaid', $bill->status);
        $this->assertEquals(0, (float) $bill->paid_amount);
        $this->assertDatabaseMissing('vendor_bill_payments', ['id' => $paymentId]);
        $this->assertDatabaseMissing('transactions', [
            'reference_type' => 'vendor_bill_payment',
            'reference_id' => $paymentId,
        ]);
    }
}
