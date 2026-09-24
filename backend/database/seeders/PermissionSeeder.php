<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PermissionSeeder extends Seeder
{
    /**
     * Katalog permission RBAC (melengkapi `roles` dari MasterReferenceSeeder).
     *
     * @var array<int, array{code: string, name: string, group: string, description: string}>
     */
    private const PERMISSIONS = [
        // Katalog Produk
        ['code' => 'products.view', 'name' => 'Lihat Produk', 'group' => 'catalog', 'description' => 'Melihat daftar dan detail produk admin'],
        ['code' => 'products.create', 'name' => 'Tambah Produk', 'group' => 'catalog', 'description' => 'Membuat produk baru'],
        ['code' => 'products.update', 'name' => 'Ubah Produk', 'group' => 'catalog', 'description' => 'Memperbarui data produk & varian'],
        ['code' => 'products.delete', 'name' => 'Hapus Produk', 'group' => 'catalog', 'description' => 'Menghapus produk'],
        ['code' => 'categories.manage', 'name' => 'Kelola Kategori', 'group' => 'catalog', 'description' => 'Mengelola master kategori'],

        // Pesanan
        ['code' => 'orders.view', 'name' => 'Lihat Pesanan', 'group' => 'orders', 'description' => 'Melihat antrean & detail pesanan'],
        ['code' => 'orders.update_status', 'name' => 'Ubah Status Pesanan', 'group' => 'orders', 'description' => 'Memperbarui status pesanan'],
        ['code' => 'orders.cancel', 'name' => 'Batalkan Pesanan', 'group' => 'orders', 'description' => 'Membatalkan pesanan'],
        ['code' => 'orders.ship', 'name' => 'Kirim Pesanan', 'group' => 'orders', 'description' => 'Memproses pengiriman & resi'],

        // Inventori
        ['code' => 'inventory.view', 'name' => 'Lihat Stok', 'group' => 'inventory', 'description' => 'Melihat saldo & mutasi stok'],
        ['code' => 'inventory.adjust', 'name' => 'Sesuaikan Stok', 'group' => 'inventory', 'description' => 'Menambah / mengurangi stok manual'],
        ['code' => 'inventory.opname', 'name' => 'Stok Opname', 'group' => 'inventory', 'description' => 'Menjalankan sesi stok opname'],
        ['code' => 'inventory.transfer', 'name' => 'Transfer Stok', 'group' => 'inventory', 'description' => 'Memindahkan stok antar gudang'],

        // Pengadaan
        ['code' => 'vendors.manage', 'name' => 'Kelola Vendor', 'group' => 'procurement', 'description' => 'Mengelola master vendor/supplier'],
        ['code' => 'purchase_orders.manage', 'name' => 'Kelola Purchase Order', 'group' => 'procurement', 'description' => 'Membuat & menyetujui PO'],
        ['code' => 'grn.manage', 'name' => 'Kelola Penerimaan Barang', 'group' => 'procurement', 'description' => 'Mencatat penerimaan barang (GRN)'],
        ['code' => 'vendor_bills.manage', 'name' => 'Kelola Tagihan Vendor', 'group' => 'procurement', 'description' => 'Mencatat & membayar tagihan vendor'],

        // Keuangan
        ['code' => 'transactions.view', 'name' => 'Lihat Buku Kas', 'group' => 'finance', 'description' => 'Melihat transaksi keuangan'],
        ['code' => 'transactions.create', 'name' => 'Catat Transaksi', 'group' => 'finance', 'description' => 'Mencatat transaksi kas masuk/keluar'],
        ['code' => 'reports.view', 'name' => 'Lihat Laporan', 'group' => 'finance', 'description' => 'Melihat laporan laba, neraca, dan aging'],
        ['code' => 'journals.manage', 'name' => 'Kelola Jurnal', 'group' => 'finance', 'description' => 'Mengelola jurnal & chart of accounts'],

        // Pemasaran
        ['code' => 'vouchers.manage', 'name' => 'Kelola Voucher', 'group' => 'marketing', 'description' => 'Mengelola voucher promo'],
        ['code' => 'templates.manage', 'name' => 'Kelola Template', 'group' => 'marketing', 'description' => 'Mengelola template email & resi'],

        // Sistem
        ['code' => 'users.manage', 'name' => 'Kelola Pengguna', 'group' => 'system', 'description' => 'Mengelola akun pengguna'],
        ['code' => 'roles.manage', 'name' => 'Kelola Role', 'group' => 'system', 'description' => 'Mengelola role & permission'],
        ['code' => 'settings.manage', 'name' => 'Kelola Pengaturan', 'group' => 'system', 'description' => 'Mengelola pengaturan integrasi & sistem'],
    ];

    /**
     * Pemetaan role -> permission ('*' = seluruh permission).
     *
     * @var array<string, string|array<int, string>>
     */
    private const ROLE_PERMISSIONS = [
        'admin' => '*',
        'warehouse_staff' => [
            'products.view',
            'orders.view',
            'orders.update_status',
            'orders.ship',
            'inventory.view',
            'inventory.adjust',
            'inventory.opname',
            'inventory.transfer',
            'purchase_orders.manage',
            'grn.manage',
        ],
        'finance_officer' => [
            'orders.view',
            'inventory.view',
            'transactions.view',
            'transactions.create',
            'reports.view',
            'journals.manage',
            'vendor_bills.manage',
        ],
        'customer' => [],
    ];

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $now = now();

        foreach (self::PERMISSIONS as $permission) {
            DB::table('permissions')->updateOrInsert(
                ['code' => $permission['code']],
                array_merge($permission, ['created_at' => $now, 'updated_at' => $now])
            );
        }

        $permissionIds = DB::table('permissions')->pluck('id', 'code');
        $roleIds = DB::table('roles')->pluck('id', 'name');

        foreach (self::ROLE_PERMISSIONS as $roleName => $codes) {
            if (!isset($roleIds[$roleName])) {
                continue;
            }

            $roleId = (int) $roleIds[$roleName];

            if ($codes === '*') {
                $codes = $permissionIds->keys()->all();
            }

            foreach ($codes as $code) {
                if (!isset($permissionIds[$code])) {
                    continue;
                }

                DB::table('role_permissions')->insertOrIgnore([
                    'role_id' => $roleId,
                    'permission_id' => (int) $permissionIds[$code],
                    'created_at' => $now,
                ]);
            }
        }
    }
}
