<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * D8 — tabel `payments` sebagai SUMBER KEBENARAN pembayaran.
     * Kolom `orders.midtrans_*`/`payment_*` menjadi turunan/legacy.
     */
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained('orders')->cascadeOnDelete();
            $table->string('method', 30)->default('midtrans');
            $table->string('channel', 50)->nullable();
            $table->decimal('amount', 14, 2)->default(0);
            $table->string('status', 30)->default('pending');
            $table->string('reference')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->string('proof')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['order_id', 'status']);
            $table->unique(['order_id', 'reference']);
        });

        // Backfill 1 baris payment per order dari kolom legacy.
        DB::table('orders')->orderBy('id')->chunk(200, function ($orders) {
            $rows = [];
            foreach ($orders as $order) {
                $rows[] = [
                    'order_id' => $order->id,
                    'method' => $order->payment_method ?: 'midtrans',
                    'channel' => $order->payment_channel ?? null,
                    'amount' => $order->grand_total ?? 0,
                    'status' => $order->payment_status ?: 'pending',
                    'reference' => $order->midtrans_transaction_id ?? null,
                    'paid_at' => $order->paid_at ?? null,
                    'proof' => $order->payment_proof ?? null,
                    'created_at' => $order->created_at ?? now(),
                    'updated_at' => $order->updated_at ?? now(),
                ];
            }

            if (! empty($rows)) {
                DB::table('payments')->insert($rows);
            }
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
