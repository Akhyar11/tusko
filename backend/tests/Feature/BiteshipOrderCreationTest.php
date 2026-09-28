<?php

namespace Tests\Feature;

use App\Models\Expedition;
use App\Models\ExpeditionService;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Shipment;
use App\Models\User;
use App\Services\IntegrationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class BiteshipOrderCreationTest extends TestCase
{
    use RefreshDatabase;

    private function configureBiteship(): void
    {
        $integrations = app(IntegrationService::class);
        $integrations->set('shipping.provider', 'biteship', 'shipping');
        $integrations->set('shipping.biteship_base_url', 'https://api.biteship.test', 'shipping');
        $integrations->set('shipping.biteship_api_key', 'biteship_test_key', 'shipping', true);
    }

    private function makeOrder(): Order
    {
        $expedition = Expedition::create([
            'name' => 'JNE Express',
            'code' => 'jne',
            'service' => 'Reguler',
            'category' => 'Reguler',
            'etd' => '2-3 hari',
            'base_cost' => 12000,
            'cost' => 12000,
            'is_active' => true,
        ]);

        $service = ExpeditionService::create([
            'expedition_id' => $expedition->id,
            'service_code' => 'reg',
            'service_name' => 'JNE Reguler',
            'etd_days' => '2-3 hari',
            'base_rate' => 12000,
            'per_kg_rate' => 0,
            'is_active' => true,
        ]);

        $order = Order::factory()->paid()->create([
            'expedition_id' => $expedition->id,
            'expedition_service_id' => $service->id,
            'expedition_service' => 'JNE Reguler',
            'recipient_name' => 'Budi Santoso',
            'phone' => '081234567890',
            'full_address' => 'Jl. Merdeka No. 1',
            'postal_code' => '12950',
        ]);

        OrderItem::factory()->create(['order_id' => $order->id]);

        return $order;
    }

    private function actingAsAdmin(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'admin', 'is_active' => true]));
    }

    public function test_creates_biteship_order_and_shipment(): void
    {
        $this->configureBiteship();
        $this->actingAsAdmin();
        $order = $this->makeOrder();

        Http::fake([
            'https://api.biteship.test/v1/orders' => Http::response([
                'success' => true,
                'id' => 'bsh_order_123',
                'courier_waybill_id' => 'JNE-999',
                'courier_tracking_id' => 'TRK-999',
                'courier_company' => 'jne',
                'courier_type' => 'reg',
                'status' => 'confirmed',
            ], 200),
        ]);

        $this->postJson("/api/admin/orders/{$order->id}/shipment")
            ->assertStatus(201)
            ->assertJsonPath('data.provider', 'biteship')
            ->assertJsonPath('data.provider_order_id', 'bsh_order_123')
            ->assertJsonPath('data.waybill_number', 'JNE-999');

        $this->assertDatabaseHas('shipments', [
            'order_id' => $order->id,
            'provider' => 'biteship',
            'provider_order_id' => 'bsh_order_123',
            'provider_waybill_id' => 'JNE-999',
        ]);

        Http::assertSent(function ($request) {
            return str_contains($request->url(), '/v1/orders')
                && $request->hasHeader('Authorization', 'biteship_test_key')
                && $request['courier_company'] === 'jne'
                && $request['courier_type'] === 'reg'
                && $request['destination_contact_name'] === 'Budi Santoso'
                && (int) $request['items'][0]['weight'] >= 1;
        });
    }

    public function test_second_booking_reuses_existing_shipment(): void
    {
        $this->configureBiteship();
        $this->actingAsAdmin();
        $order = $this->makeOrder();

        Http::fake([
            'https://api.biteship.test/v1/orders' => Http::response([
                'success' => true,
                'id' => 'bsh_order_123',
                'courier_waybill_id' => 'JNE-999',
                'status' => 'confirmed',
            ], 200),
        ]);

        $this->postJson("/api/admin/orders/{$order->id}/shipment")->assertStatus(201);
        $this->postJson("/api/admin/orders/{$order->id}/shipment")->assertStatus(201);

        $this->assertSame(1, Shipment::where('order_id', $order->id)->count());
    }

    public function test_rejects_when_biteship_not_configured(): void
    {
        $this->actingAsAdmin();
        $order = $this->makeOrder();

        $this->postJson("/api/admin/orders/{$order->id}/shipment")
            ->assertStatus(422)
            ->assertJsonPath('status', 'error');
    }

    public function test_non_admin_cannot_create_shipment(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'customer', 'is_active' => true]));
        $order = $this->makeOrder();

        $this->postJson("/api/admin/orders/{$order->id}/shipment")->assertStatus(403);
    }
}
