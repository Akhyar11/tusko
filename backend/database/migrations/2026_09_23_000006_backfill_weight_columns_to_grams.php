<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Ambang batas konversi D3: nilai berat < 100 dianggap Kilogram lalu
     * dikonversi ke GRAM (×1000); nilai >= 100 dianggap sudah gram.
     */
    private const KG_TO_GRAM_THRESHOLD = 100;

    /**
     * Konversi berat baku ke GRAM (D3) untuk data lama.
     *
     * `orders.total_weight` dan `order_items.product_weight` sebelumnya dicatat
     * dalam Kilogram. Nilai < 100 (mis. 1.5 kg, 0.5 kg) dikalikan 1000 menjadi
     * gram agar konsisten dengan `products.weight` & `product_variants.weight_grams`.
     * Nilai >= 100 dianggap sudah dalam gram dan dibiarkan apa adanya.
     */
    public function up(): void
    {
        $this->convertToGrams('orders', 'total_weight');
        $this->convertToGrams('order_items', 'product_weight');
    }

    /**
     * Normalisasi ini bersifat satu arah: nilai asli (kg) tidak disimpan sebagai
     * snapshot, sehingga tidak dapat dibalik secara akurat tanpa menebak. Migrasi
     * ini juga TIDAK mengubah skema, sehingga tidak ada rollback skema yang
     * diperlukan.
     */
    public function down(): void
    {
        // Sengaja tanpa operasi: konversi data maju (one-way data normalization).
    }

    /**
     * Kalikan nilai berat Kilogram (< 100) menjadi gram untuk satu kolom.
     */
    private function convertToGrams(string $table, string $column): void
    {
        if (!Schema::hasTable($table) || !Schema::hasColumn($table, $column)) {
            return;
        }

        DB::table($table)
            ->whereNotNull($column)
            ->where($column, '>', 0)
            ->where($column, '<', self::KG_TO_GRAM_THRESHOLD)
            ->update([$column => DB::raw("{$column} * 1000")]);
    }
};
