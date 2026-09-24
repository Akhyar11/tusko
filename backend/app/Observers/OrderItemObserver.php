<?php

namespace App\Observers;

use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Services\CogsService;

class OrderItemObserver
{
    /**
     * Isi HPP/COGS per unit saat order item dibuat (T18.1).
     */
    public function creating(OrderItem $item): void
    {
        if ((float) $item->unit_cogs > 0) {
            return;
        }

        $variant = $item->product_variant_id
            ? ProductVariant::find($item->product_variant_id)
            : null;
        $product = $item->product_id ? Product::find($item->product_id) : null;

        if ($product) {
            $item->unit_cogs = app(CogsService::class)->currentCost($product, $variant);
        }
    }

    /**
     * Perbarui total HPP pesanan setelah item tersimpan.
     */
    public function created(OrderItem $item): void
    {
        $item->order?->recalculateTotalCogs();
    }
}
