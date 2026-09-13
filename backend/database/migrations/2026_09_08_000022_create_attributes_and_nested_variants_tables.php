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
        // 1. Attributes Table
        if (!Schema::hasTable('attributes')) {
            Schema::create('attributes', function (Blueprint $table) {
                $table->id();
                $table->string('name'); // 'Warna', 'Ukuran', 'Panjang Lengan'
                $table->string('code')->unique(); // 'color', 'size', 'sleeve_length'
                $table->string('display_type')->default('button'); // 'button', 'color_picker', 'dropdown'
                $table->integer('sort_order')->default(0);
                $table->timestamps();
            });
        }

        // 2. Attribute Values Table
        if (!Schema::hasTable('attribute_values')) {
            Schema::create('attribute_values', function (Blueprint $table) {
                $table->id();
                $table->foreignId('attribute_id')->constrained('attributes')->cascadeOnDelete();
                $table->string('value'); // 'Merah', 'XL', 'Pendek'
                $table->string('color_hex')->nullable(); // '#ef4444'
                $table->integer('sort_order')->default(0);
                $table->timestamps();

                $table->index(['attribute_id', 'sort_order']);
            });
        }

        // 3. Product Variants Table (Nested Matrix with Unique SKU & Custom Pricing)
        if (!Schema::hasTable('product_variants')) {
            Schema::create('product_variants', function (Blueprint $table) {
                $table->id();
                $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
                $table->string('sku')->unique(); // 'TSK-JRS-RED-XL'
                $table->string('barcode')->nullable()->unique();
                $table->string('variant_name'); // 'Pendek / Merah / XL'
                $table->decimal('price', 14, 2); // Custom Variant Pricing
                $table->decimal('original_price', 14, 2)->nullable();
                $table->decimal('current_cogs', 14, 2)->default(0.00); // HPP Terkini
                $table->decimal('weight_grams', 8, 2)->nullable();
                $table->integer('stock')->default(0);
                $table->boolean('is_active')->default(true);
                $table->timestamps();
                $table->softDeletes();

                $table->index(['product_id', 'is_active']);
            });
        }

        // 4. Variant Attribute Values Pivot (Multi-level nesting)
        if (!Schema::hasTable('variant_attribute_values')) {
            Schema::create('variant_attribute_values', function (Blueprint $table) {
                $table->foreignId('product_variant_id')->constrained('product_variants')->cascadeOnDelete();
                $table->foreignId('attribute_value_id')->constrained('attribute_values')->cascadeOnDelete();
                $table->primary(['product_variant_id', 'attribute_value_id']);
                $table->timestamp('created_at')->nullable();
            });
        }

        // 5. Tambahkan kolom opsional variant_id pada product_images jika belum ada
        if (Schema::hasTable('product_images') && !Schema::hasColumn('product_images', 'variant_id')) {
            Schema::table('product_images', function (Blueprint $table) {
                $table->foreignId('variant_id')->nullable()->after('product_id')->constrained('product_variants')->nullOnDelete();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('product_images') && Schema::hasColumn('product_images', 'variant_id')) {
            Schema::table('product_images', function (Blueprint $table) {
                $table->dropForeign(['variant_id']);
                $table->dropColumn('variant_id');
            });
        }

        Schema::dropIfExists('variant_attribute_values');
        Schema::dropIfExists('product_variants');
        Schema::dropIfExists('attribute_values');
        Schema::dropIfExists('attributes');
    }
};
