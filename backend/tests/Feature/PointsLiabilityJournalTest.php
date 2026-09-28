<?php

namespace Tests\Feature;

use App\Models\Expedition;
use App\Models\FinancialLedgerEntry;
use App\Models\Order;
use App\Models\Product;
use App\Models\Transaction;
use App\Models\User;
use App\Models\Warehouse;
use Database\Seeders\MasterReferenceSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * T34.14 — Jurnal liabilitas poin loyalitas.
 *
 * Earn (saat order lunas): Debit Beban Program Poin (6400),
 * Kredit Liabilitas Poin (2200).
 * Redeem (saat checkout): Debit Liabilitas Poin (2200), Kredit Pendapatan (4100).
 */
class PointsLiabilityJournalTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(MasterReferenceSeeder::class);

        Warehouse::create([
            'code' => 'GDG-PTS-01',
            'name' => 'Gudang Poin',
            'address' => 'Jl. Poin',
            'city' => 'Jakarta',
            'province' => 'DKI Jakarta',
            'is_primary' => true,
            'is_active' => true,
        ]);
    }

    public function test_earned_points_post_liability_journal_on_paid(): void
    {
        $user = User::factory()->create(['points' => 0]);
        $order = Order::factory()->create([
            'user_id' => $user->id,
            'status' => 'processing',
            'payment_status' => 'paid',
            'grand_total' => 200000,
            'loyalty_points_earned' => 100,
        ]);

        $container = Transaction::where('order_id', $order->id)
            ->where('category', 'loyalty_points_earned')
            ->first();

        $this->assertNotNull($container, 'transaksi loyalty_points_earned tidak dibuat');

        $entries = FinancialLedgerEntry::where('transaction_id', $container->id)
            ->with('account')
            ->get();

        $this->assertGreaterThanOrEqual(2, $entries->count());

        $codes = $entries->map(fn ($e) => $e->account?->account_code)->sort()->values()->all();
        $this->assertContains('2200', $codes);
        $this->assertContains('6400', $codes);
    }

    public function test_redeemed_points_post_journal_on_checkout(): void
    {
        $user = User::factory()->create(['points' => 1000]);
        $product = Product::factory()->create(['name' => 'Produk Poin Jurnal', 'price' => 100000, 'stock' => 10]);
        $expedition = Expedition::factory()->create(['name' => 'JNE', 'service' => 'REG', 'cost' => 10000]);

        $response = $this->actingAs($user)->postJson('/api/checkout', [
            'items' => [['product_id' => $product->id, 'quantity' => 1]],
            'recipient_name' => 'Pembeli Poin Jurnal',
            'phone' => '081200000015',
            'full_address' => 'Jl. Poin Jurnal No. 15',
            'expedition_id' => $expedition->id,
            'payment_method' => 'manual_transfer',
            'payment_channel' => 'manual_bca',
            'service_fee' => 0,
            'loyalty_points_redeemed' => 500,
        ]);

        $response->assertCreated();

        $order = Order::where('order_number', $response->json('data.order_number'))->firstOrFail();

        $container = Transaction::where('order_id', $order->id)
            ->where('category', 'loyalty_points_redeemed')
            ->first();

        $this->assertNotNull($container, 'transaksi loyalty_points_redeemed tidak dibuat');

        $entries = FinancialLedgerEntry::where('transaction_id', $container->id)
            ->with('account')
            ->get();

        $this->assertGreaterThanOrEqual(2, $entries->count());

        $codes = $entries->map(fn ($e) => $e->account?->account_code)->sort()->values()->all();
        $this->assertContains('2200', $codes);
        $this->assertContains('4100', $codes);
    }
}
