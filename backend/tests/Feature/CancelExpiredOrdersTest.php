<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\InventoryBalance;
use App\Models\Order;
use App\Models\OrderStatusHistory;
use App\Models\Product;
use App\Models\StockReservation;
use App\Models\Warehouse;
use App\Services\StockReservationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CancelExpiredOrdersTest extends TestCase
{
    use RefreshDatabase;

    private function productWithBalance(int $onHand): Product
    {
        $warehouse = Warehouse::create([
            'code' => 'GDG-EXP-01',
            'name' => 'Gudang Expired',
            'address' => 'Jl. Expired',
            'city' => 'Jakarta',
            'province' => 'DKI Jakarta',
            'is_primary' => true,
            'is_active' => true,
            'priority' => 10,
        ]);

        $category = Category::create(['name' => 'Expired', 'slug' => 'expired-' . uniqid()]);

        $product = Product::create([
            'category_id' => $category->id,
            'name' => 'Produk Expired',
            'slug' => 'produk-expired-' . uniqid(),
            'sku' => 'TSK-EXP-01',
            'price' => 100000,
            'stock' => $onHand,
        ]);

        InventoryBalance::create([
            'warehouse_id' => $warehouse->id,
            'product_id' => $product->id,
            'on_hand_stock' => $onHand,
            'reserved_stock' => 0,
            'available_stock' => $onHand,
            'safety_stock' => 5,
        ]);

        return $product;
    }

    public function test_expired_order_is_cancelled_and_reservation_released(): void
    {
        $product = $this->productWithBalance(10);

        $order = Order::factory()->create([
            'status' => 'pending',
            'payment_status' => 'pending',
            'expires_at' => now()->subHour(),
        ]);

        app(StockReservationService::class)->reserve($order, [
            ['product_id' => $product->id, 'quantity' => 4],
        ]);

        $this->artisan('orders:cancel-expired')->assertExitCode(0);

        $order->refresh();
        $this->assertSame('cancelled', $order->status);
        $this->assertSame('cancelled', $order->payment_status);

        $this->assertSame('released_expired', StockReservation::where('order_id', $order->id)->value('status'));

        $balance = InventoryBalance::where('product_id', $product->id)->firstOrFail();
        $this->assertSame(0, (int) $balance->reserved_stock);
        $this->assertSame(10, (int) $balance->available_stock);
        $this->assertSame(10, (int) $product->fresh()->stock);

        $this->assertTrue(
            OrderStatusHistory::where('order_id', $order->id)
                ->where('status_code', 'cancelled')
                ->where('actor_type', 'system')
                ->exists()
        );
    }

    public function test_not_yet_expired_order_stays_pending(): void
    {
        $order = Order::factory()->create([
            'status' => 'pending',
            'payment_status' => 'pending',
            'expires_at' => now()->addHour(),
        ]);

        $this->artisan('orders:cancel-expired')->assertExitCode(0);

        $this->assertSame('pending', $order->fresh()->status);
    }
}
