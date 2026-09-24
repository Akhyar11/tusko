<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * T13.5 — Prioritas gudang + tabel transfer stok antar gudang.
     */
    public function up(): void
    {
        if (Schema::hasTable('warehouses') && !Schema::hasColumn('warehouses', 'priority')) {
            Schema::table('warehouses', function (Blueprint $table) {
                $table->unsignedInteger('priority')->default(0)->after('is_active');
            });
        }

        if (!Schema::hasTable('stock_transfers')) {
            Schema::create('stock_transfers', function (Blueprint $table) {
                $table->id();
                $table->string('transfer_number')->unique();
                $table->foreignId('from_warehouse_id')->constrained('warehouses')->cascadeOnDelete();
                $table->foreignId('to_warehouse_id')->constrained('warehouses')->cascadeOnDelete();
                $table->string('status')->default('draft'); // draft | completed | cancelled
                $table->foreignId('requested_by')->nullable()->constrained('users')->nullOnDelete();
                $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
                $table->text('notes')->nullable();
                $table->timestamps();

                $table->index(['from_warehouse_id', 'status']);
                $table->index(['to_warehouse_id', 'status']);
            });
        }

        if (!Schema::hasTable('stock_transfer_items')) {
            Schema::create('stock_transfer_items', function (Blueprint $table) {
                $table->id();
                $table->foreignId('stock_transfer_id')->constrained('stock_transfers')->cascadeOnDelete();
                $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
                $table->foreignId('product_variant_id')->nullable()->constrained('product_variants')->nullOnDelete();
                $table->integer('quantity');
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stock_transfer_items');
        Schema::dropIfExists('stock_transfers');

        if (Schema::hasTable('warehouses') && Schema::hasColumn('warehouses', 'priority')) {
            Schema::table('warehouses', function (Blueprint $table) {
                $table->dropColumn('priority');
            });
        }
    }
};
