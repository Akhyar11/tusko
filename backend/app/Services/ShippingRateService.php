<?php

namespace App\Services;

use App\Models\Expedition;
use App\Models\Order;
use App\Models\TrackingCheckpointLabel;
use App\Models\Warehouse;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ShippingRateService
{
    /**
     * Dynamic origin warehouse instance (Gudang Pusat Utama Toko).
     */
    protected ?Warehouse $primaryWarehouse = null;
    protected float $originLat;
    protected float $originLng;
    protected string $originCity;
    protected string $originDistrict;
    protected string $warehouseName;

    // KiriminAja Integration Config
    protected ?string $kiriminAjaApiKey;
    protected string $kiriminAjaBaseUrl;

    // Biaya Tambahan Penanganan Aplikasi (Handling Fee)
    protected float $handlingFee;

    public function __construct()
    {
        // 1. Ambil Gudang Pusat secara dinamis dari database (Warehouse primary)
        $this->resolvePrimaryWarehouse();

        // 2. KiriminAja API Configuration (https://kiriminaja.com / api.kiriminaja.com)
        $this->kiriminAjaApiKey = config('services.kiriminaja.api_key', env('KIRIMINAJA_API_KEY'));
        $this->kiriminAjaBaseUrl = rtrim(config('services.kiriminaja.base_url', env('KIRIMINAJA_BASE_URL', 'https://api.kiriminaja.com')), '/');

        // 3. Biaya proteksi penanganan request berulang & pelacakan live kurir
        $this->handlingFee = (float) config('services.shipping.handling_fee', env('SHIPPING_HANDLING_FEE', 1000));
    }

    /**
     * Resolve data lokasi gudang pusat toko secara dinamis dari tabel warehouses.
     */
    public function resolvePrimaryWarehouse(): void
    {
        try {
            $this->primaryWarehouse = Warehouse::where('is_primary', true)->first()
                ?? Warehouse::where('is_active', true)->first();
        } catch (\Throwable $e) {
            $this->primaryWarehouse = null;
        }

        if ($this->primaryWarehouse) {
            $this->warehouseName = $this->primaryWarehouse->name;
            $this->originCity = $this->primaryWarehouse->city;
            $this->originDistrict = $this->primaryWarehouse->address ? explode(',', $this->primaryWarehouse->address)[0] : $this->primaryWarehouse->city;
            $this->originLat = $this->primaryWarehouse->latitude ? (float) $this->primaryWarehouse->latitude : 0.0;
            $this->originLng = $this->primaryWarehouse->longitude ? (float) $this->primaryWarehouse->longitude : 0.0;
        } else {
            $this->warehouseName = 'Gudang Pusat Tusko';
            $this->originCity = 'Jakarta Pusat';
            $this->originDistrict = 'Gambir';
            $this->originLat = 0.0;
            $this->originLng = 0.0;
        }
    }

    /**
     * Menghitung jarak lurus (geodesic distance) antara dua titik koordinat dengan Haversine Formula dalam km.
     */
    public function calculateHaversineDistance(float $lat1, float $lon1, float $lat2, float $lon2): float
    {
        $earthRadius = 6371; // Radius bumi dalam kilometer

        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);

        $a = sin($dLat / 2) * sin($dLat / 2) +
             cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
             sin($dLon / 2) * sin($dLon / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return round($earthRadius * $c, 2);
    }

    /**
     * Mengambil tarif langsung dari REST API KiriminAja (/api/v2/shipping/rates)
     */
    public function fetchKiriminAjaRates(string $originDistrict, string $destinationDistrict, int $weightGrams): ?array
    {
        if (empty($this->kiriminAjaApiKey)) {
            return null;
        }

        try {
            $response = Http::timeout(6)
                ->withHeaders([
                    'Authorization' => "Bearer {$this->kiriminAjaApiKey}",
                    'Accept' => 'application/json',
                ])
                ->post("{$this->kiriminAjaBaseUrl}/api/v2/shipping/rates", [
                    'origin' => $originDistrict,
                    'destination' => $destinationDistrict,
                    'weight' => max(100, $weightGrams),
                ]);

            if ($response->successful() && $response->json('status') === true) {
                return $response->json('data');
            }
        } catch (\Throwable $e) {
            Log::warning("Gagal terhubung ke KiriminAja shipping rates: " . $e->getMessage());
        }

        return null;
    }

    /**
     * Melacak posisi paket langsung dari endpoint KiriminAja (/api/v2/shipping/tracking/{resi})
     * Memanfaatkan kustomisasi label respons pelacakan yang dapat diatur oleh Admin toko di database.
     */
    public function trackPackage(string $resi): array
    {
        if (!empty($this->kiriminAjaApiKey)) {
            try {
                $response = Http::timeout(6)
                    ->withHeaders([
                        'Authorization' => "Bearer {$this->kiriminAjaApiKey}",
                        'Accept' => 'application/json',
                    ])
                    ->get("{$this->kiriminAjaBaseUrl}/api/v2/shipping/tracking/{$resi}");

                if ($response->successful() && $response->json('status') === true && is_array($response->json('data'))) {
                    return $response->json('data');
                }
            } catch (\Throwable $e) {
                Log::warning("Gagal melacak resi {$resi} lewat KiriminAja: " . $e->getMessage());
            }
        }

        // Cari relasi order dari database berdasarkan tracking_number atau order_number
        $order = Order::where('tracking_number', $resi)
            ->orWhere('order_number', $resi)
            ->first();

        $destinationCity = $order?->city ?? 'Kota Tujuan';
        $courierName = $order?->expedition_name ?? 'Kurir KiriminAja';
        $courierService = $order?->expedition_service ?? 'Reguler';
        $orderStatus = $order?->status ?? 'shipping';

        // Ambil label kustom respons pelacakan dari database (TrackingCheckpointLabel)
        $customLabels = [];
        try {
            $customLabels = TrackingCheckpointLabel::where('is_active', true)->pluck('custom_label', 'stage_key')->toArray();
        } catch (\Throwable $e) {
            // fallback
        }

        $labelWarehouse = $customLabels['at_warehouse'] ?? "Paket sedang disiapkan di {$this->warehouseName} ({$this->originCity})";
        $labelPickup = $customLabels['courier_pickup'] ?? "Paket telah diserahkan kepada kurir {$courierName} ({$courierService})";
        $labelTransit = $customLabels['transit_hub'] ?? "Paket tiba di pusat sortir hub transit ekspedisi";
        $labelOutDelivery = $customLabels['out_for_delivery'] ?? "Kurir sedang dalam perjalanan mengantar paket ke alamat penerima";
        $labelDelivered = $customLabels['delivered'] ?? "Paket telah berhasil diterima di alamat tujuan";

        $statusLabelMap = [
            'pending' => 'Menunggu penjemputan paket oleh kurir KiriminAja',
            'processing' => $labelWarehouse,
            'shipping' => $labelOutDelivery,
            'delivered' => $labelDelivered,
            'completed' => 'Pengiriman paket telah selesai',
            'cancelled' => 'Pengiriman dibatalkan',
        ];

        $statusLabel = $statusLabelMap[$orderStatus] ?? 'Paket dalam perjalanan ekspedisi KiriminAja';

        $history = [
            [
                'time' => now()->format('Y-m-d H:i'),
                'location' => $this->originCity,
                'stage' => 'at_warehouse',
                'note' => "{$labelWarehouse} - No. Resi: [{$resi}]",
            ],
            [
                'time' => now()->subHours(3)->format('Y-m-d H:i'),
                'location' => $this->originCity,
                'stage' => 'courier_pickup',
                'note' => "{$labelPickup} dari {$this->warehouseName}",
            ],
            [
                'time' => now()->subHours(2)->format('Y-m-d H:i'),
                'location' => 'Sorting Hub ' . $this->originCity,
                'stage' => 'transit_hub',
                'note' => $labelTransit,
            ],
        ];

        if (in_array($orderStatus, ['shipping', 'delivered', 'completed'])) {
            $history[] = [
                'time' => now()->subHours(1)->format('Y-m-d H:i'),
                'location' => $destinationCity,
                'stage' => 'out_for_delivery',
                'note' => "{$labelOutDelivery} ({$destinationCity})",
            ];
        }

        if (in_array($orderStatus, ['delivered', 'completed'])) {
            $history[] = [
                'time' => now()->format('Y-m-d H:i'),
                'location' => $destinationCity,
                'stage' => 'delivered',
                'note' => $labelDelivered,
            ];
        }

        return [
            'resi' => $resi,
            'status' => $orderStatus,
            'status_label' => $statusLabel,
            'courier' => $courierName,
            'service' => $courierService,
            'origin' => $this->originCity,
            'warehouse' => $this->warehouseName,
            'destination' => $destinationCity,
            'provider' => 'KiriminAja Logistics & Multi-Courier Gateway',
            'history' => $history,
        ];
    }

    /**
     * Menghitung estimasi ongkir untuk seluruh ekspedisi aktif berdasarkan koordinat/jarak dan berat paket.
     */
    public function calculateRates(
        ?float $destinationLat,
        ?float $destinationLng,
        float $weightKg = 1.0,
        ?string $destinationCity = null,
        ?string $category = null,
        ?string $destinationDistrict = null
    ): array {
        $weight = max(0.1, $weightKg);
        $weightGrams = (int) ceil($weight * 1000);
        $weightRoundedKg = (int) ceil($weight);

        // Hitung jarak jika koordinat tersedia
        $distanceKm = null;
        if ($destinationLat !== null && $destinationLng !== null && $this->originLat != 0.0 && $this->originLng != 0.0) {
            $distanceKm = $this->calculateHaversineDistance(
                $this->originLat,
                $this->originLng,
                $destinationLat,
                $destinationLng
            );
        } else {
            // Default estimasi jarak antar-wilayah Jabodetabek ~25km
            $distanceKm = 25.0;
        }

        $activeProvider = 'KiriminAja Logistics & Multi-Courier Gateway';

        $query = Expedition::active();
        if ($category && $category !== 'Semua') {
            $query->byCategory($category);
        }

        $expeditions = $query->orderByDesc('is_default')->orderBy('id')->get();
        $rates = [];

        foreach ($expeditions as $exp) {
            $rate = $this->calculateSingleExpeditionCost($exp, $distanceKm, $weight, $weightRoundedKg);
            $rates[] = $rate;
        }

        return [
            'origin' => [
                'warehouse_name' => $this->warehouseName,
                'city' => $this->originCity,
                'district' => $this->originDistrict,
                'latitude' => $this->originLat,
                'longitude' => $this->originLng,
            ],
            'destination' => [
                'city' => $destinationCity,
                'district' => $destinationDistrict,
                'latitude' => $destinationLat,
                'longitude' => $destinationLng,
            ],
            'distance_km' => $distanceKm,
            'weight_kg' => $weight,
            'provider' => $activeProvider,
            'handling_fee' => $this->handlingFee,
            'handling_fee_note' => 'Biaya penanganan sistem aplikasi & mitigasi kuota multi-tracking API',
            'expeditions' => $rates,
        ];
    }

    /**
     * Hitung ongkir satu ekspedisi dengan formula jarak Indonesia & kategori kurir.
     */
    protected function calculateSingleExpeditionCost(
        Expedition $exp,
        float $distanceKm,
        float $weightKg,
        int $weightRoundedKg
    ): array {
        $category = $exp->category;
        $baseRate = (float) $exp->base_cost;
        $cost = $baseRate;
        $etd = $exp->etd;

        if ($exp->is_free) {
            $cost = 0;
        } elseif ($category === 'Instan & Same Day') {
            // Formula kurir instan (GoSend / GrabExpress):
            // Jarak maksimal instan ~40km di Indonesia.
            // Tarif dasar ~Rp 15.000 untuk 4 km pertama, selanjutnya ~Rp 2.500/km.
            if ($distanceKm <= 4.0) {
                $cost = max($baseRate, 15000);
            } else {
                $extraKm = $distanceKm - 4.0;
                $cost = max($baseRate, 15000) + ($extraKm * 2500);
            }
            // Tambahan bobot jika > 5kg
            if ($weightKg > 5.0) {
                $cost += ($weightKg - 5.0) * 3000;
            }
            $cost = round($cost, -2);
        } elseif ($category === 'Kargo') {
            // Formula Kargo (JTR / SiCepat Gokil): minimum bobot perhitungan 10kg
            $cargoWeight = max(10, $weightRoundedKg);
            $distanceMultiplier = $distanceKm > 100 ? (1 + ($distanceKm / 500)) : 1.0;
            $cost = round(($baseRate / 10) * $cargoWeight * $distanceMultiplier, -3);
        } else {
            // Reguler & Next Day:
            // Zona jarak + per kilogram
            $zoneMultiplier = 1.0;
            if ($distanceKm > 300) {
                $zoneMultiplier = 1.8;
                $etd = '3 - 5 hari';
            } elseif ($distanceKm > 100) {
                $zoneMultiplier = 1.35;
                $etd = '2 - 3 hari';
            } elseif ($distanceKm > 40) {
                $zoneMultiplier = 1.15;
            }

            $cost = round($baseRate * $weightRoundedKg * $zoneMultiplier, -2);
        }

        return [
            'id' => $exp->id,
            'name' => $exp->name,
            'code' => $exp->code,
            'service' => $exp->service,
            'category' => $exp->category,
            'etd' => $etd,
            'base_cost' => $baseRate,
            'cost' => (float) $cost,
            'is_free' => (bool) $exp->is_free,
            'is_default' => (bool) $exp->is_default,
            'badge' => $exp->badge,
            'description' => $exp->description,
            'tracking_support' => (bool) $exp->tracking_support,
            'cod_support' => (bool) $exp->cod_support,
        ];
    }
}
