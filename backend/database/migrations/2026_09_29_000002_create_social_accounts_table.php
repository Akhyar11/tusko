<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * T41.3 — Akun sosial (OAuth) yang terhubung ke user. Multi-provider ready.
     */
    public function up(): void
    {
        Schema::create('social_accounts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('provider', 30)->default('google');
            $table->string('provider_user_id', 191);
            $table->string('email')->nullable();
            $table->string('name')->nullable();
            $table->string('avatar', 500)->nullable();
            $table->timestamp('token_expires_at')->nullable();
            $table->timestamps();

            $table->unique(['provider', 'provider_user_id']);
            $table->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('social_accounts');
    }
};
