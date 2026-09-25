<?php

namespace Database\Seeders;

use App\Models\Menu;
use App\Models\Role;
use Illuminate\Database\Seeder;

class MenuSeeder extends Seeder
{
    /**
     * Katalog menu navigasi & guard (REVISI 6: user -> role -> menu).
     *
     * `environment='admin'` wajib punya role (digerbangi `menu.access`).
     * `environment='storefront'` bersifat PUBLIK (tanpa role).
     *
     * @var array<int, array<string, mixed>>
     */
    private const MENUS = [
        // ==== ADMIN: Ikhtisar & Analitik ====
        ['environment' => 'admin', 'section' => 'Ikhtisar & Analitik', 'label' => 'Ringkasan Dashboard', 'sublabel' => 'KPI revenue & performa toko', 'path_prefix' => '/admin/dashboard', 'view_key' => 'admin-dashboard', 'icon' => 'LayoutDashboard', 'feature_flag' => null, 'sort_order' => 10],

        // ==== ADMIN: Katalog & Inventaris ====
        ['environment' => 'admin', 'section' => 'Katalog & Inventaris', 'label' => 'Produk & Varian SKU', 'sublabel' => 'Katalog produk, harga & SKU', 'path_prefix' => '/admin/product', 'view_key' => 'products-admin', 'icon' => 'Package', 'feature_flag' => null, 'sort_order' => 20],
        ['environment' => 'admin', 'section' => 'Katalog & Inventaris', 'label' => 'Master Kategori', 'sublabel' => 'Taksonomi & kategori olahraga', 'path_prefix' => '/admin/category', 'view_key' => 'categories-admin', 'icon' => 'FolderKanban', 'feature_flag' => null, 'sort_order' => 21],
        ['environment' => 'admin', 'section' => 'Katalog & Inventaris', 'label' => 'Master Gudang & Lokasi', 'sublabel' => 'Fasilitas gudang & titik simpan', 'path_prefix' => '/admin/warehouse', 'view_key' => 'warehouses-admin', 'icon' => 'Warehouse', 'feature_flag' => null, 'sort_order' => 22],
        ['environment' => 'admin', 'section' => 'Katalog & Inventaris', 'label' => 'Manajemen Stok Gudang', 'sublabel' => 'Stok fisik gudang & restock', 'path_prefix' => '/admin/stock', 'view_key' => 'stock', 'icon' => 'Boxes', 'feature_flag' => 'feature_flags.stock_menu', 'sort_order' => 23],

        // ==== ADMIN: Penjualan & Pengiriman ====
        ['environment' => 'admin', 'section' => 'Penjualan & Pengiriman', 'label' => 'Antrean Pesanan', 'sublabel' => 'Pesanan pembeli & status order', 'path_prefix' => '/admin/order', 'view_key' => 'orders', 'icon' => 'ShoppingBag', 'feature_flag' => 'feature_flags.orders_menu', 'sort_order' => 30],
        ['environment' => 'admin', 'section' => 'Penjualan & Pengiriman', 'label' => 'Jasa Ekspedisi & Ongkir', 'sublabel' => 'Kurir aktif & tarif pengiriman', 'path_prefix' => '/admin/expedition', 'view_key' => 'expeditions', 'icon' => 'Truck', 'feature_flag' => 'feature_flags.expeditions_menu', 'sort_order' => 31],

        // ==== ADMIN: Pengadaan & Rantai Pasok ====
        ['environment' => 'admin', 'section' => 'Pengadaan & Rantai Pasok', 'label' => 'Purchase Order (PO)', 'sublabel' => 'Pemesanan stok ke supplier', 'path_prefix' => '/admin/procurement/pos', 'view_key' => 'procurement-pos', 'icon' => 'ClipboardList', 'feature_flag' => 'feature_flags.procurement_menu', 'sort_order' => 40],
        ['environment' => 'admin', 'section' => 'Pengadaan & Rantai Pasok', 'label' => 'Penerimaan Barang (GRN)', 'sublabel' => 'Cek fisik barang masuk & QC', 'path_prefix' => '/admin/procurement/grn', 'view_key' => 'procurement-grn', 'icon' => 'PackageCheck', 'feature_flag' => 'feature_flags.procurement_menu', 'sort_order' => 41],
        ['environment' => 'admin', 'section' => 'Pengadaan & Rantai Pasok', 'label' => 'Tagihan Vendor (Bills)', 'sublabel' => 'Invoice hutang & pelunasan', 'path_prefix' => '/admin/procurement/bills', 'view_key' => 'procurement-bills', 'icon' => 'Receipt', 'feature_flag' => 'feature_flags.procurement_menu', 'sort_order' => 42],
        ['environment' => 'admin', 'section' => 'Pengadaan & Rantai Pasok', 'label' => 'Master Supplier & Vendor', 'sublabel' => 'Direktori mitra & syarat dagang', 'path_prefix' => '/admin/procurement/vendor', 'view_key' => 'suppliers-admin', 'icon' => 'Building2', 'feature_flag' => 'feature_flags.procurement_menu', 'sort_order' => 43],

        // ==== ADMIN: Keuangan & Sistem ====
        ['environment' => 'admin', 'section' => 'Keuangan & Sistem', 'label' => 'Buku Kas & Transaksi', 'sublabel' => 'Arus kas masuk & beban toko', 'path_prefix' => '/admin/transaction', 'view_key' => 'transactions', 'icon' => 'Wallet', 'feature_flag' => 'feature_flags.finance_menu', 'sort_order' => 50],
        ['environment' => 'admin', 'section' => 'Keuangan & Sistem', 'label' => 'Template Dokumen & Resi', 'sublabel' => 'Format cetak invoice & resi', 'path_prefix' => '/admin/template', 'view_key' => 'templates', 'icon' => 'Mail', 'feature_flag' => 'feature_flags.templates_menu', 'sort_order' => 51],
        ['environment' => 'admin', 'section' => 'Keuangan & Sistem', 'label' => 'Pengaturan Sistem', 'sublabel' => 'Konfigurasi toko & integrasi', 'path_prefix' => '/admin/settings', 'view_key' => 'settings', 'icon' => 'Settings', 'feature_flag' => 'feature_flags.settings_menu', 'sort_order' => 52],

        // ==== STOREFRONT (PUBLIK, tanpa role) ====
        ['environment' => 'storefront', 'section' => 'Storefront', 'label' => 'Katalog Produk', 'sublabel' => 'Jelajahi katalog olahraga', 'path_prefix' => '/', 'view_key' => 'catalog', 'icon' => 'Store', 'feature_flag' => null, 'sort_order' => 10],
        ['environment' => 'storefront', 'section' => 'Storefront', 'label' => 'Keranjang Belanja', 'sublabel' => 'Produk pilihan sebelum checkout', 'path_prefix' => '/cart', 'view_key' => 'cart', 'icon' => 'ShoppingCart', 'feature_flag' => null, 'sort_order' => 11],
        ['environment' => 'storefront', 'section' => 'Storefront', 'label' => 'Profil Saya', 'sublabel' => 'Akun, alamat & pesanan saya', 'path_prefix' => '/profile', 'view_key' => 'profile', 'icon' => 'UserRound', 'feature_flag' => null, 'sort_order' => 12],
    ];

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        foreach (self::MENUS as $menu) {
            Menu::updateOrCreate(
                [
                    'environment' => $menu['environment'],
                    'path_prefix' => $menu['path_prefix'],
                ],
                $menu
            );
        }

        // Assign SELURUH menu admin ke role `admin` (idempoten).
        $adminRole = Role::where('name', 'admin')->first();

        if ($adminRole) {
            $adminMenuIds = Menu::query()
                ->where('environment', 'admin')
                ->pluck('id')
                ->all();

            $adminRole->menus()->syncWithoutDetaching($adminMenuIds);
        }
    }
}
