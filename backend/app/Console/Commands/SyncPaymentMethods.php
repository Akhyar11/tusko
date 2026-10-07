<?php

namespace App\Console\Commands;

use App\Models\PaymentMethod;
use Illuminate\Console\Command;

class SyncPaymentMethods extends Command
{
    /**
     * Sinkronkan master metode pembayaran dari katalog kanal Midtrans
     * (config/payment_methods.php). Tarif (fee) yang sudah diatur Admin
     * TIDAK ditimpa; hanya metode baru yang ditambahkan.
     *
     * @var string
     */
    protected $signature = 'payment-methods:sync';

    /**
     * @var string
     */
    protected $description = 'Sinkronkan master metode pembayaran dari katalog kanal Midtrans tanpa menimpa fee Admin';

    public function handle(): int
    {
        $categories = config('payment_methods.categories', []);
        $added = 0;
        $skipped = 0;
        $order = (int) (PaymentMethod::max('sort_order') ?? 0);

        foreach ($categories as $category) {
            foreach ($category['methods'] ?? [] as $method) {
                $code = $method['id'] ?? null;
                if (! $code) {
                    continue;
                }

                if (PaymentMethod::where('code', $code)->exists()) {
                    $skipped++;
                    continue;
                }

                $order += 10;
                PaymentMethod::create([
                    'code' => $code,
                    'name' => $method['name'] ?? $code,
                    'category' => $category['key'] ?? 'Lainnya',
                    'type' => $method['type'] ?? 'midtrans',
                    'icon' => $method['icon'] ?? null,
                    'badge' => $method['badge'] ?? null,
                    'description' => $method['description'] ?? null,
                    'fee_percent' => 0,
                    'fee_fixed' => 0,
                    'is_active' => true,
                    'sort_order' => $order,
                ]);
                $added++;
            }
        }

        $this->info("Sync selesai: {$added} metode baru, {$skipped} sudah ada (fee Admin dipertahankan).");

        return self::SUCCESS;
    }
}
