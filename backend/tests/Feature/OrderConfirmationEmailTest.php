<?php

namespace Tests\Feature;

use App\Mail\OrderConfirmationMail;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class OrderConfirmationEmailTest extends TestCase
{
    use RefreshDatabase;

    public function test_checkout_automatically_sends_order_confirmation_email(): void
    {
        Mail::fake();

        $user = User::factory()->create([
            'email' => 'pembeli@tokoonline.test',
        ]);
        $product = Product::factory()->create([
            'name' => 'Jaket Hoodie',
            'price' => 175000,
            'stock' => 10,
        ]);

        $payload = [
            'items' => [
                ['product_id' => $product->id, 'quantity' => 1],
            ],
            'recipient_name' => 'Ahmad Fauzi',
            'phone' => '081234567890',
            'full_address' => 'Jl. Kebon Jeruk No. 12',
            'expedition_name' => 'JNE Express',
            'expedition_service' => 'REG',
            'shipping_cost' => 15000,
            'payment_method' => 'midtrans',
        ];

        $response = $this->actingAs($user)->postJson('/api/checkout', $payload);

        $response->assertCreated();

        Mail::assertSent(OrderConfirmationMail::class, function ($mail) use ($user) {
            return $mail->hasTo($user->email);
        });
    }

    public function test_can_manually_trigger_send_confirmation_email(): void
    {
        Mail::fake();

        $user = User::factory()->create(['email' => 'user.lama@tokoonline.test']);
        $order = Order::factory()->create([
            'user_id' => $user->id,
            'order_number' => 'INV/20260907/TK/445566',
        ]);

        $response = $this->postJson("/api/orders/{$order->order_number}/send-confirmation-email", [
            'email' => 'user.baru@tokoonline.test',
        ]);

        $response->assertOk()
            ->assertJsonPath('data.recipient_email', 'user.baru@tokoonline.test');

        Mail::assertSent(OrderConfirmationMail::class, function ($mail) {
            return $mail->hasTo('user.baru@tokoonline.test');
        });
    }

    public function test_order_confirmation_mail_renders_correctly(): void
    {
        $product = Product::factory()->create(['name' => 'Kamera Mirrorless']);
        $order = Order::factory()->create([
            'order_number' => 'INV/20260907/TK/999111',
            'recipient_name' => 'Dewi Sartika',
            'full_address' => 'Jl. Cihampelas No. 88, Bandung',
            'subtotal' => 5000000,
            'grand_total' => 5025000,
        ]);

        OrderItem::factory()->create([
            'order_id' => $order->id,
            'product_id' => $product->id,
            'product_name' => 'Kamera Mirrorless',
            'quantity' => 1,
            'product_price' => 5000000,
            'subtotal' => 5000000,
        ]);

        $mailable = new OrderConfirmationMail($order);

        $mailable->assertSeeInHtml('INV/20260907/TK/999111');
        $mailable->assertSeeInHtml('Dewi Sartika');
        $mailable->assertSeeInHtml('Kamera Mirrorless');
        $mailable->assertHasSubject('Konfirmasi Pesanan [INV/20260907/TK/999111] - Toko Online');
    }
}
