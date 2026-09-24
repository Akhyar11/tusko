<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Penanda kolom yang dideprecate setelah konsolidasi (D5).
     */
    private const DEPRECATED = 'DEPRECATED (D5) — gunakan kolom kanonik pengganti.';

    /**
     * Konsolidasi kolom duplikat (D5):
     *   1. products.min_stock        -> products.stock_minimum
     *   2. orders.phone_number       -> orders.phone
     *   3. products.warehouse_bin    -> warehouse_bins (+ link inventory_balances.bin_id)
     */
    public function up(): void
    {
        $this->consolidateStockMinimum();
        $this->consolidateOrderPhone();
        $this->consolidateWarehouseBins();
        $this->markLegacyColumnsDeprecated();
    }

    /**
     * Best-effort rollback: lepas penanda deprecated & hapus bin hasil migrasi
     * yang tidak direferensikan saldo gudang. Merge data bersifat satu arah.
     */
    public function down(): void
    {
        $this->dropDeprecationComments();
        $this->removeUnreferencedBackfilledBins();
    }

    /**
     * `products.stock_minimum` menjadi kanonik; nilai `min_stock` yang bermakna
     * (custom, bukan default 5) di-backfill bila `stock_minimum` masih default,
     * lalu kedua kolom disinkronkan.
     */
    private function consolidateStockMinimum(): void
    {
        if (!Schema::hasTable('products')
            || !Schema::hasColumn('products', 'min_stock')
            || !Schema::hasColumn('products', 'stock_minimum')) {
            return;
        }

        DB::table('products')
            ->whereNotNull('min_stock')
            ->where('min_stock', '<>', 5)
            ->where('stock_minimum', 5)
            ->update(['stock_minimum' => DB::raw('min_stock')]);

        DB::table('products')
            ->where(function ($query) {
                $query->whereNull('min_stock')->orWhereColumn('min_stock', '<>', 'stock_minimum');
            })
            ->update(['min_stock' => DB::raw('stock_minimum')]);
    }

    /**
     * `orders.phone` menjadi kanonik; `phone_number` di-backfill bila `phone`
     * kosong, lalu kedua kolom disinkronkan.
     */
    private function consolidateOrderPhone(): void
    {
        if (!Schema::hasTable('orders')
            || !Schema::hasColumn('orders', 'phone_number')
            || !Schema::hasColumn('orders', 'phone')) {
            return;
        }

        DB::table('orders')
            ->where(function ($query) {
                $query->whereNull('phone')->orWhere('phone', '');
            })
            ->whereNotNull('phone_number')
            ->where('phone_number', '<>', '')
            ->update(['phone' => DB::raw('phone_number')]);

        DB::table('orders')
            ->where(function ($query) {
                $query->whereNull('phone_number')->orWhereColumn('phone_number', '<>', 'phone');
            })
            ->update(['phone_number' => DB::raw('phone')]);
    }

    /**
     * Buat master `warehouse_bins` dari nilai `products.warehouse_bin` pada
     * gudang utama, lalu tautkan ke `inventory_balances.bin_id`.
     */
    private function consolidateWarehouseBins(): void
    {
        if (!Schema::hasTable('products')
            || !Schema::hasTable('warehouse_bins')
            || !Schema::hasColumn('products', 'warehouse_bin')) {
            return;
        }

        $warehouseId = DB::table('warehouses')
            ->where('is_primary', true)
            ->where('is_active', true)
            ->orderBy('id')
            ->value('id')
            ?? DB::table('warehouses')->where('is_active', true)->orderBy('id')->value('id');

        if (!$warehouseId) {
            return;
        }

        $now = now();

        $products = DB::table('products')
            ->whereNotNull('warehouse_bin')
            ->where('warehouse_bin', '<>', '')
            ->get(['id', 'warehouse_bin']);

        foreach ($products as $product) {
            $binCode = trim((string) $product->warehouse_bin);

            if ($binCode === '') {
                continue;
            }

            DB::table('warehouse_bins')->insertOrIgnore([
                'warehouse_id' => $warehouseId,
                'bin_code' => $binCode,
                'zone' => null,
                'notes' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            $binId = DB::table('warehouse_bins')
                ->where('warehouse_id', $warehouseId)
                ->where('bin_code', $binCode)
                ->value('id');

            if (!$binId || !Schema::hasTable('inventory_balances')) {
                continue;
            }

            DB::table('inventory_balances')
                ->where('warehouse_id', $warehouseId)
                ->where('product_id', $product->id)
                ->whereNull('bin_id')
                ->update(['bin_id' => $binId]);
        }
    }

    /**
     * Beri komentar deprecated pada kolom lama (kolom tidak di-drop di minor ini).
     *
     * Komentar kolom hanya didukung MySQL/PostgreSQL. SQLite mengabaikan komentar
     * dan `change()` di SQLite membangun ulang tabel (berisiko cascade FK), jadi
     * penanda deprecated dilewati pada SQLite.
     */
    private function markLegacyColumnsDeprecated(): void
    {
        if (!$this->supportsColumnComments()) {
            return;
        }

        if (Schema::hasTable('products')) {
            Schema::table('products', function (Blueprint $table) {
                if (Schema::hasColumn('products', 'min_stock')) {
                    $table->integer('min_stock')->default(5)->comment(self::DEPRECATED)->change();
                }
            });

            Schema::table('products', function (Blueprint $table) {
                if (Schema::hasColumn('products', 'warehouse_bin')) {
                    $table->string('warehouse_bin')->nullable()->comment(self::DEPRECATED)->change();
                }
            });
        }

        if (Schema::hasTable('orders') && Schema::hasColumn('orders', 'phone_number')) {
            Schema::table('orders', function (Blueprint $table) {
                $table->string('phone_number')->nullable()->comment(self::DEPRECATED)->change();
            });
        }
    }

    /**
     * Lepas komentar deprecated (kembalikan definisi kolom semula).
     */
    private function dropDeprecationComments(): void
    {
        if (!$this->supportsColumnComments()) {
            return;
        }

        if (Schema::hasTable('products')) {
            Schema::table('products', function (Blueprint $table) {
                if (Schema::hasColumn('products', 'min_stock')) {
                    $table->integer('min_stock')->default(5)->change();
                }
            });

            Schema::table('products', function (Blueprint $table) {
                if (Schema::hasColumn('products', 'warehouse_bin')) {
                    $table->string('warehouse_bin')->nullable()->change();
                }
            });
        }

        if (Schema::hasTable('orders') && Schema::hasColumn('orders', 'phone_number')) {
            Schema::table('orders', function (Blueprint $table) {
                $table->string('phone_number')->nullable()->change();
            });
        }
    }

    /**
     * Hapus bin yang dibuat dari `products.warehouse_bin` namun tak terpakai.
     */
    private function removeUnreferencedBackfilledBins(): void
    {
        if (!Schema::hasTable('warehouse_bins')
            || !Schema::hasTable('products')
            || !Schema::hasTable('inventory_balances')) {
            return;
        }

        $codes = DB::table('products')
            ->whereNotNull('warehouse_bin')
            ->where('warehouse_bin', '<>', '')
            ->distinct()
            ->pluck('warehouse_bin');

        foreach ($codes as $rawCode) {
            $binCode = trim((string) $rawCode);

            if ($binCode === '') {
                continue;
            }

            $unreferencedIds = DB::table('warehouse_bins')
                ->where('bin_code', $binCode)
                ->whereNotExists(function ($query) {
                    $query->select(DB::raw(1))
                        ->from('inventory_balances')
                        ->whereColumn('inventory_balances.bin_id', 'warehouse_bins.id');
                })
                ->pluck('id');

            if ($unreferencedIds->isNotEmpty()) {
                DB::table('warehouse_bins')->whereIn('id', $unreferencedIds)->delete();
            }
        }
    }

    /**
     * Apakah driver database mendukung komentar kolom (MySQL/PostgreSQL).
     */
    private function supportsColumnComments(): bool
    {
        return in_array(DB::getDriverName(), ['mysql', 'mariadb', 'pgsql'], true);
    }
};
