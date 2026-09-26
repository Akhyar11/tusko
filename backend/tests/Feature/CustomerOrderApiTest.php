<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\User;
use Database\Seeders\MasterReferenceSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CustomerOrderApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(MasterReferenceSeeder::class);
    }

    private function actingAsCustomer(): User
    {
        $user = User::factory()->create(['role' => 'customer', 'is_active' => true]);
        Sanctum::actingAs($user);

        return $user;
    }

    public function test_customer_can_cancel_own_pending_unpaid_order(): void
    {
        $user = $this->actingAsCustomer();
        $order = Order::factory()->create(['user_id' => $user->id, 'status' => 'pending', 'payment_status' => 'pending']);

        $response = $this->postJson("/api/orders/{$order->id}/cancel", ['cancellation_reason' => 'Berubah pikiran'])->assertStatus(200);

        $response->assertJsonPath('data.status', 'cancelled');
        $order->refresh();
        $this->assertSame('cancelled', $order->status);
        $this->assertSame('cancelled', $order->payment_status);
        $this->assertNotNull($order->cancelled_at);
    }

    public function test_customer_cannot_cancel_paid_or_non_pending_order(): void
    {
        $user = $this->actingAsCustomer();
        $paid = Order::factory()->create(['user_id' => $user->id, 'status' => 'processing', 'payment_status' => 'paid']);

        $this->postJson("/api/orders/{$paid->id}/cancel")->assertStatus(422);
    }

    public function test_customer_cannot_cancel_other_users_order(): void
    {
        $this->actingAsCustomer();
        $other = User::factory()->create(['role' => 'customer']);
        $order = Order::factory()->create(['user_id' => $other->id, 'status' => 'pending', 'payment_status' => 'pending']);

        $this->postJson("/api/orders/{$order->id}/cancel")->assertStatus(404);
    }

    public function test_customer_can_confirm_receipt_for_shipped_order(): void
    {
        $user = $this->actingAsCustomer();
        $order = Order::factory()->create(['user_id' => $user->id, 'status' => 'shipped', 'payment_status' => 'paid']);

        $response = $this->postJson("/api/orders/{$order->id}/complete")->assertStatus(200);

        $response->assertJsonPath('data.status', 'completed');
        $order->refresh();
        $this->assertSame('completed', $order->status);
        $this->assertNotNull($order->completed_at);
    }

    public function test_cannot_complete_order_before_shipped(): void
    {
        $user = $this->actingAsCustomer();
        $order = Order::factory()->create(['user_id' => $user->id, 'status' => 'processing', 'payment_status' => 'paid']);

        $this->postJson("/api/orders/{$order->id}/complete")->assertStatus(422);
    }

    public function test_guest_is_unauthorized(): void
    {
        $order = Order::factory()->create(['status' => 'pending']);

        $this->postJson("/api/orders/{$order->id}/cancel")->assertStatus(401);
        $this->postJson("/api/orders/{$order->id}/complete")->assertStatus(401);
    }
}
