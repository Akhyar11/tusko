<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * REVISI 6: buang lapisan `permissions`/`role_permissions` (diganti
     * master `menus` + pivot `role_menus`). Dipecah dari T37.1 agar DROP
     * dijalankan setelah guard `menu.access` (T37.5) siap.
     */
    public function up(): void
    {
        Schema::dropIfExists('role_permissions');
        Schema::dropIfExists('permissions');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (!Schema::hasTable('permissions')) {
            Schema::create('permissions', function (Blueprint $table) {
                $table->id();
                $table->string('code')->unique();
                $table->string('name');
                $table->string('group')->default('general');
                $table->text('description')->nullable();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('role_permissions')) {
            Schema::create('role_permissions', function (Blueprint $table) {
                $table->foreignId('role_id')->constrained('roles')->cascadeOnDelete();
                $table->foreignId('permission_id')->constrained('permissions')->cascadeOnDelete();
                $table->primary(['role_id', 'permission_id']);
                $table->timestamp('created_at')->nullable();
            });
        }
    }
};
