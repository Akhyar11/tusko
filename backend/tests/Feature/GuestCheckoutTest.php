<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\User;
use App\Models\Warehouse;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * T05.6 — Guest checkout end-to-end (keranjang `session_id` -> order `guest_session_id`).
 */
class GuestCheckoutTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Warehouse::create([
            'code' => 'GDG-GUEST-01',
            'name' => 'Gudang Guest',
            'address' => 'Jl. Guest',
            'city' => 'Jakarta',
            'province' => 'DKI Jakarta',
            'is_primary' => true,
            'is_active' => true,
        ]);
    }

    public function test_guest_can_checkout_from_session_cart(): void
    {
        $product = Product::factory()->create(['name' => 'Produk Guest', 'price' => 100000, 'stock' => 10]);
        $sessionId = 'guest-session-abc';

        // Tamu menambah ke keranjang via session_id.
        $this->postJson('/api/cart/items', [
            'session_id' => $sessionId,
            'product_id' => $product->id,
            'quantity' => 2,
        ])->assertCreated();

        // Tamu checkout (tanpa auth).
        $response = $this->postJson('/api/checkout', [
            'session_id' => $sessionId,
            'recipient_name' => 'Tamu Pembeli',
            'phone' => '081200001234',
            'full_address' => 'Jl. Tamu No. 1',
            'province' => 'DKI Jakarta',
            'city' => 'Jakarta Selatan',
            'district' => 'Tebet',
            'postal_code' => '12810',
            'expedition_name' => 'JNE',
            'expedition_service' => 'REG',
            'payment_method' => 'manual_transfer',
            'payment_channel' => 'manual_bca',
            'service_fee' => 0,
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.totals.subtotal', 200000);

        $orderNumber = $response->json('data.order_number');

        $this->assertDatabaseHas('orders', [
            'order_number' => $orderNumber,
            'user_id' => null,
            'guest_session_id' => $sessionId,
            'recipient_name' => 'Tamu Pembeli',
        ]);

        // Stok berkurang (D1) & tidak ada user terkait.
        $this->assertSame(8, (int) $product->fresh()->stock);
        $this->assertSame(0, User::count());
    }
}
