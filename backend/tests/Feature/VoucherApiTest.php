<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\User;
use App\Models\Voucher;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * T15.2 — CRUD voucher admin (`/api/admin/vouchers`).
 */
class VoucherApiTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::factory()->create(['role' => 'admin']);
    }

    private function makeVoucher(array $overrides = []): Voucher
    {
        static $sequence = 0;
        $sequence++;

        return Voucher::create(array_merge([
            'code' => 'ADM' . $sequence,
            'title' => 'Voucher Admin ' . $sequence,
            'discount_type' => 'fixed',
            'discount_value' => 10000,
            'is_active' => true,
        ], $overrides));
    }

    public function test_admin_can_list_vouchers_with_pagination_and_filters(): void
    {
        Sanctum::actingAs($this->admin());

        $this->makeVoucher(['discount_type' => 'fixed']);
        $this->makeVoucher(['discount_type' => 'fixed']);
        $this->makeVoucher(['discount_type' => 'percent']);

        $this->getJson('/api/admin/vouchers?per_page=2')
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('total', 3);

        $this->getJson('/api/admin/vouchers?discount_type=percent')
            ->assertOk()
            ->assertJsonPath('total', 1)
            ->assertJsonPath('data.0.discount_type', 'percent');
    }

    public function test_admin_can_create_voucher_with_targets(): void
    {
        Sanctum::actingAs($this->admin());

        $product = Product::factory()->create();

        $response = $this->postJson('/api/admin/vouchers', [
            'code' => 'hematbaru',
            'title' => 'Hemat Baru',
            'discount_type' => 'percent',
            'discount_value' => 15,
            'max_discount' => 25000,
            'min_purchase' => 100000,
            'quota' => 100,
            'per_user_limit' => 1,
            'is_free_shipping' => true,
            'stackable' => false,
            'is_active' => true,
            'targets' => [
                ['target_type' => 'product', 'target_id' => $product->id],
            ],
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.code', 'HEMATBARU')
            ->assertJsonPath('data.discount_type', 'percent');

        $voucher = Voucher::where('code', 'HEMATBARU')->firstOrFail();

        $this->assertDatabaseHas('voucher_targets', [
            'voucher_id' => $voucher->id,
            'target_type' => 'product',
            'target_id' => $product->id,
        ]);

        $this->assertSame(0, (int) $voucher->used_count);
    }

    public function test_create_voucher_validation_fails(): void
    {
        Sanctum::actingAs($this->admin());

        $this->postJson('/api/admin/vouchers', [
            'code' => 'X',
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['title', 'discount_type', 'discount_value']);

        // Target non-'all' tanpa target_id ditolak.
        $this->postJson('/api/admin/vouchers', [
            'code' => 'Y',
            'title' => 'Y',
            'discount_type' => 'fixed',
            'discount_value' => 5000,
            'targets' => [
                ['target_type' => 'product'],
            ],
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['targets.0.target_id']);
    }

    public function test_create_voucher_rejects_duplicate_code(): void
    {
        Sanctum::actingAs($this->admin());

        $this->makeVoucher(['code' => 'DUP']);

        $this->postJson('/api/admin/vouchers', [
            'code' => 'dup',
            'title' => 'Duplikat',
            'discount_type' => 'fixed',
            'discount_value' => 5000,
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['code']);
    }

    public function test_admin_can_show_update_and_delete_voucher(): void
    {
        Sanctum::actingAs($this->admin());

        $product = Product::factory()->create();
        $voucher = $this->makeVoucher(['code' => 'EDITME']);

        $this->getJson("/api/admin/vouchers/{$voucher->id}")
            ->assertOk()
            ->assertJsonPath('data.code', 'EDITME');

        $this->patchJson("/api/admin/vouchers/{$voucher->id}", [
            'title' => 'Judul Baru',
            'discount_type' => 'percent',
            'discount_value' => 10,
            'targets' => [
                ['target_type' => 'product', 'target_id' => $product->id],
            ],
        ])->assertOk()
            ->assertJsonPath('data.title', 'Judul Baru')
            ->assertJsonPath('data.discount_type', 'percent');

        $this->assertDatabaseHas('voucher_targets', [
            'voucher_id' => $voucher->id,
            'target_type' => 'product',
            'target_id' => $product->id,
        ]);

        // Ganti cakupan: target lama diganti target baru.
        $this->patchJson("/api/admin/vouchers/{$voucher->id}", [
            'targets' => [
                ['target_type' => 'all'],
            ],
        ])->assertOk();

        $this->assertDatabaseHas('voucher_targets', [
            'voucher_id' => $voucher->id,
            'target_type' => 'all',
            'target_id' => null,
        ]);
        $this->assertDatabaseMissing('voucher_targets', [
            'voucher_id' => $voucher->id,
            'target_type' => 'product',
        ]);

        $this->deleteJson("/api/admin/vouchers/{$voucher->id}")->assertOk();

        $this->assertDatabaseMissing('vouchers', ['id' => $voucher->id]);
    }

    public function test_non_admin_is_forbidden(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'customer']));

        $this->getJson('/api/admin/vouchers')->assertStatus(403);
        $this->postJson('/api/admin/vouchers', [])->assertStatus(403);
    }

    public function test_unauthenticated_is_rejected(): void
    {
        $this->getJson('/api/admin/vouchers')->assertStatus(401);
    }
}
