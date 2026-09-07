<?php

namespace Database\Seeders;

use App\Models\Expedition;
use Illuminate\Database\Seeder;

class ExpeditionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $expeditions = [
            // Reguler
            [
                'name' => 'JNE',
                'code' => 'jne',
                'service' => 'Reguler (REG)',
                'category' => 'Reguler',
                'etd' => '2 - 3 hari',
                'base_cost' => 18000,
                'cost' => 0,
                'is_free' => true,
                'is_active' => true,
                'badge' => 'Bebas Ongkir',
                'description' => 'Pengiriman reguler terpercaya menjangkau seluruh nusantara',
                'tracking_support' => true,
            ],
            [
                'name' => 'SiCepat',
                'code' => 'sicepat',
                'service' => 'SIUNTUNG Reguler',
                'category' => 'Reguler',
                'etd' => '2 - 3 hari',
                'base_cost' => 17000,
                'cost' => 17000,
                'is_free' => false,
                'is_active' => true,
                'badge' => 'Garansi Tepat Waktu',
                'description' => 'Layanan cepat dan efisien dengan notifikasi SMS resi otomatis',
                'tracking_support' => true,
            ],
            [
                'name' => 'J&T Express',
                'code' => 'jnt',
                'service' => 'Standard EZ',
                'category' => 'Reguler',
                'etd' => '2 - 3 hari',
                'base_cost' => 19000,
                'cost' => 19000,
                'is_free' => false,
                'is_active' => true,
                'badge' => 'Operasional 365 Hari',
                'description' => 'Pengiriman tanpa libur termasuk hari minggu dan hari besar',
                'tracking_support' => true,
            ],
            [
                'name' => 'Anteraja',
                'code' => 'anteraja',
                'service' => 'Reguler',
                'category' => 'Reguler',
                'etd' => '2 - 3 hari',
                'base_cost' => 16000,
                'cost' => 16000,
                'is_free' => false,
                'is_active' => true,
                'badge' => 'Paling Hemat',
                'description' => 'Tarif ongkir bersahabat dengan penjemputan satria anteraja',
                'tracking_support' => true,
            ],

            // Instan & Same Day
            [
                'name' => 'GoSend',
                'code' => 'gosend',
                'service' => 'Instant (3 Jam)',
                'category' => 'Instan & Same Day',
                'etd' => '3 jam tiba',
                'base_cost' => 35000,
                'cost' => 35000,
                'is_free' => false,
                'is_active' => true,
                'badge' => 'Tercepat',
                'description' => 'Kurir langsung mengantarkan pesanan langsung dari toko',
                'tracking_support' => true,
            ],
            [
                'name' => 'GrabExpress',
                'code' => 'grab',
                'service' => 'Instant (3 Jam)',
                'category' => 'Instan & Same Day',
                'etd' => '2 - 3 jam tiba',
                'base_cost' => 35000,
                'cost' => 35000,
                'is_free' => false,
                'is_active' => true,
                'badge' => 'Live GPS Tracking',
                'description' => 'Lacak posisi pengantaran driver langsung di peta real-time',
                'tracking_support' => true,
            ],
            [
                'name' => 'Anteraja',
                'code' => 'anteraja',
                'service' => 'Same Day (6-8 Jam)',
                'category' => 'Instan & Same Day',
                'etd' => 'Tiba hari ini',
                'base_cost' => 22000,
                'cost' => 22000,
                'is_free' => false,
                'is_active' => true,
                'badge' => 'Ekonomis Cepat',
                'description' => 'Kirim pagi tiba sore untuk area Jadetabek',
                'tracking_support' => true,
            ],

            // Next Day
            [
                'name' => 'SiCepat',
                'code' => 'sicepat',
                'service' => 'BEST (Next Day)',
                'category' => 'Next Day',
                'etd' => '1 hari tiba besok',
                'base_cost' => 26000,
                'cost' => 26000,
                'is_free' => false,
                'is_active' => true,
                'badge' => 'Pasti Besok Sampai',
                'description' => 'Garansi tiba di hari kerja berikutnya atau ongkir kembali',
                'tracking_support' => true,
            ],
            [
                'name' => 'JNE',
                'code' => 'jne',
                'service' => 'YES (Yakin Esok Sampai)',
                'category' => 'Next Day',
                'etd' => '1 hari garansi tiba',
                'base_cost' => 28000,
                'cost' => 28000,
                'is_free' => false,
                'is_active' => true,
                'badge' => 'Garansi Uang Kembali',
                'description' => 'Paket tiba keesokan harinya di alamat tujuan',
                'tracking_support' => true,
            ],

            // Kargo
            [
                'name' => 'JNE',
                'code' => 'jne',
                'service' => 'JTR (JNE Trucking)',
                'category' => 'Kargo',
                'etd' => '3 - 5 hari',
                'base_cost' => 45000,
                'cost' => 45000,
                'is_free' => false,
                'is_active' => true,
                'badge' => 'Kargo Hemat (min 10kg)',
                'description' => 'Pengiriman armada truk untuk barang bervolume atau berbobot besar',
                'tracking_support' => true,
            ],
            [
                'name' => 'SiCepat',
                'code' => 'sicepat',
                'service' => 'GOKIL (Cargo Kilat)',
                'category' => 'Kargo',
                'etd' => '3 - 5 hari',
                'base_cost' => 42000,
                'cost' => 42000,
                'is_free' => false,
                'is_active' => true,
                'badge' => 'Ongkir Flat Kargo',
                'description' => 'Kargo kilat dengan harga terjangkau ke seluruh kota besar',
                'tracking_support' => true,
            ],
        ];

        foreach ($expeditions as $data) {
            Expedition::updateOrCreate(
                ['code' => $data['code'], 'service' => $data['service']],
                $data
            );
        }
    }
}
