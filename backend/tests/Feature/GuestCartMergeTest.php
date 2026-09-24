<?php

namespace Tests\Feature;

use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class GuestCartMergeTest extends TestCase
{
    use RefreshDatabase;

    private function createUser(string $email = 'merge@example.com'): User
    {
        return User::factory()->create([
            'email' => $email,
            'password' => Hash::make('password123'),
        ]);
    }

    public function test_login_merges_guest_cart_into_user_cart(): void
    {
        $user = $this->createUser();
        [$productA, $productB] = Product::factory()->count(2)->create(['stock' => 50])->all();

        $userCart = Cart::create(['user_id' => $user->id]);
        CartItem::create([
            'cart_id' => $userCart->id,
            'product_id' => $productA->id,
            'quantity' => 1,
        ]);

        $guestCart = Cart::create(['session_id' => 'sess-guest-1', 'user_id' => null]);
        CartItem::create([
            'cart_id' => $guestCart->id,
            'product_id' => $productA->id,
            'quantity' => 2,
        ]);
        CartItem::create([
            'cart_id' => $guestCart->id,
            'product_id' => $productB->id,
            'quantity' => 3,
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'password123',
            'session_id' => 'sess-guest-1',
        ]);

        $response->assertStatus(200);

        // Item produk A dijumlahkan (1 + 2 = 3), produk B dipindahkan.
        $this->assertDatabaseHas('cart_items', [
            'cart_id' => $userCart->id,
            'product_id' => $productA->id,
            'quantity' => 3,
        ]);
        $this->assertDatabaseHas('cart_items', [
            'cart_id' => $userCart->id,
            'product_id' => $productB->id,
            'quantity' => 3,
        ]);

        // Keranjang guest dihapus seluruhnya.
        $this->assertDatabaseMissing('carts', ['session_id' => 'sess-guest-1']);
        $this->assertDatabaseCount('cart_items', 2);
    }

    public function test_merge_matches_existing_items_by_product(): void
    {
        $user = $this->createUser('variant@example.com');
        $product = Product::factory()->create(['stock' => 50]);

        $variant = ProductVariant::create([
            'product_id' => $product->id,
            'sku' => 'MERGE-VAR-A',
            'variant_name' => 'Varian A',
            'price' => 100000,
            'stock' => 50,
            'is_active' => true,
        ]);

        // Keranjang user sudah punya produk ini tanpa varian.
        $userCart = Cart::create(['user_id' => $user->id]);
        CartItem::create([
            'cart_id' => $userCart->id,
            'product_id' => $product->id,
            'quantity' => 1,
        ]);

        // Keranjang guest punya produk sama dengan varian -> dijumlahkan.
        $guestCart = Cart::create(['session_id' => 'sess-variant', 'user_id' => null]);
        CartItem::create([
            'cart_id' => $guestCart->id,
            'product_id' => $product->id,
            'product_variant_id' => $variant->id,
            'quantity' => 2,
        ]);

        $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'password123',
            'session_id' => 'sess-variant',
        ])->assertStatus(200);

        $this->assertDatabaseHas('cart_items', [
            'cart_id' => $userCart->id,
            'product_id' => $product->id,
            'quantity' => 3,
        ]);
        $this->assertDatabaseCount('cart_items', 1);
    }

    public function test_login_without_session_id_keeps_guest_cart(): void
    {
        $user = $this->createUser('nosession@example.com');
        $product = Product::factory()->create(['stock' => 50]);

        $guestCart = Cart::create(['session_id' => 'sess-untouched', 'user_id' => null]);
        CartItem::create([
            'cart_id' => $guestCart->id,
            'product_id' => $product->id,
            'quantity' => 2,
        ]);

        $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'password123',
        ])->assertStatus(200);

        $this->assertDatabaseHas('carts', ['session_id' => 'sess-untouched']);
        $this->assertDatabaseMissing('carts', ['user_id' => $user->id]);
    }

    public function test_login_does_not_merge_other_session_guest_cart(): void
    {
        $user = $this->createUser('other@example.com');
        $product = Product::factory()->create(['stock' => 50]);

        $otherGuestCart = Cart::create(['session_id' => 'sess-other', 'user_id' => null]);
        CartItem::create([
            'cart_id' => $otherGuestCart->id,
            'product_id' => $product->id,
            'quantity' => 5,
        ]);

        $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'password123',
            'session_id' => 'sess-mine',
        ])->assertStatus(200);

        $this->assertDatabaseHas('carts', ['session_id' => 'sess-other']);
        $this->assertDatabaseMissing('carts', ['user_id' => $user->id]);
    }

    public function test_register_merges_guest_cart_into_new_user(): void
    {
        $product = Product::factory()->create(['stock' => 50]);

        $guestCart = Cart::create(['session_id' => 'sess-register', 'user_id' => null]);
        CartItem::create([
            'cart_id' => $guestCart->id,
            'product_id' => $product->id,
            'quantity' => 2,
        ]);

        $this->postJson('/api/auth/register', [
            'name' => 'User Baru',
            'email' => 'baru@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'session_id' => 'sess-register',
        ])->assertStatus(201);

        $newUser = User::where('email', 'baru@example.com')->firstOrFail();
        $userCart = Cart::where('user_id', $newUser->id)->firstOrFail();

        $this->assertDatabaseHas('cart_items', [
            'cart_id' => $userCart->id,
            'product_id' => $product->id,
            'quantity' => 2,
        ]);
        $this->assertDatabaseMissing('carts', ['session_id' => 'sess-register']);
    }

    public function test_merge_removes_empty_guest_cart(): void
    {
        $user = $this->createUser('empty@example.com');

        Cart::create(['session_id' => 'sess-empty', 'user_id' => null]);

        $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'password123',
            'session_id' => 'sess-empty',
        ])->assertStatus(200);

        $this->assertDatabaseMissing('carts', ['session_id' => 'sess-empty']);
        $this->assertDatabaseMissing('carts', ['user_id' => $user->id]);
    }
}
