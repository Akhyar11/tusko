<?php

namespace App\Services;

use App\Models\Order;
use App\Models\OrderStatus;
use App\Models\OrderStatusHistory;
use App\Models\Shipment;
use App\Models\ShipmentTracking;
use App\Models\ShippingWebhookEvent;
use Throwable;

/**
 * BiteshipWebhookService — pemrosesan webhook Biteship (T40.9).
 *
 * Event: order.status, order.waybill_id, order.price. Bersifat IDEMPOTEN via
 * `shipping_webhook_events` (provider+event+external_id+payload_hash) dan
 * mencatat audit trail. Tidak ada kredensial hardcode.
 */
class BiteshipWebhookService
{
    public const SUPPORTED_EVENTS = ['order.status', 'order.waybill_id', 'order.price'];

    public function __construct(private readonly BiteshipTrackingService $tracking)
    {
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array{status: string, event?: string}
     */
    public function handle(array $payload, bool $signatureValid): array
    {
        $event = (string) ($payload['event'] ?? '');
        $externalId = (string) ($payload['order_id'] ?? '');
        $hash = hash('sha256', json_encode($payload));

        $keys = [
            'provider' => 'biteship',
            'event' => $event,
            'external_id' => $externalId,
            'payload_hash' => $hash,
        ];

        if (! in_array($event, self::SUPPORTED_EVENTS, true)) {
            ShippingWebhookEvent::firstOrCreate($keys, [
                'payload' => $payload,
                'signature_valid' => $signatureValid,
                'status' => 'ignored',
                'error_message' => 'Event tidak dikenal.',
            ]);

            return ['status' => 'unknown', 'event' => $event];
        }

        $record = ShippingWebhookEvent::firstOrCreate($keys, [
            'payload' => $payload,
            'signature_valid' => $signatureValid,
            'status' => 'received',
        ]);

        if (in_array($record->status, ['processed', 'ignored'], true)) {
            return ['status' => 'duplicate', 'event' => $event];
        }

        try {
            $this->process($event, $payload);
            $record->update(['status' => 'processed', 'processed_at' => now(), 'error_message' => null]);

            return ['status' => 'processed', 'event' => $event];
        } catch (Throwable $e) {
            $record->update([
                'status' => 'failed',
                'processed_at' => now(),
                'error_message' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function process(string $event, array $payload): void
    {
        $orderId = $payload['order_id'] ?? null;

        if (! $orderId) {
            return;
        }

        $shipment = Shipment::where('provider', 'biteship')
            ->where('provider_order_id', (string) $orderId)
            ->first();

        if (! $shipment) {
            return;
        }

        match ($event) {
            'order.waybill_id' => $this->processWaybill($shipment, $payload),
            'order.status' => $this->processStatus($shipment, $payload),
            'order.price' => $this->processPrice($shipment, $payload),
            default => null,
        };
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function processWaybill(Shipment $shipment, array $payload): void
    {
        $waybill = $payload['courier_waybill_id'] ?? $payload['waybill_id'] ?? null;

        if (! $waybill) {
            return;
        }

        $update = [
            'provider_waybill_id' => (string) $waybill,
            'provider_tracking_id' => $payload['courier_tracking_id'] ?? $shipment->provider_tracking_id,
        ];

        // waybill_number unik: hanya timpa placeholder bila belum ada resi asli.
        if (empty($shipment->provider_waybill_id)) {
            $update['waybill_number'] = (string) $waybill;
        }

        $shipment->update($update);

        $order = $shipment->order;

        if ($order && empty($order->tracking_number)) {
            $order->forceFill(['tracking_number' => (string) $waybill])->save();
        }
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function processStatus(Shipment $shipment, array $payload): void
    {
        $providerStatus = (string) ($payload['status'] ?? '');

        if ($providerStatus === '') {
            return;
        }

        $update = [
            'provider_status' => $providerStatus,
            'status' => $this->tracking->mapStatus($providerStatus, $shipment->status),
        ];

        if (! empty($payload['courier_waybill_id'])) {
            $update['provider_waybill_id'] = (string) $payload['courier_waybill_id'];
        }
        if (! empty($payload['courier_tracking_id'])) {
            $update['provider_tracking_id'] = (string) $payload['courier_tracking_id'];
        }
        if (! empty($payload['courier_company'])) {
            $update['courier_company'] = (string) $payload['courier_company'];
        }
        if (! empty($payload['courier_type'])) {
            $update['courier_type'] = (string) $payload['courier_type'];
        }
        if (! empty($payload['courier_link'])) {
            $update['provider_tracking_url'] = (string) $payload['courier_link'];
        }
        if (strtolower($providerStatus) === 'delivered' && ! $shipment->delivered_time) {
            $update['delivered_time'] = now();
        }

        $shipment->update($update);

        ShipmentTracking::firstOrCreate(
            [
                'shipment_id' => $shipment->id,
                'tracking_time' => now()->startOfSecond(),
                'status_description' => 'Biteship: ' . $providerStatus,
            ],
            ['city_location' => (string) ($payload['courier_company'] ?? '')]
        );

        $this->advanceOrder($shipment, $providerStatus);
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function processPrice(Shipment $shipment, array $payload): void
    {
        $payloadData = $shipment->provider_payload ?? [];
        $payloadData['final_price'] = $payload['order_price'] ?? null;

        $shipment->update(['provider_payload' => $payloadData]);
    }

    private function advanceOrder(Shipment $shipment, string $providerStatus): void
    {
        $order = $shipment->order;

        if (! $order) {
            return;
        }

        $providerStatus = strtolower($providerStatus);

        $target = null;

        if (in_array($providerStatus, ['picking_up', 'picked', 'dropping_off', 'in_transit'], true)
            && in_array($order->status, ['confirmed', 'processing'], true)
            && $order->payment_status === 'paid') {
            $target = 'shipped';
        } elseif ($providerStatus === 'delivered' && $order->status === 'shipped') {
            $target = 'delivered';
        }

        if ($target === null || $target === $order->status) {
            return;
        }

        $statusRef = OrderStatus::where('code', $target)->first();
        $update = ['status' => $target];

        if ($target === 'shipped') {
            $update['shipped_at'] = $order->shipped_at ?? now();
        }
        if ($target === 'delivered') {
            $update['completed_at'] = $order->completed_at ?? now();
        }
        if ($statusRef) {
            $update['status_id'] = $statusRef->id;
        }

        $previous = $order->status;
        $order->update($update);

        OrderStatusHistory::create([
            'order_id' => $order->id,
            'status_id' => $statusRef?->id,
            'status_code' => $target,
            'actor_type' => 'system',
            'actor_id' => null,
            'notes' => "Status diperbarui otomatis dari webhook Biteship ({$providerStatus}).",
        ]);
    }
}
