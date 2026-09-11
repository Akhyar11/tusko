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
        // 1. COGS Histories (Pelacakan HPP Riil per Varian Produk)
        if (!Schema::hasTable('cogs_histories')) {
            Schema::create('cogs_histories', function (Blueprint $table) {
                $table->id();
                $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
                $table->foreignId('product_variant_id')->nullable()->constrained('product_variants')->nullOnDelete();
                $table->string('source_type'); // 'grn_receiving', 'manual_adjustment', 'initial_seed'
                $table->string('source_id')->nullable(); // grn_number
                $table->integer('incoming_quantity');
                $table->decimal('incoming_cost_per_unit', 14, 2);
                $table->decimal('previous_average_cogs', 14, 2);
                $table->decimal('new_average_cogs', 14, 2);
                $table->timestamp('effective_date');
                $table->timestamps();

                $table->index(['product_id', 'effective_date']);
            });
        }

        // 2. Chart of Accounts (Bagan Akun Keuangan)
        if (!Schema::hasTable('chart_of_accounts')) {
            Schema::create('chart_of_accounts', function (Blueprint $table) {
                $table->id();
                $table->string('account_code')->unique(); // '1100' Kas, '1200' Bank, '4100' Penjualan, '5100' HPP, '6100' Operasional
                $table->string('account_name');
                $table->string('account_type'); // 'asset', 'liability', 'equity', 'revenue', 'expense'
                $table->text('description')->nullable();
                $table->boolean('is_active')->default(true);
                $table->timestamps();
            });
        }

        // 3. Financial Accounts (Rekening Kas & Bank Riil Toko)
        if (!Schema::hasTable('financial_accounts')) {
            Schema::create('financial_accounts', function (Blueprint $table) {
                $table->id();
                $table->string('account_name'); // 'BCA Operasional', 'Mandiri Escrow'
                $table->string('account_number');
                $table->string('bank_name');
                $table->decimal('current_balance', 16, 2)->default(0.00);
                $table->boolean('is_active')->default(true);
                $table->timestamps();
            });
        }

        // 4. Perluas tabel transactions untuk relasi rekening finansial
        if (Schema::hasTable('transactions')) {
            Schema::table('transactions', function (Blueprint $table) {
                if (!Schema::hasColumn('transactions', 'financial_account_id')) {
                    $table->foreignId('financial_account_id')->nullable()->after('order_id')->constrained('financial_accounts')->nullOnDelete();
                }
                if (!Schema::hasColumn('transactions', 'fee_deducted')) {
                    $table->decimal('fee_deducted', 10, 2)->default(0.00)->after('amount');
                }
                if (!Schema::hasColumn('transactions', 'net_amount')) {
                    $table->decimal('net_amount', 14, 2)->nullable()->after('fee_deducted');
                }
            });
        }

        // 5. Financial Ledger Entries (Jurnal Umum Terpadu Double-Entry)
        if (!Schema::hasTable('financial_ledger_entries')) {
            Schema::create('financial_ledger_entries', function (Blueprint $table) {
                $table->id();
                $table->foreignId('transaction_id')->constrained('transactions')->cascadeOnDelete();
                $table->foreignId('chart_of_account_id')->constrained('chart_of_accounts')->cascadeOnDelete();
                $table->decimal('debit', 14, 2)->default(0.00);
                $table->decimal('credit', 14, 2)->default(0.00);
                $table->text('notes')->nullable();
                $table->timestamps();

                $table->index(['transaction_id', 'chart_of_account_id']);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('financial_ledger_entries');

        if (Schema::hasTable('transactions')) {
            Schema::table('transactions', function (Blueprint $table) {
                if (Schema::hasColumn('transactions', 'financial_account_id')) {
                    $table->dropForeign(['financial_account_id']);
                    $table->dropColumn(['financial_account_id', 'fee_deducted', 'net_amount']);
                }
            });
        }

        Schema::dropIfExists('financial_accounts');
        Schema::dropIfExists('chart_of_accounts');
        Schema::dropIfExists('cogs_histories');
    }
};
