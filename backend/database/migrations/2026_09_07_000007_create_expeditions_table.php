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
        Schema::create('expeditions', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code', 30)->index();
            $table->string('service');
            $table->string('category', 50)->default('Reguler')->index();
            $table->string('etd', 50);
            $table->decimal('base_cost', 10, 2);
            $table->decimal('cost', 10, 2);
            $table->boolean('is_free')->default(false);
            $table->boolean('is_active')->default(true)->index();
            $table->string('badge')->nullable();
            $table->text('description')->nullable();
            $table->boolean('tracking_support')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('expeditions');
    }
};
