<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * T15.1a — Schema voucher lanjutan: kuota, batas per-user, gratis ongkir,
     * stacking, serta tabel cakupan (targets) dan riwayat pemakaian (usages).
     */
    public function up(): void
    {
        if (Schema::hasTable('vouchers')) {
            Schema::table('vouchers', function (Blueprint $table) {
                if (!Schema::hasColumn('vouchers', 'quota')) {
                    $table->integer('quota')->nullable()->after('max_discount');
                }
                if (!Schema::hasColumn('vouchers', 'used_count')) {
                    $table->unsignedInteger('used_count')->default(0)->after('quota');
                }
                if (!Schema::hasColumn('vouchers', 'per_user_limit')) {
                    $table->unsignedInteger('per_user_limit')->nullable()->after('used_count');
                }
                if (!Schema::hasColumn('vouchers', 'is_free_shipping')) {
                    $table->boolean('is_free_shipping')->default(false)->after('per_user_limit');
                }
                if (!Schema::hasColumn('vouchers', 'stackable')) {
                    $table->boolean('stackable')->default(false)->after('is_free_shipping');
                }
            });
        }

        if (!Schema::hasTable('voucher_targets')) {
            Schema::create('voucher_targets', function (Blueprint $table) {
                $table->id();
                $table->foreignId('voucher_id')->constrained('vouchers')->cascadeOnDelete();
                $table->string('target_type'); // all | product | variant | category
                $table->unsignedBigInteger('target_id')->nullable();
                $table->timestamps();

                $table->index(['voucher_id', 'target_type']);
            });
        }

        if (!Schema::hasTable('voucher_usages')) {
            Schema::create('voucher_usages', function (Blueprint $table) {
                $table->id();
                $table->foreignId('voucher_id')->constrained('vouchers')->cascadeOnDelete();
                $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
                $table->foreignId('order_id')->nullable()->constrained('orders')->nullOnDelete();
                $table->timestamp('used_at')->nullable();
                $table->timestamps();

                $table->index(['voucher_id', 'user_id']);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('voucher_usages');
        Schema::dropIfExists('voucher_targets');

        if (Schema::hasTable('vouchers')) {
            Schema::table('vouchers', function (Blueprint $table) {
                $columns = [];
                foreach (['quota', 'used_count', 'per_user_limit', 'is_free_shipping', 'stackable'] as $column) {
                    if (Schema::hasColumn('vouchers', $column)) {
                        $columns[] = $column;
                    }
                }
                if (!empty($columns)) {
                    $table->dropColumn($columns);
                }
            });
        }
    }
};
