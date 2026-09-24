<?php

namespace App\Services;

use App\Exceptions\InsufficientStockException;
use App\Models\InventoryBalance;
use App\Models\Order;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\StockReservation;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * StockReservationService — reservasi stok otomatis (T13.3).
 *
 * Mengunci ketersediaan saat checkout agar tidak overselling: `available_stock`
 * berkurang & `reserved_stock` bertambah. Release saat batal/expired, commit saat
 * lunas (on_hand berkurang).
 */
class StockReservationService
{
    public function __construct(
        private readonly WarehouseAllocationService $allocation,
        private readonly InventoryService $inventory
    ) {
    }

    /**
     * Reservasi stok untuk sebuah order.
     *
     * @param  array<int, array{product_id: int, product_variant_id?: ?int, quantity: int}>  $lines
     * @return array<int, StockReservation>
     */
    public function reserve(Order $order, array $lines, ?Carbon $expiresAt = null): array
    {
        $expiresAt = $expiresAt ?? now()->addHours(24);

        return DB::transaction(function () use ($order, $lines, $expiresAt) {
            $created = [];

            foreach ($lines as $line) {
                $quantity = (int) $line['quantity'];
                if ($quantity <= 0) {
                    continue;
                }

                $variantId = $line['product_variant_id'] ?? null;
                $variantId = $variantId !== null ? (int) $variantId : null;

                $allocation = $this->allocation->allocate((int) $line['product_id'], $variantId, $quantity);

                if (!$allocation) {
                    throw new InsufficientStockException(0, $quantity, 'Stok tersedia tidak mencukupi untuk reservasi.');
                }

                $balance = InventoryBalance::query()->whereKey($allocation->id)->lockForUpdate()->firstOrFail();

                if ((int) $balance->available_stock < $quantity) {
                    throw new InsufficientStockException((int) $balance->available_stock, $quantity);
                }

                $balance->reserved_stock = (int) $balance->reserved_stock + $quantity;
                $balance->available_stock = max(0, (int) $balance->on_hand_stock - (int) $balance->reserved_stock);
                $balance->save();

                $created[] = StockReservation::create([
                    'order_id' => $order->id,
                    'product_id' => (int) $line['product_id'],
                    'product_variant_id' => $variantId,
                    'warehouse_id' => $balance->warehouse_id,
                    'quantity' => $quantity,
                    'status' => 'active',
                    'expires_at' => $expiresAt,
                ]);
            }

            return $created;
        });
    }

    /**
     * Lepaskan seluruh reservasi aktif sebuah order (batal/expired).
     */
    public function release(Order $order): int
    {
        return $this->releaseReservations(
            StockReservation::where('order_id', $order->id)->where('status', 'active')->get()
        );
    }

    /**
     * Commit reservasi aktif menjadi pengurangan stok permanen (lunas).
     */
    public function commit(Order $order): int
    {
        return DB::transaction(function () use ($order) {
            $reservations = StockReservation::where('order_id', $order->id)
                ->where('status', 'active')
                ->lockForUpdate()
                ->get();

            $count = 0;

            foreach ($reservations as $reservation) {
                $balance = InventoryBalance::query()->whereKey(
                    $this->balanceId($reservation)
                )->lockForUpdate()->first();

                if (!$balance) {
                    continue;
                }

                $balance->on_hand_stock = max(0, (int) $balance->on_hand_stock - (int) $reservation->quantity);
                $balance->reserved_stock = max(0, (int) $balance->reserved_stock - (int) $reservation->quantity);
                $balance->available_stock = max(0, (int) $balance->on_hand_stock - (int) $balance->reserved_stock);
                $balance->save();

                $reservation->update(['status' => 'committed_sold']);
                $this->syncReservationAggregates($reservation);
                $count++;
            }

            return $count;
        });
    }

    /**
     * Lepaskan reservasi aktif yang sudah kedaluwarsa (dipakai scheduler T30.2).
     */
    public function releaseExpired(?Carbon $now = null): int
    {
        $now = $now ?? now();

        return $this->releaseReservations(
            StockReservation::where('status', 'active')
                ->whereNotNull('expires_at')
                ->where('expires_at', '<', $now)
                ->get()
        );
    }

    /**
     * @param  \Illuminate\Support\Collection<int, StockReservation>  $reservations
     */
    private function releaseReservations($reservations): int
    {
        return DB::transaction(function () use ($reservations) {
            $count = 0;

            foreach ($reservations as $reservation) {
                $balance = InventoryBalance::query()->whereKey(
                    $this->balanceId($reservation)
                )->lockForUpdate()->first();

                if (!$balance) {
                    continue;
                }

                $balance->reserved_stock = max(0, (int) $balance->reserved_stock - (int) $reservation->quantity);
                $balance->available_stock = max(0, (int) $balance->on_hand_stock - (int) $balance->reserved_stock);
                $balance->save();

                $reservation->update(['status' => 'released_expired']);
                $count++;
            }

            return $count;
        });
    }

    private function balanceId(StockReservation $reservation): int
    {
        return (int) InventoryBalance::query()
            ->where('warehouse_id', $reservation->warehouse_id)
            ->where('product_id', $reservation->product_id)
            ->when($reservation->product_variant_id, fn ($q) => $q->where('product_variant_id', $reservation->product_variant_id))
            ->when(!$reservation->product_variant_id, fn ($q) => $q->whereNull('product_variant_id'))
            ->value('id');
    }

    private function syncReservationAggregates(StockReservation $reservation): void
    {
        $product = Product::find($reservation->product_id);
        if (!$product) {
            return;
        }

        $variant = $reservation->product_variant_id ? ProductVariant::find($reservation->product_variant_id) : null;
        $this->inventory->syncAggregatesFor($product, $variant);
    }
}
