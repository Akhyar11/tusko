<?php

namespace App\Services;

use App\Models\ExpeditionService;
use App\Models\Order;
use App\Models\Shipment;
use App\Models\Warehouse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use RuntimeException;

/**
 * BiteshipOrderService — pembuatan order pengiriman ke Biteship (T40.7).
 *
 * Memakai POST /v1/orders dengan data shipper/origin (gudang pemenuh) dan
 * destination (alamat penerima). Menyimpan identitas provider pada `shipments`
 * (provider_order_id/waybill/tracking/label/payload). Tanpa hardcode kredensial.
 */
class BiteshipOrderService
{
    public function __construct(
        private readonly BiteshipClient $client,
        private readonly IntegrationService $integrations
    ) {
    }

    public function isConfigured(): bool
    {
        return $this->client->isConfigured();
    }

    /**
     * Buat order di Biteship dan simpan hasilnya ke `shipments`.
     * Mengembalikan null bila integrasi gagal / tidak dikonfigurasi.
     */
    public function bookShipment(Order $order): ?Shipment
    {
        if (! $this->isConfigured()) {
            return null;
        }

        $existing = Shipment::where('order_id', $order->id)->first();

        if ($existing && ! empty($existing->provider_order_id)) {
            return $existing;
        }

        $response = $this->createForOrder($order);

        if (empty($response['id'])) {
            return null;
        }

        return DB::transaction(function () use ($order, $response) {
            $shipment = Shipment::where('order_id', $order->id)->lockForUpdate()->first()
                ?? new Shipment(['order_id' => $order->id]);

            $waybill = $response['courier_waybill_id'] ?? null;

            if (empty($waybill) && empty($shipment->waybill_number)) {
                $waybill = IdentityCodeService::generate(Shipment::class, 'RESI', 'waybill_number');
            }

            $shipment->fill([
                'expedition_service_id' => $shipment->expedition_service_id ?? $order->expedition_service_id,
                'provider' => 'biteship',
                'provider_order_id' => $response['id'],
                'provider_waybill_id' => $response['courier_waybill_id'] ?? null,
                'provider_tracking_id' => $response['courier_tracking_id'] ?? null,
                'provider_status' => $response['status'] ?? 'confirmed',
                'provider_label_url' => $response['label_url'] ?? null,
                'provider_tracking_url' => $response['courier_link'] ?? null,
                'courier_company' => $response['courier_company'] ?? null,
                'courier_type' => $response['courier_type'] ?? null,
                'provider_payload' => $response,
                'waybill_number' => $response['courier_waybill_id'] ?? $shipment->waybill_number ?? $waybill,
                'status' => $shipment->status ?? 'manifested',
                'pickup_time' => $shipment->pickup_time ?? now(),
            ]);
            $shipment->save();

            if (empty($order->tracking_number)) {
                $order->forceFill(['tracking_number' => $shipment->waybill_number])->save();
            }

            return $shipment;
        });
    }

    /**
     * Susun payload & kirim POST /v1/orders.
     *
     * @return array<string, mixed>
     */
    public function createForOrder(Order $order): array
    {
        $order->loadMissing(['items', 'shippingAddress']);

        $warehouse = $order->warehouse_id ? Warehouse::find($order->warehouse_id) : null;
        $warehouse ??= Warehouse::where('is_primary', true)->first();

        $address = $order->shippingAddress;
        $storeName = (string) ($this->integrations->get('store.name') ?: 'Tusko Official Store');

        $payload = array_filter([
            'shipper_contact_name' => $storeName,
            'shipper_contact_phone' => (string) ($this->integrations->get('store.phone') ?? ''),
            'shipper_contact_email' => (string) ($this->integrations->get('store.email') ?? ''),
            'shipper_organization' => $storeName,
            'origin_contact_name' => $warehouse?->name ?? $storeName,
            'origin_contact_phone' => (string) ($this->integrations->get('store.phone') ?? ''),
            'origin_address' => $warehouse?->address ?? (string) ($this->integrations->get('store.address') ?? ''),
            'origin_postal_code' => $warehouse?->postal_code ?? $this->integrations->get('store.origin_postal_code'),
            'origin_area_id' => $warehouse?->biteship_area_id ?? $this->integrations->get('shipping.biteship_origin_area_id'),
            'destination_contact_name' => $order->recipient_name,
            'destination_contact_phone' => $order->phone,
            'destination_contact_email' => $order->user?->email,
            'destination_address' => $order->full_address,
            'destination_postal_code' => $order->postal_code,
            'destination_area_id' => $address?->biteship_area_id,
            'courier_company' => strtolower((string) ($order->expedition?->code ?? '')),
            'courier_type' => $this->courierType($order),
            'courier_insurance' => (float) ($order->insurance_cost ?? 0) > 0 ? (int) round($order->subtotal) : null,
            'delivery_type' => (string) ($this->integrations->get('shipping.biteship_default_delivery_type') ?: 'now'),
            'order_note' => $order->notes,
            'metadata' => ['order_id' => $order->id, 'order_number' => $order->order_number],
        ], fn ($value) => $value !== null && $value !== '');

        $payload['items'] = $order->items->map(fn ($item) => array_filter([
            'name' => Str::limit((string) $item->product_name, 100, ''),
            'value' => (int) round((float) $item->product_price),
            'quantity' => max(1, (int) $item->quantity),
            'weight' => max(1, (int) round((float) ($item->product_weight ?: 1) * 1000)),
        ]))->values()->all();

        if ($payload['items'] === []) {
            throw new RuntimeException('Pesanan tidak memiliki item untuk dikirim.');
        }

        if (empty($payload['courier_company']) || empty($payload['courier_type'])) {
            throw new RuntimeException('Kurir & layanan pesanan belum ditentukan.');
        }

        return $this->client->post('/v1/orders', $payload);
    }

    /**
     * Batalkan order pengiriman Biteship (T40.14).
     *
     * Memanggil POST /v1/orders/{id}/cancel saat pesanan dibatalkan admin agar
     * booking tidak menggantung/tertagih. Best-effort: kegagalan jaringan dicatat
     * ke log, tidak melempar error ke pemanggil.
     */
    public function cancelForOrder(Order $order, ?string $reason = null): bool
    {
        $shipment = Shipment::query()
            ->where('order_id', $order->id)
            ->where('provider', 'biteship')
            ->first();

        if (! $shipment || empty($shipment->provider_order_id) || ! $this->isConfigured()) {
            return false;
        }

        $terminal = ['cancelled', 'returned', 'delivered', 'disposed', 'rejected'];
        if (in_array((string) $shipment->provider_status, $terminal, true)) {
            return false;
        }

        try {
            $this->client->post(
                '/v1/orders/' . rawurlencode((string) $shipment->provider_order_id) . '/cancel',
                ['reason' => $reason ?: 'Dibatalkan oleh admin']
            );

            $shipment->forceFill([
                'provider_status' => 'cancelled',
                'status' => 'cancelled',
            ])->save();

            return true;
        } catch (\Throwable $e) {
            Log::warning('Biteship cancel order gagal: ' . $e->getMessage(), ['order_id' => $order->id]);

            return false;
        }
    }

    private function courierType(Order $order): ?string
    {
        if ($order->expedition_service_id) {
            $service = ExpeditionService::find($order->expedition_service_id);

            if ($service?->service_code) {
                return (string) $service->service_code;
            }
        }

        return $order->expedition_service ? Str::slug((string) $order->expedition_service) : null;
    }
}
