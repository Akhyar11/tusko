<?php

namespace App\Services;

use App\Models\Order;
use App\Models\User;
use App\Models\Voucher;
use App\Models\VoucherUsage;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * VoucherService — siklus pemakaian voucher (T15.1b).
 *
 * - `redeemForOrder()` mencatat `voucher_usages` + menaikkan `vouchers.used_count`
 *   saat order dibuat (idempoten per order).
 * - `releaseForOrder()` mengembalikan kuota + menghapus catatan pemakaian saat
 *   order dibatalkan (idempoten). Pemanggilan saat pembatalan order dijalankan
 *   oleh sisi Order/ERP (A2) melalui hook observer.
 */
class VoucherService
{
    /**
     * Catat pemakaian voucher untuk sebuah order.
     *
     * @throws ValidationException bila voucher tidak berlaku, kuota habis, atau
     *                               batas pemakaian per-user tercapai.
     */
    public function redeemForOrder(Order $order, ?string $code, ?User $user = null): ?VoucherUsage
    {
        $normalized = strtoupper(trim((string) $code));

        if ($normalized === '') {
            return null;
        }

        return DB::transaction(function () use ($order, $normalized, $user) {
            $voucher = Voucher::query()
                ->active()
                ->whereRaw('UPPER(code) = ?', [$normalized])
                ->lockForUpdate()
                ->first();

            if (! $voucher) {
                throw ValidationException::withMessages([
                    'coupon_code' => ["Voucher \"{$normalized}\" tidak ditemukan atau sudah tidak berlaku."],
                ]);
            }

            $existing = VoucherUsage::query()
                ->where('voucher_id', $voucher->id)
                ->where('order_id', $order->id)
                ->first();

            if ($existing) {
                return $existing;
            }

            if (! $voucher->hasQuotaRemaining()) {
                throw ValidationException::withMessages([
                    'coupon_code' => ["Kuota voucher \"{$normalized}\" sudah habis."],
                ]);
            }

            $userId = $user?->id ?? $order->user_id;

            if ($userId !== null && $voucher->per_user_limit !== null) {
                $usedByUser = VoucherUsage::query()
                    ->where('voucher_id', $voucher->id)
                    ->where('user_id', $userId)
                    ->count();

                if ($usedByUser >= (int) $voucher->per_user_limit) {
                    throw ValidationException::withMessages([
                        'coupon_code' => ["Batas pemakaian voucher \"{$normalized}\" untuk akun ini sudah tercapai."],
                    ]);
                }
            }

            $usage = VoucherUsage::create([
                'voucher_id' => $voucher->id,
                'user_id' => $userId,
                'order_id' => $order->id,
                'used_at' => now(),
            ]);

            $voucher->increment('used_count');

            return $usage;
        });
    }

    /**
     * Rollback pemakaian voucher saat order dibatalkan (idempoten).
     *
     * @return int jumlah catatan pemakaian yang dikembalikan.
     */
    public function releaseForOrder(Order $order): int
    {
        return DB::transaction(function () use ($order) {
            $usages = VoucherUsage::query()
                ->where('order_id', $order->id)
                ->lockForUpdate()
                ->get();

            foreach ($usages as $usage) {
                $voucher = Voucher::query()->whereKey($usage->voucher_id)->lockForUpdate()->first();

                if ($voucher && (int) $voucher->used_count > 0) {
                    $voucher->decrement('used_count');
                }

                $usage->delete();
            }

            return $usages->count();
        });
    }
}
