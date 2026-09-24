<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\InventoryBalance;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Warehouse;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CartStockValidationTest extends TestCase
{
    use RefreshDatabase;

    private Product $product;

    private Warehouse $warehouse;

    protected function setUp(): void
    {
        parent::setUp();

        $category = Category::create(['name' => 'Olahraga', 'slug' => 'olahraga']);

        $this->product = Product::create([
            'category_id' => $category->id,
            'name' => 'Sepatu Lari Pro',
            'slug' => 'sepatu-lari-pro',
            'price' => 750000,
            'stock' => 50,
            'stock_minimum' => 2,
            'active' => true,
        ]);

        $this->warehouse = Warehouse::create([
            'code' => 'WH/TEST/001',
            'name' => 'Gudang Uji',
            'address' => 'Jl. Uji No. 1',
            'city' => 'Jakarta',
            'province' => 'DKI Jakarta',
            'postal_code' => '10110',
            'is_primary' => true,
            'is_active' => true,
        ]);
    }

    private function balance(int $available, ?ProductVariant $variant = null, int $reserved = 0): InventoryBalance
    {
        return InventoryBalance::create([
            'warehouse_id' => $this->warehouse->id,
            'product_id' => $this->product->id,
            'product_variant_id' => $variant?->id,
            'on_hand_stock' => $available + $reserved,
            'reserved_stock' => $reserved,
            'available_stock' => $available,
            'safety_stock' => 0,
        ]);
    }

    public function test_add_item_rejects_when_exceeding_inventory_available_stock(): void
    {
        // products.stock = 50 (agregat), tetapi inventory_balances hanya 2 (otoritatif D1).
        $this->balance(2);

        $response = $this->postJson('/api/cart/items', [
            'product_id' => $this->product->id,
            'quantity' => 3,
            'session_id' => 'sess-stock-1',
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('available_stock', 2);
    }

    public function test_add_item_succeeds_within_inventory_available_and_exposes_live_stock(): void
    {
        $this->balance(2);

        $response = $this->postJson('/api/cart/items', [
            'product_id' => $this->product->id,
            'quantity' => 2,
            'session_id' => 'sess-stock-2',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.items.0.quantity', 2)
            ->assertJsonPath('data.items.0.available_stock', 2);
    }

    public function test_update_item_rejects_when_exceeding_inventory_available_stock(): void
    {
        $this->balance(5);

        $add = $this->postJson('/api/cart/items', [
            'product_id' => $this->product->id,
            'quantity' => 2,
            'session_id' => 'sess-stock-3',
        ]);
        $itemId = $add->json('data.items.0.id');

        $response = $this->putJson("/api/cart/items/{$itemId}", [
            'quantity' => 9,
            'session_id' => 'sess-stock-3',
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('available_stock', 5);
    }

    public function test_available_stock_uses_variant_balance(): void
    {
        $variant = ProductVariant::create([
            'product_id' => $this->product->id,
            'sku' => 'SEP-42',
            'variant_name' => 'Ukuran 42',
            'price' => 760000,
            'stock' => 40,
            'is_active' => true,
        ]);

        // Saldo level produk besar, tetapi saldo varian hanya 1.
        $this->balance(30);
        $this->balance(1, $variant);

        $response = $this->postJson('/api/cart/items', [
            'product_id' => $this->product->id,
            'product_variant_id' => $variant->id,
            'quantity' => 2,
            'session_id' => 'sess-stock-variant',
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('available_stock', 1);
    }
}
