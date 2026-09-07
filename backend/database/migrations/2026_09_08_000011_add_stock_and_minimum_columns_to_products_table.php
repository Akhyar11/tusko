<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            if (!Schema::hasColumn('products', 'sku')) {
                $table->string('sku')->nullable()->unique()->after('slug');
            }
            if (!Schema::hasColumn('products', 'stock')) {
                $table->integer('stock')->default(0)->after('price');
            }
            if (!Schema::hasColumn('products', 'stock_minimum')) {
                $table->integer('stock_minimum')->default(5)->after('stock');
            }
            if (!Schema::hasColumn('products', 'min_stock')) {
                $table->integer('min_stock')->default(5)->after('stock_minimum');
            }
            if (!Schema::hasColumn('products', 'cost_price')) {
                $table->decimal('cost_price', 12, 2)->nullable()->after('price');
            }
            if (!Schema::hasColumn('products', 'warehouse_bin')) {
                $table->string('warehouse_bin')->nullable()->after('stock_minimum');
            }
            if (!Schema::hasColumn('products', 'last_restock_at')) {
                $table->timestamp('last_restock_at')->nullable()->after('warehouse_bin');
            }
        });

        // Tabel pencatatan riwayat mutasi / pergerakan stok
        if (!Schema::hasTable('stock_mutations')) {
            Schema::create('stock_mutations', function (Blueprint $table) {
                $table->id();
                $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
                $table->enum('type', ['in', 'out', 'adjustment'])->default('in');
                $table->integer('quantity');
                $table->integer('stock_before');
                $table->integer('stock_after');
                $table->string('reference_type')->nullable(); // 'manual_restock', 'manual_reduce', 'order', 'adjustment'
                $table->string('reference_id')->nullable(); // order_id atau nomor invoice / ref
                $table->text('notes')->nullable();
                $table->string('created_by')->nullable();
                $table->timestamps();

                $table->index(['product_id', 'created_at']);
                $table->index('reference_type');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stock_mutations');

        Schema::table('products', function (Blueprint $table) {
            $columnsToDrop = [];
            foreach (['sku', 'min_stock', 'cost_price', 'warehouse_bin', 'last_restock_at'] as $col) {
                if (Schema::hasColumn('products', $col)) {
                    $columnsToDrop[] = $col;
                }
            }
            if (!empty($columnsToDrop)) {
                $table->dropColumn($columnsToDrop);
            }
        });
    }
};
