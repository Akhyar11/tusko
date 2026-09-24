<?php

namespace App\Services;

use App\Models\CogsHistory;
use App\Models\Product;
use App\Models\ProductVariant;

/**
 * CogsService — pipeline HPP/COGS (T18.1).
 *
 * Menghitung rata-rata bergerak (weighted moving average) saat barang masuk,
 * mencatat `cogs_histories`, dan menyinkronkan `product_variants.current_cogs`
 * atau `products.cost_price` (konsolidasi D5).
 */
class CogsService
{
    /**
     * Catat barang masuk & perbarui HPP rata-rata.
     */
    public function recordIncoming(
        Product $product,
        ?ProductVariant $variant,
        int $quantity,
        float $unitCost,
        int $previousQuantity,
        string $sourceType,
        ?string $sourceId = null
    ): CogsHistory {
        $unitCost = $this->round($unitCost);
        $previousAverage = $this->round((float) ($variant ? $variant->current_cogs : $product->cost_price));
        $previousQuantity = max(0, $previousQuantity);

        $totalQuantity = $previousQuantity + max(0, $quantity);
        $newAverage = $totalQuantity > 0
            ? $this->round((($previousQuantity * $previousAverage) + ($quantity * $unitCost)) / $totalQuantity)
            : $unitCost;

        if ($variant) {
            $variant->forceFill(['current_cogs' => $newAverage])->save();
        } else {
            $product->forceFill(['cost_price' => $newAverage])->save();
        }

        return CogsHistory::create([
            'product_id' => $product->id,
            'product_variant_id' => $variant?->id,
            'source_type' => $sourceType,
            'source_id' => $sourceId,
            'incoming_quantity' => $quantity,
            'incoming_cost_per_unit' => $unitCost,
            'previous_average_cogs' => $previousAverage,
            'new_average_cogs' => $newAverage,
            'effective_date' => now(),
        ]);
    }

    /**
     * HPP/COGS terkini untuk sebuah produk/varian (konsolidasi D5).
     */
    public function currentCost(Product $product, ?ProductVariant $variant = null): float
    {
        if ($variant && (float) $variant->current_cogs > 0) {
            return (float) $variant->current_cogs;
        }

        return (float) ($product->cost_price ?? 0);
    }

    private function round(float $value): float
    {
        return round($value, 2);
    }
}
