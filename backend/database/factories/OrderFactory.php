<?php

namespace Database\Factories;

use App\Models\Order;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Order>
 */
class OrderFactory extends Factory
{
    protected $model = Order::class;

    public function definition(): array
    {
        return [
            'order_number' => Order::generateOrderNumber(),
            'user_id' => User::factory(),
            'guest_session_id' => null,
            'status' => 'pending',
            'payment_status' => 'pending',
            'payment_method' => 'midtrans',
            'payment_channel' => 'bca_va',
            'va_number' => '8808' . fake()->numerify('##########'),
            'recipient_name' => fake()->name(),
            'phone_number' => '08123456789',
            'full_address' => fake()->address(),
            'province' => 'DKI Jakarta',
            'city' => 'Jakarta Selatan',
            'district' => 'Kebayoran Baru',
            'postal_code' => '12160',
            'address_label' => 'Rumah',
            'expedition_name' => 'J&T Express',
            'expedition_service' => 'EZ (Reguler)',
            'expedition_etd' => '2-3 hari',
            'subtotal' => 150000,
            'shipping_cost' => 10000,
            'insurance_cost' => 1000,
            'service_fee' => 1000,
            'discount_amount' => 0,
            'grand_total' => 162000,
            'total_weight' => 1.0,
            'notes' => fake()->sentence(),
        ];
    }

    public function paid(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'processing',
            'payment_status' => 'paid',
            'paid_at' => now(),
        ]);
    }

    public function shipped(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'shipped',
            'payment_status' => 'paid',
            'tracking_number' => 'JT' . fake()->numerify('##########'),
            'paid_at' => now()->subDay(),
            'shipped_at' => now(),
        ]);
    }
}
