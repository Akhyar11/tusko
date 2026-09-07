<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use App\Services\MidtransService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class MidtransIntegrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_checkout_with_midtrans_generates_snap_token(): void
    {
        $user = User::factory()->create();
        $product = Product::factory()->create([
            'name' => 'Headset Bluetooth',
            'price' => 350000,
            'stock' => 10,
        ]);

        $payload = [
            'items' => [
                ['product_id' => $product->id, 'quantity' => 1],
            ],
            'recipient_name' => 'Fajar Pratama',
            'phone' => '081234567890',
            'full_address' => 'Jl. Jenderal Sudirman No. 1',
            'expedition_name' => 'J&T Express',
            'expedition_service' => 'EZ',
            'shipping_cost' => 15000,
            'payment_method' => 'midtrans',
            'payment_channel' => 'gopay',
        ];

        $response = $this->actingAs($user)->postJson('/api/checkout', $payload);

        $response->assertCreated()
            ->assertJsonPath('data.payment_method', 'midtrans');

        $orderNumber = $response->json('data.order_number');
        $this->assertNotNull($orderNumber);

        $order = Order::where('order_number', $orderNumber)->first();
        $this->assertNotNull($order->midtrans_snap_token);
        $this->assertNotNull($order->midtrans_pdf_url);
    }

    public function test_can_fetch_snap_token_via_order_endpoint(): void
    {
        $order = Order::factory()->create([
            'payment_method' => 'midtrans',
            'midtrans_snap_token' => null,
        ]);

        $response = $this->postJson("/api/orders/{$order->order_number}/snap-token");

        $response->assertOk()
            ->assertJsonPath('data.order_number', $order->order_number)
            ->assertJsonStructure(['data' => ['order_number', 'snap_token', 'redirect_url']]);

        $this->assertNotNull($order->fresh()->midtrans_snap_token);
    }

    public function test_midtrans_service_with_http_mock(): void
    {
        $order = Order::factory()->create([
            'order_number' => 'INV/20260907/TK/112233',
            'grand_total' => 500000,
            'payment_method' => 'midtrans',
        ]);

        Http::fake([
            config('midtrans.snap_url') => Http::response([
                'token' => 'real-midtrans-snap-token-abc123xyz',
                'redirect_url' => 'https://app.sandbox.midtrans.com/snap/v2/vtweb/real-midtrans-snap-token-abc123xyz',
            ], 201),
        ]);

        $service = app(MidtransService::class);
        $result = $service->createSnapToken($order);

        $this->assertEquals('real-midtrans-snap-token-abc123xyz', $result['token']);
        $this->assertEquals('real-midtrans-snap-token-abc123xyz', $order->fresh()->midtrans_snap_token);
    }

    public function test_midtrans_service_verify_signature(): void
    {
        $service = app(MidtransService::class);
        $serverKey = config('midtrans.server_key');

        $orderId = 'INV/20260907/TK/112233';
        $statusCode = '200';
        $grossAmount = '500000.00';

        $validSignature = hash('sha512', $orderId . $statusCode . $grossAmount . $serverKey);

        $this->assertTrue($service->verifySignature($orderId, $statusCode, $grossAmount, $validSignature));
        $this->assertFalse($service->verifySignature($orderId, $statusCode, $grossAmount, 'invalid-signature'));
    }
}
