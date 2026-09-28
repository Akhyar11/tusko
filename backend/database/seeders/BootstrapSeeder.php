<?php

namespace Database\Seeders;

use App\Models\Menu;
use App\Models\Role;
use Illuminate\Database\Seeder;

/**
 * BootstrapSeeder — data referensi & RBAC yang aman dijalankan otomatis saat deploy.
 *
 * Idempotent: dipakai oleh `entrypoint.sh` agar production tidak kosong
 * (roles, menu admin, pengaturan default, template, COA/status) tanpa
 * menyentuh data transaksi. Menu yang sudah ada TIDAK ditimpa labelnya;
 * hanya relasi role `admin` -> seluruh menu admin yang disinkronkan.
 */
class BootstrapSeeder extends Seeder
{
    public function run(): void
    {
        // Pengaturan & template default: aman diulang (firstOrCreate, tak menimpa nilai admin).
        $this->call(SettingsSeeder::class);
        $this->call(ReceiptTemplateSeeder::class);

        // Referensi inti: role, status order/pembayaran, COA, gudang, atribut.
        $this->call(MasterReferenceSeeder::class);

        // Menu: seed sekali bila belum ada; jika sudah ada jangan timpa kustomisasi admin.
        if (!Menu::query()->where('environment', 'admin')->exists()) {
            $this->call(MenuSeeder::class);
        } else {
            $adminRole = Role::where('name', 'admin')->first();
            if ($adminRole) {
                $adminRole->menus()->syncWithoutDetaching(
                    Menu::query()->where('environment', 'admin')->pluck('id')->all()
                );
            }
        }
    }
}
