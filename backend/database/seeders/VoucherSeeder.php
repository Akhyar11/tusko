<?php

namespace Database\Seeders;

use App\Models\Voucher;
use Illuminate\Database\Seeder;

class VoucherSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $vouchers = [
            [
                'code' => 'TUSKOVIBES150',
                'title' => 'POTONGAN RP 150.000',
                'description' => 'Min. belanja Rp 750.000 untuk seluruh koleksi sepatu performa dan jersey atlet.',
                'badge' => 'DISKON SPESIAL',
                'discount_type' => 'fixed',
                'discount_value' => 150000,
                'min_purchase' => 750000,
                'max_discount' => 150000,
                'expires_at' => '2026-12-31',
                'is_active' => true,
            ],
            [
                'code' => 'TUSKOKILAT',
                'title' => 'GRATIS ONGKIR KILAT',
                'description' => 'Bebas ongkos kirim s/d Rp 40.000 tanpa minimum pembelanjaan ke seluruh kota besar Indonesia.',
                'badge' => 'BEBAS ONGKIR',
                'discount_type' => 'fixed',
                'discount_value' => 40000,
                'min_purchase' => 0,
                'max_discount' => 40000,
                'expires_at' => '2026-12-31',
                'is_active' => true,
            ],
            [
                'code' => 'DOUBLEPTS2026',
                'title' => 'DOUBLE LOYALTY POINTS',
                'description' => 'Dapatkan 2x lipat poin loyalitas atletik pada setiap transaksi di atas Rp 500.000.',
                'badge' => 'DOUBLE POIN',
                'discount_type' => 'fixed',
                'discount_value' => 50000,
                'min_purchase' => 500000,
                'max_discount' => 50000,
                'expires_at' => '2026-12-31',
                'is_active' => true,
            ],
        ];

        foreach ($vouchers as $voucher) {
            Voucher::updateOrCreate(
                ['code' => $voucher['code']],
                $voucher
            );
        }
    }
}
