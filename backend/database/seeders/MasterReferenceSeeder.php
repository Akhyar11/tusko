<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class MasterReferenceSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Seed Roles
        $roles = [
            ['name' => 'admin', 'display_name' => 'Super Administrator', 'description' => 'Akses penuh ke seluruh operasional toko dan sistem', 'is_system' => true],
            ['name' => 'customer', 'display_name' => 'Pelanggan / Member', 'description' => 'Pengguna storefront untuk belanja dan pelacakan pesanan', 'is_system' => true],
            ['name' => 'warehouse_staff', 'display_name' => 'Staf Gudang', 'description' => 'Pengelolaan stok, penerimaan barang, dan pemrosesan kiriman', 'is_system' => false],
            ['name' => 'finance_officer', 'display_name' => 'Staf Keuangan', 'description' => 'Pengelolaan buku kas, verifikasi transfer, dan rekonsiliasi', 'is_system' => false],
        ];

        foreach ($roles as $role) {
            DB::table('roles')->updateOrInsert(['name' => $role['name']], array_merge($role, ['created_at' => now(), 'updated_at' => now()]));
        }

        // 2. Seed Order Statuses
        $orderStatuses = [
            ['code' => 'pending', 'name' => 'Menunggu Pembayaran', 'badge_color' => 'amber', 'sort_order' => 1, 'is_terminal' => false, 'allows_cancellation' => true],
            ['code' => 'confirmed', 'name' => 'Pembayaran Dikonfirmasi', 'badge_color' => 'blue', 'sort_order' => 2, 'is_terminal' => false, 'allows_cancellation' => false],
            ['code' => 'processing', 'name' => 'Pesanan Diproses Gudang', 'badge_color' => 'indigo', 'sort_order' => 3, 'is_terminal' => false, 'allows_cancellation' => false],
            ['code' => 'shipped', 'name' => 'Dalam Pengiriman', 'badge_color' => 'purple', 'sort_order' => 4, 'is_terminal' => false, 'allows_cancellation' => false],
            ['code' => 'delivered', 'name' => 'Pesanan Tiba di Tujuan', 'badge_color' => 'emerald', 'sort_order' => 5, 'is_terminal' => false, 'allows_cancellation' => false],
            ['code' => 'completed', 'name' => 'Pesanan Selesai', 'badge_color' => 'emerald', 'sort_order' => 6, 'is_terminal' => true, 'allows_cancellation' => false],
            ['code' => 'cancelled', 'name' => 'Pesanan Dibatalkan', 'badge_color' => 'red', 'sort_order' => 7, 'is_terminal' => true, 'allows_cancellation' => false],
        ];

        foreach ($orderStatuses as $status) {
            DB::table('order_statuses')->updateOrInsert(['code' => $status['code']], array_merge($status, ['created_at' => now(), 'updated_at' => now()]));
        }

        // 3. Seed Payment Statuses
        $paymentStatuses = [
            ['code' => 'unpaid', 'name' => 'Belum Dibayar', 'badge_color' => 'neutral', 'sort_order' => 1],
            ['code' => 'pending_verification', 'name' => 'Menunggu Verifikasi Bukti', 'badge_color' => 'amber', 'sort_order' => 2],
            ['code' => 'paid', 'name' => 'Lunas / Terverifikasi', 'badge_color' => 'emerald', 'sort_order' => 3],
            ['code' => 'failed', 'name' => 'Pembayaran Gagal / Ditolak', 'badge_color' => 'red', 'sort_order' => 4],
            ['code' => 'refunded', 'name' => 'Dana Dikembalikan (Refund)', 'badge_color' => 'purple', 'sort_order' => 5],
        ];

        foreach ($paymentStatuses as $pStatus) {
            DB::table('payment_statuses')->updateOrInsert(['code' => $pStatus['code']], array_merge($pStatus, ['created_at' => now(), 'updated_at' => now()]));
        }

        // 4. Seed Primary Warehouse (Gudang Pusat Tusko)
        DB::table('warehouses')->updateOrInsert(
            ['code' => 'GDG-JKT-PST'],
            [
                'name' => 'Gudang Pusat Tusko Jakarta',
                'address' => 'Jl. TB Simatupang No. 88, Cilandak',
                'city' => 'Jakarta Selatan',
                'province' => 'DKI Jakarta',
                'postal_code' => '12430',
                'latitude' => -6.29230000,
                'longitude' => 106.79950000,
                'is_primary' => true,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );

        // 5. Seed Chart of Accounts
        $coaList = [
            ['account_code' => '1100', 'account_name' => 'Kas Toko & Kasir', 'account_type' => 'asset'],
            ['account_code' => '1200', 'account_name' => 'Bank Operasional BCA', 'account_type' => 'asset'],
            ['account_code' => '1300', 'account_name' => 'Persediaan Barang Dagang (Inventory Asset)', 'account_type' => 'asset'],
            ['account_code' => '2100', 'account_name' => 'Utang Usaha / Hutang Vendor', 'account_type' => 'liability'],
            ['account_code' => '4100', 'account_name' => 'Pendapatan Penjualan Toko (Sales Revenue)', 'account_type' => 'revenue'],
            ['account_code' => '5100', 'account_name' => 'Beban Pokok Penjualan (HPP / COGS)', 'account_type' => 'expense'],
            ['account_code' => '6100', 'account_name' => 'Beban Biaya Pengiriman / Kurir', 'account_type' => 'expense'],
            ['account_code' => '6200', 'account_name' => 'Beban Biaya Gateway & Transaksi', 'account_type' => 'expense'],
        ];

        foreach ($coaList as $coa) {
            DB::table('chart_of_accounts')->updateOrInsert(['account_code' => $coa['account_code']], array_merge($coa, ['created_at' => now(), 'updated_at' => now()]));
        }

        // 6. Seed Financial Account (Rekening Toko)
        DB::table('financial_accounts')->updateOrInsert(
            ['account_number' => '8012345678'],
            [
                'account_name' => 'BCA Rekening Operasional Utama',
                'bank_name' => 'Bank Central Asia (BCA)',
                'current_balance' => 45850000.00,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );

        // 7. Seed Standard Attributes
        $attributes = [
            ['code' => 'color', 'name' => 'Warna', 'display_type' => 'color_picker', 'sort_order' => 1],
            ['code' => 'size', 'name' => 'Ukuran Apparel / Sepatu', 'display_type' => 'button', 'sort_order' => 2],
            ['code' => 'sleeve', 'name' => 'Panjang Lengan', 'display_type' => 'button', 'sort_order' => 3],
        ];

        foreach ($attributes as $attr) {
            DB::table('attributes')->updateOrInsert(['code' => $attr['code']], array_merge($attr, ['created_at' => now(), 'updated_at' => now()]));
        }

        // 8. Seed Default Tracking Checkpoint Labels (KiriminAja)
        $checkpointLabels = [
            [
                'stage_key' => 'at_warehouse',
                'stage_name' => 'Diproses di Gudang Pusat',
                'custom_label' => 'Paket sedang disiapkan dan dikemas di Gudang Pusat',
                'description_template' => 'Paket telah selesai diperiksa dan siap dijemput kurir di :warehouse_name (:city)',
                'sort_order' => 1,
                'is_active' => true,
            ],
            [
                'stage_key' => 'courier_pickup',
                'stage_name' => 'Diserahkan ke Kurir',
                'custom_label' => 'Paket telah diserahkan kepada kurir pengiriman',
                'description_template' => 'Kurir :courier_name (:service) telah menerima paket dari Gudang Pusat :city',
                'sort_order' => 2,
                'is_active' => true,
            ],
            [
                'stage_key' => 'transit_hub',
                'stage_name' => 'Pusat Sortir Ekspedisi',
                'custom_label' => 'Tiba di fasilitas transit sortir ekspedisi',
                'description_template' => 'Paket dalam proses sortasi di Sorting Hub :location untuk diteruskan ke wilayah tujuan',
                'sort_order' => 3,
                'is_active' => true,
            ],
            [
                'stage_key' => 'out_for_delivery',
                'stage_name' => 'Kurir Mengantar Paket',
                'custom_label' => 'Paket dibawa kurir menuju alamat penerima',
                'description_template' => 'Kurir sedang dalam perjalanan mengantar paket ke alamat tujuan :destination',
                'sort_order' => 4,
                'is_active' => true,
            ],
            [
                'stage_key' => 'delivered',
                'stage_name' => 'Paket Diterima',
                'custom_label' => 'Paket telah berhasil diterima',
                'description_template' => 'Paket telah diterima dengan baik di alamat tujuan oleh penerima yang bersangkutan',
                'sort_order' => 5,
                'is_active' => true,
            ],
        ];

        foreach ($checkpointLabels as $label) {
            DB::table('tracking_checkpoint_labels')->updateOrInsert(
                ['stage_key' => $label['stage_key']],
                array_merge($label, ['created_at' => now(), 'updated_at' => now()])
            );
        }
    }
}
