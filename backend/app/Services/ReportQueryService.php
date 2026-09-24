<?php

namespace App\Services;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

/**
 * ReportQueryService — kueri laporan bersama (T18.2).
 *
 * Dipakai ulang oleh laporan laba kotor (T18.3) dan Dashboard BI (T19.1).
 */
class ReportQueryService
{
    /**
     * Basis pesanan terbayar (revenue) dengan filter periode.
     */
    public function paidOrders(?string $from = null, ?string $to = null): Builder
    {
        $query = Order::query()->where('payment_status', 'paid');

        if ($from) {
            $query->whereDate('created_at', '>=', $from);
        }
        if ($to) {
            $query->whereDate('created_at', '<=', $to);
        }

        return $query;
    }

    public function revenue(?string $from = null, ?string $to = null): float
    {
        return round((float) $this->paidOrders($from, $to)->sum('grand_total'), 2);
    }

    public function cogs(?string $from = null, ?string $to = null): float
    {
        return round((float) $this->paidOrders($from, $to)->sum('total_cogs'), 2);
    }

    public function grossProfit(?string $from = null, ?string $to = null): float
    {
        return round($this->revenue($from, $to) - $this->cogs($from, $to), 2);
    }

    /**
     * Arus kas bersih (income - expense) dari transaksi settled.
     */
    public function netCashflow(?string $from = null, ?string $to = null): float
    {
        $base = fn () => Transaction::query()
            ->where('status', 'settled')
            ->when($from, fn (Builder $q) => $q->whereDate('created_at', '>=', $from))
            ->when($to, fn (Builder $q) => $q->whereDate('created_at', '<=', $to));

        $income = (float) $base()->where('type', 'income')->sum('amount');
        $expense = (float) $base()->where('type', 'expense')->sum('amount');

        return round($income - $expense, 2);
    }

    /**
     * Produk fast-moving (terjual terbanyak) pada pesanan terbayar.
     *
     * @return Collection<int, object>
     */
    public function fastMovingProducts(int $limit = 10, ?string $from = null, ?string $to = null): Collection
    {
        return $this->productSalesQuery($from, $to)
            ->orderByDesc('total_quantity')
            ->limit($limit)
            ->get();
    }

    /**
     * Produk slow-moving (terjual paling sedikit) pada pesanan terbayar.
     *
     * @return Collection<int, object>
     */
    public function slowMovingProducts(int $limit = 10, ?string $from = null, ?string $to = null): Collection
    {
        return $this->productSalesQuery($from, $to)
            ->orderBy('total_quantity')
            ->limit($limit)
            ->get();
    }

    /**
     * Liabilitas poin loyalitas pelanggan (total poin beredar).
     */
    public function pointsLiability(): int
    {
        return (int) User::query()->sum('points');
    }

    /**
     * Laba kotor per produk pada pesanan terbayar.
     *
     * @return Collection<int, array<string, mixed>>
     */
    public function profitByProduct(?string $from = null, ?string $to = null): Collection
    {
        return OrderItem::query()
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->leftJoin('products', 'products.id', '=', 'order_items.product_id')
            ->where('orders.payment_status', 'paid')
            ->when($from, fn (Builder $q) => $q->whereDate('orders.created_at', '>=', $from))
            ->when($to, fn (Builder $q) => $q->whereDate('orders.created_at', '<=', $to))
            ->groupBy('order_items.product_id', 'products.name')
            ->selectRaw('order_items.product_id as product_id, products.name as product_name, SUM(order_items.quantity) as quantity_sold, SUM(order_items.subtotal) as revenue, SUM(order_items.unit_cogs * order_items.quantity) as cogs')
            ->get()
            ->map(function ($row) {
                $revenue = round((float) $row->revenue, 2);
                $cogs = round((float) $row->cogs, 2);

                return [
                    'product_id' => (int) $row->product_id,
                    'product_name' => $row->product_name,
                    'quantity_sold' => (int) $row->quantity_sold,
                    'revenue' => $revenue,
                    'cogs' => $cogs,
                    'gross_profit' => round($revenue - $cogs, 2),
                ];
            });
    }

    private function productSalesQuery(?string $from, ?string $to): Builder
    {
        return OrderItem::query()
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->where('orders.payment_status', 'paid')
            ->when($from, fn (Builder $q) => $q->whereDate('orders.created_at', '>=', $from))
            ->when($to, fn (Builder $q) => $q->whereDate('orders.created_at', '<=', $to))
            ->groupBy('order_items.product_id')
            ->selectRaw('order_items.product_id, SUM(order_items.quantity) as total_quantity, SUM(order_items.subtotal) as total_sales');
    }
}
