<?php

namespace Database\Seeders;

use App\Models\PaymentMethod;
use Illuminate\Database\Seeder;

class PaymentMethodSeeder extends Seeder
{
    /**
     * Tarif awal mengikuti publikasi Midtrans (dapat diubah Admin via UI).
     * VA bank: Rp 4.000/transaksi; QRIS: 0,7%.
     */
    private const DEFAULT_FEES = [
        'bca_va' => ['percent' => 0, 'fixed' => 4000],
        'mandiri_va' => ['percent' => 0, 'fixed' => 4000],
        'bri_va' => ['percent' => 0, 'fixed' => 4000],
        'bni_va' => ['percent' => 0, 'fixed' => 4000],
        'qris' => ['percent' => 0.7, 'fixed' => 0],
    ];

    public function run(): void
    {
        $categories = config('payment_methods.categories', []);
        $order = 0;

        foreach ($categories as $category) {
            foreach ($category['methods'] ?? [] as $method) {
                $code = $method['id'] ?? null;
                if (! $code) {
                    continue;
                }

                $fee = self::DEFAULT_FEES[$code] ?? ['percent' => 0, 'fixed' => 0];
                $order += 10;

                PaymentMethod::updateOrCreate(
                    ['code' => $code],
                    [
                        'name' => $method['name'] ?? $code,
                        'category' => $category['key'] ?? 'Lainnya',
                        'type' => $method['type'] ?? 'midtrans',
                        'icon' => $method['icon'] ?? null,
                        'badge' => $method['badge'] ?? null,
                        'description' => $method['description'] ?? null,
                        'fee_percent' => $fee['percent'],
                        'fee_fixed' => $fee['fixed'],
                        'is_active' => true,
                        'sort_order' => $order,
                    ]
                );
            }
        }
    }
}
