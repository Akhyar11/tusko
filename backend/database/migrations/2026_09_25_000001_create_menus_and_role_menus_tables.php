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
        // 1. Master Menu (navigasi + guard halaman; REVISI 6, tanpa permissions).
        if (!Schema::hasTable('menus')) {
            Schema::create('menus', function (Blueprint $table) {
                $table->id();
                $table->foreignId('parent_id')->nullable()->constrained('menus')->cascadeOnDelete();
                $table->string('environment')->default('admin'); // 'admin' | 'storefront'
                $table->string('section')->nullable();
                $table->string('label');
                $table->string('sublabel')->nullable();
                $table->string('path_prefix');
                $table->string('view_key')->nullable();
                $table->string('icon')->nullable();
                $table->string('feature_flag')->nullable();
                $table->unsignedInteger('sort_order')->default(0);
                $table->boolean('is_active')->default(true);
                $table->timestamps();

                $table->index(['environment', 'is_active']);
                $table->index(['parent_id', 'sort_order']);
            });
        }

        // 2. Role-Menu Pivot (user -> role -> menu).
        if (!Schema::hasTable('role_menus')) {
            Schema::create('role_menus', function (Blueprint $table) {
                $table->foreignId('role_id')->constrained('roles')->cascadeOnDelete();
                $table->foreignId('menu_id')->constrained('menus')->cascadeOnDelete();
                $table->primary(['role_id', 'menu_id']);
                $table->timestamp('created_at')->nullable();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('role_menus');
        Schema::dropIfExists('menus');
    }
};
