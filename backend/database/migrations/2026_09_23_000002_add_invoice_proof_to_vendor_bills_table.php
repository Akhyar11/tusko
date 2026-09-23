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
        if (Schema::hasTable('vendor_bills') && !Schema::hasColumn('vendor_bills', 'invoice_file_path')) {
            Schema::table('vendor_bills', function (Blueprint $table) {
                $table->string('invoice_file_path')->nullable()->after('status');
                $table->string('invoice_file_name')->nullable()->after('invoice_file_path');
                $table->string('invoice_file_mime')->nullable()->after('invoice_file_name');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('vendor_bills') && Schema::hasColumn('vendor_bills', 'invoice_file_path')) {
            Schema::table('vendor_bills', function (Blueprint $table) {
                $table->dropColumn(['invoice_file_path', 'invoice_file_name', 'invoice_file_mime']);
            });
        }
    }
};
