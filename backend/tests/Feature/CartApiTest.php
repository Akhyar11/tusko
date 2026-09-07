<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CartApiTest extends TestCase
{
    use RefreshDatabase;

    private Product $product;

    protected function setUp(): void
    {
        parent::setUp();

        $category = Category::create([
            'name' => 'Elektronik',
            'slug' => 'elektronik',
        ]);

        $this->product = Product::create([
            'category_id' => $category->id,
            'name' => 'Mechanical Keyboard Gaming',
            'slug' => 'mechanical-keyboard-gaming',
            'description' => 'Keyboard mechanical RGB hot-swappable',
            'price' => 500000,
            'stock' => 10,
            'stock_minimum' => 2,
            'active' => true,
        ]);
    }

    public function test_guest_can_add_item_to_cart_with_session_id(): void
    {
        $response = $this->postJson('/api/cart/items', [
            'product_id' => $this->product->id,
            'quantity' => 2,
            'notes' => 'Tolong bubble wrap tebal',
            'session_id' => 'guest_session_xyz',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('message', 'Produk berhasil ditambahkan ke keranjang belanja.')
            ->assertJsonPath('data.total_quantity', 2)
            ->assertJsonPath('data.total_price', 1000000)
            ->assertJsonPath('data.items.0.product_id', $this->product->id)
            ->assertJsonPath('data.items.0.quantity', 2)
            ->assertJsonPath('data.items.0.notes', 'Tolong bubble wrap tebal')
            ->assertJsonPath('data.items.0.subtotal', 1000000);

        $this->assertDatabaseHas('carts', [
            'session_id' => 'guest_session_xyz',
        ]);

        $this->assertDatabaseHas('cart_items', [
            'product_id' => $this->product->id,
            'quantity' => 2,
        ]);
    }

    public function test_authenticated_user_can_add_item_to_cart(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $response = $this->postJson('/api/cart/items', [
            'product_id' => $this->product->id,
            'quantity' => 1,
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.user_id', $user->id)
            ->assertJsonPath('data.total_quantity', 1);

        $this->assertDatabaseHas('carts', [
            'user_id' => $user->id,
        ]);
    }

    public function test_adding_same_product_increments_existing_quantity(): void
    {
        $sessionId = 'session_increment_test';

        $this->postJson('/api/cart/items', [
            'product_id' => $this->product->id,
            'quantity' => 2,
            'session_id' => $sessionId,
        ])->assertStatus(201);

        // Add 3 more of the same product
        $response = $this->postJson('/api/cart/items', [
            'product_id' => $this->product->id,
            'quantity' => 3,
            'session_id' => $sessionId,
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.total_quantity', 5)
            ->assertJsonPath('data.items.0.quantity', 5)
            ->assertJsonPath('data.items.0.subtotal', 2500000);

        $this->assertDatabaseCount('cart_items', 1);
    }

    public function test_cannot_add_more_quantity_than_available_stock(): void
    {
        $response = $this->postJson('/api/cart/items', [
            'product_id' => $this->product->id,
            'quantity' => 15, // stock is 10
            'session_id' => 'session_stock_check',
        ]);

        $response->assertStatus(422)
            ->assertJsonStructure(['message', 'available_stock']);

        $this->assertDatabaseEmpty('cart_items');
    }

    public function test_cannot_add_inactive_product(): void
    {
        $this->product->update(['active' => false]);

        $response = $this->postJson('/api/cart/items', [
            'product_id' => $this->product->id,
            'quantity' => 1,
            'session_id' => 'session_inactive_check',
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('message', 'Produk ini sedang tidak aktif dan tidak dapat dibeli.');
    }

    public function test_validation_fails_for_invalid_product_id(): void
    {
        $response = $this->postJson('/api/cart/items', [
            'product_id' => 999999, // non existent
            'quantity' => 1,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['product_id']);
    }

    public function test_can_retrieve_cart_contents_via_get_endpoint(): void
    {
        $sessionId = 'session_get_check';

        $this->postJson('/api/cart/items', [
            'product_id' => $this->product->id,
            'quantity' => 1,
            'session_id' => $sessionId,
        ])->assertStatus(201);

        $response = $this->getJson("/api/cart?session_id={$sessionId}");

        $response->assertStatus(200)
            ->assertJsonPath('data.total_quantity', 1)
            ->assertJsonPath('data.items.0.product.name', 'Mechanical Keyboard Gaming');
    }

    public function test_can_update_cart_item_quantity_and_notes(): void
    {
        $sessionId = 'session_update_test';

        $addResponse = $this->postJson('/api/cart/items', [
            'product_id' => $this->product->id,
            'quantity' => 1,
            'session_id' => $sessionId,
        ])->assertStatus(201);

        $itemId = $addResponse->json('data.items.0.id');

        $updateResponse = $this->putJson("/api/cart/items/{$itemId}", [
            'quantity' => 4,
            'notes' => 'Catatan diperbarui',
            'session_id' => $sessionId,
        ]);

        $updateResponse->assertStatus(200)
            ->assertJsonPath('message', 'Jumlah barang berhasil diperbarui.')
            ->assertJsonPath('data.total_quantity', 4)
            ->assertJsonPath('data.items.0.quantity', 4)
            ->assertJsonPath('data.items.0.notes', 'Catatan diperbarui')
            ->assertJsonPath('data.items.0.subtotal', 2000000);
    }

    public function test_update_item_fails_when_quantity_exceeds_stock(): void
    {
        $sessionId = 'session_update_stock_test';

        $addResponse = $this->postJson('/api/cart/items', [
            'product_id' => $this->product->id,
            'quantity' => 1,
            'session_id' => $sessionId,
        ])->assertStatus(201);

        $itemId = $addResponse->json('data.items.0.id');

        $response = $this->putJson("/api/cart/items/{$itemId}", [
            'quantity' => 25, // stock is 10
            'session_id' => $sessionId,
        ]);

        $response->assertStatus(422)
            ->assertJsonStructure(['message', 'available_stock']);
    }

    public function test_can_remove_item_from_cart(): void
    {
        $sessionId = 'session_remove_test';

        $addResponse = $this->postJson('/api/cart/items', [
            'product_id' => $this->product->id,
            'quantity' => 1,
            'session_id' => $sessionId,
        ])->assertStatus(201);

        $itemId = $addResponse->json('data.items.0.id');

        $deleteResponse = $this->deleteJson("/api/cart/items/{$itemId}?session_id={$sessionId}");

        $deleteResponse->assertStatus(200)
            ->assertJsonPath('message', 'Item berhasil dihapus dari keranjang.')
            ->assertJsonPath('data.total_quantity', 0)
            ->assertJsonCount(0, 'data.items');

        $this->assertDatabaseMissing('cart_items', ['id' => $itemId]);
    }

    public function test_can_clear_all_items_in_cart(): void
    {
        $sessionId = 'session_clear_test';

        $this->postJson('/api/cart/items', [
            'product_id' => $this->product->id,
            'quantity' => 2,
            'session_id' => $sessionId,
        ])->assertStatus(201);

        $clearResponse = $this->deleteJson("/api/cart/clear?session_id={$sessionId}");

        $clearResponse->assertStatus(200)
            ->assertJsonPath('message', 'Semua item di keranjang berhasil dikosongkan.')
            ->assertJsonPath('data.total_quantity', 0)
            ->assertJsonCount(0, 'data.items');

        $this->assertDatabaseEmpty('cart_items');
    }
}
