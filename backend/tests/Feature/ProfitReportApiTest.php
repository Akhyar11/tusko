<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProfitReportApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_profit_report_returns_summary_and_product_breakdown(): void
    {
        $category = Category::create(['name' => 'Profit', 'slug' => 'profit']);

        $productA = Product::create([
            'category_id' => $category->id,
            'name' => 'Produk Profit A',
            'slug' => 'produk-profit-a',
            'sku' => 'TSK-PRF-A',
            'price' => 10000,
            'cost_price' => 10000,
            'stock' => 100,
        ]);
        $productB = Product::create([
            'category_id' => $category->id,
            'name' => 'Produk Profit B',
            'slug' => 'produk-profit-b',
            'sku' => 'TSK-PRF-B',
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

        $response = $this->getJson('/api/reports/profit');

        $response->assertStatus(200)
            ->assertJsonPath('summary.revenue', 100000)
            ->assertJsonPath('summary.cogs', 60000)
            ->assertJsonPath('summary.gross_profit', 40000)
            ->assertJsonPath('summary.margin_percentage', 40)
            ->assertJsonCount(2, 'data');

        $rows = collect($response->json('data'))->keyBy('product_id');

        $this->assertSame(50000, (int) $rows[$productA->id]['cogs']);
        $this->assertSame(0, (int) $rows[$productA->id]['gross_profit']);
        $this->assertSame(10000, (int) $rows[$productB->id]['gross_profit']);
    }
}
