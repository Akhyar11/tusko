<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Penanda mutasi saldo awal hasil backfill (D1 — stok otoritatif inventory_balances).
     */
    private const REFERENCE_TYPE = 'initial_backfill';

    /**
     * Backfill awal `inventory_balances` dari stok lama (`products.stock` &
     * `product_variants.stock`) ke gudang `is_primary`, sekaligus mencatat
     * `stock_mutations` saldo awal agar kartu stok tetap konsisten (D1).
     *
     * Idempoten: aman dijalankan berulang kali tanpa menggandakan data.
     */
    public function up(): void
    {
        if (!Schema::hasTable('inventory_balances')
            || !Schema::hasTable('stock_mutations')
            || !Schema::hasTable('warehouses')) {
            return;
        }

        $warehouse = $this->resolvePrimaryWarehouse();

        if (!$warehouse) {
            return;
        }

        $now = now();
        $warehouseId = (int) $warehouse->id;

        // Produk yang memiliki varian ditangani per varian agar tidak dobel hitung.
        $variantProductIds = DB::table('product_variants')
            ->whereNull('deleted_at')
            ->distinct()
            ->pluck('product_id')
            ->all();

        // 1. Saldo per varian (sumber stok: product_variants.stock).
        $variants = DB::table('product_variants')
            ->join('products', 'products.id', '=', 'product_variants.product_id')
            ->whereNull('product_variants.deleted_at')
            ->where('product_variants.stock', '>', 0)
            ->get([
                'product_variants.id as variant_id',
                'product_variants.product_id',
                'product_variants.stock',
                'products.stock_minimum',
                'products.min_stock',
            ]);

        foreach ($variants as $variant) {
            $this->backfillBalance(
                $warehouseId,
                (int) $variant->product_id,
                (int) $variant->variant_id,
                (int) $variant->stock,
                $this->effectiveStockMinimum($variant->stock_minimum, $variant->min_stock),
                $now
            );
        }

        // 2. Saldo per produk untuk produk tanpa varian (sumber stok: products.stock).
        $products = DB::table('products')
            ->where('stock', '>', 0)
            ->whereNotIn('id', $variantProductIds)
            ->get(['id', 'stock', 'stock_minimum', 'min_stock']);

        foreach ($products as $product) {
            $this->backfillBalance(
                $warehouseId,
                (int) $product->id,
                null,
                (int) $product->stock,
                $this->effectiveStockMinimum($product->stock_minimum, $product->min_stock),
                $now
            );
        }
    }

    /**
     * Batalkan backfill: hapus saldo & mutasi saldo awal yang dibuat migrasi ini.
     */
    public function down(): void
    {
        if (!Schema::hasTable('inventory_balances') || !Schema::hasTable('stock_mutations')) {
            return;
        }

        $warehouse = $this->resolvePrimaryWarehouse();

        if ($warehouse) {
            $backfilled = DB::table('stock_mutations')
                ->where('reference_type', self::REFERENCE_TYPE)
                ->get(['product_id', 'product_variant_id']);

            foreach ($backfilled as $row) {
                $query = DB::table('inventory_balances')
                    ->where('warehouse_id', $warehouse->id)
                    ->where('product_id', $row->product_id);

                if ($row->product_variant_id === null) {
                    $query->whereNull('product_variant_id');
                } else {
                    $query->where('product_variant_id', $row->product_variant_id);
                }

                $query->delete();
            }
        }

        DB::table('stock_mutations')->where('reference_type', self::REFERENCE_TYPE)->delete();
    }

    /**
     * Tulis satu baris saldo gudang + mutasi saldo awal secara idempoten.
     */
    private function backfillBalance(
        int $warehouseId,
        int $productId,
        ?int $variantId,
        int $stock,
        int $safetyStock,
        mixed $now
    ): void {
        $balanceExists = DB::table('inventory_balances')
            ->where('warehouse_id', $warehouseId)
            ->where('product_id', $productId)
            ->when($variantId === null, fn ($q) => $q->whereNull('product_variant_id'))
            ->when($variantId !== null, fn ($q) => $q->where('product_variant_id', $variantId))
            ->exists();

        if (!$balanceExists) {
            DB::table('inventory_balances')->insert([
                'warehouse_id' => $warehouseId,
                'product_id' => $productId,
                'product_variant_id' => $variantId,
                'bin_id' => null,
                'on_hand_stock' => $stock,
                'reserved_stock' => 0,
                'available_stock' => $stock,
                'safety_stock' => $safetyStock,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        $mutationExists = DB::table('stock_mutations')
            ->where('reference_type', self::REFERENCE_TYPE)
            ->where('product_id', $productId)
            ->when($variantId === null, fn ($q) => $q->whereNull('product_variant_id'))
            ->when($variantId !== null, fn ($q) => $q->where('product_variant_id', $variantId))
            ->exists();

        if (!$mutationExists) {
            DB::table('stock_mutations')->insert([
                'product_id' => $productId,
                'product_variant_id' => $variantId,
                'warehouse_id' => $warehouseId,
                'type' => 'in',
                'quantity' => $stock,
                'stock_before' => 0,
                'stock_after' => $stock,
                'reference_type' => self::REFERENCE_TYPE,
                'reference_id' => 'T12.1a',
                'notes' => 'Saldo awal migrasi inventory_balances (D1)',
                'created_by' => 'system',
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
    }

    /**
     * Ambang minimum stok efektif (konsolidasi D5: stock_minimum diutamakan).
     */
    private function effectiveStockMinimum(mixed $stockMinimum, mixed $minStock): int
    {
        $value = $stockMinimum ?: $minStock;

        return ($value === null || $value === '') ? 5 : (int) $value;
    }

    /**
     * Gudang tujuan backfill: `is_primary` aktif, fallback gudang aktif pertama.
     */
    private function resolvePrimaryWarehouse(): ?object
    {
        if (!Schema::hasTable('warehouses')) {
            return null;
        }

        return DB::table('warehouses')
            ->where('is_primary', true)
            ->where('is_active', true)
            ->orderBy('id')
            ->first()
            ?? DB::table('warehouses')
                ->where('is_active', true)
                ->orderBy('id')
                ->first();
    }
};
