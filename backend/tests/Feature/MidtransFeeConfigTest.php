<?php

namespace Tests\Feature;

use App\Http\Controllers\Api\MidtransWebhookController;
use App\Services\IntegrationService;
use App\Services\JournalMappingService;
use App\Services\Settings\SettingsRegistry;
use App\Services\Settings\SettingsService;
use App\Models\Order;
use App\Models\FinancialLedgerEntry;
use App\Models\Transaction;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Database\Seeders\MasterReferenceSeeder;
use ReflectionMethod;
use Tests\TestCase;

/**
 * Fee transaksi Midtrans: konfigurabel admin + tercatat (kas & jurnal).
 */
class MidtransFeeConfigTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(MasterReferenceSeeder::class);
    }

    public function test_registry_has_midtrans_fee_keys(): void
    {
        $keys = SettingsRegistry::keys('payment');

        $this->assertArrayHasKey('payment.midtrans_fee_percent', $keys);
        $this->assertArrayHasKey('payment.midtrans_fee_fixed', $keys);
        $this->assertFalse($keys['payment.midtrans_fee_percent']['is_secret']);
        $this->assertFalse($keys['payment.midtrans_fee_fixed']['is_secret']);
    }

    public function test_admin_can_store_fee_settings(): void
    {
        app(SettingsService::class)->setGroup('payment', [
            'payment.midtrans_fee_percent' => '0.7',
            'payment.midtrans_fee_fixed' => '500',
        ]);

        $values = app(SettingsService::class)->all('payment');
        $this->assertSame('0.7', $values['payment.midtrans_fee_percent']);
        $this->assertSame('500', $values['payment.midtrans_fee_fixed']);
    }

    public function test_gateway_fee_is_calculated_from_admin_config(): void
    {
        app(IntegrationService::class)->set('payment.midtrans_fee_percent', '0.7', 'payment');
        app(IntegrationService::class)->set('payment.midtrans_fee_fixed', '500', 'payment');

        $controller = app(MidtransWebhookController::class);
        $method = new ReflectionMethod($controller, 'calculateGatewayFee');
        $method->setAccessible(true);

        // 100.000 * 0.7% + 500 = 1.200
        $this->assertSame(1200.0, (float) $method->invoke($controller, 100000.0));
    }

    public function test_gateway_fee_posts_balanced_journal_and_records_amounts(): void
    {
        $order = Order::factory()->create([
            'status' => 'pending',
            'payment_status' => 'pending',
            'grand_total' => 200000,
        ]);

        $entries = app(JournalMappingService::class)->postPaymentGatewayFee($order, 1400.0);
        $this->assertNotNull($entries);

        $codes = collect($entries)->map(fn ($e) => $e->account->account_code)->sort()->values()->all();
        $this->assertSame(['1200', '6200'], $codes);
        $this->assertSame(1400.0, (float) collect($entries)->sum('debit'));
        $this->assertSame(1400.0, (float) collect($entries)->sum('credit'));

        $container = Transaction::where('reference_type', 'order_gateway_fee')->firstOrFail();
        $this->assertSame($order->order_number, $container->reference_code);
        $this->assertSame(1400.0, (float) $container->amount);
    }
}
