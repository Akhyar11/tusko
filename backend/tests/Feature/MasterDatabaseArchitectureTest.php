<?php

namespace Tests\Feature;

use App\Models\Attribute;
use App\Models\AttributeValue;
use App\Models\ChartOfAccount;
use App\Models\CogsHistory;
use App\Models\Expedition;
use App\Models\ExpeditionService;
use App\Models\FinancialAccount;
use App\Models\GoodsReceivingNote;
use App\Models\InventoryBalance;
use App\Models\LoyaltyPointsLedger;
use App\Models\Order;
use App\Models\OrderStatus;
use App\Models\PaymentStatus;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\PurchaseOrder;
use App\Models\Role;
use App\Models\Shipment;
use App\Models\StockReservation;
use App\Models\User;
use App\Models\Vendor;
use App\Models\Warehouse;
use App\Models\WarehouseBin;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MasterDatabaseArchitectureTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
    }

    public function test_dynamic_roles_and_permissions_are_seeded(): void
    {
        $this->assertDatabaseHas('roles', ['name' => 'admin']);
        $this->assertDatabaseHas('roles', ['name' => 'customer']);
        $this->assertDatabaseHas('roles', ['name' => 'warehouse_staff']);
        $this->assertDatabaseHas('roles', ['name' => 'finance_officer']);
    }

    public function test_dynamic_order_and_payment_statuses_are_seeded_without_hardcoded_enums(): void
    {
        $this->assertDatabaseHas('order_statuses', ['code' => 'pending']);
        $this->assertDatabaseHas('order_statuses', ['code' => 'processing']);
        $this->assertDatabaseHas('order_statuses', ['code' => 'shipped']);
        $this->assertDatabaseHas('order_statuses', ['code' => 'completed']);

        $this->assertDatabaseHas('payment_statuses', ['code' => 'unpaid']);
        $this->assertDatabaseHas('payment_statuses', ['code' => 'paid']);
    }

    public function test_nested_variant_matrix_with_custom_pricing_and_sku(): void
    {
        $product = Product::first();
        $this->assertNotNull($product);

        $colorAttr = Attribute::where('code', 'color')->first();
        $sizeAttr = Attribute::where('code', 'size')->first();

        $redVal = AttributeValue::create([
            'attribute_id' => $colorAttr->id,
            'value' => 'Merah Crimson',
            'color_hex' => '#dc2626',
        ]);

        $xlVal = AttributeValue::create([
            'attribute_id' => $sizeAttr->id,
            'value' => 'XL Athletic',
        ]);

        $variant = ProductVariant::create([
            'product_id' => $product->id,
            'sku' => 'TSK-PRD-RED-XL',
            'barcode' => '8991234567890',
            'variant_name' => 'Merah Crimson / XL Athletic',
            'price' => 389000.00,
            'original_price' => 450000.00,
            'current_cogs' => 195000.00,
            'stock' => 25,
            'is_active' => true,
        ]);

        $variant->attributeValues()->attach([$redVal->id, $xlVal->id]);

        $this->assertDatabaseHas('product_variants', ['sku' => 'TSK-PRD-RED-XL', 'price' => 389000.00]);
        $this->assertCount(2, $variant->attributeValues);
        $this->assertEquals($product->id, $variant->product->id);
    }

    public function test_multi_warehouse_and_inventory_balances_with_stock_reservations(): void
    {
        $warehouse = Warehouse::where('code', 'GDG-JKT-PST')->first();
        $this->assertNotNull($warehouse);

        $bin = WarehouseBin::create([
            'warehouse_id' => $warehouse->id,
            'bin_code' => 'BIN-APPAREL-A01',
            'zone' => 'APPAREL',
        ]);

        $product = Product::first();
        $variant = ProductVariant::create([
            'product_id' => $product->id,
            'sku' => 'TSK-TEST-WH-01',
            'variant_name' => 'Default Variant',
            'price' => 250000.00,
            'stock' => 50,
        ]);

        $balance = InventoryBalance::create([
            'warehouse_id' => $warehouse->id,
            'product_id' => $product->id,
            'product_variant_id' => $variant->id,
            'bin_id' => $bin->id,
            'on_hand_stock' => 50,
            'reserved_stock' => 5,
            'available_stock' => 45,
            'safety_stock' => 10,
        ]);

        $this->assertDatabaseHas('inventory_balances', [
            'warehouse_id' => $warehouse->id,
            'product_variant_id' => $variant->id,
            'available_stock' => 45,
        ]);

        $user = User::first();
        $order = Order::create([
            'order_number' => 'TSK-ORD-TEST-RES-01',
            'user_id' => $user->id,
            'status' => 'pending',
            'payment_status' => 'unpaid',
            'payment_method' => 'manual_transfer',
            'recipient_name' => 'Akhyar',
            'phone_number' => '08123456789',
            'full_address' => 'Jl. Sudirman No. 1',
            'province' => 'DKI Jakarta',
            'city' => 'Jakarta Selatan',
            'district' => 'Setiabudi',
            'postal_code' => '12910',
            'expedition_name' => 'JNE',
            'expedition_service' => 'REG',
            'subtotal' => 250000.00,
            'shipping_cost' => 10000.00,
            'grand_total' => 260000.00,
        ]);

        $reservation = StockReservation::create([
            'order_id' => $order->id,
            'product_id' => $product->id,
            'product_variant_id' => $variant->id,
            'warehouse_id' => $warehouse->id,
            'quantity' => 5,
            'status' => 'active',
            'expires_at' => now()->addHours(24),
        ]);

        $this->assertDatabaseHas('stock_reservations', [
            'order_id' => $order->id,
            'quantity' => 5,
            'status' => 'active',
        ]);
    }

    public function test_procurement_po_and_goods_receiving(): void
    {
        $vendor = Vendor::create([
            'code' => 'VND-APPAREL-01',
            'company_name' => 'PT Tekstil Atletik Indonesia',
            'contact_person' => 'Budi Santoso',
            'email' => 'vendor@tekstil.co.id',
            'phone' => '0217890123',
            'address' => 'Kawasan Industri Rungkut Surabaya',
            'payment_terms_days' => 30,
        ]);

        $warehouse = Warehouse::first();
        $po = PurchaseOrder::create([
            'po_number' => 'PO-202609-TEST01',
            'vendor_id' => $vendor->id,
            'warehouse_id' => $warehouse->id,
            'status' => 'approved',
            'total_amount' => 15000000.00,
            'order_date' => now()->toDateString(),
        ]);

        $grn = GoodsReceivingNote::create([
            'grn_number' => 'GRN-202609-TEST01',
            'purchase_order_id' => $po->id,
            'warehouse_id' => $warehouse->id,
            'received_date' => now()->toDateString(),
            'delivery_order_number' => 'SJ-VENDOR-9988',
            'status' => 'verified',
        ]);

        $this->assertDatabaseHas('purchase_orders', ['po_number' => 'PO-202609-TEST01']);
        $this->assertDatabaseHas('goods_receiving_notes', ['grn_number' => 'GRN-202609-TEST01']);
    }

    public function test_cogs_and_financial_accounts_integration(): void
    {
        $coaAsset = ChartOfAccount::where('account_code', '1100')->first();
        $this->assertNotNull($coaAsset);

        $finAccount = FinancialAccount::where('account_number', '8012345678')->first();
        $this->assertNotNull($finAccount);
        $this->assertGreaterThan(0, $finAccount->current_balance);

        $product = Product::first();
        $cogs = CogsHistory::create([
            'product_id' => $product->id,
            'source_type' => 'grn_receiving',
            'source_id' => 'GRN-202609-TEST01',
            'incoming_quantity' => 100,
            'incoming_cost_per_unit' => 125000.00,
            'previous_average_cogs' => 120000.00,
            'new_average_cogs' => 123500.00,
            'effective_date' => now(),
        ]);

        $this->assertDatabaseHas('cogs_histories', ['new_average_cogs' => 123500.00]);
    }

    public function test_logistics_services_and_lifetime_loyalty_points(): void
    {
        $expedition = Expedition::first();
        $service = ExpeditionService::create([
            'expedition_id' => $expedition->id,
            'service_code' => 'REG',
            'service_name' => 'JNE Reguler Tusko',
            'base_rate' => 12000.00,
            'per_kg_rate' => 10000.00,
        ]);

        $this->assertDatabaseHas('expedition_services', ['service_code' => 'REG']);

        $user = User::first();
        $loyalty = LoyaltyPointsLedger::create([
            'user_id' => $user->id,
            'type' => 'earn',
            'points' => 250,
            'balance_after' => 250,
            'reference_type' => 'order',
            'reference_id' => 'TSK-ORD-0001',
            'description' => 'Poin reward pesanan TSK-ORD-0001',
        ]);

        $this->assertDatabaseHas('loyalty_points_ledger', [
            'user_id' => $user->id,
            'points' => 250,
            'balance_after' => 250,
        ]);
    }
}
