<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use App\Models\Voucher;
use App\Models\VoucherUsage;
use App\Models\Warehouse;
use App\Services\VoucherService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * T15.1b — Siklus pemakaian voucher.
 *
 * Menguji: pencatatan `voucher_usages` + kenaikan `used_count` saat order dibuat,
 * penegakan kuota & batas per-user, idempotensi redeem, serta rollback
 * (`releaseForOrder`) yang idempoten untuk pembatalan order.
 */
class VoucherUsageCycleTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Warehouse::create([
            'code' => 'GDG-VCR-01',
            'name' => 'Gudang Voucher',
            'address' => 'Jl. Voucher',
            'city' => 'Jakarta',
            'province' => 'DKI Jakarta',
            'is_primary' => true,
            'is_active' => true,
        ]);
    }

    private function makeVoucher(array $overrides = []): Voucher
    {
        static $sequence = 0;
        $sequence++;

        return Voucher::create(array_merge([
            'code' => 'HEMAT' . $sequence,
            'title' => 'Voucher Hemat ' . $sequence,
            'discount_type' => 'fixed',
            'discount_value' => 10000,
            'is_active' => true,
        ], $overrides));
    }

    private function checkoutPayload(Product $product, string $code, int $quantity = 1, array $overrides = []): array
    {
        return array_merge([
            'items' => [
                ['product_id' => $product->id, 'quantity' => $quantity],
            ],
            'recipient_name' => 'Pembeli Voucher',
            'phone' => '081200000009',
            'full_address' => 'Jl. Voucher No. 9',
            'expedition_name' => 'JNE',
            'expedition_service' => 'REG',
            'payment_method' => 'manual_transfer',
            'payment_channel' => 'manual_bca',
            'service_fee' => 0,
            'coupon_code' => $code,
        ], $overrides);
    }

    public function test_checkout_with_coupon_records_usage_and_increments_used_count(): void
    {
        $user = User::factory()->create();
        $voucher = $this->makeVoucher(['code' => 'HEMAT10']);
        $product = Product::factory()->create(['price' => 100000, 'stock' => 5]);

        $response = $this->actingAs($user)->postJson('/api/checkout', $this->checkoutPayload($product, 'HEMAT10'));

        $response->assertCreated()
            ->assertJsonPath('data.coupon_code', 'HEMAT10');

        $orderNumber = $response->json('data.order_number');
        $order = Order::where('order_number', $orderNumber)->firstOrFail();

        $this->assertDatabaseHas('voucher_usages', [
            'voucher_id' => $voucher->id,
            'user_id' => $user->id,
            'order_id' => $order->id,
        ]);

        $this->assertSame(1, (int) $voucher->fresh()->used_count);
    }

    public function test_redeem_is_idempotent_for_the_same_order(): void
    {
        $user = User::factory()->create();
        $voucher = $this->makeVoucher();
        $order = Order::factory()->create(['user_id' => $user->id]);

        $service = app(VoucherService::class);

        $first = $service->redeemForOrder($order, $voucher->code, $user);
        $second = $service->redeemForOrder($order, $voucher->code, $user);

        $this->assertNotNull($first);
        $this->assertSame($first->id, $second->id);

        $this->assertSame(1, VoucherUsage::where('order_id', $order->id)->count());
        $this->assertSame(1, (int) $voucher->fresh()->used_count);
    }

    public function test_checkout_rejects_coupon_when_quota_is_exhausted(): void
    {
        $user = User::factory()->create();
        $voucher = $this->makeVoucher(['code' => 'LIMIT1', 'quota' => 1, 'used_count' => 1]);
        $product = Product::factory()->create(['price' => 100000, 'stock' => 5]);

        $response = $this->actingAs($user)->postJson('/api/checkout', $this->checkoutPayload($product, 'LIMIT1'));

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['coupon_code']);

        // Transaksi di-rollback: tidak ada order/usage baru, kuota tetap.
        $this->assertDatabaseCount('orders', 0);
        $this->assertDatabaseCount('voucher_usages', 0);
        $this->assertSame(1, (int) $voucher->fresh()->used_count);
    }

    public function test_checkout_enforces_per_user_limit(): void
    {
        $user = User::factory()->create();
        $voucher = $this->makeVoucher(['code' => 'ONCE', 'per_user_limit' => 1]);

        // Pemakaian pertama oleh user yang sama.
        $previousOrder = Order::factory()->create(['user_id' => $user->id]);
        app(VoucherService::class)->redeemForOrder($previousOrder, $voucher->code, $user);

        $product = Product::factory()->create(['price' => 100000, 'stock' => 5]);

        $response = $this->actingAs($user)->postJson('/api/checkout', $this->checkoutPayload($product, 'ONCE'));

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['coupon_code']);

        $this->assertSame(1, VoucherUsage::where('voucher_id', $voucher->id)->count());
    }

    public function test_checkout_rejects_unknown_coupon_code(): void
    {
        $user = User::factory()->create();
        $product = Product::factory()->create(['price' => 100000, 'stock' => 5]);

        $response = $this->actingAs($user)->postJson('/api/checkout', $this->checkoutPayload($product, 'TIDAKADA'));

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['coupon_code']);

        $this->assertDatabaseCount('orders', 0);
    }

    public function test_release_rolls_back_usage_and_used_count_idempotently(): void
    {
        $user = User::factory()->create();
        $voucher = $this->makeVoucher();
        $order = Order::factory()->create(['user_id' => $user->id]);

        $service = app(VoucherService::class);
        $service->redeemForOrder($order, $voucher->code, $user);

        $this->assertSame(1, (int) $voucher->fresh()->used_count);

        $released = $service->releaseForOrder($order);

        $this->assertSame(1, $released);
        $this->assertSame(0, VoucherUsage::where('order_id', $order->id)->count());
        $this->assertSame(0, (int) $voucher->fresh()->used_count);

        // Idempoten: pemanggilan ulang tidak mengubah apa pun.
        $this->assertSame(0, $service->releaseForOrder($order));
        $this->assertSame(0, (int) $voucher->fresh()->used_count);
    }
}
