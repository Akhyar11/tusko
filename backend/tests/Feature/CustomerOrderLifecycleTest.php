<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\OrderStatusHistory;
use App\Models\Product;
use App\Models\StockMutation;
use App\Models\User;
use App\Models\Warehouse;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CustomerOrderLifecycleTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Warehouse::create([
            'code' => 'GDG-LFC-01',
            'name' => 'Gudang Lifecycle',
            'address' => 'Jl. Lifecycle',
            'city' => 'Jakarta',
            'province' => 'DKI Jakarta',
            'is_primary' => true,
            'is_active' => true,
        ]);
    }

    private function checkout(User $user, Product $product, int $qty = 2): Order
    {
        $response = $this->actingAs($user)->postJson('/api/checkout', [
            'items' => [['product_id' => $product->id, 'quantity' => $qty]],
            'recipient_name' => 'Pembeli Lifecycle',
            'phone' => '081200000001',
            'full_address' => 'Jl. Uji No. 1',
            'province' => 'DKI Jakarta',
            'city' => 'Jakarta Selatan',
            'postal_code' => '12810',
            'expedition_name' => 'JNE',
            'expedition_service' => 'REG',
            'payment_method' => 'manual_transfer',
            'payment_channel' => 'manual_bca',
        ]);

        $response->assertCreated();

        return Order::where('user_id', $user->id)->latest('id')->firstOrFail();
    }

    public function test_checkout_decrements_stock_then_expiry_restores_and_is_idempotent(): void
    {
        $user = User::factory()->create();
        $product = Product::factory()->create(['price' => 100000, 'stock' => 10]);

        $order = $this->checkout($user, $product, 2);

        // 1) Stok turun saat checkout.
        $this->assertSame(8, (int) $product->fresh()->stock);

        // 2) Percepat kedaluwarsa & jalankan auto-cancel.
        $order->update(['expires_at' => now()->subMinute(), 'payment_status' => 'pending']);

        $this->artisan('orders:cancel-expired')->assertExitCode(0);

        $order->refresh();
        $this->assertSame('cancelled', $order->status);
        $this->assertSame('cancelled', $order->payment_status);
        $this->assertSame(10, (int) $product->fresh()->stock);

        // 3) Idempoten: jalankan ulang tidak menggandakan pengembalian stok.
        $this->artisan('orders:cancel-expired')->assertExitCode(0);
        $this->assertSame(10, (int) $product->fresh()->stock);
        $this->assertSame(
            1,
            StockMutation::where('reference_type', 'order_cancelled')
                ->where('reference_id', $order->order_number)
                ->count()
        );
    }

    public function test_paid_order_lifecycle_status_transitions_and_histories(): void
    {
        $user = User::factory()->create();
        $product = Product::factory()->create(['price' => 100000, 'stock' => 5]);
        $admin = User::factory()->create(['role' => 'admin', 'is_active' => true]);

        $order = $this->checkout($user, $product, 1);
        $this->assertSame('pending', $order->status);

        Sanctum::actingAs($admin);

        // pending -> processing (menandai lunas).
        $this->patchJson("/api/orders/{$order->id}/status", ['status' => 'processing'])
            ->assertStatus(200)
            ->assertJsonPath('data.status', 'processing');

        // processing -> shipped (butuh resi).
        $this->patchJson("/api/orders/{$order->id}/status", [
            'status' => 'shipped',
            'tracking_number' => 'JNE-LFC-0001',
        ])->assertStatus(200)->assertJsonPath('data.status', 'shipped');

        // shipped -> completed.
        $this->patchJson("/api/orders/{$order->id}/status", ['status' => 'completed'])
            ->assertStatus(200)
            ->assertJsonPath('data.status', 'completed');

        $order->refresh();
        $this->assertSame('completed', $order->status);
        $this->assertSame('paid', $order->payment_status);
        $this->assertSame('JNE-LFC-0001', $order->tracking_number);
        $this->assertNotNull($order->paid_at);
        $this->assertNotNull($order->shipped_at);
        $this->assertNotNull($order->completed_at);

        // Histori status tercatat untuk setiap transisi.
        foreach (['processing', 'shipped', 'completed'] as $code) {
            $this->assertTrue(
                OrderStatusHistory::where('order_id', $order->id)->where('status_code', $code)->exists(),
                "Histori status '{$code}' tidak tercatat."
            );
        }
    }
}
