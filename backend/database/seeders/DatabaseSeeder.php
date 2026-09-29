<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed data referensi inti saja: role (+ master referensi), users, menu.
     *
     * Seeder lain (product, voucher, expedition, settings, receipt template)
     * sengaja dihapus; data tersebut dikelola lewat UI/CRUD atau dibuat otomatis
     * oleh aplikasi saat dibutuhkan.
     */
    public function run(): void
    {
        $this->call(MasterReferenceSeeder::class);
        $this->call(UserSeeder::class);
        $this->call(MenuSeeder::class);
    }
}
