<?php

namespace App\Services;

use App\Models\InventoryBalance;

/**
 * WarehouseAllocationService — pemilihan gudang pemenuh (T13.5).
 *
 * Memilih saldo gudang terbaik berdasarkan prioritas gudang lalu ketersediaan
 * `available_stock` yang mencukupi.
 */
class WarehouseAllocationService
{
    public function allocate(int $productId, ?int $variantId, int $quantity): ?InventoryBalance
    {
        if ($quantity <= 0) {
            return null;
        }

        return InventoryBalance::query()
            ->where('inventory_balances.product_id', $productId)
            ->when($variantId, fn ($query) => $query->where('inventory_balances.product_variant_id', $variantId))
            ->when(!$variantId, fn ($query) => $query->whereNull('inventory_balances.product_variant_id'))
            ->where('inventory_balances.available_stock', '>=', $quantity)
            ->join('warehouses', 'warehouses.id', '=', 'inventory_balances.warehouse_id')
            ->where('warehouses.is_active', true)
            ->orderByDesc('warehouses.priority')
            ->orderByDesc('inventory_balances.available_stock')
            ->select('inventory_balances.*')
            ->first();
    }
}
