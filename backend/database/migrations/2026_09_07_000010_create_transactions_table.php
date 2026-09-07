<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Skema tabel `transactions` untuk pencatatan kas masuk & keluar
     * Sesuai PRD Spesifikasi Teknis Tabel `transactions`
     */
    public function up(): void
    {
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->string('transaction_number')->unique()->index();
            $table->foreignId('order_id')->nullable()->constrained('orders')->nullOnDelete();

            // Tipe transaksi: 'income' (uang masuk) atau 'expense' (uang keluar)
            $table->enum('type', ['income', 'expense'])->default('income')->index();

            // Kategori transaksi
            $table->string('category')->default('order_payment')->index();
            $table->string('category_label')->nullable();

            // Nominal dan deskripsi
            $table->decimal('amount', 14, 2)->default(0);
            $table->text('description');

            // Akun pembayaran / metode kas
            $table->string('payment_method')->nullable();
            $table->string('status')->default('settled')->index(); // 'settled', 'pending', 'failed'

            // Pihak terkait & catatan
            $table->string('customer_name')->nullable();
            $table->text('notes')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};
