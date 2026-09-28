<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Product;
use App\Models\Expedition;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class TurnstileGuardTest extends TestCase
{
    use RefreshDatabase;

    private function enable(string $hostname = 'toko.test'): void
    {
        config()->set('services.turnstile.enabled', true);
        config()->set('services.turnstile.secret', 'test-secret');
        config()->set('services.turnstile.verify_url', 'https://turnstile.test/siteverify');
        config()->set('services.turnstile.hostnames', [$hostname]);
    }

    private function fakeSuccess(string $action, string $hostname = 'toko.test'): void
    {
        Http::fake([
            'turnstile.test/*' => Http::response([
                'success' => true,
                'action' => $action,
                'hostname' => $hostname,
            ], 200),
        ]);
    }

    public function test_register_rejected_without_token_when_enabled(): void
    {
        $this->enable();

        $this->postJson('/api/auth/register', [
            'name' => 'Bot',
            'email' => 'bot@example.com',
            'password' => 'secret123',
            'password_confirmation' => 'secret123',
        ])->assertForbidden();
    }

    public function test_register_passes_with_valid_token(): void
    {
        $this->enable();
        $this->fakeSuccess('register');

        $this->postJson('/api/auth/register', [
            'name' => 'Manusia',
            'email' => 'manusia@example.com',
            'password' => 'secret123',
            'password_confirmation' => 'secret123',
            'cf_turnstile_response' => 'valid-token',
        ])->assertCreated();
    }

    public function test_login_rejected_without_token_when_enabled(): void
    {
        $this->enable();

        User::factory()->create(['email' => 'user@example.com', 'password' => bcrypt('secret123')]);

        $this->postJson('/api/auth/login', [
            'email' => 'user@example.com',
            'password' => 'secret123',
        ])->assertForbidden();
    }

    public function test_checkout_rejected_without_token_when_enabled(): void
    {
        $this->enable();

        $user = User::factory()->create();
        $product = Product::factory()->create(['name' => 'Produk Bot', 'price' => 100000, 'stock' => 10]);
        $expedition = Expedition::factory()->create(['name' => 'JNE', 'service' => 'REG', 'cost' => 10000]);

        // Payload VALID agar lolos validasi FormRequest lalu ditolak gerbang Turnstile (403).
        $this->actingAs($user)->postJson('/api/checkout', [
            'items' => [['product_id' => $product->id, 'quantity' => 1]],
            'recipient_name' => 'Pembeli Bot',
            'phone' => '081200000020',
            'full_address' => 'Jl. Bot No. 20',
            'expedition_id' => $expedition->id,
            'payment_method' => 'manual_transfer',
            'payment_channel' => 'manual_bca',
        ])->assertForbidden();
    }

    public function test_voucher_validate_rejected_without_token_when_enabled(): void
    {
        $this->enable();

        $this->postJson('/api/vouchers/validate', [
            'code' => 'HEMAT10',
        ])->assertForbidden();
    }

    public function test_guards_bypassed_when_disabled(): void
    {
        config()->set('services.turnstile.enabled', false);

        $this->postJson('/api/auth/login', [
            'email' => 'nobody@example.com',
            'password' => 'wrong',
        ])->assertStatus(401);
    }

    public function test_voucher_claim_rejected_without_token_when_enabled(): void
    {
        $this->enable();

        $user = User::factory()->create();
        \App\Models\Voucher::create([
            'code' => 'BOTGARD',
            'title' => 'Voucher Bot',
            'discount_type' => 'fixed',
            'discount_value' => 10000,
            'is_active' => true,
        ]);

        $this->actingAs($user)->postJson('/api/vouchers/claim', [
            'code' => 'BOTGARD',
        ])->assertForbidden();
    }

    public function test_review_rejected_without_token_when_enabled(): void
    {
        $this->enable();

        $user = User::factory()->create();
        $product = Product::factory()->create(['price' => 50000, 'stock' => 5]);
        $order = \App\Models\Order::factory()->create([
            'user_id' => $user->id,
            'status' => 'completed',
            'payment_status' => 'paid',
            'grand_total' => 50000,
        ]);

        $this->actingAs($user)->postJson('/api/reviews', [
            'product_id' => $product->id,
            'order_id' => $order->id,
            'rating' => 5,
            'comment' => 'Bot review',
        ])->assertForbidden();
    }
}
