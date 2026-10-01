<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\BiteshipOrderService;
use App\Services\BiteshipTrackingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use RuntimeException;

class ShipmentController extends Controller
{
    /**
     * Lacak pengiriman (T40.8) — sinkron riwayat Biteship lalu kembalikan.
     */
    public function tracking(Request $request, string $idOrOrderNumber, BiteshipTrackingService $tracking): JsonResponse
    {
        $order = Order::with(['shipment.trackings'])
            ->whereIdOrCode($idOrOrderNumber)
            ->firstOrFail();

        // T27.1: anti-IDOR — hanya admin atau pemilik pesanan.
        $user = $request->user();
        $isAdmin = $user && app(\App\Services\MenuService::class)->isAdmin($user);

        if (! $isAdmin && (! $user || (int) $order->user_id !== (int) $user->id)) {
            abort(403, 'Akses ditolak.');
        }

        $shipment = $order->shipment;

        if ($shipment && $shipment->provider === 'biteship') {
            $tracking->syncShipment($shipment);
            $shipment->refresh()->load('trackings');
        }

        return response()->json([
            'status' => 'success',
            'data' => [
                'order_number' => $order->order_number,
                'status' => $order->status,
                'tracking_number' => $order->tracking_number,
                'expedition_name' => $order->expedition_name,
                'expedition_service' => $order->expedition_service,
                'provider' => $shipment?->provider,
                'provider_status' => $shipment?->provider_status,
                'tracking_url' => $shipment?->provider_tracking_url,
                'label_url' => $shipment?->provider_label_url,
                'history' => $shipment
                    ? $shipment->trackings
                        ->sortByDesc('tracking_time')
                        ->values()
                        ->map(fn ($entry) => [
                            'time' => $entry->tracking_time?->toIso8601String(),
                            'city' => $entry->city_location,
                            'description' => $entry->status_description,
                        ])
                    : [],
            ],
        ]);
    }

    /**
     * Buat order pengiriman Biteship untuk sebuah pesanan (T40.7, admin-only).
     */
    public function store(Request $request, string $idOrOrderNumber, BiteshipOrderService $biteship): JsonResponse
    {
        $order = Order::with(['items', 'expedition', 'shippingAddress'])
            ->whereIdOrCode($idOrOrderNumber)
            ->firstOrFail();

        if (! $biteship->isConfigured()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Integrasi Biteship belum dikonfigurasi admin.',
            ], 422);
        }

        if (in_array($order->status, ['pending', 'cancelled'], true)) {
            return response()->json([
                'message' => 'Pengiriman hanya dapat dibuat untuk pesanan yang sudah diproses/dibayar.',
            ], 422);
        }

        try {
            $shipment = $biteship->bookShipment($order);
        } catch (RuntimeException $e) {
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 422);
        }

        if (! $shipment) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal membuat order pengiriman Biteship. Periksa kredensial & data kurir.',
            ], 422);
        }

        return response()->json([
            'status' => 'success',
            'message' => "Order pengiriman Biteship dibuat. Resi: {$shipment->waybill_number}.",
            'data' => [
                'shipment_id' => $shipment->id,
                'provider' => $shipment->provider,
                'provider_order_id' => $shipment->provider_order_id,
                'waybill_number' => $shipment->waybill_number,
                'provider_waybill_id' => $shipment->provider_waybill_id,
                'provider_status' => $shipment->provider_status,
                'label_url' => $shipment->provider_label_url,
                'tracking_url' => $shipment->provider_tracking_url,
                'status' => $shipment->status,
            ],
        ], 201);
    }

    /**
     * Perbarui order pengiriman Biteship (T40.16, admin-only) — ubah alamat/kurir
     * selama status belum dijemput.
     */
    public function update(Request $request, string $idOrOrderNumber, BiteshipOrderService $biteship): JsonResponse
    {
        $order = Order::whereIdOrCode($idOrOrderNumber)->firstOrFail();

        if (! $biteship->isConfigured()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Integrasi Biteship belum dikonfigurasi admin.',
            ], 422);
        }

        $validated = $request->validate([
            'origin_contact_name' => 'nullable|string|max:150',
            'origin_contact_phone' => 'nullable|string|max:30',
            'origin_address' => 'nullable|string|max:500',
            'origin_postal_code' => 'nullable|string|max:10',
            'destination_contact_name' => 'nullable|string|max:150',
            'destination_contact_phone' => 'nullable|string|max:30',
            'destination_address' => 'nullable|string|max:500',
            'destination_postal_code' => 'nullable|string|max:10',
            'courier_company' => 'nullable|string|max:50',
            'courier_type' => 'nullable|string|max:50',
            'delivery_type' => 'nullable|string|in:now,scheduled',
            'order_note' => 'nullable|string|max:500',
        ]);

        $result = $biteship->updateForOrder($order, $validated);

        if ($result === null) {
            return response()->json([
                'status' => 'error',
                'message' => 'Order pengiriman tidak dapat diperbarui (belum dibooking, sudah dijemput, atau tidak ada perubahan).',
            ], 422);
        }

        $shipment = $order->fresh()->shipment;

        return response()->json([
            'status' => 'success',
            'message' => 'Order pengiriman Biteship berhasil diperbarui.',
            'data' => [
                'provider_status' => $shipment?->provider_status,
                'waybill_number' => $shipment?->waybill_number,
                'provider_waybill_id' => $shipment?->provider_waybill_id,
            ],
        ]);
    }
}
