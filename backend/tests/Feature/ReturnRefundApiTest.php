<?php

namespace Tests\Feature;

use App\Models\InventoryBalance;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderReturn;
use App\Models\Product;
use App\Models\ReturnItem;
use App\Models\User;
use App\Models\Warehouse;
use Database\Seeders\MasterReferenceSeeder;
use Database\Seeders\SettingsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ReturnRefundApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(MasterReferenceSeeder::class);
        $this->seed(SettingsSeeder::class);
    }

    private function actingAsAdmin(): User
    {
        $admin = User::factory()->create(['role' => 'admin', 'is_active' => true]);
        Sanctum::actingAs($admin);

        return $admin;
    }

    /**
     * @return array{0: User, 1: Order, 2: Product}
     */
    private function fixture(int $points = 200): array
    {
        $user = User::factory()->create(['role' => 'customer', 'is_active' => true, 'points' => $points]);
        $warehouse = Warehouse::where('is_primary', true)->first() ?? Warehouse::firstOrFail();
        $product = Product::factory()->create(['stock' => 10]);

        $order = Order::factory()->create([
            'user_id' => $user->id,
            'status' => 'completed',
            'payment_status' => 'paid',
            'loyalty_points_earned' => 100,
            'loyalty_points_redeemed' => 50,
        ]);
        $item = OrderItem::factory()->create([
            'order_id' => $order->id,
            'product_id' => $product->id,
            'product_price' => 50000,
            'quantity' => 2,
            'subtotal' => 100000,
        ]);

        InventoryBalance::create([
            'warehouse_id' => $warehouse->id,
            'product_id' => $product->id,
            'product_variant_id' => null,
            'on_hand_stock' => 10,
            'reserved_stock' => 0,
            'available_stock' => 10,
            'safety_stock' => 0,
        ]);

        return [$user, $order, $product, $item];
    }

    private function approvedReturn(Order $order, User $user, OrderItem $item): OrderReturn
    {
        $return = OrderReturn::create([
            'return_number' => 'RTR/25092026/' . str_pad((string) random_int(1, 999), 3, '0', STR_PAD_LEFT),
            'order_id' => $order->id,
            'user_id' => $user->id,
            'status' => 'approved',
            'refund_amount' => 50000,
            'requested_at' => now(),
            'approved_at' => now(),
        ]);

        ReturnItem::create([
            'return_id' => $return->id,
            'order_item_id' => $item->id,
            'product_id' => $item->product_id,
            'quantity' => 1,
            'refund_amount' => 50000,
        ]);

        return $return;
    }

    public function test_manual_refund_restocks_points_and_journal(): void
    {
        [$user, $order, $product, $item] = $this->fixture();
        $return = $this->approvedReturn($order, $user, $item);

        // Observer pesanan sudah mengkredit +100 poin (earned) saat pesanan paid → saldo awal 300.
        $this->assertSame(300, (int) $user->fresh()->points, 'poin awal user');

        $this->actingAsAdmin();
        $response = $this->postJson("/api/returns/{$return->id}/refund", [
            'refund_method' => 'manual',
            'refund_reference' => 'TRF-MANUAL-001',
        ])->assertStatus(200);

        $response->assertJsonPath('data.status', 'refunded');

        // Stok kembali 10 -> 11.
        $balance = InventoryBalance::where('product_id', $product->id)->firstOrFail();
        $this->assertSame(11, (int) $balance->on_hand_stock);
        $this->assertTrue((bool) $return->items()->first()->restocked);

        // Poin: earned 100 ditarik, redeemed 50 dikembalikan → 300 - 100 + 50 = 250.
        $this->assertSame(250, (int) $user->fresh()->points);
        $this->assertDatabaseHas('loyalty_points_ledger', ['user_id' => $user->id, 'type' => 'reversal', 'points' => -100]);
        $this->assertDatabaseHas('loyalty_points_ledger', ['user_id' => $user->id, 'type' => 'refund', 'points' => 50]);

        // Jurnal balik + audit log.
        $this->assertDatabaseHas('transactions', ['reference_type' => 'refund', 'reference_id' => $order->order_number]);
        $this->assertGreaterThanOrEqual(2, DB::table('financial_ledger_entries')->count());
        $this->assertDatabaseHas('activity_logs', ['action' => 'return.refunded', 'subject_id' => $return->id]);
    }

    public function test_midtrans_refund_requires_configuration(): void
    {
        [$user, $order, $product, $item] = $this->fixture();
        $return = $this->approvedReturn($order, $user, $item);

        $this->actingAsAdmin();
        $this->postJson("/api/returns/{$return->id}/refund", ['refund_method' => 'midtrans'])
            ->assertStatus(422);
    }

    public function test_refund_requires_approved_status(): void
    {
        [$user, $order, $product, $item] = $this->fixture();
        $return = OrderReturn::create([
            'return_number' => 'RTR/25092026/999',
            'order_id' => $order->id,
            'user_id' => $user->id,
            'status' => 'pending',
            'refund_amount' => 50000,
            'requested_at' => now(),
        ]);

        $this->actingAsAdmin();
        $this->postJson("/api/returns/{$return->id}/refund", ['refund_method' => 'manual'])->assertStatus(422);
    }

    public function test_non_admin_cannot_refund(): void
    {
        [$user, $order, $product, $item] = $this->fixture();
        $return = $this->approvedReturn($order, $user, $item);

        Sanctum::actingAs($user);
        $this->postJson("/api/returns/{$return->id}/refund", ['refund_method' => 'manual'])->assertStatus(403);
    }
}
