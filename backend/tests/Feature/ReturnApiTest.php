<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderReturn;
use App\Models\Product;
use App\Models\User;
use Database\Seeders\MasterReferenceSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ReturnApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(MasterReferenceSeeder::class);
    }

    private function buyerWithOrder(string $status = 'completed'): array
    {
        $user = User::factory()->create(['role' => 'customer', 'is_active' => true]);
        $order = Order::factory()->create(['user_id' => $user->id, 'status' => $status, 'payment_status' => 'paid']);
        $product = Product::factory()->create();
        $item = OrderItem::factory()->create([
            'order_id' => $order->id,
            'product_id' => $product->id,
            'product_price' => 50000,
            'quantity' => 2,
            'subtotal' => 100000,
        ]);

        return [$user, $order, $item];
    }

    public function test_buyer_can_request_return_with_computed_refund(): void
    {
        [$user, $order, $item] = $this->buyerWithOrder();
        Sanctum::actingAs($user);

        $response = $this->postJson('/api/returns', [
            'order_id' => $order->id,
            'reason' => 'Produk cacat',
            'items' => [
                ['order_item_id' => $item->id, 'quantity' => 1, 'condition' => 'rusak'],
            ],
        ])->assertStatus(201);

        $this->assertSame('pending', $response->json('data.status'));
        $this->assertSame(50000.0, (float) $response->json('data.refund_amount'));
        $this->assertDatabaseHas('returns', ['order_id' => $order->id, 'status' => 'pending', 'refund_amount' => 50000]);
    }

    public function test_cannot_request_return_for_ineligible_order(): void
    {
        [$user, $order, $item] = $this->buyerWithOrder('processing');
        Sanctum::actingAs($user);

        $this->postJson('/api/returns', [
            'order_id' => $order->id,
            'items' => [['order_item_id' => $item->id, 'quantity' => 1]],
        ])->assertStatus(422);

        // Pesanan milik orang lain.
        $otherOrder = Order::factory()->create(['status' => 'completed', 'payment_status' => 'paid']);
        $otherItem = OrderItem::factory()->create(['order_id' => $otherOrder->id]);
        $this->postJson('/api/returns', [
            'order_id' => $otherOrder->id,
            'items' => [['order_item_id' => $otherItem->id, 'quantity' => 1]],
        ])->assertStatus(403);
    }

    public function test_quantity_cannot_exceed_and_duplicate_return_rejected(): void
    {
        [$user, $order, $item] = $this->buyerWithOrder();
        Sanctum::actingAs($user);

        $this->postJson('/api/returns', [
            'order_id' => $order->id,
            'items' => [['order_item_id' => $item->id, 'quantity' => 5]],
        ])->assertStatus(422);

        $this->postJson('/api/returns', [
            'order_id' => $order->id,
            'items' => [['order_item_id' => $item->id, 'quantity' => 1]],
        ])->assertStatus(201);

        $this->postJson('/api/returns', [
            'order_id' => $order->id,
            'items' => [['order_item_id' => $item->id, 'quantity' => 1]],
        ])->assertStatus(422);
    }

    public function test_admin_can_approve_and_reject(): void
    {
        [$user, $order, $item] = $this->buyerWithOrder();
        $return = OrderReturn::create([
            'return_number' => 'RTR/25092026/001',
            'order_id' => $order->id,
            'user_id' => $user->id,
            'status' => 'pending',
            'refund_amount' => 50000,
            'requested_at' => now(),
        ]);

        Sanctum::actingAs(User::factory()->create(['role' => 'admin', 'is_active' => true]));

        $this->postJson("/api/returns/{$return->id}/approve")->assertStatus(200);
        $this->assertSame('approved', $return->fresh()->status);
        $this->assertDatabaseHas('activity_logs', ['action' => 'return.approved']);

        // Reject butuh alasan.
        $this->postJson("/api/returns/{$return->id}/reject", [])->assertStatus(422);
        $this->postJson("/api/returns/{$return->id}/reject", ['rejection_reason' => 'Barang tidak sesuai'])->assertStatus(200);
        $this->assertSame('rejected', $return->fresh()->status);
    }

    public function test_list_scoping_and_authorization(): void
    {
        [$userA, $orderA, $itemA] = $this->buyerWithOrder();
        [$userB, $orderB] = $this->buyerWithOrder();
        OrderReturn::create(['return_number' => 'RTR-A', 'order_id' => $orderA->id, 'user_id' => $userA->id, 'status' => 'pending', 'refund_amount' => 1, 'requested_at' => now()]);
        OrderReturn::create(['return_number' => 'RTR-B', 'order_id' => $orderB->id, 'user_id' => $userB->id, 'status' => 'pending', 'refund_amount' => 1, 'requested_at' => now()]);

        Sanctum::actingAs($userA);
        $own = $this->getJson('/api/returns')->assertStatus(200);
        $this->assertSame(1, $own->json('total'));

        Sanctum::actingAs(User::factory()->create(['role' => 'admin', 'is_active' => true]));
        $all = $this->getJson('/api/returns?per_page=100')->assertStatus(200);
        $this->assertSame(2, $all->json('total'));

        // Filter rentang nominal & jumlah item.
        $byAmount = $this->getJson('/api/returns?refund_amount_min=1&refund_amount_max=100&items_max=5')->assertStatus(200);
        $this->assertSame(2, $byAmount->json('total'));
    }

    public function test_non_admin_cannot_approve_and_guest_unauthorized(): void
    {
        [$user, $order] = $this->buyerWithOrder();
        $return = OrderReturn::create(['return_number' => 'RTR-X', 'order_id' => $order->id, 'user_id' => $user->id, 'status' => 'pending', 'refund_amount' => 1, 'requested_at' => now()]);

        Sanctum::actingAs($user);
        $this->postJson("/api/returns/{$return->id}/approve")->assertStatus(403);
    }

    public function test_guest_is_unauthorized(): void
    {
        $this->getJson('/api/returns')->assertStatus(401);
    }
}
