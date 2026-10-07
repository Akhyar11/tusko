<?php

namespace Tests\Feature;

use App\Models\PaymentMethod;
use App\Models\User;
use App\Services\IntegrationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * T07.6 — Payment methods API (katalog dinamis untuk checkout).
 * T07.12 — Master metode pembayaran DB + admin fee per kanal.
 */
class PaymentMethodApiTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::factory()->create(['role' => 'admin']);
    }

    private function seedMaster(): void
    {
        PaymentMethod::create([
            'code' => 'bca_va', 'name' => 'BCA Virtual Account',
            'category' => 'Virtual Account', 'type' => 'midtrans',
            'fee_percent' => 0, 'fee_fixed' => 4000, 'is_active' => true, 'sort_order' => 10,
        ]);
        PaymentMethod::create([
            'code' => 'qris', 'name' => 'QRIS',
            'category' => 'QRIS & E-Wallet', 'type' => 'midtrans',
            'fee_percent' => 0.7, 'fee_fixed' => 0, 'is_active' => true, 'sort_order' => 20,
        ]);
    }

    public function test_returns_manual_methods_from_integrations_and_excludes_midtrans_when_disabled(): void
    {
        $this->seedMaster();
        app(IntegrationService::class)->set(
            'payment.manual_banks',
            json_encode([['code' => 'BCA', 'bank_name' => 'BCA', 'account_number' => '123', 'account_holder' => 'PT Tusko']]),
            'payment'
        );

        $response = $this->getJson('/api/payment-methods')->assertOk();

        $response->assertJsonPath('data.midtrans_enabled', false);
        $response->assertJsonPath('data.manual_banks.0.code', 'BCA');

        $categories = collect($response->json('data.categories'));
        $methods = $categories->flatMap(fn ($c) => $c['methods']);

        $this->assertTrue($methods->contains(fn ($m) => $m['type'] === 'manual'), 'manual method missing');
        $this->assertFalse($methods->contains(fn ($m) => $m['type'] === 'midtrans'), 'midtrans method should be excluded');
    }

    public function test_includes_midtrans_methods_when_configured(): void
    {
        $this->seedMaster();
        app(IntegrationService::class)->set('payment.midtrans_server_key', 'SB-Mid-server-TEST', 'payment', true);

        $response = $this->getJson('/api/payment-methods')->assertOk();

        $response->assertJsonPath('data.midtrans_enabled', true);

        $methods = collect($response->json('data.categories'))->flatMap(fn ($c) => $c['methods']);
        $this->assertTrue($methods->contains(fn ($m) => $m['id'] === 'bca_va'), 'BCA VA missing');
        $this->assertTrue($methods->contains(fn ($m) => $m['id'] === 'qris'), 'QRIS missing');

        $bca = $methods->firstWhere('id', 'bca_va');
        $this->assertEquals(4000, $bca['fee_fixed']);
        $qris = $methods->firstWhere('id', 'qris');
        $this->assertEquals(0.7, $qris['fee_percent']);
    }

    public function test_public_catalog_hides_inactive_methods(): void
    {
        app(IntegrationService::class)->set('payment.midtrans_server_key', 'test-key', 'payment');
        $this->seedMaster();
        PaymentMethod::where('code', 'qris')->update(['is_active' => false]);

        $response = $this->getJson('/api/payment-methods');
        $response->assertOk();

        $codes = collect($response->json('data.categories'))->flatMap(fn ($c) => $c['methods'])->pluck('id')->all();
        $this->assertContains('bca_va', $codes);
        $this->assertNotContains('qris', $codes);
    }

    public function test_admin_can_crud_payment_method(): void
    {
        $admin = $this->admin();

        // Create dengan kode semantik.
        $create = $this->actingAs($admin)->postJson('/api/admin/payment-methods', [
            'code' => 'gopay',
            'name' => 'GoPay E-Wallet',
            'category' => 'E-Wallet',
            'type' => 'midtrans',
            'fee_percent' => 2,
            'fee_fixed' => 0,
        ]);
        $create->assertCreated();
        $id = $create->json('data.id');
        $this->assertEquals('gopay', $create->json('data.code'));

        // Kode duplikat ditolak.
        $this->actingAs($admin)->postJson('/api/admin/payment-methods', [
            'code' => 'gopay', 'name' => 'Duplikat', 'type' => 'midtrans',
        ])->assertStatus(422);

        // Update fee.
        $update = $this->actingAs($admin)->putJson("/api/admin/payment-methods/{$id}", [
            'code' => 'gopay',
            'name' => 'GoPay E-Wallet',
            'category' => 'E-Wallet',
            'type' => 'midtrans',
            'fee_percent' => 2.5,
            'fee_fixed' => 1000,
        ]);
        $update->assertOk();
        $this->assertEquals(2.5, $update->json('data.fee_percent'));

        // Toggle status.
        $toggle = $this->actingAs($admin)->postJson("/api/admin/payment-methods/{$id}/toggle-status");
        $toggle->assertOk();
        $this->assertFalse($toggle->json('data.is_active'));

        // Estimate fee via model.
        $method = PaymentMethod::find($id);
        $this->assertEquals(3500.0, $method->estimateFee(100000));

        // Delete.
        $this->actingAs($admin)->deleteJson("/api/admin/payment-methods/{$id}")->assertOk();
        $this->assertDatabaseMissing('payment_methods', ['id' => $id]);
    }

    public function test_guest_cannot_access_admin_endpoints(): void
    {
        $this->getJson('/api/admin/payment-methods')->assertStatus(401);
        $this->postJson('/api/admin/payment-methods', [])->assertStatus(401);
    }

    public function test_admin_index_supports_search_and_filter(): void
    {
        $admin = $this->admin();
        PaymentMethod::create([
            'code' => 'bca_va', 'name' => 'BCA Virtual Account',
            'category' => 'Virtual Account', 'type' => 'midtrans', 'is_active' => true,
        ]);
        PaymentMethod::create([
            'code' => 'manual_bca', 'name' => 'Transfer BCA Manual',
            'category' => 'Transfer Manual', 'type' => 'manual', 'is_active' => true,
        ]);

        $response = $this->actingAs($admin)->getJson('/api/admin/payment-methods?type=manual&search=bca');
        $response->assertOk();
        $this->assertEquals(1, $response->json('meta.total'));
        $this->assertEquals('manual_bca', $response->json('data.0.code'));
        $this->assertEquals(2, $response->json('summary.total_count'));
    }
}
