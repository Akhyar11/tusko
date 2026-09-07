<?php

namespace Database\Factories;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\OrderItem>
 */
class OrderItemFactory extends Factory
{
    protected $model = OrderItem::class;

    public function definition(): array
    {
        return [
            'order_id' => Order::factory(),
            'product_id' => Product::factory(),
            'product_name' => fake()->words(3, true),
            'product_slug' => fake()->slug(),
            'product_image' => 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
            'product_price' => 50000,
            'product_weight' => 0.5,
            'quantity' => 2,
            'subtotal' => 100000,
            'notes' => fake()->optional()->sentence(),
        ];
    }
}
