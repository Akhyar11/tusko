<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderReturn;
use App\Models\Product;
use App\Models\ReturnItem;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class ReturnModelTest extends TestCase
{
    use RefreshDatabase;

    public function test_returns_schema_has_expected_columns(): void
    {
        $this->assertTrue(Schema::hasTable('returns'));
        $this->assertTrue(Schema::hasTable('return_items'));

        foreach ([
            'id', 'return_number', 'order_id', 'user_id', 'status', 'reason', 'notes',
            'refund_amount', 'refund_method', 'refund_reference', 'requested_at',
            'approved_at', 'approved_by', 'rejected_at', 'rejected_by', 'rejection_reason',
            'refunded_at', 'refunded_by',
        ] as $column) {
            $this->assertTrue(Schema::hasColumn('returns', $column), "Kolom returns.{$column} tidak ada.");
        }

        foreach ([
            'id', 'return_id', 'order_item_id', 'product_id', 'product_variant_id',
            'quantity', 'reason', 'condition', 'refund_amount', 'restocked',
        ] as $column) {
            $this->assertTrue(Schema::hasColumn('return_items', $column), "Kolom return_items.{$column} tidak ada.");
        }
    }

    public function test_return_persists_with_relations_and_casts(): void
    {
        $user = User::factory()->create();
        $order = Order::factory()->create(['user_id' => $user->id, 'status' => 'completed']);
        $product = Product::factory()->create();
        $orderItem = OrderItem::factory()->create(['order_id' => $order->id, 'product_id' => $product->id]);

        $return = OrderReturn::create([
            'return_number' => 'RTR/25092026/001',
            'order_id' => $order->id,
            'user_id' => $user->id,
            'status' => 'pending',
            'reason' => 'Produk cacat',
            'refund_amount' => 50000,
            'requested_at' => now(),
        ]);

        ReturnItem::create([
            'return_id' => $return->id,
            'order_item_id' => $orderItem->id,
            'product_id' => $product->id,
            'quantity' => 1,
            'refund_amount' => 50000,
        ]);

        $return = $return->fresh(['items']);

        $this->assertSame('pending', $return->status);
        $this->assertSame('50000.00', $return->refund_amount);
        $this->assertSame($order->id, $return->order->id);
        $this->assertSame($user->id, $return->user->id);
        $this->assertCount(1, $return->items);
        $this->assertFalse($return->items->first()->restocked);

        $this->assertSame(1, $order->fresh()->returns()->count());
    }
}
