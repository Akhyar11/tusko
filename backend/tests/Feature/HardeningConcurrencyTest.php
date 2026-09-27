<?php

namespace Tests\Feature;

use App\Exceptions\InsufficientStockException;
use App\Models\Category;
use App\Models\InventoryBalance;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\Product;
use App\Models\StockMutation;
use App\Models\StockReservation;
use App\Models\Transaction;
use App\Models\Warehouse;
use App\Services\InventoryService;
use App\Services\StockReservationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class HardeningConcurrencyTest extends TestCase
{
    use RefreshDatabase;

    private function primaryWarehouse(): Warehouse
    {
        return Warehouse::create([
            'code' => 'GDG-HRD-01',
            'name' => 'Gudang Hardening',
            'address' => 'Jl. Hardening',
            'city' => 'Jakarta',
            'province' => 'DKI Jakarta',
            'is_primary' => true,
            'is_active' => true,
            'priority' => 10,
        ]);
    }

    private function productWithBalance(int $onHand): Product
    {
        static $sequence = 0;
        $sequence++;

        $category = Category::create([
            'name' => 'Hardening ' . $sequence,
            'slug' => 'hardening-' . $sequence . '-' . uniqid(),
        ]);

        $product = Product::create([
            'category_id' => $category->id,
            'name' => 'Produk Hardening ' . $sequence,
            'slug' => 'produk-hardening-' . $sequence . '-' . uniqid(),
            'sku' => 'TSK-HRD-' . $sequence,
            'price' => 100000,
            'stock' => $onHand,
        ]);

        InventoryBalance::create([
            'warehouse_id' => $this->primaryWarehouse()->id,
            'product_id' => $product->id,
            'on_hand_stock' => $onHand,
            'reserved_stock' => 0,
            'available_stock' => $onHand,
            'safety_stock' => 0,
        ]);

        return $product;
    }

    private function generateSignature(string $orderId, string $statusCode, string $grossAmount): string
    {
        return hash('sha512', $orderId . $statusCode . $grossAmount . config('midtrans.server_key'));
    }

    public function test_two_orders_competing_for_last_unit_only_one_can_reserve(): void
    {
        $product = $this->productWithBalance(1);
        $orderA = Order::factory()->create();
        $orderB = Order::factory()->create();

        $service = app(StockReservationService::class);

        $service->reserve($orderA, [['product_id' => $product->id, 'quantity' => 1]]);

        $thrown = null;

        try {
            $service->reserve($orderB, [['product_id' => $product->id, 'quantity' => 1]]);
        } catch (InsufficientStockException $exception) {
            $thrown = $exception;
        }

        $this->assertInstanceOf(InsufficientStockException::class, $thrown);

        $balance = InventoryBalance::where('product_id', $product->id)->firstOrFail();
        $this->assertSame(0, (int) $balance->available_stock);
        $this->assertSame(1, (int) $balance->reserved_stock);
        $this->assertSame(1, (int) $balance->on_hand_stock);

        // Hanya satu reservasi aktif tercipta (tidak overselling).
        $this->assertSame(1, StockReservation::where('status', 'active')->count());
        $this->assertSame(0, StockReservation::where('order_id', $orderB->id)->count());
    }

    public function test_many_orders_competing_for_limited_stock_never_oversell(): void
    {
        $product = $this->productWithBalance(3);
        $service = app(StockReservationService::class);

        $success = 0;
        $rejected = 0;

        for ($i = 0; $i < 6; $i++) {
            $order = Order::factory()->create();

            try {
                $service->reserve($order, [['product_id' => $product->id, 'quantity' => 1]]);
                $success++;
            } catch (InsufficientStockException $exception) {
                $rejected++;
            }
        }

        $this->assertSame(3, $success);
        $this->assertSame(3, $rejected);

        $balance = InventoryBalance::where('product_id', $product->id)->firstOrFail();
        $this->assertSame(3, (int) $balance->on_hand_stock);
        $this->assertSame(3, (int) $balance->reserved_stock);
        $this->assertSame(0, (int) $balance->available_stock);
        $this->assertSame(3, StockReservation::where('status', 'active')->count());
    }

    public function test_committed_last_unit_cannot_be_resold(): void
    {
        $product = $this->productWithBalance(1);
        $orderA = Order::factory()->create();
        $orderB = Order::factory()->create();

        $service = app(StockReservationService::class);
        $service->reserve($orderA, [['product_id' => $product->id, 'quantity' => 1]]);
        $service->commit($orderA);

        $balance = InventoryBalance::where('product_id', $product->id)->firstOrFail();
        $this->assertSame(0, (int) $balance->on_hand_stock);
        $this->assertSame(0, (int) $balance->available_stock);

        $this->expectException(InsufficientStockException::class);
        $service->reserve($orderB, [['product_id' => $product->id, 'quantity' => 1]]);
    }

    public function test_inventory_decrease_cannot_go_negative_on_repeated_attempt(): void
    {
        $product = $this->productWithBalance(1);
        $inventory = app(InventoryService::class);

        $inventory->decrease($product, 1, ['reference_type' => 'manual_reduce']);

        $thrown = null;

        try {
            $inventory->decrease($product, 1, ['reference_type' => 'manual_reduce']);
        } catch (InsufficientStockException $exception) {
            $thrown = $exception;
        }

        $this->assertInstanceOf(InsufficientStockException::class, $thrown);

        $balance = InventoryBalance::where('product_id', $product->id)->firstOrFail();
        $this->assertSame(0, (int) $balance->on_hand_stock);
        $this->assertSame(0, (int) $balance->available_stock);
        $this->assertSame(0, (int) $product->fresh()->stock);
    }

    public function test_duplicate_settlement_does_not_duplicate_income_transaction_or_payment(): void
    {
        $order = Order::factory()->create([
            'order_number' => 'INV/HARDEN/TRX-01',
            'grand_total' => 200000,
            'status' => 'pending',
            'payment_status' => 'pending',
        ]);

        $payload = [
            'order_id' => $order->order_number,
            'status_code' => '200',
            'gross_amount' => '200000.00',
            'signature_key' => $this->generateSignature($order->order_number, '200', '200000.00'),
            'transaction_status' => 'settlement',
            'transaction_id' => 'midtrans-hardening-dupe',
            'payment_type' => 'bank_transfer',
        ];

        $this->postJson('/api/webhooks/midtrans', $payload)
            ->assertOk()
            ->assertJsonPath('duplicate', false);

        $this->postJson('/api/webhooks/midtrans', $payload)
            ->assertOk()
            ->assertJsonPath('duplicate', true);

        $this->assertSame(1, Payment::where('order_id', $order->id)->count());
        $this->assertSame(
            1,
            Transaction::where('order_id', $order->id)->where('category', 'order_payment')->count()
        );
        $this->assertEquals('paid', $order->fresh()->payment_status);
    }

    public function test_duplicate_expire_does_not_restore_stock_twice(): void
    {
        $product = Product::factory()->create(['stock' => 5]);

        $order = Order::factory()->create([
            'order_number' => 'INV/HARDEN/EXP-01',
            'grand_total' => 150000,
            'status' => 'pending',
            'payment_status' => 'pending',
        ]);

        OrderItem::factory()->create([
            'order_id' => $order->id,
            'product_id' => $product->id,
            'quantity' => 2,
        ]);

        $payload = [
            'order_id' => $order->order_number,
            'status_code' => '200',
            'gross_amount' => '150000.00',
            'signature_key' => $this->generateSignature($order->order_number, '200', '150000.00'),
            'transaction_status' => 'expire',
            'transaction_id' => 'midtrans-hardening-expire',
            'payment_type' => 'qris',
        ];

        $this->postJson('/api/webhooks/midtrans', $payload)->assertOk();
        $this->postJson('/api/webhooks/midtrans', $payload)
            ->assertOk()
            ->assertJsonPath('duplicate', true);

        // Stok dipulihkan tepat sekali (5 -> 7), bukan 9.
        $this->assertSame(7, (int) $product->fresh()->stock);
        $this->assertSame(
            1,
            StockMutation::where('product_id', $product->id)
                ->where('reference_type', 'order_cancelled')
                ->count()
        );
    }
}
