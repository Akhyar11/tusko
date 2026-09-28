<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * T40.2 — Kolom integrasi Biteship: area id (asal/tujuan), data provider pada
     * shipments, serta tabel audit/idempotensi webhook `shipping_webhook_events`.
     */
    public function up(): void
    {
        if (Schema::hasTable('warehouses') && ! Schema::hasColumn('warehouses', 'biteship_area_id')) {
            Schema::table('warehouses', function (Blueprint $table) {
                $table->string('biteship_area_id', 50)->nullable()->after('postal_code')->index();
            });
        }

        if (Schema::hasTable('shipping_addresses') && ! Schema::hasColumn('shipping_addresses', 'biteship_area_id')) {
            Schema::table('shipping_addresses', function (Blueprint $table) {
                $table->string('biteship_area_id', 50)->nullable()->after('subdistrict_code')->index();
            });
        }

        if (Schema::hasTable('shipments')) {
            Schema::table('shipments', function (Blueprint $table) {
                if (! Schema::hasColumn('shipments', 'provider')) {
                    $table->string('provider', 30)->default('manual')->after('expedition_service_id')->index();
                }
                if (! Schema::hasColumn('shipments', 'provider_order_id')) {
                    $table->string('provider_order_id', 100)->nullable()->after('provider')->index();
                }
                if (! Schema::hasColumn('shipments', 'provider_waybill_id')) {
                    $table->string('provider_waybill_id', 100)->nullable()->after('provider_order_id');
                }
                if (! Schema::hasColumn('shipments', 'provider_tracking_id')) {
                    $table->string('provider_tracking_id', 100)->nullable()->after('provider_waybill_id');
                }
                if (! Schema::hasColumn('shipments', 'provider_status')) {
                    $table->string('provider_status', 50)->nullable()->after('provider_tracking_id');
                }
                if (! Schema::hasColumn('shipments', 'provider_label_url')) {
                    $table->string('provider_label_url', 500)->nullable()->after('provider_status');
                }
                if (! Schema::hasColumn('shipments', 'provider_tracking_url')) {
                    $table->string('provider_tracking_url', 500)->nullable()->after('provider_label_url');
                }
                if (! Schema::hasColumn('shipments', 'courier_company')) {
                    $table->string('courier_company', 50)->nullable()->after('provider_tracking_url');
                }
                if (! Schema::hasColumn('shipments', 'courier_type')) {
                    $table->string('courier_type', 50)->nullable()->after('courier_company');
                }
                if (! Schema::hasColumn('shipments', 'provider_payload')) {
                    $table->json('provider_payload')->nullable()->after('courier_type');
                }
            });
        }

        if (! Schema::hasTable('shipping_webhook_events')) {
            Schema::create('shipping_webhook_events', function (Blueprint $table) {
                $table->id();
                $table->string('provider', 30)->index();
                $table->string('event', 50);
                $table->string('external_id', 100)->nullable();
                $table->json('payload');
                $table->string('payload_hash', 64);
                $table->boolean('signature_valid')->default(false);
                $table->string('status', 20)->default('received');
                $table->text('error_message')->nullable();
                $table->timestamp('processed_at')->nullable();
                $table->timestamps();

                $table->unique(['provider', 'event', 'external_id', 'payload_hash'], 'shipping_webhook_dedupe_unique');
                $table->index(['provider', 'external_id']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('shipping_webhook_events');

        if (Schema::hasTable('shipments')) {
            Schema::table('shipments', function (Blueprint $table) {
                foreach ([
                    'provider_payload', 'courier_type', 'courier_company', 'provider_tracking_url',
                    'provider_label_url', 'provider_status', 'provider_tracking_id',
                    'provider_waybill_id', 'provider_order_id', 'provider',
                ] as $column) {
                    if (Schema::hasColumn('shipments', $column)) {
                        $table->dropColumn($column);
                    }
                }
            });
        }

        if (Schema::hasTable('shipping_addresses') && Schema::hasColumn('shipping_addresses', 'biteship_area_id')) {
            Schema::table('shipping_addresses', function (Blueprint $table) {
                $table->dropColumn('biteship_area_id');
            });
        }

        if (Schema::hasTable('warehouses') && Schema::hasColumn('warehouses', 'biteship_area_id')) {
            Schema::table('warehouses', function (Blueprint $table) {
                $table->dropColumn('biteship_area_id');
            });
        }
    }
};
