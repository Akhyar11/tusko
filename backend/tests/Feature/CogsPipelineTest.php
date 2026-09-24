<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\CogsHistory;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\PurchaseOrder;
use App\Models\User;
use App\Models\Vendor;
use App\Models\Warehouse;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class CogsPipelineTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private Vendor $vendor;
    private Warehouse $warehouse;
    private Category $category;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->create(['role' => 'admin']);

        $this->category = Category::create([
            'name' => 'COGS Apparel',
            'slug' => 'cogs-apparel',
        ]);

        $this->vendor = Vendor::create([
            'code' => 'VND/24092026/701',
            'company_name' => 'Vendor COGS',
            'contact_person' => 'Kontak',
            'phone' => '0812000000',
            'address' => 'Jl. COGS',
        ]);

        $this->warehouse = Warehouse::create([
            'code' => 'GDG-COGS-01',
            'name' => 'Gudang COGS',
            'address' => 'Jl. COGS',
            'city' => 'Jakarta',
            'province' => 'DKI Jakarta',
            'is_primary' => true,
            'is_active' => true,
        ]);
    }

    private function createProduct(float $costPrice, int $stock = 0): Product
    {
        static $sequence = 0;
        $sequence++;

        return Product::create([
            'category_id' => $this->category->id,
            'vendor_id' => $this->vendor->id,
            'name' => 'Produk COGS ' . $sequence,
            'slug' => 'produk-cogs-' . $sequence . '-' . uniqid(),
            'sku' => 'TSK-COGS-' . $sequence,
            'price' => 200000,
            'cost_price' => $costPrice,
            'stock' => $stock,
        ]);
    }

    private function receive(Product $product, ?ProductVariant $variant, int $quantity, float $unitCost): void
    {
        $po = PurchaseOrder::create([
            'po_number' => 'PO/COGS/' . uniqid(),
            'vendor_id' => $this->vendor->id,
            'warehouse_id' => $this->warehouse->id,
            'status' => 'approved',
            'total_amount' => $quantity * $unitCost,
            'order_date' => now()->toDateString(),
        ]);

        $item = $po->items()->create([
            'product_id' => $product->id,
            'product_variant_id' => $variant?->id,
            'ordered_quantity' => $quantity,
            'received_quantity' => 0,
            'unit_price' => $unitCost,
            'subtotal' => $quantity * $unitCost,
        ]);

        $this->actingAs($this->admin)->post(
            "/api/purchase-orders/{$po->id}/receive",
            [
                'accepted_quantities' => [$item->id => $quantity],
                'invoice_file' => UploadedFile::fake()->image('invoice-cogs.jpg'),
            ],
            ['Accept' => 'application/json']
        )->assertStatus(200);
    }

    public function test_goods_receiving_records_cogs_history_and_weighted_average(): void
    {
        $product = $this->createProduct(100000, 10);

        $this->receive($product, null, 10, 120000);

        // Weighted average: (10 x 100.000 + 10 x 120.000) / 20 = 110.000
        $this->assertEqualsWithDelta(110000.0, (float) $product->fresh()->cost_price, 0.01);

        $history = CogsHistory::where('product_id', $product->id)->latest('id')->first();

        $this->assertNotNull($history);
        $this->assertSame(10, (int) $history->incoming_quantity);
        $this->assertEqualsWithDelta(120000.0, (float) $history->incoming_cost_per_unit, 0.01);
        $this->assertEqualsWithDelta(100000.0, (float) $history->previous_average_cogs, 0.01);
        $this->assertEqualsWithDelta(110000.0, (float) $history->new_average_cogs, 0.01);
    }

    public function test_variant_goods_receiving_updates_variant_cogs(): void
    {
        $product = $this->createProduct(0, 0);

        $variant = ProductVariant::create([
            'product_id' => $product->id,
            'sku' => 'TSK-COGS-VAR',
            'variant_name' => 'Merah / L',
            'price' => 200000,
            'current_cogs' => 0,
            'stock' => 0,
        ]);

        $this->receive($product, $variant, 10, 70000);

        $this->assertEqualsWithDelta(70000.0, (float) $variant->fresh()->current_cogs, 0.01);

        $history = CogsHistory::where('product_variant_id', $variant->id)->latest('id')->first();
        $this->assertNotNull($history);
        $this->assertEqualsWithDelta(70000.0, (float) $history->new_average_cogs, 0.01);
    }

    public function test_order_item_fills_unit_cogs_and_order_total_cogs(): void
    {
        $product = $this->createProduct(80000, 10);
        $order = Order::factory()->create();

        OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $product->id,
            'product_name' => $product->name,
            'product_price' => 200000,
            'quantity' => 3,
            'subtotal' => 600000,
        ]);

        $item = OrderItem::where('order_id', $order->id)->firstOrFail();

        $this->assertEqualsWithDelta(80000.0, (float) $item->unit_cogs, 0.01);
        $this->assertEqualsWithDelta(240000.0, (float) $order->fresh()->total_cogs, 0.01);
    }

    public function test_order_item_uses_variant_cogs_when_available(): void
    {
        $product = $this->createProduct(80000, 0);
        $variant = ProductVariant::create([
            'product_id' => $product->id,
            'sku' => 'TSK-COGS-VAR2',
            'variant_name' => 'Biru / M',
            'price' => 200000,
            'current_cogs' => 60000,
            'stock' => 5,
        ]);

        $order = Order::factory()->create();

        OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $product->id,
            'product_variant_id' => $variant->id,
            'product_name' => $product->name,
            'product_price' => 200000,
            'quantity' => 2,
            'subtotal' => 400000,
        ]);

        $item = OrderItem::where('order_id', $order->id)->firstOrFail();

        $this->assertEqualsWithDelta(60000.0, (float) $item->unit_cogs, 0.01);
        $this->assertEqualsWithDelta(120000.0, (float) $order->fresh()->total_cogs, 0.01);
    }
}
