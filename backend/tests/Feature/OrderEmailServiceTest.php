<?php

namespace Tests\Feature;

use App\Mail\OrderConfirmationMail;
use App\Models\EmailLog;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;
use App\Services\OrderEmailService;
use Exception;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class OrderEmailServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_order_email_service_sends_email_and_logs_to_database(): void
    {
        Mail::fake();

        $user = User::factory()->create(['email' => 'customer@tusko.id']);
        $order = Order::factory()->create([
            'user_id' => $user->id,
            'order_number' => 'INV/20260908/TK/889900',
        ]);

        $service = app(OrderEmailService::class);
        $result = $service->sendOrderConfirmation($order);

        $this->assertTrue($result);

        Mail::assertSent(OrderConfirmationMail::class, function ($mail) use ($user) {
            return $mail->hasTo($user->email);
        });

        $this->assertDatabaseHas('email_logs', [
            'order_id' => $order->id,
            'email_type' => 'confirmation',
            'recipient_email' => 'customer@tusko.id',
            'status' => 'sent',
        ]);
    }

    public function test_order_email_service_respects_custom_recipient_email(): void
    {
        Mail::fake();

        $order = Order::factory()->create([
            'order_number' => 'INV/20260908/TK/113355',
        ]);

        $customEmail = 'alternative@receiver.com';
        $service = app(OrderEmailService::class);
        $result = $service->sendOrderConfirmation($order, $customEmail);

        $this->assertTrue($result);

        Mail::assertSent(OrderConfirmationMail::class, function ($mail) use ($customEmail) {
            return $mail->hasTo($customEmail);
        });

        $this->assertDatabaseHas('email_logs', [
            'order_id' => $order->id,
            'recipient_email' => $customEmail,
            'status' => 'sent',
        ]);
    }

    public function test_order_email_service_handles_invalid_or_missing_email_gracefully(): void
    {
        Mail::fake();

        $order = Order::factory()->create([
            'user_id' => null,
            'order_number' => 'INV/20260908/TK/998877',
        ]);

        $service = app(OrderEmailService::class);
        $result = $service->sendOrderConfirmation($order, 'not-an-email');

        $this->assertFalse($result);
        Mail::assertNothingSent();
    }
}
