<?php

namespace Database\Factories;

use App\Models\Expedition;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Expedition>
 */
class ExpeditionFactory extends Factory
{
    protected $model = Expedition::class;

    public function definition(): array
    {
        return [
            'name' => fake()->company(),
            'code' => strtoupper(fake()->lexify('???')),
            'service' => 'Reguler',
            'category' => 'Reguler',
            'etd' => '2-3 hari',
            'base_cost' => 10000,
            'cost' => 10000,
            'is_free' => false,
            'is_active' => true,
            'badge' => null,
            'description' => fake()->sentence(),
            'tracking_support' => true,
        ];
    }
}
