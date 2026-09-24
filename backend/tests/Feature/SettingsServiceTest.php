<?php

namespace Tests\Feature;

use App\Models\ActivityLog;
use App\Services\Settings\SettingsService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class SettingsServiceTest extends TestCase
{
    use RefreshDatabase;

    private function service(): SettingsService
    {
        return app(SettingsService::class);
    }

    public function test_set_and_get_casts_types(): void
    {
        $changes = $this->service()->setGroup('loyalty', [
            'loyalty.points_expiry_months' => 24,
        ]);

        $this->assertArrayHasKey('loyalty.points_expiry_months', $changes);
        $this->assertSame(24, $this->service()->get('loyalty.points_expiry_months'));

        $this->service()->setGroup('payment', ['payment.is_production' => true]);
        $this->assertTrue($this->service()->get('payment.is_production'));

        $this->service()->setGroup('payment', ['payment.is_production' => false]);
        $this->assertFalse($this->service()->get('payment.is_production'));
    }

    public function test_secret_is_masked_on_read_but_available_internally(): void
    {
        $this->service()->setGroup('shipping', ['shipping.api_key' => 'SECRET-XYZ']);

        $this->assertSame('********', $this->service()->maskedGroup('shipping')['shipping.api_key']);
        $this->assertSame('SECRET-XYZ', $this->service()->all('shipping')['shipping.api_key']);
    }

    public function test_default_resolution_from_registry(): void
    {
        $this->assertSame(3600, $this->service()->get('shipping.rate_cache_ttl'));
        $this->assertSame(12, $this->service()->get('loyalty.points_expiry_months'));
        $this->assertSame('fallback', $this->service()->get('unknown.key', 'fallback'));
    }

    public function test_activity_log_recorded_without_secret_value(): void
    {
        $this->service()->setGroup('shipping', [
            'shipping.base_url' => 'https://api.kiriminaja.test',
            'shipping.api_key' => 'SECRET-ABC-123',
        ], null, '127.0.0.1');

        $log = ActivityLog::where('action', 'settings.updated')->latest('id')->first();
        $this->assertNotNull($log);
        $this->assertSame('shipping', $log->properties['group']);
        $this->assertArrayHasKey('shipping.api_key', $log->properties['changes']);
        $this->assertSame('********', $log->properties['changes']['shipping.api_key']['after']);

        // Nilai secret TIDAK boleh muncul di baris log (raw DB).
        $raw = (string) DB::table('activity_logs')->where('action', 'settings.updated')->value('properties');
        $this->assertStringNotContainsString('SECRET-ABC-123', $raw);
    }

    public function test_ignores_unknown_and_out_of_group_keys(): void
    {
        $changes = $this->service()->setGroup('shipping', [
            'payment.is_production' => true,
            'unknown.key' => 'x',
        ]);

        $this->assertSame([], $changes);
        $this->assertFalse($this->service()->get('payment.is_production'));
    }
}
