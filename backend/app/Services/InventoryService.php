<?php

namespace App\Services;

use App\Exceptions\InsufficientStockException;
use App\Models\InventoryBalance;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\StockMutation;
use App\Models\Warehouse;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;
use RuntimeException;

/**
 * InventoryService — sumber kebenaran stok (D1).
 *
 * Seluruh mutasi:
 *  - dijalankan dalam transaksi database + `lockForUpdate`,
 *  - menulis `inventory_balances` (otoritatif) dan `stock_mutations` (kartu stok),
 *  - menyinkronkan agregat turunan `product_variants.stock` & `products.stock`.
 */
class InventoryService
{
    public function __construct(
        private readonly ActivityLogService $activityLog,
        private readonly CogsService $cogs
    ) {
    }

    /**
     * Tambah stok secara otoritatif.
     *
     * @param  array<string, mixed>  $attributes  reference_type, reference_id, notes, created_by, warehouse
     */
    public function increase(Product $product, int $quantity, array $attributes = [], ?ProductVariant $variant = null): StockMutation
    {
        return $this->mutate($product, $variant, abs($quantity), 'in', $attributes);
    }

    /**
     * Kurangi stok secara otoritatif (gagal bila saldo tidak mencukupi).
     *
     * @param  array<string, mixed>  $attributes  reference_type, reference_id, notes, created_by, warehouse
     */
    public function decrease(Product $product, int $quantity, array $attributes = [], ?ProductVariant $variant = null): StockMutation
    {
        return $this->mutate($product, $variant, -abs($quantity), 'out', $attributes);
    }

    /**
     * Stok tersedia otoritatif (D1) dihitung dari `inventory_balances`
     * (total `available_stock` seluruh gudang). Bila belum ada baris saldo,
     * jatuh kembali ke stok agregat legacy agar tetap aman sebelum backfill.
     */
    public function availableStock(Product $product, ?ProductVariant $variant = null): int
    {
        $query = InventoryBalance::query()
            ->where('product_id', $product->id)
            ->when($variant, fn ($q) => $q->where('product_variant_id', $variant->id))
            ->when(! $variant, fn ($q) => $q->whereNull('product_variant_id'));

        if ((clone $query)->exists()) {
            return max(0, (int) $query->sum('available_stock'));
        }

        return max(0, (int) ($variant ? $variant->stock : $product->stock));
    }

    /**
     * Inti mutasi stok: lock saldo -> validasi -> update saldo -> sinkron agregat -> kartu stok.
     */
    private function mutate(Product $product, ?ProductVariant $variant, int $signedQuantity, string $type, array $attributes): StockMutation
    {
        if ($signedQuantity === 0) {
            throw new InvalidArgumentException('Kuantitas mutasi stok tidak boleh nol.');
        }

        return DB::transaction(function () use ($product, $variant, $signedQuantity, $type, $attributes) {
            $warehouse = ($attributes['warehouse'] ?? null) instanceof Warehouse
                ? $attributes['warehouse']
                : $this->resolvePrimaryWarehouse();

            $lockedProduct = Product::query()->whereKey($product->id)->lockForUpdate()->firstOrFail();
            $lockedVariant = $variant
                ? ProductVariant::query()->whereKey($variant->id)->lockForUpdate()->firstOrFail()
                : null;

            $balance = $this->lockOrCreateBalance($lockedProduct, $lockedVariant, $warehouse);

            $before = (int) $balance->on_hand_stock;
            $after = $before + $signedQuantity;

            if ($after < 0) {
                throw new InsufficientStockException(max(0, $before), abs($signedQuantity));
            }

            $balance->on_hand_stock = $after;
            $balance->available_stock = max(0, $after - (int) $balance->reserved_stock);
            $balance->save();

            $this->syncAggregates($lockedProduct, $lockedVariant);

            $mutation = StockMutation::create([
                'product_id' => $lockedProduct->id,
                'product_variant_id' => $lockedVariant?->id,
                'warehouse_id' => $warehouse->id,
                'type' => $type,
                'quantity' => abs($signedQuantity),
                'stock_before' => $before,
                'stock_after' => $after,
                'reference_type' => $attributes['reference_type'] ?? null,
                'reference_id' => $attributes['reference_id'] ?? null,
                'notes' => $attributes['notes'] ?? null,
                'created_by' => $attributes['created_by'] ?? null,
            ]);

            if ($type === 'in') {
                $lockedProduct->forceFill(['last_restock_at' => now()])->save();
            }

            // T18.1: catat HPP/COGS saat barang masuk (unit_cost disediakan pemanggil).
            if ($type === 'in' && isset($attributes['unit_cost']) && (float) $attributes['unit_cost'] > 0) {
                $this->cogs->recordIncoming(
                    $lockedProduct,
                    $lockedVariant,
                    abs($signedQuantity),
                    (float) $attributes['unit_cost'],
                    $before,
                    (string) ($attributes['reference_type'] ?? 'manual_restock'),
                    isset($attributes['reference_id']) ? (string) $attributes['reference_id'] : null
                );
            }

            // G9: setiap perubahan stok wajib tercatat di audit log.
            $this->activityLog->log('stock.mutated', $lockedProduct, [
                'mutation_id' => $mutation->id,
                'product_id' => $lockedProduct->id,
                'product_variant_id' => $lockedVariant?->id,
                'warehouse_id' => $warehouse->id,
                'type' => $type,
                'quantity' => abs($signedQuantity),
                'stock_before' => $before,
                'stock_after' => $after,
                'reference_type' => $mutation->reference_type,
                'reference_id' => $mutation->reference_id,
            ]);

            return $mutation;
        });
    }

    /**
     * Ambil baris saldo dengan lock; buat bila belum ada (inisialisasi dari stok
     * legacy yang belum tercatat agar tidak kehilangan data).
     */
    private function lockOrCreateBalance(Product $product, ?ProductVariant $variant, Warehouse $warehouse): InventoryBalance
    {
        $balance = InventoryBalance::query()
            ->where('warehouse_id', $warehouse->id)
            ->where('product_id', $product->id)
            ->when($variant, fn ($query) => $query->where('product_variant_id', $variant->id))
            ->when(!$variant, fn ($query) => $query->whereNull('product_variant_id'))
            ->lockForUpdate()
            ->first();

        if ($balance) {
            return $balance;
        }

        $initial = $this->unaccountedStock($product, $variant);

        return InventoryBalance::create([
            'warehouse_id' => $warehouse->id,
            'product_id' => $product->id,
            'product_variant_id' => $variant?->id,
            'on_hand_stock' => $initial,
            'reserved_stock' => 0,
            'available_stock' => $initial,
            'safety_stock' => (int) $product->effective_stock_minimum,
        ]);
    }

    /**
     * Stok legacy yang belum tercatat pada `inventory_balances` untuk scope tsb.
     */
    private function unaccountedStock(Product $product, ?ProductVariant $variant): int
    {
        $accounted = (int) InventoryBalance::query()
            ->where('product_id', $product->id)
            ->when($variant, fn ($query) => $query->where('product_variant_id', $variant->id))
            ->when(!$variant, fn ($query) => $query->whereNull('product_variant_id'))
            ->sum('on_hand_stock');

        $legacy = $variant ? (int) $variant->stock : (int) $product->stock;

        return max(0, $legacy - $accounted);
    }

    /**
     * Sinkronkan agregat turunan: `product_variants.stock` & `products.stock`.
     *
     * - `product_variants.stock` = total saldo gudang varian tersebut.
     * - `products.stock` = total seluruh varian (bila ada) + saldo level produk,
     *   atau total saldo produk bila tanpa varian.
     */
    private function syncAggregates(Product $product, ?ProductVariant $variant): void
    {
        if ($variant) {
            $variantTotal = (int) InventoryBalance::query()
                ->where('product_variant_id', $variant->id)
                ->sum('on_hand_stock');

            $variant->forceFill(['stock' => $variantTotal])->save();
        }

        if ($product->variants()->exists()) {
            $variantSum = (int) $product->variants()->sum('stock');
            $unassigned = (int) InventoryBalance::query()
                ->where('product_id', $product->id)
                ->whereNull('product_variant_id')
                ->sum('on_hand_stock');

            $productTotal = $variantSum + $unassigned;
        } else {
            $productTotal = (int) InventoryBalance::query()
                ->where('product_id', $product->id)
                ->sum('on_hand_stock');
        }

        $product->forceFill(['stock' => $productTotal])->save();
    }

    /**
     * Gudang tujuan mutasi: `is_primary` aktif, fallback gudang aktif pertama.
     */
    private function resolvePrimaryWarehouse(): Warehouse
    {
        $warehouse = Warehouse::query()
            ->where('is_primary', true)
            ->where('is_active', true)
            ->orderBy('id')
            ->first()
            ?? Warehouse::query()
                ->where('is_active', true)
                ->orderBy('id')
                ->first();

        if (!$warehouse) {
            throw new RuntimeException('Gudang aktif belum tersedia untuk mencatat mutasi stok.');
        }

        return $warehouse;
    }
}
