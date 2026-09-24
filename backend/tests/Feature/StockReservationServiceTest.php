<?php

namespace Tests\Feature;

use App\Exceptions\InsufficientStockException;
use App\Models\Category;
use App\Models\InventoryBalance;
use App\Models\Order;
use App\Models\Product;
use App\Models\StockReservation;
use App\Models\Warehouse;
use App\Services\StockReservationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StockReservationServiceTest extends TestCase
{
    use RefreshDatabase;

    private function service(): StockReservationService
    {
        return app(StockReservationService::class);
    }

    private function warehouse(): Warehouse
    {
        return Warehouse::create([
            'code' => 'GDG-RSV-01',
            'name' => 'Gudang Reservasi',
            'address' => 'Jl. Reservasi',
            'city' => 'Jakarta',
            'province' => 'DKI Jakarta',
            'is_primary' => true,
            'is_active' => true,
            'priority' => 10,
        ]);
    }

    private function product(int $onHand): Product
    {
        static $sequence = 0;
        $sequence++;

        $category = Category::create([
            'name' => 'Reservasi ' . $sequence,
            'slug' => 'reservasi-' . $sequence . '-' . uniqid(),
        ]);

        $product = Product::create([
            'category_id' => $category->id,
            'name' => 'Produk Reservasi ' . $sequence,
            'slug' => 'produk-reservasi-' . $sequence . '-' . uniqid(),
            'sku' => 'TSK-RSV-' . $sequence,
            'price' => 100000,
            'stock' => $onHand,
        ]);

        InventoryBalance::create([
            'warehouse_id' => $this->warehouse()->id,
            'product_id' => $product->id,
            'on_hand_stock' => $onHand,
            'reserved_stock' => 0,
            'available_stock' => $onHand,
            'safety_stock' => 5,
        ]);

        return $product;
    }

    public function test_reserve_reduces_available_and_records_reservation(): void
    {
        $product = $this->product(10);
        $order = Order::factory()->create();

        $reservations = $this->service()->reserve($order, [
            ['product_id' => $product->id, 'quantity' => 4],
        ]);

        $this->assertCount(1, $reservations);

        $balance = InventoryBalance::where('product_id', $product->id)->firstOrFail();
        $this->assertSame(4, (int) $balance->reserved_stock);
        $this->assertSame(6, (int) $balance->available_stock);
        $this->assertSame(10, (int) $balance->on_hand_stock);

        $this->assertDatabaseHas('stock_reservations', [
            'order_id' => $order->id,
            'product_id' => $product->id,
            'quantity' => 4,
            'status' => 'active',
        ]);
    }

    public function test_release_restores_availability(): void
    {
        $product = $this->product(10);
        $order = Order::factory()->create();

        $this->service()->reserve($order, [['product_id' => $product->id, 'quantity' => 4]]);
        $released = $this->service()->release($order);

        $this->assertSame(1, $released);

        $balance = InventoryBalance::where('product_id', $product->id)->firstOrFail();
        $this->assertSame(0, (int) $balance->reserved_stock);
        $this->assertSame(10, (int) $balance->available_stock);

        $this->assertSame('released_expired', StockReservation::where('order_id', $order->id)->value('status'));
    }

    public function test_commit_reduces_on_hand_and_syncs_aggregate(): void
    {
        $product = $this->product(10);
        $order = Order::factory()->create();

        $this->service()->reserve($order, [['product_id' => $product->id, 'quantity' => 4]]);
        $committed = $this->service()->commit($order);

        $this->assertSame(1, $committed);

        $balance = InventoryBalance::where('product_id', $product->id)->firstOrFail();
        $this->assertSame(6, (int) $balance->on_hand_stock);
        $this->assertSame(0, (int) $balance->reserved_stock);
        $this->assertSame(6, (int) $balance->available_stock);
        $this->assertSame(6, (int) $product->fresh()->stock);
        $this->assertSame('committed_sold', StockReservation::where('order_id', $order->id)->value('status'));
    }

    public function test_reserve_rejected_when_insufficient(): void
    {
        $product = $this->product(3);
        $order = Order::factory()->create();

        $this->expectException(InsufficientStockException::class);

        $this->service()->reserve($order, [['product_id' => $product->id, 'quantity' => 5]]);
    }

    public function test_release_expired_releases_stale_reservations(): void
    {
        $product = $this->product(10);
        $order = Order::factory()->create();

        StockReservation::create([
            'order_id' => $order->id,
            'product_id' => $product->id,
            'warehouse_id' => InventoryBalance::where('product_id', $product->id)->value('warehouse_id'),
            'quantity' => 2,
            'status' => 'active',
            'expires_at' => now()->subHour(),
        ]);

        $released = $this->service()->releaseExpired();

        $this->assertSame(1, $released);
        $this->assertSame('released_expired', StockReservation::where('order_id', $order->id)->value('status'));
    }
}
