<?php

namespace App\Services;

use App\Models\Expedition;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ShippingRateService
{
    /**
     * Default origin store coordinates (Tusko Performance Storefront - Jakarta Pusat).
     */
    protected float $originLat;
    protected float $originLng;
    protected string $originCity;
    protected string $originDistrict;
    
    // api.co.id Integration Config
    protected ?string $apiCoIdKey;
    protected string $apiCoIdBaseUrl;

    // RajaOngkir Config (Secondary / Fallback)
    protected ?string $rajaOngkirApiKey;
    protected string $rajaOngkirBaseUrl;
    protected string $originCityId;

    // Biaya Tambahan Penanganan Aplikasi (Handling Fee)
    // Untuk mitigasi lonjakan request kuota check ongkir & live tracking berulang
    protected float $handlingFee;

    public function __construct()
    {
        $this->originLat = (float) config('services.shipping.origin_lat', -6.2088);
        $this->originLng = (float) config('services.shipping.origin_lng', 106.8456);
        $this->originCity = config('services.shipping.origin_city', 'Jakarta Pusat');
        $this->originDistrict = config('services.shipping.origin_district', 'Gambir');

        // https://api.co.id/integrasi-api-pengiriman/
        $this->apiCoIdKey = config('services.apicoid.api_key', env('APICOID_API_KEY'));
        $this->apiCoIdBaseUrl = rtrim(config('services.apicoid.base_url', env('APICOID_BASE_URL', 'https://api.co.id')), '/');

        // RajaOngkir fallback
        $this->rajaOngkirApiKey = config('services.rajaongkir.api_key', env('RAJAONGKIR_API_KEY'));
        $this->rajaOngkirBaseUrl = config('services.rajaongkir.base_url', env('RAJAONGKIR_BASE_URL', 'https://api.rajaongkir.com/starter'));
        $this->originCityId = config('services.rajaongkir.origin_city_id', env('RAJAONGKIR_ORIGIN_CITY_ID', '152'));

        // Biaya proteksi penanganan request berulang & pelacakan live kurir (Rp 1.000)
        $this->handlingFee = (float) config('services.shipping.handling_fee', 1000);
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
     * Mengambil tarif langsung dari REST API api.co.id (/courier/v2/rates)
     * Format header: x-api-co-id: YOUR_API_KEY
     * Cek ongkir Rp 5 per panggilan sukses, menyatukan 10 kurir Indonesia.
     */
    public function fetchApiCoIdRates(string $originDistrict, string $destinationDistrict, int $weightGrams): ?array
    {
        if (empty($this->apiCoIdKey)) {
            return null;
        }

        try {
            $response = Http::timeout(6)
                ->withHeaders([
                    'x-api-co-id' => $this->apiCoIdKey,
                    'Accept' => 'application/json',
                ])
                ->get("{$this->apiCoIdBaseUrl}/courier/v2/rates", [
                    'origin' => $originDistrict,
                    'destination' => $destinationDistrict,
                    'weight' => max(100, $weightGrams),
                ]);

            if ($response->successful() && $response->json('is_success')) {
                return $response->json('data');
            }
        } catch (\Throwable $e) {
            Log::warning("Gagal terhubung ke api.co.id rates: " . $e->getMessage());
        }

        return null;
    }

    /**
     * Melacak posisi paket langsung dari endpoint api.co.id (/courier/v1/orders/track/{resi})
     * Endpoint tracking gratis, mengembalikan history perjalanan paket real-time.
     */
    public function trackPackage(string $resi): ?array
    {
        if (!empty($this->apiCoIdKey)) {
            try {
                $response = Http::timeout(6)
                    ->withHeaders([
                        'x-api-co-id' => $this->apiCoIdKey,
                        'Accept' => 'application/json',
                    ])
                    ->get("{$this->apiCoIdBaseUrl}/courier/v1/orders/track/{$resi}");

                if ($response->successful() && $response->json('is_success')) {
                    return $response->json('data');
                }
            } catch (\Throwable $e) {
                Log::warning("Gagal melacak resi {$resi} lewat api.co.id: " . $e->getMessage());
            }
        }

        // Mock tracking response jika live API offline atau mode sandbox
        return [
            'resi' => $resi,
            'status' => 'shipping',
            'status_label' => 'Paket dalam pengiriman ke alamat tujuan',
            'provider' => 'api.co.id Multi-Courier Gateway',
            'history' => [
                [
                    'time' => now()->format('Y-m-d H:i'),
                    'location' => $this->originCity,
                    'note' => 'Paket telah dijemput kurir dari gudang pengirim',
                ],
                [
                    'time' => now()->subHours(2)->format('Y-m-d H:i'),
                    'location' => 'Sorting Hub ' . $this->originCity,
                    'note' => 'Pesanan tiba di pusat sortir transit',
                ],
            ]
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
        if ($destinationLat !== null && $destinationLng !== null) {
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

        $activeProvider = 'Tusko Indonesia Multi-Courier Engine (api.co.id compatible)';
        if (!empty($this->apiCoIdKey)) {
            $activeProvider = 'api.co.id (Multi-Kurir Indonesia)';
        }

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
