<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GuestOrderTrackingTest extends TestCase
{
    use RefreshDatabase;

    private function orderFor(User $user): Order
    {
        return Order::factory()->create([
            'user_id' => $user->id,
            'order_number' => 'INV/TRACK/001',
            'phone' => '081234567890',
        ]);
    }

    public function test_guest_can_track_order_with_matching_email(): void
    {
        $user = User::factory()->create(['email' => 'buyer@example.test']);
        $this->orderFor($user);

        $response = $this->getJson('/api/orders/track/INV/TRACK/001?email=buyer@example.test');

        $response->assertStatus(200)
            ->assertJsonPath('data.order_number', 'INV/TRACK/001');
    }

    public function test_guest_can_track_order_with_matching_phone(): void
    {
        $user = User::factory()->create(['email' => 'buyer2@example.test']);
        $this->orderFor($user);

        $this->getJson('/api/orders/track/INV/TRACK/001?phone=0812-3456-7890')
            ->assertStatus(200)
            ->assertJsonPath('data.order_number', 'INV/TRACK/001');
    }

    public function test_tracking_rejected_with_wrong_contact(): void
    {
        $user = User::factory()->create(['email' => 'buyer3@example.test']);
        $this->orderFor($user);

        $this->getJson('/api/orders/track/INV/TRACK/001?email=wrong@example.test')
            ->assertStatus(404);
    }

    public function test_tracking_requires_email_or_phone(): void
    {
        $user = User::factory()->create(['email' => 'buyer4@example.test']);
        $this->orderFor($user);

        $this->getJson('/api/orders/track/INV/TRACK/001')
            ->assertStatus(422);
    }
}
