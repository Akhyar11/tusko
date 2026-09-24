<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Transaction;
use App\Models\User;
use App\Services\ReportQueryService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReportQueryServiceTest extends TestCase
{
    use RefreshDatabase;

    private function service(): ReportQueryService
    {
        return app(ReportQueryService::class);
    }

    public function test_computes_revenue_cogs_and_gross_profit(): void
    {
        $category = Category::create(['name' => 'Report', 'slug' => 'report']);

        $productA = Product::create([
            'category_id' => $category->id,
            'name' => 'Produk A',
            'slug' => 'produk-a-report',
            'sku' => 'TSK-RPT-A',
            'price' => 10000,
            'cost_price' => 10000,
            'stock' => 100,
        ]);
        $productB = Product::create([
            'category_id' => $category->id,
            'name' => 'Produk B',
            'slug' => 'produk-b-report',
            'sku' => 'TSK-RPT-B',
            'price' => 10000,
            'cost_price' => 5000,
            'stock' => 100,
        ]);

        $order = Order::factory()->create([
            'payment_status' => 'paid',
            'grand_total' => 100000,
        ]);

        OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $productA->id,
            'product_name' => $productA->name,
            'product_price' => 10000,
            'quantity' => 5,
            'subtotal' => 50000,
        ]);
        OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $productB->id,
            'product_name' => $productB->name,
            'product_price' => 10000,
            'quantity' => 2,
            'subtotal' => 20000,
        ]);

        // total_cogs otomatis dari observer item: 5x10.000 + 2x5.000 = 60.000
        $this->assertEqualsWithDelta(60000.0, (float) $order->fresh()->total_cogs, 0.01);

        $service = $this->service();

        $this->assertEqualsWithDelta(100000.0, $service->revenue(), 0.01);
        $this->assertEqualsWithDelta(60000.0, $service->cogs(), 0.01);
        $this->assertEqualsWithDelta(40000.0, $service->grossProfit(), 0.01);
    }

    public function test_computes_net_cashflow_and_points_liability(): void
    {
        Transaction::create([
            'transaction_number' => 'TRX/RPT/IN-1',
            'type' => 'income',
            'category' => 'order_payment',
            'amount' => 100000,
            'description' => 'Pemasukan',
            'status' => 'settled',
        ]);
        Transaction::create([
            'transaction_number' => 'TRX/RPT/EX-1',
            'type' => 'expense',
            'category' => 'operational',
            'amount' => 20000,
            'description' => 'Pengeluaran',
            'status' => 'settled',
        ]);

        User::create([
            'name' => 'Member Poin',
            'email' => 'poin-report-' . uniqid() . '@example.test',
            'password' => 'password123',
            'points' => 30,
        ]);

        $service = $this->service();

        $this->assertEqualsWithDelta(80000.0, $service->netCashflow(), 0.01);
        $this->assertSame(30, $service->pointsLiability());
    }

    public function test_fast_and_slow_moving_products(): void
    {
        $category = Category::create(['name' => 'Moving', 'slug' => 'moving']);

        $fast = Product::create([
            'category_id' => $category->id,
            'name' => 'Fast',
            'slug' => 'fast-moving',
            'sku' => 'TSK-MOV-FAST',
            'price' => 10000,
            'cost_price' => 5000,
            'stock' => 100,
        ]);
        $slow = Product::create([
            'category_id' => $category->id,
            'name' => 'Slow',
            'slug' => 'slow-moving',
            'sku' => 'TSK-MOV-SLOW',
            'price' => 10000,
            'cost_price' => 5000,
            'stock' => 100,
        ]);

        $order = Order::factory()->create(['payment_status' => 'paid']);

        OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $fast->id,
            'product_name' => $fast->name,
            'product_price' => 10000,
            'quantity' => 5,
            'subtotal' => 50000,
        ]);
        OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $slow->id,
            'product_name' => $slow->name,
            'product_price' => 10000,
            'quantity' => 1,
            'subtotal' => 10000,
        ]);

        $service = $this->service();

        $this->assertSame((int) $fast->id, (int) $service->fastMovingProducts(1)->first()->product_id);
        $this->assertSame((int) $slow->id, (int) $service->slowMovingProducts(1)->first()->product_id);
    }
}
