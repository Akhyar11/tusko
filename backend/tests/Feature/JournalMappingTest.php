<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\FinancialLedgerEntry;
use App\Models\GoodsReceivingItem;
use App\Models\GoodsReceivingNote;
use App\Models\Order;
use App\Models\Product;
use App\Models\PurchaseOrder;
use App\Models\StockOpname;
use App\Models\StockOpnameItem;
use App\Models\Transaction;
use App\Models\Vendor;
use App\Models\VendorBill;
use App\Models\VendorBillPayment;
use App\Models\Warehouse;
use App\Services\JournalMappingService;
use Database\Seeders\MasterReferenceSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Collection;
use Tests\TestCase;

class JournalMappingTest extends TestCase
{
    use RefreshDatabase;

    private function service(): JournalMappingService
    {
        return app(JournalMappingService::class);
    }

    private function entries(string $referenceType, string $referenceId): Collection
    {
        $transaction = Transaction::where('reference_type', $referenceType)
            ->where('reference_id', (string) $referenceId)
            ->firstOrFail();

        return FinancialLedgerEntry::with('account')
            ->where('transaction_id', $transaction->id)
            ->get();
    }

    private function assertBalanced(Collection $entries, float $amount, array $expectedCodes): void
    {
        $this->assertCount(2, $entries);
        $this->assertEqualsWithDelta($amount, (float) $entries->sum('debit'), 0.01);
        $this->assertEqualsWithDelta($amount, (float) $entries->sum('credit'), 0.01);

        $codes = $entries->pluck('account.account_code')->sort()->values()->all();
        sort($expectedCodes);
        $this->assertSame($expectedCodes, $codes);
    }

    private function createWarehouse(string $code): Warehouse
    {
        return Warehouse::create([
            'code' => $code,
            'name' => 'Gudang ' . $code,
            'address' => 'Jl. Uji',
            'city' => 'Jakarta',
            'province' => 'DKI Jakarta',
            'is_primary' => true,
            'is_active' => true,
        ]);
    }

    private function createProduct(float $costPrice = 5000): Product
    {
        static $sequence = 0;
        $sequence++;

        $category = Category::create([
            'name' => 'Mapping ' . $sequence,
            'slug' => 'mapping-' . $sequence . '-' . uniqid(),
        ]);

        return Product::create([
            'category_id' => $category->id,
            'name' => 'Produk Mapping ' . $sequence,
            'slug' => 'produk-mapping-' . $sequence . '-' . uniqid(),
            'sku' => 'TSK-MAP-' . $sequence,
            'price' => 20000,
            'cost_price' => $costPrice,
            'stock' => 10,
        ]);
    }

    private function createOrder(float $grandTotal = 100000, string $method = 'midtrans'): Order
    {
        return Order::factory()->create([
            'grand_total' => $grandTotal,
            'payment_method' => $method,
            'payment_status' => 'pending',
        ]);
    }

    public function test_order_paid_maps_revenue_journal_and_is_idempotent(): void
    {
        $this->seed(MasterReferenceSeeder::class);
        $order = $this->createOrder(100000, 'midtrans');

        $this->service()->postOrderPaid($order);
        $this->service()->postOrderPaid($order);

        $this->assertBalanced(
            $this->entries('order_payment', $order->order_number),
            100000.0,
            ['1200', '4100']
        );
    }

    public function test_payment_gateway_fee_maps_expense_journal(): void
    {
        $this->seed(MasterReferenceSeeder::class);
        $order = $this->createOrder(100000, 'midtrans');

        $this->service()->postPaymentGatewayFee($order, 2500);

        $this->assertBalanced(
            $this->entries('order_gateway_fee', $order->order_number),
            2500.0,
            ['1200', '6200']
        );
    }

    public function test_goods_receiving_maps_inventory_and_payable_journal(): void
    {
        $this->seed(MasterReferenceSeeder::class);
        $warehouse = $this->createWarehouse('GDG-MAP-GRN');
        $product = $this->createProduct();
        $vendor = $this->createVendor();

        $po = PurchaseOrder::create([
            'po_number' => 'PO/MAP/001',
            'vendor_id' => $vendor->id,
            'warehouse_id' => $warehouse->id,
            'status' => 'approved',
            'order_date' => now()->toDateString(),
            'total_amount' => 50000,
        ]);

        $grn = GoodsReceivingNote::create([
            'grn_number' => 'GRN/MAP/001',
            'purchase_order_id' => $po->id,
            'warehouse_id' => $warehouse->id,
            'received_date' => now()->toDateString(),
            'status' => 'verified',
        ]);

        GoodsReceivingItem::create([
            'grn_id' => $grn->id,
            'product_id' => $product->id,
            'accepted_quantity' => 10,
            'unit_cost' => 5000,
        ]);

        $this->service()->postGoodsReceiving($grn->fresh('items'));

        $this->assertBalanced(
            $this->entries('grn', $grn->grn_number),
            50000.0,
            ['1300', '2100']
        );
    }

    public function test_vendor_bill_payment_maps_payable_journal(): void
    {
        $this->seed(MasterReferenceSeeder::class);
        $vendor = $this->createVendor();

        $bill = VendorBill::create([
            'bill_number' => 'BILL/MAP/001',
            'vendor_id' => $vendor->id,
            'amount' => 30000,
            'status' => 'unpaid',
            'bill_date' => now()->toDateString(),
            'due_date' => now()->addDays(30)->toDateString(),
        ]);

        $payment = VendorBillPayment::create([
            'vendor_bill_id' => $bill->id,
            'amount' => 30000,
            'payment_method' => 'transfer',
            'paid_at' => now()->toDateString(),
        ]);

        $this->service()->postVendorBillPayment($payment);

        $this->assertBalanced(
            $this->entries('vendor_bill_payment', (string) $payment->id),
            30000.0,
            ['1200', '2100']
        );
    }

    public function test_refund_maps_revenue_reversal_journal(): void
    {
        $this->seed(MasterReferenceSeeder::class);
        $order = $this->createOrder(100000, 'midtrans');

        $this->service()->postRefund($order, 40000);

        $this->assertBalanced(
            $this->entries('refund', $order->order_number),
            40000.0,
            ['1200', '4100']
        );
    }

    public function test_stock_opname_maps_inventory_adjustment_journal(): void
    {
        $this->seed(MasterReferenceSeeder::class);
        $warehouse = $this->createWarehouse('GDG-MAP-SO');
        $product = $this->createProduct(10000);

        $opname = StockOpname::create([
            'opname_number' => 'SO/MAP/001',
            'warehouse_id' => $warehouse->id,
            'status' => 'approved',
        ]);

        StockOpnameItem::create([
            'stock_opname_id' => $opname->id,
            'product_id' => $product->id,
            'system_stock' => 10,
            'physical_stock' => 15,
            'difference' => 5,
        ]);

        $this->service()->postStockOpname($opname->fresh('items'));

        // Selisih lebih: Debit Persediaan, Kredit HPP (5 x 10.000 = 50.000)
        $this->assertBalanced(
            $this->entries('stock_opname', $opname->opname_number),
            50000.0,
            ['1300', '5100']
        );
    }

    private function createVendor(): Vendor
    {
        static $sequence = 0;
        $sequence++;

        return Vendor::create([
            'code' => 'VND/MAP/' . str_pad((string) $sequence, 3, '0', STR_PAD_LEFT),
            'company_name' => 'Vendor Mapping ' . $sequence,
            'contact_person' => 'Kontak ' . $sequence,
            'phone' => '0812000000',
            'address' => 'Jl. Vendor',
        ]);
    }
}
