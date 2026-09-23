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
        if (!Schema::hasTable('vendor_bill_payments')) {
            Schema::create('vendor_bill_payments', function (Blueprint $table) {
                $table->id();
                $table->foreignId('vendor_bill_id')->constrained('vendor_bills')->cascadeOnDelete();
                $table->decimal('amount', 14, 2);
                $table->string('payment_method');
                $table->string('reference_number')->nullable();
                $table->date('paid_at');
                $table->string('proof_file_path')->nullable();
                $table->string('proof_file_name')->nullable();
                $table->string('proof_file_mime')->nullable();
                $table->text('notes')->nullable();
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();

                $table->index(['vendor_bill_id', 'paid_at']);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('vendor_bill_payments');
    }
};
