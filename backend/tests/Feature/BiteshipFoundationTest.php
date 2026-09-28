<?php

namespace Tests\Feature;

use App\Models\Integration;
use App\Models\ShippingWebhookEvent;
use App\Services\Settings\SettingsRegistry;
use App\Services\Settings\SettingsService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class BiteshipFoundationTest extends TestCase
{
    use RefreshDatabase;

    public function test_registry_offers_biteship_provider_option(): void
    {
        $provider = SettingsRegistry::get('shipping.provider');

        $this->assertContains('biteship', $provider['options']);
        $this->assertStringContainsString('biteship', $provider['rule']);
    }

    public function test_registry_contains_biteship_keys_with_secrets(): void
    {
        foreach ([
            'shipping.biteship_base_url',
            'shipping.biteship_api_key',
            'shipping.biteship_webhook_signature_key',
            'shipping.biteship_webhook_signature_secret',
            'shipping.biteship_origin_area_id',
            'shipping.biteship_origin_postal_code',
            'shipping.biteship_default_delivery_type',
            'shipping.biteship_couriers',
        ] as $key) {
            $this->assertTrue(SettingsRegistry::has($key), "Key {$key} tidak terdaftar.");
        }

        $this->assertTrue(SettingsRegistry::isSecret('shipping.biteship_api_key'));
        $this->assertTrue(SettingsRegistry::isSecret('shipping.biteship_webhook_signature_secret'));
        $this->assertFalse(SettingsRegistry::isSecret('shipping.biteship_base_url'));
        $this->assertNull(SettingsRegistry::default('shipping.biteship_base_url'));
    }

    public function test_settings_service_masks_biteship_api_key(): void
    {
        $service = app(SettingsService::class);
        $service->setGroup('shipping', ['shipping.biteship_api_key' => 'biteship_test_secret']);

        $this->assertSame('biteship_test_secret', $service->all('shipping')['shipping.biteship_api_key']);
        $this->assertSame(SettingsService::SECRET_MASK, $service->maskedGroup('shipping')['shipping.biteship_api_key']);

        // Nilai tersimpan terenkripsi di kolom value (bukan plaintext).
        $raw = \Illuminate\Support\Facades\DB::table('integrations')
            ->where('key', 'shipping.biteship_api_key')
            ->value('value');
        $this->assertNotSame('biteship_test_secret', $raw);
        $this->assertSame('biteship_test_secret', Integration::where('key', 'shipping.biteship_api_key')->first()->value);
    }

    public function test_migration_adds_biteship_area_columns(): void
    {
        $this->assertTrue(Schema::hasColumn('warehouses', 'biteship_area_id'));
        $this->assertTrue(Schema::hasColumn('shipping_addresses', 'biteship_area_id'));
    }

    public function test_migration_adds_provider_columns_to_shipments(): void
    {
        foreach ([
            'provider',
            'provider_order_id',
            'provider_waybill_id',
            'provider_tracking_id',
            'provider_status',
            'provider_label_url',
            'provider_tracking_url',
            'courier_company',
            'courier_type',
            'provider_payload',
        ] as $column) {
            $this->assertTrue(Schema::hasColumn('shipments', $column), "Kolom shipments.{$column} tidak ada.");
        }
    }

    public function test_shipping_webhook_events_table_and_model(): void
    {
        $this->assertTrue(Schema::hasTable('shipping_webhook_events'));

        $event = ShippingWebhookEvent::create([
            'provider' => 'biteship',
            'event' => 'order.status',
            'external_id' => 'order-123',
            'payload' => ['status' => 'confirmed'],
            'payload_hash' => hash('sha256', 'order-123'),
            'signature_valid' => true,
            'status' => 'processed',
        ]);

        $this->assertSame('biteship', $event->fresh()->provider);
        $this->assertIsArray($event->fresh()->payload);
        $this->assertTrue($event->fresh()->signature_valid);
    }
}
