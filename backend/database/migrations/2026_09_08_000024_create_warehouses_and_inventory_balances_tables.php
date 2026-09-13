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
        // 1. Warehouses (Gudang Multi-Lokasi)
        if (!Schema::hasTable('warehouses')) {
            Schema::create('warehouses', function (Blueprint $table) {
                $table->id();
                $table->string('code')->unique(); // 'GDG-JKT-PST', 'GDG-SBY'
                $table->string('name');
                $table->text('address');
                $table->string('city');
                $table->string('province');
                $table->string('postal_code')->nullable();
                $table->decimal('latitude', 10, 8)->nullable();
                $table->decimal('longitude', 11, 8)->nullable();
                $table->boolean('is_primary')->default(false);
                $table->boolean('is_active')->default(true);
                $table->timestamps();
            });
        }

        // 2. Warehouse Bins (Rak / Lokasi Spesifik Penyimpanan)
        if (!Schema::hasTable('warehouse_bins')) {
            Schema::create('warehouse_bins', function (Blueprint $table) {
                $table->id();
                $table->foreignId('warehouse_id')->constrained('warehouses')->cascadeOnDelete();
                $table->string('bin_code'); // 'A-01-02' (Lorong-Rak-Tingkat)
                $table->string('zone')->nullable(); // 'APPAREL', 'FOOTWEAR', 'EQUIPMENT'
                $table->text('notes')->nullable();
                $table->timestamps();

                $table->unique(['warehouse_id', 'bin_code']);
            });
        }

        // 3. Inventory Balances (Saldo Stok Per Varian Per Gudang)
        if (!Schema::hasTable('inventory_balances')) {
            Schema::create('inventory_balances', function (Blueprint $table) {
                $table->id();
                $table->foreignId('warehouse_id')->constrained('warehouses')->cascadeOnDelete();
                $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
                $table->foreignId('product_variant_id')->nullable()->constrained('product_variants')->cascadeOnDelete();
                $table->foreignId('bin_id')->nullable()->constrained('warehouse_bins')->nullOnDelete();
                $table->integer('on_hand_stock')->default(0); // Fisik di rak gudang
                $table->integer('reserved_stock')->default(0); // Terkunci di checkout yang belum bayar
                $table->integer('available_stock')->default(0); // on_hand - reserved
                $table->integer('safety_stock')->default(5); // Ambang batas peringatan restok
                $table->timestamps();

                $table->index(['warehouse_id', 'product_id']);
                $table->index(['warehouse_id', 'product_variant_id']);
            });
        }

        // 4. Stock Reservations (Penguncian Stok Otomatis Saat Checkout)
        if (!Schema::hasTable('stock_reservations')) {
            Schema::create('stock_reservations', function (Blueprint $table) {
                $table->id();
                $table->foreignId('order_id')->constrained('orders')->cascadeOnDelete();
                $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
                $table->foreignId('product_variant_id')->nullable()->constrained('product_variants')->nullOnDelete();
                $table->foreignId('warehouse_id')->constrained('warehouses')->cascadeOnDelete();
                $table->integer('quantity');
                $table->string('status')->default('active'); // 'active', 'committed_sold', 'released_expired'
                $table->timestamp('expires_at');
                $table->timestamps();

                $table->index(['order_id', 'status']);
                $table->index('expires_at');
            });
        }

        // 5. Stock Opnames & Items (Audit Fisik Berkala)
        if (!Schema::hasTable('stock_opnames')) {
            Schema::create('stock_opnames', function (Blueprint $table) {
                $table->id();
                $table->string('opname_number')->unique(); // 'SO-202609-001'
                $table->foreignId('warehouse_id')->constrained('warehouses')->cascadeOnDelete();
                $table->string('status')->default('draft'); // 'draft', 'in_progress', 'approved', 'rejected'
                $table->foreignId('conducted_by')->nullable()->constrained('users')->nullOnDelete();
                $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
                $table->text('notes')->nullable();
                $table->timestamp('conducted_at')->nullable();
                $table->timestamp('approved_at')->nullable();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('stock_opname_items')) {
            Schema::create('stock_opname_items', function (Blueprint $table) {
                $table->id();
                $table->foreignId('stock_opname_id')->constrained('stock_opnames')->cascadeOnDelete();
                $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
                $table->foreignId('product_variant_id')->nullable()->constrained('product_variants')->nullOnDelete();
                $table->integer('system_stock');
                $table->integer('physical_stock');
                $table->integer('difference'); // physical - system
                $table->text('notes')->nullable();
                $table->timestamps();
            });
        }

        // 6. Hubungkan warehouse_id dan product_variant_id ke stock_mutations jika belum ada
        if (Schema::hasTable('stock_mutations')) {
            Schema::table('stock_mutations', function (Blueprint $table) {
                if (!Schema::hasColumn('stock_mutations', 'warehouse_id')) {
                    $table->foreignId('warehouse_id')->nullable()->after('product_id')->constrained('warehouses')->nullOnDelete();
                }
                if (!Schema::hasColumn('stock_mutations', 'product_variant_id')) {
                    $table->foreignId('product_variant_id')->nullable()->after('product_id')->constrained('product_variants')->nullOnDelete();
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('stock_mutations')) {
            Schema::table('stock_mutations', function (Blueprint $table) {
                if (Schema::hasColumn('stock_mutations', 'warehouse_id')) {
                    $table->dropForeign(['warehouse_id']);
                    $table->dropColumn('warehouse_id');
                }
                if (Schema::hasColumn('stock_mutations', 'product_variant_id')) {
                    $table->dropForeign(['product_variant_id']);
                    $table->dropColumn('product_variant_id');
                }
            });
        }

        Schema::dropIfExists('stock_opname_items');
        Schema::dropIfExists('stock_opnames');
        Schema::dropIfExists('stock_reservations');
        Schema::dropIfExists('inventory_balances');
        Schema::dropIfExists('warehouse_bins');
        Schema::dropIfExists('warehouses');
    }
};
