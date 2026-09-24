<?php

namespace App\Observers;

use App\Models\Product;
use App\Services\ActivityLogService;

class ProductObserver
{
    /**
     * Atribut harga yang perubahannya wajib tercatat (G9).
     */
    private const PRICE_ATTRIBUTES = ['price', 'cost_price', 'original_price'];

    /**
     * Handle the Product "updated" event.
     */
    public function updated(Product $product): void
    {
        $changes = [];

        foreach (self::PRICE_ATTRIBUTES as $attribute) {
            if ($product->wasChanged($attribute)) {
                $changes[$attribute] = [
                    'before' => $product->getOriginal($attribute),
                    'after' => $product->getAttribute($attribute),
                ];
            }
        }

        if ($changes === []) {
            return;
        }

        app(ActivityLogService::class)->log('product.price_updated', $product, [
            'changes' => $changes,
        ]);
    }
}
