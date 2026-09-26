<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\IntegrationService;
use Illuminate\Http\JsonResponse;

class PaymentMethodController extends Controller
{
    /**
     * Katalog metode pembayaran untuk checkout (T07.6) — dinamis (G6).
     */
    public function index(IntegrationService $integrations): JsonResponse
    {
        $midtransEnabled = (bool) $integrations->get('payment.midtrans_server_key');

        $categories = collect(config('payment_methods.categories', []))
            ->map(function (array $category) use ($midtransEnabled) {
                $methods = collect($category['methods'] ?? [])
                    ->when(! $midtransEnabled, fn ($collection) => $collection->reject(
                        fn ($method) => ($method['type'] ?? null) === 'midtrans'
                    ))
                    ->values()
                    ->all();

                return [
                    'key' => $category['key'],
                    'label' => $category['label'],
                    'methods' => $methods,
                ];
            })
            ->filter(fn (array $category) => count($category['methods']) > 0)
            ->values()
            ->all();

        // Rekening bank manual dinamis dari konfigurasi Admin (`integrations`).
        $raw = $integrations->get('payment.manual_banks');
        $decoded = is_string($raw) ? json_decode($raw, true) : $raw;
        $banks = is_array($decoded) ? array_values($decoded) : [];

        if ($banks !== []) {
            $categories[] = [
                'key' => 'Transfer Bank Manual',
                'label' => 'Transfer Bank Manual (Verifikasi Penjual)',
                'methods' => array_map(
                    fn ($bank, $index) => [
                        'id' => 'manual_' . ($bank['code'] ?? $bank['bank_code'] ?? $index),
                        'name' => 'Transfer ' . ($bank['bank_name'] ?? $bank['bank'] ?? $bank['name'] ?? 'Bank') . ' Manual',
                        'code' => $bank['code'] ?? $bank['bank_code'] ?? null,
                        'type' => 'manual',
                        'icon' => 'Building2',
                        'fee' => $bank['fee'] ?? 0,
                        'badge' => 'Manual Verifikasi',
                        'description' => 'Transfer ke rekening resmi toko, konfirmasi diproses 1x24 jam',
                    ],
                    $banks,
                    array_keys($banks)
                ),
            ];
        }

        return response()->json([
            'data' => [
                'categories' => $categories,
                'midtrans_enabled' => $midtransEnabled,
                'manual_banks' => $banks,
            ],
        ]);
    }
}
