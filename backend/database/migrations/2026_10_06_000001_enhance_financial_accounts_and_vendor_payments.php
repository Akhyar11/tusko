<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('financial_accounts', function (Blueprint $table) {
            if (!Schema::hasColumn('financial_accounts', 'type')) {
                $table->string('type', 20)->default('bank')->after('id'); // 'cash' atau 'bank'
            }
            if (!Schema::hasColumn('financial_accounts', 'account_holder')) {
                $table->string('account_holder')->nullable()->after('account_number');
            }
            if (!Schema::hasColumn('financial_accounts', 'chart_of_account_id')) {
                $table->foreignId('chart_of_account_id')->nullable()->after('type')->constrained('chart_of_accounts')->nullOnDelete();
            }
            if (!Schema::hasColumn('financial_accounts', 'opening_balance')) {
                $table->decimal('opening_balance', 16, 2)->default(0.00)->after('bank_name');
            }
            if (!Schema::hasColumn('financial_accounts', 'notes')) {
                $table->text('notes')->nullable()->after('current_balance');
            }
            $table->string('account_number')->nullable()->change();
            $table->string('bank_name')->nullable()->change();
        });

        Schema::table('vendor_bill_payments', function (Blueprint $table) {
            if (!Schema::hasColumn('vendor_bill_payments', 'financial_account_id')) {
                $table->foreignId('financial_account_id')->nullable()->after('vendor_bill_id')->constrained('financial_accounts')->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('vendor_bill_payments', function (Blueprint $table) {
            if (Schema::hasColumn('vendor_bill_payments', 'financial_account_id')) {
                $table->dropConstrainedForeignId('financial_account_id');
            }
        });

        Schema::table('financial_accounts', function (Blueprint $table) {
            if (Schema::hasColumn('financial_accounts', 'chart_of_account_id')) {
                $table->dropConstrainedForeignId('chart_of_account_id');
            }
            $table->dropColumn(['type', 'account_holder', 'opening_balance', 'notes']);
        });
    }
};
