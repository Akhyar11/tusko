<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\User;
use App\Models\Voucher;
use App\Models\VoucherUsage;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * VoucherService — siklus pemakaian voucher (T15.1b) & validasi kupon (T08.2).
 *
 * - `validate()` menghitung kelayakan + nominal diskon secara server-authoritative
 *   (min belanja, kuota, batas per-user, cakupan target, stacking, gratis ongkir).
 * - `redeemForOrder()` mencatat `voucher_usages` + menaikkan `vouchers.used_count`
 *   saat order dibuat (idempoten per order).
 * - `releaseForOrder()` mengembalikan kuota + menghapus catatan pemakaian saat
 *   order dibatalkan (idempoten). Pemanggilan saat pembatalan order dijalankan
 *   oleh sisi Order/ERP (A2) melalui hook observer.
 */
class VoucherService
{
    /**
     * Validasi kelayakan kupon + hitung nominal diskon (T08.2) — server-authoritative.
     *
     * @param  array<int, array{product_id?: int, product_variant_id?: int|null, quantity?: int}>  $items
     * @param  array<int, string>  $appliedCodes  kupon lain yang sudah diterapkan (uji stacking)
     * @return array<string, mixed>
     */
    public function validate(
        ?string $code,
        array $items = [],
        ?float $subtotal = null,
        ?User $user = null,
        array $appliedCodes = []
    ): array {
        $normalized = strtoupper(trim((string) $code));

        if ($normalized === '') {
            return $this->invalidResult('Kode voucher wajib diisi.');
        }

        $voucher = Voucher::query()
            ->active()
            ->whereRaw('UPPER(code) = ?', [$normalized])
            ->with('targets')
            ->first();

        if (! $voucher) {
            return $this->invalidResult("Voucher \"{$normalized}\" tidak ditemukan atau sudah tidak berlaku.");
        }

        // Stacking: kupon non-stackable tidak boleh digabung dengan kupon lain.
        $otherCodes = array_values(array_filter(
            array_map(fn ($c) => strtoupper(trim((string) $c)), $appliedCodes),
            fn ($c) => $c !== '' && $c !== $normalized
        ));

        if (! empty($otherCodes) && ! $voucher->stackable) {
            return $this->invalidResult("Voucher \"{$normalized}\" tidak dapat digabung dengan voucher lain.", $voucher);
        }

        if (! $voucher->hasQuotaRemaining()) {
            return $this->invalidResult("Kuota voucher \"{$normalized}\" sudah habis.", $voucher);
        }

        $userId = $user?->id;
        if ($userId !== null && $voucher->per_user_limit !== null) {
            $usedByUser = VoucherUsage::query()
                ->where('voucher_id', $voucher->id)
                ->where('user_id', $userId)
                ->count();

            if ($usedByUser >= (int) $voucher->per_user_limit) {
                return $this->invalidResult("Batas pemakaian voucher \"{$normalized}\" untuk akun ini sudah tercapai.", $voucher);
            }
        }

        $targets = $voucher->targets;
        $hasSpecificTargets = $targets->isNotEmpty() && ! $targets->contains('target_type', 'all');

        if (! empty($items)) {
            $resolved = $this->resolveItems($items);
            $orderSubtotal = $resolved['order_subtotal'];
            $applicableSubtotal = 0.0;

            foreach ($resolved['lines'] as $line) {
                if (! $hasSpecificTargets || $this->matchesTargets($line['product'], $line['variant'], $targets)) {
                    $applicableSubtotal += $line['line_total'];
                }
            }
        } else {
            $orderSubtotal = round((float) ($subtotal ?? 0), 2);
            if ($hasSpecificTargets) {
                return $this->invalidResult("Voucher \"{$normalized}\" hanya berlaku untuk produk tertentu; sertakan daftar item.", $voucher);
            }
            $applicableSubtotal = $orderSubtotal;
        }

        if ((float) $voucher->min_purchase > 0 && $orderSubtotal < (float) $voucher->min_purchase) {
            return $this->invalidResult(
                "Minimal belanja untuk voucher \"{$normalized}\" adalah Rp " . number_format((float) $voucher->min_purchase, 0, ',', '.') . '.',
                $voucher
            );
        }

        if ($applicableSubtotal <= 0) {
            return $this->invalidResult("Tidak ada produk yang memenuhi cakupan voucher \"{$normalized}\".", $voucher);
        }

        $discount = $this->calculateDiscount($voucher, $applicableSubtotal);

        return [
            'valid' => true,
            'message' => "Voucher \"{$voucher->title}\" berhasil diterapkan.",
            'code' => $voucher->code,
            'discount_type' => $voucher->discount_type,
            'discount_value' => (float) $voucher->discount_value,
            'discount_amount' => $discount,
            'free_shipping' => (bool) $voucher->is_free_shipping,
            'stackable' => (bool) $voucher->stackable,
            'order_subtotal' => round($orderSubtotal, 2),
            'applicable_subtotal' => round($applicableSubtotal, 2),
            'min_purchase' => (float) $voucher->min_purchase,
            'voucher' => $voucher,
        ];
    }

    /**
     * Hitung nominal diskon dari tipe/nilai voucher dengan batas `max_discount`.
     */
    private function calculateDiscount(Voucher $voucher, float $applicableSubtotal): float
    {
        $type = strtolower((string) $voucher->discount_type);

        $discount = in_array($type, ['percent', 'percentage'], true)
            ? $applicableSubtotal * ((float) $voucher->discount_value / 100)
            : (float) $voucher->discount_value;

        if ($voucher->max_discount !== null && (float) $voucher->max_discount > 0) {
            $discount = min($discount, (float) $voucher->max_discount);
        }

        return round(min(max(0, $discount), $applicableSubtotal), 2);
    }

    /**
     * Resolusi item dari DB (harga otoritatif) untuk menghitung subtotal & cakupan.
     *
     * @param  array<int, array<string, mixed>>  $items
     * @return array{order_subtotal: float, lines: array<int, array{product: Product, variant: ?ProductVariant, line_total: float}>}
     */
    private function resolveItems(array $items): array
    {
        $orderSubtotal = 0.0;
        $lines = [];

        foreach ($items as $item) {
            if (empty($item['product_id'])) {
                continue;
            }

            $product = Product::find($item['product_id']);
            if (! $product) {
                continue;
            }

            $variant = ! empty($item['product_variant_id'])
                ? ProductVariant::find($item['product_variant_id'])
                : null;

            $quantity = max(1, (int) ($item['quantity'] ?? 1));
            $price = (float) ($variant && $variant->price !== null ? $variant->price : $product->price);
            $lineTotal = round($price * $quantity, 2);

            $orderSubtotal += $lineTotal;
            $lines[] = ['product' => $product, 'variant' => $variant, 'line_total' => $lineTotal];
        }

        return ['order_subtotal' => round($orderSubtotal, 2), 'lines' => $lines];
    }

    /**
     * Apakah sebuah item tercakup target voucher (all/product/variant/category).
     */
    private function matchesTargets(Product $product, ?ProductVariant $variant, Collection $targets): bool
    {
        foreach ($targets as $target) {
            if ($target->target_type === 'product' && (int) $target->target_id === (int) $product->id) {
                return true;
            }

            if ($target->target_type === 'variant' && $variant && (int) $target->target_id === (int) $variant->id) {
                return true;
            }

            if ($target->target_type === 'category') {
                if ((int) $target->target_id === (int) $product->category_id) {
                    return true;
                }

                if ($product->categories()->whereKey($target->target_id)->exists()) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Hasil validasi gagal (bentuk konsisten dengan hasil sukses).
     *
     * @return array<string, mixed>
     */
    private function invalidResult(string $message, ?Voucher $voucher = null): array
    {
        return [
            'valid' => false,
            'message' => $message,
            'code' => $voucher?->code,
            'discount_amount' => 0.0,
            'free_shipping' => false,
            'stackable' => (bool) ($voucher?->stackable ?? false),
            'order_subtotal' => 0.0,
            'applicable_subtotal' => 0.0,
            'voucher' => $voucher,
        ];
    }

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
