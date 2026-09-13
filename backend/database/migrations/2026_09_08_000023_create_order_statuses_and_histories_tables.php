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
        // 1. Order Statuses Reference Table
        if (!Schema::hasTable('order_statuses')) {
            Schema::create('order_statuses', function (Blueprint $table) {
                $table->id();
                $table->string('code')->unique(); // 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'completed', 'cancelled'
                $table->string('name');
                $table->string('badge_color')->default('neutral'); // 'neutral', 'amber', 'blue', 'emerald', 'red'
                $table->integer('sort_order')->default(0);
                $table->boolean('is_terminal')->default(false); // Selesai atau batal
                $table->boolean('allows_cancellation')->default(false);
                $table->timestamps();
            });
        }

        // 2. Payment Statuses Reference Table
        if (!Schema::hasTable('payment_statuses')) {
            Schema::create('payment_statuses', function (Blueprint $table) {
                $table->id();
                $table->string('code')->unique(); // 'unpaid', 'pending_verification', 'paid', 'failed', 'refunded'
                $table->string('name');
                $table->string('badge_color')->default('neutral');
                $table->integer('sort_order')->default(0);
                $table->timestamps();
            });
        }

        // 3. Order Status Histories (Audit Trail Perubahan Status)
        if (!Schema::hasTable('order_status_histories')) {
            Schema::create('order_status_histories', function (Blueprint $table) {
                $table->id();
                $table->foreignId('order_id')->constrained('orders')->cascadeOnDelete();
                $table->foreignId('status_id')->nullable()->constrained('order_statuses')->nullOnDelete();
                $table->string('status_code'); // Cadangan kode tekstual
                $table->string('actor_type')->default('system'); // 'customer', 'admin', 'system', 'webhook'
                $table->foreignId('actor_id')->nullable()->constrained('users')->nullOnDelete();
                $table->text('notes')->nullable();
                $table->timestamps();

                $table->index(['order_id', 'created_at']);
            });
        }

        // 4. Perluas tabel orders & items untuk relasi varian & status dinamis
        if (Schema::hasTable('orders')) {
            Schema::table('orders', function (Blueprint $table) {
                if (!Schema::hasColumn('orders', 'status_id')) {
                    $table->foreignId('status_id')->nullable()->after('status')->constrained('order_statuses')->nullOnDelete();
                }
                if (!Schema::hasColumn('orders', 'payment_status_id')) {
                    $table->foreignId('payment_status_id')->nullable()->after('payment_status')->constrained('payment_statuses')->nullOnDelete();
                }
                if (!Schema::hasColumn('orders', 'total_cogs')) {
                    $table->decimal('total_cogs', 14, 2)->default(0.00)->after('grand_total');
                }
                if (!Schema::hasColumn('orders', 'loyalty_points_earned')) {
                    $table->integer('loyalty_points_earned')->default(0)->after('total_cogs');
                }
                if (!Schema::hasColumn('orders', 'loyalty_points_redeemed')) {
                    $table->integer('loyalty_points_redeemed')->default(0)->after('loyalty_points_earned');
                }
            });
        }

        if (Schema::hasTable('order_items') && !Schema::hasColumn('order_items', 'product_variant_id')) {
            Schema::table('order_items', function (Blueprint $table) {
                $table->foreignId('product_variant_id')->nullable()->after('product_id')->constrained('product_variants')->nullOnDelete();
                $table->decimal('unit_cogs', 14, 2)->default(0.00)->after('unit_price');
            });
        }

        if (Schema::hasTable('cart_items') && !Schema::hasColumn('cart_items', 'product_variant_id')) {
            Schema::table('cart_items', function (Blueprint $table) {
                $table->foreignId('product_variant_id')->nullable()->after('product_id')->constrained('product_variants')->nullOnDelete();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('cart_items') && Schema::hasColumn('cart_items', 'product_variant_id')) {
            Schema::table('cart_items', function (Blueprint $table) {
                $table->dropForeign(['product_variant_id']);
                $table->dropColumn('product_variant_id');
            });
        }

        if (Schema::hasTable('order_items')) {
            Schema::table('order_items', function (Blueprint $table) {
                if (Schema::hasColumn('order_items', 'product_variant_id')) {
                    $table->dropForeign(['product_variant_id']);
                    $table->dropColumn(['product_variant_id', 'unit_cogs']);
                }
            });
        }

        if (Schema::hasTable('orders')) {
            Schema::table('orders', function (Blueprint $table) {
                if (Schema::hasColumn('orders', 'status_id')) {
                    $table->dropForeign(['status_id']);
                    $table->dropColumn('status_id');
                }
                if (Schema::hasColumn('orders', 'payment_status_id')) {
                    $table->dropForeign(['payment_status_id']);
                    $table->dropColumn('payment_status_id');
                }
                if (Schema::hasColumn('orders', 'total_cogs')) {
                    $table->dropColumn(['total_cogs', 'loyalty_points_earned', 'loyalty_points_redeemed']);
                }
            });
        }

        Schema::dropIfExists('order_status_histories');
        Schema::dropIfExists('payment_statuses');
        Schema::dropIfExists('order_statuses');
    }
};
