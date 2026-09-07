<?php

namespace Tests\Feature;

use App\Mail\OrderStatusNotificationMail;
use App\Models\EmailLog;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\User;
use App\Services\OrderEmailService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class OrderStatusEmailNotificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_updating_order_status_to_shipped_sends_notification_email(): void
    {
        Mail::fake();

        $user = User::factory()->create(['email' => 'buyer@tusko.com']);
        $order = Order::factory()->create([
            'order_number' => 'INV/20260908/TK/556677',
            'user_id' => $user->id,
            'recipient_name' => 'Fajar Nugraha',
            'phone_number' => '081234567890',
            'status' => 'processing',
            'payment_status' => 'paid',
        ]);

        $response = $this->patchJson("/api/orders/{$order->id}/status", [
            'status' => 'shipped',
            'tracking_number' => 'JNE-20260908-ABC123',
        ]);

        $response->assertStatus(200);

        Mail::assertSent(OrderStatusNotificationMail::class, function ($mail) use ($user) {
            return $mail->hasTo($user->email)
                && $mail->status === 'shipped'
                && str_contains($mail->envelope()->subject, 'Pesanan Sedang Dikirim');
        });

        $this->assertDatabaseHas('email_logs', [
            'order_id' => $order->id,
            'email_type' => 'shipping_status',
            'recipient_email' => $user->email,
            'status' => 'sent',
        ]);
    }

    public function test_can_manually_trigger_status_notification_email(): void
    {
        Mail::fake();

        $order = Order::factory()->create([
            'order_number' => 'INV/20260908/TK/888999',
            'recipient_name' => 'Rina Nose',
            'status' => 'completed',
            'payment_status' => 'paid',
        ]);

        $response = $this->postJson("/api/orders/{$order->order_number}/send-status-email", [
            'email' => 'rina.customer@gmail.com',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.status', 'completed');

        Mail::assertSent(OrderStatusNotificationMail::class, function ($mail) {
            return $mail->hasTo('rina.customer@gmail.com')
                && $mail->status === 'completed';
        });

        $this->assertDatabaseHas('email_logs', [
            'order_id' => $order->id,
            'recipient_email' => 'rina.customer@gmail.com',
            'status' => 'sent',
        ]);
    }

    public function test_order_status_mailable_renders_view_properly(): void
    {
        $order = Order::factory()->create([
            'order_number' => 'INV/20260908/TK/112244',
            'recipient_name' => 'Indra Bekti',
            'tracking_number' => 'TRK-TEBET-1002',
            'status' => 'shipped',
            'payment_status' => 'paid',
        ]);

        OrderItem::create([
            'order_id' => $order->id,
            'product_name' => 'Headset Gaming Bluetooth',
            'quantity' => 1,
            'product_price' => 350000,
            'subtotal' => 350000,
        ]);

        $mailable = new OrderStatusNotificationMail($order, 'processing');

        $mailable->assertSeeInHtml('INV/20260908/TK/112244');
        $mailable->assertSeeInHtml('TRK-TEBET-1002');
        $mailable->assertSeeInHtml('Headset Gaming Bluetooth');
        $mailable->assertSeeInHtml('Pesanan Sedang Dikirim');
    }
}
