<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Kolom uang yang menyimpang dari standar DECIMAL(14,2) (D4).
     *
     * `previous` menyimpan presisi asal untuk kebutuhan rollback.
     */
    private const MONEY_COLUMNS = [
        'products' => [
            'price' => ['nullable' => false, 'default' => null, 'previous' => [10, 2]],
            'cost_price' => ['nullable' => true, 'default' => null, 'previous' => [12, 2]],
            'original_price' => ['nullable' => true, 'default' => null, 'previous' => [12, 2]],
            'point_value' => ['nullable' => false, 'default' => 0, 'previous' => [10, 2]],
        ],
        'expeditions' => [
            'base_cost' => ['nullable' => false, 'default' => null, 'previous' => [10, 2]],
            'cost' => ['nullable' => false, 'default' => null, 'previous' => [10, 2]],
        ],
        'expedition_services' => [
            'base_rate' => ['nullable' => false, 'default' => 0, 'previous' => [10, 2]],
            'per_kg_rate' => ['nullable' => false, 'default' => 0, 'previous' => [10, 2]],
        ],
        'vouchers' => [
            'discount_value' => ['nullable' => false, 'default' => 0, 'previous' => [12, 2]],
            'min_purchase' => ['nullable' => false, 'default' => 0, 'previous' => [12, 2]],
            'max_discount' => ['nullable' => true, 'default' => null, 'previous' => [12, 2]],
        ],
        'transactions' => [
            'fee_deducted' => ['nullable' => false, 'default' => 0, 'previous' => [10, 2]],
        ],
        'financial_accounts' => [
            'current_balance' => ['nullable' => false, 'default' => 0, 'previous' => [16, 2]],
        ],
    ];

    /**
     * Standardisasi presisi seluruh kolom uang ke DECIMAL(14,2) (D4).
     */
    public function up(): void
    {
        $this->alterMoneyColumns(revert: false);
    }

    /**
     * Kembalikan presisi kolom uang ke ukuran sebelumnya.
     */
    public function down(): void
    {
        $this->alterMoneyColumns(revert: true);
    }

    /**
     * Ubah presisi kolom uang secara idempoten, mempertahankan nullability/default.
     *
     * Pada SQLite, `change()` membangun ulang tabel; foreign key dinonaktifkan
     * sementara agar baris anak (varian/saldo stok) tidak ter-cascade delete.
     */
    private function alterMoneyColumns(bool $revert): void
    {
        // SQLite tidak menegakkan presisi DECIMAL, dan `change()` di sana membangun
        // ulang tabel sehingga berisiko menghapus baris anak (cascade FK).
        // Standardisasi cukup dijalankan pada driver yang mendukung (MySQL/PostgreSQL).
        if (DB::getDriverName() === 'sqlite') {
            return;
        }

        Schema::disableForeignKeyConstraints();

        try {
            foreach (self::MONEY_COLUMNS as $table => $columns) {
                if (!Schema::hasTable($table)) {
                    continue;
                }

                $targets = [];
                foreach ($columns as $column => $config) {
                    if (Schema::hasColumn($table, $column)) {
                        $targets[$column] = $config;
                    }
                }

                if (empty($targets)) {
                    continue;
                }

                Schema::table($table, function (Blueprint $blueprint) use ($targets, $revert) {
                    foreach ($targets as $column => $config) {
                        [$width, $scale] = $revert ? $config['previous'] : [14, 2];

                        $definition = $blueprint->decimal($column, $width, $scale);

                        if ($config['nullable']) {
                            $definition->nullable();
                        }

                        if ($config['default'] !== null) {
                            $definition->default($config['default']);
                        }

                        $definition->change();
                    }
                });
            }
        } finally {
            Schema::enableForeignKeyConstraints();
        }
    }
};
