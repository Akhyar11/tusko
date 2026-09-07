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
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_number')->unique()->index();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('guest_session_id')->nullable()->index();

            // Status
            $table->string('status')->default('pending')->index();
            $table->string('payment_status')->default('pending')->index();
            $table->string('payment_method')->default('midtrans');
            $table->string('payment_channel')->nullable();
            $table->string('va_number')->nullable();

            // Midtrans specific fields
            $table->string('midtrans_snap_token')->nullable();
            $table->string('midtrans_transaction_id')->nullable();
            $table->string('midtrans_payment_type')->nullable();
            $table->text('midtrans_pdf_url')->nullable();

            // Manual transfer proof & info
            $table->string('payment_proof')->nullable();
            $table->timestamp('payment_transferred_at')->nullable();
            $table->string('bank_account_name')->nullable();
            $table->string('bank_name')->nullable();

            // Shipping Address snapshot
            $table->foreignId('shipping_address_id')->nullable()->constrained('shipping_addresses')->nullOnDelete();
            $table->string('recipient_name');
            $table->string('phone')->nullable();
            $table->string('phone_number')->nullable();
            $table->text('full_address');
            $table->string('province')->nullable();
            $table->string('city')->nullable();
            $table->string('district')->nullable();
            $table->string('postal_code')->nullable();
            $table->string('address_label')->nullable();

            // Expedition details
            $table->foreignId('expedition_id')->nullable()->constrained('expeditions')->nullOnDelete();
            $table->string('expedition_name');
            $table->string('expedition_service');
            $table->string('expedition_etd')->nullable();
            $table->string('tracking_number')->nullable()->index();

            // Financial calculations
            $table->decimal('subtotal', 14, 2)->default(0);
            $table->decimal('shipping_cost', 14, 2)->default(0);
            $table->decimal('insurance_cost', 14, 2)->default(0);
            $table->decimal('service_fee', 14, 2)->default(0);
            $table->decimal('discount_amount', 14, 2)->default(0);
            $table->decimal('grand_total', 14, 2)->default(0);
            $table->decimal('total_weight', 8, 2)->default(1.0);

            // Optional coupon / notes
            $table->string('coupon_code')->nullable();
            $table->text('notes')->nullable();

            // Lifecycle Timestamps
            $table->timestamp('paid_at')->nullable();
            $table->timestamp('shipped_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamp('expires_at')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
