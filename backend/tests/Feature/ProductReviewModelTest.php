<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\Product;
use App\Models\ProductReview;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class ProductReviewModelTest extends TestCase
{
    use RefreshDatabase;

    private function review(array $override = []): ProductReview
    {
        $product = Product::factory()->create();
        $user = User::factory()->create();
        $order = Order::factory()->create(['user_id' => $user->id]);

        return ProductReview::create(array_merge([
            'product_id' => $product->id,
            'user_id' => $user->id,
            'order_id' => $order->id,
            'rating' => 5,
            'title' => 'Bagus',
            'comment' => 'Kualitas mantap',
            'is_approved' => false,
        ], $override));
    }

    public function test_product_reviews_schema_has_expected_columns(): void
    {
        $this->assertTrue(Schema::hasTable('product_reviews'));

        foreach ([
            'id', 'product_id', 'user_id', 'order_id', 'rating', 'title',
            'comment', 'is_approved', 'approved_at', 'approved_by',
        ] as $column) {
            $this->assertTrue(Schema::hasColumn('product_reviews', $column), "Kolom {$column} tidak ada.");
        }

        $this->assertTrue(Schema::hasColumn('products', 'rating_count'));
    }

    public function test_review_persists_with_casts_and_relations(): void
    {
        $review = $this->review(['is_approved' => true, 'approved_at' => now()]);

        $this->assertSame(5, $review->rating);
        $this->assertTrue($review->is_approved);
        $this->assertNotNull($review->approved_at);
        $this->assertSame($review->product_id, $review->product->id);
        $this->assertSame($review->user_id, $review->user->id);
        $this->assertSame($review->order_id, $review->order->id);
    }

    public function test_product_relations_separate_approved_reviews(): void
    {
        $product = Product::factory()->create();
        $user = User::factory()->create();
        $orderA = Order::factory()->create(['user_id' => $user->id]);
        $orderB = Order::factory()->create(['user_id' => $user->id]);

        ProductReview::create(['product_id' => $product->id, 'user_id' => $user->id, 'order_id' => $orderA->id, 'rating' => 5, 'is_approved' => true]);
        ProductReview::create(['product_id' => $product->id, 'user_id' => $user->id, 'order_id' => $orderB->id, 'rating' => 4, 'is_approved' => false]);

        $this->assertSame(2, $product->reviews()->count());
        $this->assertSame(1, $product->approvedReviews()->count());
    }
}
