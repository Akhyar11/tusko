<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class WeightBackfillToGramsTest extends TestCase
{
    use RefreshDatabase;

    private const MIGRATION_FILE = '2026_09_23_000006_backfill_weight_columns_to_grams.php';

    private function runBackfill(): void
    {
        (require database_path('migrations/' . self::MIGRATION_FILE))->up();
    }

    private function insertOrder(float $totalWeight): int
    {
        static $sequence = 0;
        $sequence++;

        return (int) DB::table('orders')->insertGetId([
            'order_number' => 'T12-1B-' . $sequence,
            'recipient_name' => 'Pembeli Uji',
            'full_address' => 'Jl. Pengujian No. 1',
            'expedition_name' => 'J&T Express',
            'expedition_service' => 'EZ (Reguler)',
            'total_weight' => $totalWeight,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function insertOrderItem(int $orderId, float $productWeight): int
    {
        return (int) DB::table('order_items')->insertGetId([
            'order_id' => $orderId,
            'product_name' => 'Produk Uji Berat',
            'product_price' => 100000,
            'product_weight' => $productWeight,
            'quantity' => 1,
            'subtotal' => 100000,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function orderWeight(int $orderId): float
    {
        return (float) DB::table('orders')->where('id', $orderId)->value('total_weight');
    }

    public function test_converts_legacy_kilogram_order_weight_to_grams(): void
    {
        $light = $this->insertOrder(0.5);
        $heavier = $this->insertOrder(1.5);

        $this->runBackfill();

        $this->assertEqualsWithDelta(500.0, $this->orderWeight($light), 0.01);
        $this->assertEqualsWithDelta(1500.0, $this->orderWeight($heavier), 0.01);
    }

    public function test_keeps_order_weight_at_or_above_threshold_unchanged(): void
    {
        $exactlyThreshold = $this->insertOrder(100.0);
        $alreadyGram = $this->insertOrder(750.0);

        $this->runBackfill();

        $this->assertEqualsWithDelta(100.0, $this->orderWeight($exactlyThreshold), 0.01);
        $this->assertEqualsWithDelta(750.0, $this->orderWeight($alreadyGram), 0.01);
    }

    public function test_keeps_zero_order_weight_unchanged(): void
    {
        $empty = $this->insertOrder(0.0);

        $this->runBackfill();

        $this->assertEqualsWithDelta(0.0, $this->orderWeight($empty), 0.01);
    }

    public function test_converts_legacy_kilogram_order_item_weight_to_grams(): void
    {
        $orderId = $this->insertOrder(1.0);
        $lightItem = $this->insertOrderItem($orderId, 0.5);
        $heavierItem = $this->insertOrderItem($orderId, 2.0);

        $this->runBackfill();

        $this->assertEqualsWithDelta(
            500.0,
            (float) DB::table('order_items')->where('id', $lightItem)->value('product_weight'),
            0.01
        );
        $this->assertEqualsWithDelta(
            2000.0,
            (float) DB::table('order_items')->where('id', $heavierItem)->value('product_weight'),
            0.01
        );
    }

    public function test_backfill_does_not_double_convert_realistic_weights(): void
    {
        $orderId = $this->insertOrder(1.5);

        $this->runBackfill();
        $this->runBackfill();

        $this->assertEqualsWithDelta(1500.0, $this->orderWeight($orderId), 0.01);
    }
}
