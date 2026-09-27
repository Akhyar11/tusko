<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Voucher;
use App\Models\VoucherClaim;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * T08.5 — Persist klaim voucher (`voucher_claims`).
 */
class VoucherClaimTest extends TestCase
{
    use RefreshDatabase;

    private function makeVoucher(string $code = 'KLAIM10'): Voucher
    {
        return Voucher::create([
            'code' => $code,
            'title' => 'Voucher Klaim',
            'discount_type' => 'fixed',
            'discount_value' => 10000,
            'is_active' => true,
        ]);
    }

    public function test_claim_persists_and_is_idempotent(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        $voucher = $this->makeVoucher();

        $first = $this->postJson('/api/vouchers/claim', ['code' => 'klaim10']);
        $first->assertOk()->assertJsonPath('claimed', true)->assertJsonPath('already_claimed', false);

        $second = $this->postJson('/api/vouchers/claim', ['code' => 'KLAIM10']);
        $second->assertOk()->assertJsonPath('already_claimed', true);

        $this->assertSame(1, VoucherClaim::where('voucher_id', $voucher->id)->where('user_id', $user->id)->count());
    }

    public function test_index_marks_claimed_voucher_for_authenticated_user(): void
    {
        $user = User::factory()->create();
        $voucher = $this->makeVoucher('MARKED');

        // Sebelum klaim.
        Sanctum::actingAs($user);
        $before = $this->getJson('/api/vouchers')->assertOk();
        $this->assertFalse(collect($before->json('data'))->firstWhere('code', 'MARKED')['is_claimed']);

        $this->postJson('/api/vouchers/claim', ['code' => 'MARKED'])->assertOk();

        $after = $this->getJson('/api/vouchers')->assertOk();
        $this->assertTrue(collect($after->json('data'))->firstWhere('code', 'MARKED')['is_claimed']);
    }

    public function test_guest_cannot_claim(): void
    {
        $this->makeVoucher('GUESTONLY');
        $this->postJson('/api/vouchers/claim', ['code' => 'GUESTONLY'])->assertStatus(401);
    }

    public function test_unknown_code_returns_404(): void
    {
        Sanctum::actingAs(User::factory()->create());
        $this->postJson('/api/vouchers/claim', ['code' => 'TIDAKADA'])->assertStatus(404);
    }
}
