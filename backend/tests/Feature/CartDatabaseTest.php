<?php

namespace Tests\Feature;

use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class CartDatabaseTest extends TestCase
{
    use RefreshDatabase;

    public function test_cart_and_cart_items_tables_have_expected_columns(): void
    {
        $this->assertTrue(Schema::hasTable('carts'));
        $this->assertTrue(Schema::hasColumns('carts', [
            'id', 'user_id', 'session_id', 'created_at', 'updated_at'
        ]));

        $this->assertTrue(Schema::hasTable('cart_items'));
        $this->assertTrue(Schema::hasColumns('cart_items', [
            'id', 'cart_id', 'product_id', 'quantity', 'notes', 'created_at', 'updated_at'
        ]));
    }

    public function test_can_create_guest_and_user_carts(): void
    {
        // Guest cart
        $guestCart = Cart::create([
            'session_id' => 'guest_session_12345'
        ]);
        $this->assertDatabaseHas('carts', [
            'id' => $guestCart->id,
            'session_id' => 'guest_session_12345',
            'user_id' => null,
        ]);

        // User cart
        $user = User::factory()->create();
        $userCart = Cart::create([
            'user_id' => $user->id,
        ]);
        $this->assertDatabaseHas('carts', [
            'id' => $userCart->id,
            'user_id' => $user->id,
        ]);
        $this->assertEquals($user->id, $userCart->user->id);
    }

    public function test_can_add_products_to_cart_and_calculate_totals(): void
    {
        $category = Category::create([
            'name' => 'Elektronik',
            'slug' => 'elektronik',
        ]);

        $productA = Product::create([
            'category_id' => $category->id,
            'name' => 'Mechanical Keyboard RGB',
            'slug' => 'mechanical-keyboard-rgb',
            'price' => 450000,
            'stock' => 15,
        ]);

        $productB = Product::create([
            'category_id' => $category->id,
            'name' => 'Gaming Mouse Wireless',
            'slug' => 'gaming-mouse-wireless',
            'price' => 250000,
            'stock' => 20,
        ]);

        $cart = Cart::create(['session_id' => 'session_test_abc']);

        $itemA = CartItem::create([
            'cart_id' => $cart->id,
            'product_id' => $productA->id,
            'quantity' => 2,
            'notes' => 'Warna hitam switch blue'
        ]);

        $itemB = CartItem::create([
            'cart_id' => $cart->id,
            'product_id' => $productB->id,
            'quantity' => 1,
        ]);

        $this->assertCount(2, $cart->items);
        $this->assertEquals(900000, $itemA->subtotal);
        $this->assertEquals(250000, $itemB->subtotal);

        // Check attributes
        $this->assertEquals(3, $cart->total_quantity);
        $this->assertEquals(1150000, $cart->total_price);
    }

    public function test_cart_item_unique_constraint_prevents_duplicates(): void
    {
        $category = Category::create(['name' => 'Kategori', 'slug' => 'kategori']);
        $product = Product::create([
            'category_id' => $category->id,
            'name' => 'Barang A',
            'slug' => 'barang-a',
            'price' => 10000,
            'stock' => 5,
        ]);

        $cart = Cart::create(['session_id' => 'session_uniq']);

        CartItem::create([
            'cart_id' => $cart->id,
            'product_id' => $product->id,
            'quantity' => 1,
        ]);

        $this->expectException(QueryException::class);

        // Attempting to add duplicate cart_id + product_id must fail unique constraint
        CartItem::create([
            'cart_id' => $cart->id,
            'product_id' => $product->id,
            'quantity' => 2,
        ]);
    }

    public function test_deleting_cart_cascades_to_cart_items(): void
    {
        $category = Category::create(['name' => 'Kategori', 'slug' => 'kategori']);
        $product = Product::create([
            'category_id' => $category->id,
            'name' => 'Barang B',
            'slug' => 'barang-b',
            'price' => 10000,
            'stock' => 5,
        ]);

        $cart = Cart::create(['session_id' => 'session_cascade']);
        $item = CartItem::create([
            'cart_id' => $cart->id,
            'product_id' => $product->id,
            'quantity' => 1,
        ]);

        $this->assertDatabaseHas('cart_items', ['id' => $item->id]);

        $cart->delete();

        $this->assertDatabaseMissing('carts', ['id' => $cart->id]);
        $this->assertDatabaseMissing('cart_items', ['id' => $item->id]);
    }
}
