<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\FinancialLedgerEntry;
use App\Models\GoodsReceivingNote;
use App\Models\Product;
use App\Models\PurchaseOrder;
use App\Models\Transaction;
use App\Models\User;
use App\Models\Vendor;
use App\Models\Warehouse;
use App\Services\JournalMappingService;
use Database\Seeders\MasterReferenceSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class GoodsReceivingJournalTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private Vendor $vendor;
    private Warehouse $warehouse;
    private Product $product;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(MasterReferenceSeeder::class);

        $this->admin = User::factory()->create(['role' => 'admin']);

        $category = Category::create([
            'name' => 'Journal GRN',
            'slug' => 'journal-grn',
        ]);

        $this->vendor = Vendor::create([
            'code' => 'VND/GRN/001',
            'company_name' => 'Vendor Jurnal GRN',
            'contact_person' => 'Kontak',
            'phone' => '0812000000',
            'address' => 'Jl. Vendor',
            'payment_terms_days' => 30,
            'is_active' => true,
        ]);

        $this->warehouse = Warehouse::create([
            'code' => 'WH/GRN/001',
            'name' => 'Gudang Jurnal GRN',
            'address' => 'Jl. Uji',
            'city' => 'Jakarta',
            'province' => 'DKI Jakarta',
            'is_primary' => true,
            'is_active' => true,
        ]);

        $this->product = Product::create([
            'category_id' => $category->id,
            'vendor_id' => $this->vendor->id,
            'name' => 'Produk Jurnal GRN',
            'slug' => 'produk-jurnal-grn',
            'sku' => 'TSK-GRN-001',
            'price' => 100000,
            'cost_price' => 60000,
            'stock' => 0,
        ]);
    }

    private function createPoWithItem(int $orderedQty = 10, float $unitPrice = 60000): array
    {
        $po = PurchaseOrder::create([
            'po_number' => 'PO/GRN/001',
            'vendor_id' => $this->vendor->id,
            'warehouse_id' => $this->warehouse->id,
            'status' => 'approved',
            'total_amount' => $orderedQty * $unitPrice,
            'order_date' => now()->toDateString(),
        ]);

        $item = $po->items()->create([
            'product_id' => $this->product->id,
            'product_variant_id' => null,
            'ordered_quantity' => $orderedQty,
            'received_quantity' => 0,
            'unit_price' => $unitPrice,
            'subtotal' => $orderedQty * $unitPrice,
        ]);

        return [$po, $item];
    }

    public function test_receive_endpoint_posts_inventory_and_payable_journal(): void
    {
        [$po, $item] = $this->createPoWithItem(10, 60000);

        $response = $this->actingAs($this->admin)->post(
            "/api/purchase-orders/{$po->id}/receive",
            [
                'accepted_quantities' => [$item->id => 10],
                'invoice_file' => UploadedFile::fake()->image('invoice-grn.jpg'),
            ],
            ['Accept' => 'application/json']
        );

        $response->assertStatus(200)->assertJsonPath('status', 'success');

        $grn = GoodsReceivingNote::where('purchase_order_id', $po->id)->firstOrFail();

        $container = Transaction::where('reference_type', 'grn')
            ->where('reference_id', $grn->grn_number)
            ->first();

        $this->assertNotNull($container, 'transaksi kontainer jurnal grn tidak dibuat');

        $entries = FinancialLedgerEntry::with('account')
            ->where('transaction_id', $container->id)
            ->get();

        $this->assertCount(2, $entries);
        $this->assertEqualsWithDelta(600000.0, (float) $entries->sum('debit'), 0.01);
        $this->assertEqualsWithDelta(600000.0, (float) $entries->sum('credit'), 0.01);

        $codes = $entries->pluck('account.account_code')->sort()->values()->all();
        $this->assertSame(['1300', '2100'], $codes);
    }

    public function test_grn_journal_is_idempotent_on_repost(): void
    {
        [$po, $item] = $this->createPoWithItem(4, 25000);

        $this->actingAs($this->admin)->post(
            "/api/purchase-orders/{$po->id}/receive",
            [
                'accepted_quantities' => [$item->id => 4],
                'invoice_file' => UploadedFile::fake()->image('invoice-grn-idem.jpg'),
            ],
            ['Accept' => 'application/json']
        )->assertStatus(200);

        $grn = GoodsReceivingNote::with('items')->where('purchase_order_id', $po->id)->firstOrFail();
        $container = Transaction::where('reference_type', 'grn')
            ->where('reference_id', $grn->grn_number)
            ->firstOrFail();

        $before = FinancialLedgerEntry::where('transaction_id', $container->id)->count();

        app(JournalMappingService::class)->postGoodsReceiving($grn);

        $this->assertSame($before, FinancialLedgerEntry::where('transaction_id', $container->id)->count());
        $this->assertSame(1, Transaction::where('reference_type', 'grn')->where('reference_id', $grn->grn_number)->count());
    }
}
