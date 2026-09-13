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
        // 1. Vendors / Suppliers Table
        if (!Schema::hasTable('vendors')) {
            Schema::create('vendors', function (Blueprint $table) {
                $table->id();
                $table->string('code')->unique(); // 'VND-001'
                $table->string('company_name');
                $table->string('contact_person');
                $table->string('email')->nullable();
                $table->string('phone');
                $table->text('address');
                $table->integer('payment_terms_days')->default(30); // Tempo pembayaran
                $table->text('bank_account_info')->nullable();
                $table->boolean('is_active')->default(true);
                $table->timestamps();
            });
        }

        // 2. Purchase Orders (PO ke Supplier)
        if (!Schema::hasTable('purchase_orders')) {
            Schema::create('purchase_orders', function (Blueprint $table) {
                $table->id();
                $table->string('po_number')->unique(); // 'PO-202609-001'
                $table->foreignId('vendor_id')->constrained('vendors')->cascadeOnDelete();
                $table->foreignId('warehouse_id')->constrained('warehouses')->cascadeOnDelete();
                $table->string('status')->default('draft'); // 'draft', 'approved', 'sent', 'partially_received', 'received', 'cancelled'
                $table->decimal('total_amount', 14, 2)->default(0.00);
                $table->date('order_date');
                $table->date('expected_delivery_date')->nullable();
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
                $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
                $table->text('notes')->nullable();
                $table->timestamps();

                $table->index(['vendor_id', 'status']);
            });
        }

        // 3. Purchase Order Items
        if (!Schema::hasTable('purchase_order_items')) {
            Schema::create('purchase_order_items', function (Blueprint $table) {
                $table->id();
                $table->foreignId('purchase_order_id')->constrained('purchase_orders')->cascadeOnDelete();
                $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
                $table->foreignId('product_variant_id')->nullable()->constrained('product_variants')->nullOnDelete();
                $table->integer('ordered_quantity');
                $table->integer('received_quantity')->default(0);
                $table->decimal('unit_price', 14, 2); // Harga beli dari vendor
                $table->decimal('subtotal', 14, 2);
                $table->timestamps();
            });
        }

        // 4. Goods Receiving Notes (GRN - Penerimaan Barang Fisik di Gudang)
        if (!Schema::hasTable('goods_receiving_notes')) {
            Schema::create('goods_receiving_notes', function (Blueprint $table) {
                $table->id();
                $table->string('grn_number')->unique(); // 'GRN-202609-001'
                $table->foreignId('purchase_order_id')->constrained('purchase_orders')->cascadeOnDelete();
                $table->foreignId('warehouse_id')->constrained('warehouses')->cascadeOnDelete();
                $table->foreignId('received_by')->nullable()->constrained('users')->nullOnDelete();
                $table->date('received_date');
                $table->string('delivery_order_number')->nullable(); // No surat jalan vendor
                $table->string('status')->default('verified'); // 'verified', 'discrepancy'
                $table->text('notes')->nullable();
                $table->timestamps();
            });
        }

        // 5. Goods Receiving Items
        if (!Schema::hasTable('goods_receiving_items')) {
            Schema::create('goods_receiving_items', function (Blueprint $table) {
                $table->id();
                $table->foreignId('grn_id')->constrained('goods_receiving_notes')->cascadeOnDelete();
                $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
                $table->foreignId('product_variant_id')->nullable()->constrained('product_variants')->nullOnDelete();
                $table->integer('accepted_quantity');
                $table->integer('rejected_quantity')->default(0);
                $table->decimal('unit_cost', 14, 2); // Biaya per unit masuk
                $table->text('notes')->nullable();
                $table->timestamps();
            });
        }

        // 6. Vendor Bills (Faktur Tagihan Hutang Vendor)
        if (!Schema::hasTable('vendor_bills')) {
            Schema::create('vendor_bills', function (Blueprint $table) {
                $table->id();
                $table->string('bill_number')->unique(); // 'BILL-202609-001'
                $table->foreignId('vendor_id')->constrained('vendors')->cascadeOnDelete();
                $table->foreignId('purchase_order_id')->nullable()->constrained('purchase_orders')->nullOnDelete();
                $table->foreignId('grn_id')->nullable()->constrained('goods_receiving_notes')->nullOnDelete();
                $table->decimal('amount', 14, 2);
                $table->decimal('paid_amount', 14, 2)->default(0.00);
                $table->string('status')->default('unpaid'); // 'unpaid', 'partially_paid', 'paid'
                $table->date('bill_date');
                $table->date('due_date');
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('vendor_bills');
        Schema::dropIfExists('goods_receiving_items');
        Schema::dropIfExists('goods_receiving_notes');
        Schema::dropIfExists('purchase_order_items');
        Schema::dropIfExists('purchase_orders');
        Schema::dropIfExists('vendors');
    }
};
