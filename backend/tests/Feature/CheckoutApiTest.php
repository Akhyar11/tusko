<?php

namespace Tests\Feature;

use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Expedition;
use App\Models\Order;
use App\Models\Product;
use App\Models\ShippingAddress;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CheckoutApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_checkout_with_explicit_items_and_decrements_stock(): void
    {
        $user = User::factory()->create();
        $product = Product::factory()->create([
            'name' => 'Kemeja Casual',
            'price' => 150000,
            'stock' => 10,
        ]);
        $expedition = Expedition::factory()->create([
            'name' => 'J&T Express',
            'service' => 'Reguler',
            'cost' => 12000,
        ]);

        $payload = [
            'items' => [
                [
                    'product_id' => $product->id,
                    'quantity' => 2,
                    'notes' => 'Ukuran L warna putih',
                ],
            ],
            'recipient_name' => 'Budi Santoso',
            'phone' => '08123456789',
            'full_address' => 'Jl. Merdeka No. 45',
            'province' => 'DKI Jakarta',
            'city' => 'Jakarta Selatan',
            'district' => 'Tebet',
            'postal_code' => '12810',
            'expedition_id' => $expedition->id,
            'payment_method' => 'midtrans',
            'payment_channel' => 'bca_va',
            'insurance_cost' => 1000,
            'service_fee' => 1000,
        ];

        $response = $this->actingAs($user)->postJson('/api/checkout', $payload);

        $response->assertCreated()
            ->assertJsonPath('data.address.recipient_name', 'Budi Santoso')
            ->assertJsonPath('data.totals.subtotal', 300000)
            ->assertJsonPath('data.totals.shipping_cost', 24000)
            ->assertJsonPath('data.totals.grand_total', 326000)
            ->assertJsonCount(1, 'data.items')
            ->assertJsonPath('data.items.0.product_name', 'Kemeja Casual')
            ->assertJsonPath('data.items.0.quantity', 2);

        // Verify stock decremented
        $this->assertEquals(8, $product->fresh()->stock);

        // Verify order in database
        $this->assertDatabaseHas('orders', [
            'user_id' => $user->id,
            'recipient_name' => 'Budi Santoso',
            'grand_total' => 326000,
        ]);
    }

    public function test_checkout_fails_if_product_stock_is_insufficient(): void
    {
        $user = User::factory()->create();
        $product = Product::factory()->create([
            'name' => 'Sepatu Sneakers',
            'stock' => 2,
        ]);

        $payload = [
            'items' => [
                [
                    'product_id' => $product->id,
                    'quantity' => 5, // exceeds stock of 2
                ],
            ],
            'recipient_name' => 'Andi',
            'phone' => '0811223344',
            'full_address' => 'Jl. Sudirman',
            'expedition_name' => 'JNE',
            'expedition_service' => 'REG',
            'shipping_cost' => 10000,
        ];

        $response = $this->actingAs($user)->postJson('/api/checkout', $payload);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['items']);

        // Stock must remain unchanged
        $this->assertEquals(2, $product->fresh()->stock);
    }

    public function test_can_checkout_from_active_cart(): void
    {
        $user = User::factory()->create();
        $cart = Cart::factory()->create(['user_id' => $user->id]);
        $product = Product::factory()->create([
            'name' => 'Tas Ransel',
            'price' => 200000,
            'stock' => 5,
        ]);

        CartItem::factory()->create([
            'cart_id' => $cart->id,
            'product_id' => $product->id,
            'quantity' => 1,
        ]);

        $payload = [
            'recipient_name' => 'Rina Gunawan',
            'phone' => '0855667788',
            'full_address' => 'Jl. Melati No. 10',
            'expedition_name' => 'SiCepat',
            'expedition_service' => 'GOKIL',
            'shipping_cost' => 20000,
            'payment_method' => 'manual_transfer',
            'payment_channel' => 'manual_bca',
        ];

        $response = $this->actingAs($user)->postJson('/api/checkout', $payload);

        $response->assertCreated()
            ->assertJsonPath('data.totals.subtotal', 200000)
            ->assertJsonPath('data.payment_method', 'manual_transfer');

        // Cart items must be cleared
        $this->assertDatabaseMissing('cart_items', [
            'cart_id' => $cart->id,
            'product_id' => $product->id,
        ]);

        // Product stock decremented
        $this->assertEquals(4, $product->fresh()->stock);
    }

    public function test_can_checkout_using_saved_shipping_address(): void
    {
        $user = User::factory()->create();
        $address = ShippingAddress::factory()->create([
            'user_id' => $user->id,
            'recipient_name' => 'Siti Rahma',
            'phone' => '0899887766',
            'full_address' => 'Komplek Griya Indah Blok B2',
            'city' => 'Bandung',
        ]);

        $product = Product::factory()->create(['price' => 50000, 'stock' => 10]);

        $payload = [
            'items' => [
                ['product_id' => $product->id, 'quantity' => 1],
            ],
            'shipping_address_id' => $address->id,
            'expedition_name' => 'J&T Express',
            'expedition_service' => 'EZ',
            'shipping_cost' => 15000,
        ];

        $response = $this->actingAs($user)->postJson('/api/checkout', $payload);

        $response->assertCreated()
            ->assertJsonPath('data.address.recipient_name', 'Siti Rahma')
            ->assertJsonPath('data.address.city', 'Bandung');
    }

    public function test_can_retrieve_order_by_number_or_id(): void
    {
        $user = User::factory()->create();
        $order = Order::factory()->create([
            'user_id' => $user->id,
            'order_number' => 'INV/20260907/TK/998877',
        ]);

        $response = $this->actingAs($user)->getJson("/api/orders/{$order->order_number}");

        $response->assertOk()
            ->assertJsonPath('data.order_number', 'INV/20260907/TK/998877');

        $responseById = $this->actingAs($user)->getJson("/api/orders/{$order->id}");
        $responseById->assertOk()
            ->assertJsonPath('data.id', $order->id);
    }

    public function test_can_list_orders_for_user(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();

        Order::factory()->count(3)->create(['user_id' => $user->id]);
        Order::factory()->count(2)->create(['user_id' => $otherUser->id]);

        $response = $this->actingAs($user)->getJson('/api/orders');

        $response->assertOk()
            ->assertJsonCount(3, 'data')
            ->assertJsonPath('meta.total', 3);
    }
}
