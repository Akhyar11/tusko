<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('category_product', function (Blueprint $table) {
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->foreignId('category_id')->constrained('categories')->cascadeOnDelete();
            $table->primary(['product_id', 'category_id']);
            $table->timestamps();
        });

        // Seed pivot data from existing products that already have a category_id
        $driver = DB::getDriverName();
        if ($driver === 'pgsql') {
            DB::statement("
                INSERT INTO category_product (product_id, category_id, created_at, updated_at)
                SELECT id, category_id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
                FROM products
                WHERE category_id IS NOT NULL
                ON CONFLICT DO NOTHING
            ");
        } elseif ($driver === 'mysql') {
            DB::statement("
                INSERT IGNORE INTO category_product (product_id, category_id, created_at, updated_at)
                SELECT id, category_id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
                FROM products
                WHERE category_id IS NOT NULL
            ");
        } else {
            DB::statement("
                INSERT OR IGNORE INTO category_product (product_id, category_id, created_at, updated_at)
                SELECT id, category_id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
                FROM products
                WHERE category_id IS NOT NULL
            ");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('category_product');
    }
};
