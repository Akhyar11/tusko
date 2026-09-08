<?php

namespace Database\Factories;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Product>
 */
class ProductFactory extends Factory
{
    protected $model = Product::class;

    public function definition(): array
    {
        $name = fake()->unique()->words(3, true);

        return [
            'category_id' => Category::factory(),
            'name' => ucfirst($name),
            'slug' => Str::slug($name),
            'description' => fake()->paragraph(),
            'price' => fake()->randomFloat(2, 50000, 5000000),
            'stock' => fake()->numberBetween(0, 100),
            'stock_minimum' => 5,
            'weight' => 1000,
            'status' => 'active',
            'image_url' => fake()->imageUrl(640, 480, 'technics'),
            'active' => true,
        ];
    }
}
