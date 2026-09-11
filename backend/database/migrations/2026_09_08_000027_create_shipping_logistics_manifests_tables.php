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
        // 1. Expedition Services (Layanan Kurir: Reguler, Kargo, Same Day)
        if (!Schema::hasTable('expedition_services')) {
            Schema::create('expedition_services', function (Blueprint $table) {
                $table->id();
                $table->foreignId('expedition_id')->constrained('expeditions')->cascadeOnDelete();
                $table->string('service_code'); // 'REG', 'CARGO', 'EZ'
                $table->string('service_name'); // 'J&T Regular', 'SiCepat BEST'
                $table->string('etd_days')->default('1-3 hari');
                $table->decimal('base_rate', 10, 2)->default(0.00);
                $table->decimal('per_kg_rate', 10, 2)->default(0.00);
                $table->boolean('is_active')->default(true);
                $table->timestamps();

                $table->unique(['expedition_id', 'service_code']);
            });
        }

        // 2. Shipments (Manifest & Label Resi Kiriman)
        if (!Schema::hasTable('shipments')) {
            Schema::create('shipments', function (Blueprint $table) {
                $table->id();
                $table->foreignId('order_id')->constrained('orders')->cascadeOnDelete();
                $table->foreignId('expedition_service_id')->nullable()->constrained('expedition_services')->nullOnDelete();
                $table->string('waybill_number')->unique(); // No Resi Pelacakan
                $table->string('status')->default('manifested'); // 'manifested', 'picked_up', 'in_transit', 'delivered', 'returned'
                $table->string('thermal_label_url')->nullable();
                $table->timestamp('pickup_time')->nullable();
                $table->timestamp('delivered_time')->nullable();
                $table->timestamps();
            });
        }

        // 3. Shipment Trackings (Riwayat Pergerakan Titik Paket)
        if (!Schema::hasTable('shipment_trackings')) {
            Schema::create('shipment_trackings', function (Blueprint $table) {
                $table->id();
                $table->foreignId('shipment_id')->constrained('shipments')->cascadeOnDelete();
                $table->timestamp('tracking_time');
                $table->string('city_location');
                $table->text('status_description');
                $table->timestamps();

                $table->index(['shipment_id', 'tracking_time']);
            });
        }

        // 4. Perluas tabel orders untuk relasi layanan ekspedisi
        if (Schema::hasTable('orders') && !Schema::hasColumn('orders', 'expedition_service_id')) {
            Schema::table('orders', function (Blueprint $table) {
                $table->foreignId('expedition_service_id')->nullable()->after('expedition_id')->constrained('expedition_services')->nullOnDelete();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('orders') && Schema::hasColumn('orders', 'expedition_service_id')) {
            Schema::table('orders', function (Blueprint $table) {
                $table->dropForeign(['expedition_service_id']);
                $table->dropColumn('expedition_service_id');
            });
        }

        Schema::dropIfExists('shipment_trackings');
        Schema::dropIfExists('shipments');
        Schema::dropIfExists('expedition_services');
    }
};
