<?php

namespace Database\Seeders;

use App\Models\ShippingAddress;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Akun Pelanggan Utama (Budi Pratama - Sesuai Prototype)
        $budiPratama = User::firstOrCreate(
            ['email' => 'budi.pratama@gmail.com'],
            [
                'name' => 'Budi Pratama',
                'password' => Hash::make('TuskoSport2026!'),
                'phone' => '0812-3456-7890',
                'role' => 'customer',
                'avatar' => 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
                'gender' => 'male',
                'birth_date' => '1995-08-17',
                'points' => 1250,
                'membership_tier' => 'Gold Member',
                'is_active' => true,
            ]
        );

        // Alamat pengiriman untuk Budi Pratama
        ShippingAddress::firstOrCreate(
            [
                'user_id' => $budiPratama->id,
                'recipient_name' => 'Budi Pratama',
            ],
            [
                'label' => 'Rumah Utama',
                'phone' => '0812-3456-7890',
                'full_address' => 'Jl. Kemang Raya No. 45, RT 02 / RW 04, Bangka, Mampang Prapatan',
                'city' => 'Jakarta Selatan',
                'province' => 'DKI Jakarta',
                'postal_code' => '12730',
                'is_default' => true,
            ]
        );

        // 2. Akun Pelanggan Demo (Budi Santoso - Sesuai Mock Data)
        $budiSantoso = User::firstOrCreate(
            ['email' => 'budi@tusko.com'],
            [
                'name' => 'Budi Santoso',
                'password' => Hash::make('password123'),
                'phone' => '0812-3456-7890',
                'role' => 'customer',
                'avatar' => 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
                'gender' => 'male',
                'birth_date' => '1996-05-12',
                'points' => 1250,
                'membership_tier' => 'Gold Member',
                'is_active' => true,
            ]
        );

        ShippingAddress::firstOrCreate(
            [
                'user_id' => $budiSantoso->id,
                'recipient_name' => 'Budi Santoso',
            ],
            [
                'label' => 'Rumah',
                'phone' => '0812-3456-7890',
                'full_address' => 'Jl. Senopati No. 18, Kebayoran Baru',
                'city' => 'Jakarta Selatan',
                'province' => 'DKI Jakarta',
                'postal_code' => '12190',
                'is_default' => true,
            ]
        );

        // 3. Akun Super Administrator (Akhyar / Admin Tusko)
        User::firstOrCreate(
            ['email' => 'admin@tusko.com'],
            [
                'name' => 'Admin Tusko Official',
                'password' => Hash::make('admin123'),
                'phone' => '0811-9876-5432',
                'role' => 'admin',
                'avatar' => 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
                'gender' => 'male',
                'points' => 99999,
                'membership_tier' => 'Super Admin',
                'is_active' => true,
            ]
        );

        // 4. Akun Admin Toko Bawaan (admin@tokoonline.com)
        User::firstOrCreate(
            ['email' => 'admin@tokoonline.com'],
            [
                'name' => 'Admin Toko',
                'password' => Hash::make('password'),
                'role' => 'admin',
                'phone' => '0811-1234-5678',
                'points' => 50000,
                'membership_tier' => 'Super Admin',
                'is_active' => true,
            ]
        );
    }
}
