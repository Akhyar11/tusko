<?php

namespace Tests\Feature;

use App\Models\PaymentGatewaySetting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PaymentGatewaySettingApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_get_payment_gateway_settings(): void
    {
        $response = $this->getJson('/api/payment-settings');

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonStructure([
                'status',
                'message',
                'data' => [
                    'id',
                    'gateway_name',
                    'payment_mode',
                    'is_production',
                    'merchant_id',
                    'client_key',
                    'expiry_duration_hours',
                    'enable_va',
                    'enable_qris',
                    'enable_cc',
                    'is_active',
                    'has_server_key',
                    'snap_script_url',
                ],
            ]);

        $this->assertDatabaseCount('payment_gateway_settings', 1);
    }

    public function test_can_update_payment_gateway_mode_and_settings(): void
    {
        $payload = [
            'payment_mode' => 'store_custom',
            'is_production' => false,
            'merchant_id' => 'MERCHANT-TEST-99',
            'client_key' => 'SB-Mid-client-custom-key-123',
            'server_key' => 'SB-Mid-server-custom-key-456',
            'expiry_duration_hours' => 48,
            'enable_va' => true,
            'enable_qris' => false,
            'enable_cc' => true,
            'is_active' => true,
        ];

        $response = $this->putJson('/api/payment-settings', $payload);

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.payment_mode', 'store_custom')
            ->assertJsonPath('data.merchant_id', 'MERCHANT-TEST-99')
            ->assertJsonPath('data.expiry_duration_hours', 48)
            ->assertJsonPath('data.enable_qris', false);

        $this->assertDatabaseHas('payment_gateway_settings', [
            'payment_mode' => 'store_custom',
            'merchant_id' => 'MERCHANT-TEST-99',
            'client_key' => 'SB-Mid-client-custom-key-123',
            'server_key' => 'SB-Mid-server-custom-key-456',
            'expiry_duration_hours' => 48,
            'enable_qris' => false,
        ]);
    }

    public function test_validates_payment_mode_on_update(): void
    {
        $response = $this->putJson('/api/payment-settings', [
            'payment_mode' => 'invalid_mode',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['payment_mode']);
    }
}
