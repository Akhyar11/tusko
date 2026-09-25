<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Order;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\User;
use App\Models\Voucher;
use App\Models\VoucherTarget;
use App\Models\VoucherUsage;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * T08.2 — Validasi kupon server-authoritative.
 *
 * Menguji min belanja, kuota, batas per-user, cakupan target (produk/varian/kategori),
 * stacking, gratis ongkir, serta perhitungan diskon fixed/persentase + cap `max_discount`.
 */
class VoucherValidationTest extends TestCase
{
    use RefreshDatabase;

    private function makeVoucher(array $overrides = []): Voucher
    {
        static $sequence = 0;
        $sequence++;

        return Voucher::create(array_merge([
            'code' => 'VALID' . $sequence,
            'title' => 'Voucher Validasi ' . $sequence,
            'discount_type' => 'fixed',
            'discount_value' => 10000,
            'is_active' => true,
        ], $overrides));
    }

    public function test_fixed_discount_is_calculated_from_subtotal(): void
    {
        $voucher = $this->makeVoucher(['code' => 'FIX10', 'discount_value' => 10000]);

        $response = $this->postJson('/api/vouchers/validate', [
            'code' => 'FIX10',
            'subtotal' => 100000,
        ]);

        $response->assertOk()
            ->assertJsonPath('data.valid', true)
            ->assertJsonPath('data.discount_amount', 10000)
            ->assertJsonPath('data.free_shipping', false);
    }

    public function test_percentage_discount_respects_max_discount_cap(): void
    {
        $voucher = $this->makeVoucher([
            'code' => 'PCT20',
            'discount_type' => 'percent',
            'discount_value' => 20,
            'max_discount' => 30000,
        ]);

        $response = $this->postJson('/api/vouchers/validate', [
            'code' => 'PCT20',
            'subtotal' => 200000,
        ]);

        // 20% dari 200000 = 40000, dibatasi max_discount 30000.
        $response->assertOk()
            ->assertJsonPath('data.valid', true)
            ->assertJsonPath('data.discount_amount', 30000);
    }

    public function test_min_purchase_not_met_is_invalid(): void
    {
        $this->makeVoucher(['code' => 'MIN150', 'min_purchase' => 150000]);

        $response = $this->postJson('/api/vouchers/validate', [
            'code' => 'MIN150',
            'subtotal' => 100000,
        ]);

        $response->assertOk()
            ->assertJsonPath('data.valid', false)
            ->assertJsonPath('data.discount_amount', 0);
    }

    public function test_quota_exhausted_is_invalid(): void
    {
        $this->makeVoucher(['code' => 'HABIS', 'quota' => 2, 'used_count' => 2]);

        $this->postJson('/api/vouchers/validate', ['code' => 'HABIS', 'subtotal' => 100000])
            ->assertOk()
            ->assertJsonPath('data.valid', false);
    }

    public function test_per_user_limit_is_enforced_for_authenticated_user(): void
    {
        $user = User::factory()->create();
        $voucher = $this->makeVoucher(['code' => 'ONCE', 'per_user_limit' => 1]);

        VoucherUsage::create([
            'voucher_id' => $voucher->id,
            'user_id' => $user->id,
            'order_id' => Order::factory()->create(['user_id' => $user->id])->id,
            'used_at' => now(),
        ]);

        $this->actingAs($user)->postJson('/api/vouchers/validate', ['code' => 'ONCE', 'subtotal' => 100000])
            ->assertOk()
            ->assertJsonPath('data.valid', false);
    }

    public function test_target_coverage_limits_discount_to_matching_items(): void
    {
        $category = Category::factory()->create();
        $productA = Product::factory()->create(['category_id' => $category->id, 'price' => 100000]);
        $productB = Product::factory()->create(['category_id' => $category->id, 'price' => 100000]);

        $voucher = $this->makeVoucher(['code' => 'PRODA', 'discount_value' => 10000]);
        VoucherTarget::create([
            'voucher_id' => $voucher->id,
            'target_type' => 'product',
            'target_id' => $productA->id,
        ]);

        $response = $this->postJson('/api/vouchers/validate', [
            'code' => 'PRODA',
            'items' => [
                ['product_id' => $productA->id, 'quantity' => 1],
                ['product_id' => $productB->id, 'quantity' => 1],
            ],
        ]);

        $response->assertOk()
            ->assertJsonPath('data.valid', true)
            ->assertJsonPath('data.order_subtotal', 200000)
            ->assertJsonPath('data.applicable_subtotal', 100000)
            ->assertJsonPath('data.discount_amount', 10000);
    }

    public function test_target_coverage_without_matching_item_is_invalid(): void
    {
        $productA = Product::factory()->create(['price' => 100000]);
        $productB = Product::factory()->create(['price' => 100000]);

        $voucher = $this->makeVoucher(['code' => 'ONLYA']);
        VoucherTarget::create([
            'voucher_id' => $voucher->id,
            'target_type' => 'product',
            'target_id' => $productA->id,
        ]);

        $this->postJson('/api/vouchers/validate', [
            'code' => 'ONLYA',
            'items' => [
                ['product_id' => $productB->id, 'quantity' => 1],
            ],
        ])->assertOk()->assertJsonPath('data.valid', false);
    }

    public function test_category_target_matches_product_category(): void
    {
        $category = Category::factory()->create();
        $product = Product::factory()->create(['category_id' => $category->id, 'price' => 120000]);

        $voucher = $this->makeVoucher(['code' => 'CATOK']);
        VoucherTarget::create([
            'voucher_id' => $voucher->id,
            'target_type' => 'category',
            'target_id' => $category->id,
        ]);

        $this->postJson('/api/vouchers/validate', [
            'code' => 'CATOK',
            'items' => [
                ['product_id' => $product->id, 'quantity' => 1],
            ],
        ])->assertOk()
            ->assertJsonPath('data.valid', true)
            ->assertJsonPath('data.applicable_subtotal', 120000);
    }

    public function test_variant_target_matches_selected_variant(): void
    {
        $product = Product::factory()->create(['price' => 100000]);
        $variant = ProductVariant::create([
            'product_id' => $product->id,
            'sku' => 'TSK-VAL-VAR-01',
            'variant_name' => 'Merah / L',
            'price' => 110000,
            'stock' => 5,
            'is_active' => true,
        ]);

        $voucher = $this->makeVoucher(['code' => 'VAROK']);
        VoucherTarget::create([
            'voucher_id' => $voucher->id,
            'target_type' => 'variant',
            'target_id' => $variant->id,
        ]);

        $this->postJson('/api/vouchers/validate', [
            'code' => 'VAROK',
            'items' => [
                ['product_id' => $product->id, 'product_variant_id' => $variant->id, 'quantity' => 1],
            ],
        ])->assertOk()
            ->assertJsonPath('data.valid', true)
            ->assertJsonPath('data.applicable_subtotal', 110000);
    }

    public function test_free_shipping_flag_is_returned(): void
    {
        $this->makeVoucher(['code' => 'FREEONG', 'discount_value' => 0, 'is_free_shipping' => true]);

        $this->postJson('/api/vouchers/validate', ['code' => 'FREEONG', 'subtotal' => 50000])
            ->assertOk()
            ->assertJsonPath('data.valid', true)
            ->assertJsonPath('data.free_shipping', true)
            ->assertJsonPath('data.discount_amount', 0);
    }

    public function test_non_stackable_voucher_rejected_when_combined(): void
    {
        $this->makeVoucher(['code' => 'NOSTACK', 'stackable' => false]);

        $this->postJson('/api/vouchers/validate', [
            'code' => 'NOSTACK',
            'subtotal' => 100000,
            'applied_codes' => ['LAIN'],
        ])->assertOk()->assertJsonPath('data.valid', false);

        $this->makeVoucher(['code' => 'STACK', 'stackable' => true]);

        $this->postJson('/api/vouchers/validate', [
            'code' => 'STACK',
            'subtotal' => 100000,
            'applied_codes' => ['LAIN'],
        ])->assertOk()->assertJsonPath('data.valid', true);
    }

    public function test_inactive_or_expired_voucher_is_invalid(): void
    {
        $this->makeVoucher(['code' => 'OFF', 'is_active' => false]);
        $this->makeVoucher(['code' => 'KEDALUWARSA', 'expires_at' => now()->subDay()->toDateString()]);

        $this->postJson('/api/vouchers/validate', ['code' => 'OFF', 'subtotal' => 100000])
            ->assertOk()->assertJsonPath('data.valid', false);

        $this->postJson('/api/vouchers/validate', ['code' => 'KEDALUWARSA', 'subtotal' => 100000])
            ->assertOk()->assertJsonPath('data.valid', false);
    }

    public function test_unknown_code_is_invalid(): void
    {
        $this->postJson('/api/vouchers/validate', ['code' => 'TIDAKADA', 'subtotal' => 100000])
            ->assertOk()
            ->assertJsonPath('data.valid', false);
    }
}
