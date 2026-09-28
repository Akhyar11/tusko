<?php

namespace App\Services;

use App\Models\Shipment;
use App\Models\ShipmentTracking;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

/**
 * BiteshipTrackingService — sinkronisasi pelacakan Biteship (T40.8).
 *
 * GET /v1/trackings/{orderId} (memakai Biteship order id) atau
 * /v1/trackings/{waybillId}/couriers/{courierCode}. Menyimpan riwayat ke
 * `shipment_trackings` secara idempotent + memperbarui status provider.
 */
class BiteshipTrackingService
{
    public function __construct(private readonly BiteshipClient $client)
    {
    }

    /**
     * @return array<string, mixed>  respons mentah Biteship (kosong bila gagal)
     */
    public function fetch(Shipment $shipment): array
    {
        if (! $this->client->isConfigured()) {
            return [];
        }

        if ($shipment->provider_order_id) {
            return $this->client->get('/v1/trackings/' . urlencode((string) $shipment->provider_order_id));
        }

        $waybill = $shipment->provider_waybill_id ?? $shipment->waybill_number;
        $courier = $shipment->courier_company;

        if ($waybill && $courier) {
            return $this->client->get('/v1/trackings/' . urlencode((string) $waybill) . '/couriers/' . urlencode((string) $courier));
        }

        return [];
    }

    /**
     * Sinkronkan pelacakan & perbarui shipment. Mengembalikan jumlah entri baru.
     */
    public function syncShipment(Shipment $shipment): int
    {
        $body = $this->fetch($shipment);

        if ($body === []) {
            return 0;
        }

        $history = $body['history'] ?? [];
        $created = 0;

        foreach ($history as $event) {
            $note = (string) ($event['note'] ?? $event['status'] ?? '');
            $time = $event['updated_at'] ?? $event['time'] ?? null;
            $trackingTime = $time ? Carbon::parse($time) : now();

            $exists = ShipmentTracking::where('shipment_id', $shipment->id)
                ->where('tracking_time', $trackingTime)
                ->where('status_description', $note)
                ->exists();

            if ($exists) {
                continue;
            }

            ShipmentTracking::create([
                'shipment_id' => $shipment->id,
                'tracking_time' => $trackingTime,
                'city_location' => (string) ($event['city'] ?? $event['location'] ?? $note),
                'status_description' => $note,
            ]);
            $created++;
        }

        $providerStatus = $body['status'] ?? null;

        if ($providerStatus) {
            $update = [
                'provider_status' => $providerStatus,
                'status' => $this->mapStatus((string) $providerStatus, $shipment->status),
            ];

            if (strtolower((string) $providerStatus) === 'delivered' && ! $shipment->delivered_time) {
                $update['delivered_time'] = now();
            }

            $shipment->update($update);
        }

        Log::info('Biteship tracking tersinkron', [
            'shipment_id' => $shipment->id,
            'new_entries' => $created,
        ]);

        return $created;
    }

    /**
     * Petakan status Biteship -> status internal `shipments.status`.
     */
    public function mapStatus(string $providerStatus, string $current): string
    {
        return match (strtolower($providerStatus)) {
            'confirmed', 'allocated', 'manifested' => 'manifested',
            'picking_up', 'picked' => 'picked_up',
            'dropping_off', 'in_transit', 'on_hold' => 'in_transit',
            'delivered' => 'delivered',
            'cancelled', 'rejected', 'return_in_transit', 'returned' => 'returned',
            default => $current,
        };
    }
}
