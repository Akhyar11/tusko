<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (!Schema::hasTable('payment_gateway_settings')) {
            Schema::create('payment_gateway_settings', function (Blueprint $table) {
                $table->id();
                $table->string('gateway_name')->default('midtrans'); // 'midtrans'
                $table->string('payment_mode')->default('midtrans_popup'); // 'midtrans_popup' | 'store_custom' | 'midtrans_redirect'
                $table->boolean('is_production')->default(false);
                $table->string('merchant_id')->nullable();
                $table->string('client_key')->nullable();
                $table->string('server_key')->nullable();
                $table->integer('expiry_duration_hours')->default(24);
                $table->boolean('enable_va')->default(true);
                $table->boolean('enable_qris')->default(true);
                $table->boolean('enable_cc')->default(true);
                $table->boolean('is_active')->default(true);
                $table->timestamps();
            });

            // Seed initial default payment settings
            DB::table('payment_gateway_settings')->insert([
                'gateway_name' => 'midtrans',
                'payment_mode' => 'midtrans_popup',
                'is_production' => false,
                'merchant_id' => config('midtrans.merchant_id'),
                'client_key' => config('midtrans.client_key'),
                'server_key' => config('midtrans.server_key'),
                'expiry_duration_hours' => 24,
                'enable_va' => true,
                'enable_qris' => true,
                'enable_cc' => true,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payment_gateway_settings');
    }
};
