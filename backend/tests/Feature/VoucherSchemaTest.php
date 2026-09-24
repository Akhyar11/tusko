<?php

namespace Tests\Feature;

use App\Models\Voucher;
use App\Models\VoucherTarget;
use App\Models\VoucherUsage;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class VoucherSchemaTest extends TestCase
{
    use RefreshDatabase;

    private function createVoucher(array $overrides = []): Voucher
    {
        static $sequence = 0;
        $sequence++;

        return Voucher::create(array_merge([
            'code' => 'VCR-SCHEMA-' . $sequence,
            'title' => 'Voucher Schema ' . $sequence,
            'discount_type' => 'fixed',
            'discount_value' => 10000,
        ], $overrides));
    }

    public function test_voucher_tables_and_columns_exist(): void
    {
        $this->assertTrue(Schema::hasTable('vouchers'));
        $this->assertTrue(Schema::hasTable('voucher_targets'));
        $this->assertTrue(Schema::hasTable('voucher_usages'));

        $this->assertTrue(Schema::hasColumns('vouchers', [
            'quota',
            'used_count',
            'per_user_limit',
            'is_free_shipping',
            'stackable',
        ]));

        $this->assertTrue(Schema::hasColumns('voucher_targets', [
            'id',
            'voucher_id',
            'target_type',
            'target_id',
        ]));

        $this->assertTrue(Schema::hasColumns('voucher_usages', [
            'id',
            'voucher_id',
            'user_id',
            'order_id',
            'used_at',
        ]));
    }

    public function test_voucher_defaults_and_extended_fields(): void
    {
        $voucher = $this->createVoucher();

        $fresh = $voucher->fresh();

        $this->assertSame(0, (int) $fresh->used_count);
        $this->assertFalse($fresh->is_free_shipping);
        $this->assertFalse($fresh->stackable);
        $this->assertNull($fresh->quota);
        $this->assertNull($fresh->per_user_limit);

        $extended = $this->createVoucher([
            'quota' => 100,
            'per_user_limit' => 2,
            'is_free_shipping' => true,
            'stackable' => true,
        ]);

        $extendedFresh = $extended->fresh();

        $this->assertSame(100, (int) $extendedFresh->quota);
        $this->assertSame(2, (int) $extendedFresh->per_user_limit);
        $this->assertTrue($extendedFresh->is_free_shipping);
        $this->assertTrue($extendedFresh->stackable);
    }

    public function test_voucher_targets_and_usages_relations(): void
    {
        $voucher = $this->createVoucher();

        VoucherTarget::create([
            'voucher_id' => $voucher->id,
            'target_type' => 'category',
            'target_id' => 7,
        ]);

        VoucherUsage::create([
            'voucher_id' => $voucher->id,
            'used_at' => now(),
        ]);

        $this->assertSame(1, $voucher->targets()->count());
        $this->assertSame(1, $voucher->usages()->count());
        $this->assertSame('category', $voucher->targets()->first()->target_type);
    }

    public function test_has_quota_remaining(): void
    {
        $unlimited = $this->createVoucher(['quota' => null, 'used_count' => 999]);
        $this->assertTrue($unlimited->hasQuotaRemaining());

        $available = $this->createVoucher(['quota' => 5, 'used_count' => 4]);
        $this->assertTrue($available->hasQuotaRemaining());

        $exhausted = $this->createVoucher(['quota' => 5, 'used_count' => 5]);
        $this->assertFalse($exhausted->hasQuotaRemaining());
    }
}
