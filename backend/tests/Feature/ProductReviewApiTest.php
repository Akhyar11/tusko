<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ProductReview;
use App\Models\User;
use Database\Seeders\MasterReferenceSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ProductReviewApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(MasterReferenceSeeder::class);
    }

    private function buyerWithOrder(Product $product): array
    {
        $user = User::factory()->create(['role' => 'customer', 'is_active' => true]);
        $order = Order::factory()->create(['user_id' => $user->id, 'payment_status' => 'paid', 'status' => 'completed']);
        OrderItem::factory()->create(['order_id' => $order->id, 'product_id' => $product->id]);

        return [$user, $order];
    }

    public function test_buyer_can_submit_review_pending_moderation(): void
    {
        $product = Product::factory()->create();
        [$user, $order] = $this->buyerWithOrder($product);
        Sanctum::actingAs($user);

        $response = $this->postJson('/api/reviews', [
            'product_id' => $product->id,
            'order_id' => $order->id,
            'rating' => 5,
            'title' => 'Mantap',
            'comment' => 'Sangat bagus',
        ])->assertStatus(201);

        $this->assertFalse($response->json('data.is_approved'));
        $this->assertDatabaseHas('product_reviews', [
            'product_id' => $product->id,
            'order_id' => $order->id,
            'rating' => 5,
            'is_approved' => false,
        ]);
    }

    public function test_non_buyer_cannot_review(): void
    {
        $product = Product::factory()->create();
        $user = User::factory()->create(['role' => 'customer', 'is_active' => true]);
        $order = Order::factory()->create(['user_id' => $user->id, 'payment_status' => 'paid']);
        Sanctum::actingAs($user);

        // Order tidak memuat produk.
        $this->postJson('/api/reviews', [
            'product_id' => $product->id,
            'order_id' => $order->id,
            'rating' => 4,
        ])->assertStatus(422);

        // Order milik orang lain.
        $other = User::factory()->create(['role' => 'customer', 'is_active' => true]);
        $otherOrder = Order::factory()->create(['user_id' => $other->id, 'payment_status' => 'paid']);
        OrderItem::factory()->create(['order_id' => $otherOrder->id, 'product_id' => $product->id]);

        $this->postJson('/api/reviews', [
            'product_id' => $product->id,
            'order_id' => $otherOrder->id,
            'rating' => 4,
        ])->assertStatus(403);
    }

    public function test_duplicate_review_and_rating_validation(): void
    {
        $product = Product::factory()->create();
        [$user, $order] = $this->buyerWithOrder($product);
        Sanctum::actingAs($user);

        $this->postJson('/api/reviews', ['product_id' => $product->id, 'order_id' => $order->id, 'rating' => 5])->assertStatus(201);
        $this->postJson('/api/reviews', ['product_id' => $product->id, 'order_id' => $order->id, 'rating' => 4])->assertStatus(422);

        $product2 = Product::factory()->create();
        $order2 = Order::factory()->create(['user_id' => $user->id, 'payment_status' => 'paid']);
        OrderItem::factory()->create(['order_id' => $order2->id, 'product_id' => $product2->id]);

        $this->postJson('/api/reviews', ['product_id' => $product2->id, 'order_id' => $order2->id, 'rating' => 6])
            ->assertStatus(422)->assertJsonValidationErrors('rating');
    }

    public function test_public_list_returns_only_approved_with_aggregate(): void
    {
        $product = Product::factory()->create();
        [$user, $order] = $this->buyerWithOrder($product);
        ProductReview::create(['product_id' => $product->id, 'user_id' => $user->id, 'order_id' => $order->id, 'rating' => 5, 'is_approved' => true]);

        $user2 = User::factory()->create();
        $order2 = Order::factory()->create(['user_id' => $user2->id, 'payment_status' => 'paid']);
        ProductReview::create(['product_id' => $product->id, 'user_id' => $user2->id, 'order_id' => $order2->id, 'rating' => 1, 'is_approved' => false]);

        $response = $this->getJson("/api/products/{$product->id}/reviews")->assertStatus(200);

        $this->assertCount(1, $response->json('data'));
        $this->assertSame(1, $response->json('aggregate.count'));
        $this->assertSame(5.0, (float) $response->json('aggregate.average'));
        $this->assertSame(1, $response->json('aggregate.distribution.5'));
    }

    public function test_admin_moderation_updates_product_rating(): void
    {
        $product = Product::factory()->create();
        [$user, $order] = $this->buyerWithOrder($product);
        $review = ProductReview::create(['product_id' => $product->id, 'user_id' => $user->id, 'order_id' => $order->id, 'rating' => 4, 'is_approved' => false]);

        Sanctum::actingAs(User::factory()->create(['role' => 'admin', 'is_active' => true]));

        $this->putJson("/api/admin/reviews/{$review->id}/moderate", ['is_approved' => true])->assertStatus(200);

        $this->assertTrue($review->fresh()->is_approved);
        $this->assertSame(4.0, (float) $product->fresh()->rating);
        $this->assertSame(1, (int) $product->fresh()->rating_count);
        $this->assertDatabaseHas('activity_logs', ['action' => 'review.moderated', 'subject_id' => $review->id]);

        // Daftar moderasi + filter.
        $list = $this->getJson('/api/admin/reviews?is_approved=1')->assertStatus(200);
        $this->assertSame(1, $list->json('total'));

        // Filter pengulas & rentang tanggal.
        $byUser = $this->getJson('/api/admin/reviews?userSearch=' . urlencode($user->name))->assertStatus(200);
        $this->assertSame(1, $byUser->json('total'));

        $byDate = $this->getJson('/api/admin/reviews?created_from=' . now()->toDateString() . '&created_to=' . now()->toDateString())->assertStatus(200);
        $this->assertGreaterThanOrEqual(1, $byDate->json('total'));

        $this->deleteJson("/api/admin/reviews/{$review->id}")->assertStatus(200);
        $this->assertDatabaseMissing('product_reviews', ['id' => $review->id]);
    }

    public function test_authorization(): void
    {
        $product = Product::factory()->create();

        // Guest tidak boleh posting.
        $this->postJson('/api/reviews', ['product_id' => $product->id, 'order_id' => 1, 'rating' => 5])->assertStatus(401);

        // Non-admin tidak boleh moderasi.
        Sanctum::actingAs(User::factory()->create(['role' => 'customer', 'is_active' => true]));
        $this->getJson('/api/admin/reviews')->assertStatus(403);
    }
}
