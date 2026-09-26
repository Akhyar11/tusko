<?php

namespace App\Services;

use App\Models\FinancialLedgerEntry;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Transaction;
use App\Models\User;
use App\Models\VendorBill;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Carbon;
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

    /**
     * Neraca saldo (trial balance) per akun dari `financial_ledger_entries` (T34.2).
     *
     * @return Collection<int, array<string, mixed>>
     */
    public function trialBalance(?string $from = null, ?string $to = null): Collection
    {
        return FinancialLedgerEntry::query()
            ->join('chart_of_accounts', 'chart_of_accounts.id', '=', 'financial_ledger_entries.chart_of_account_id')
            ->when($from, fn (Builder $q) => $q->whereDate('financial_ledger_entries.created_at', '>=', $from))
            ->when($to, fn (Builder $q) => $q->whereDate('financial_ledger_entries.created_at', '<=', $to))
            ->groupBy('chart_of_accounts.id', 'chart_of_accounts.account_code', 'chart_of_accounts.account_name', 'chart_of_accounts.account_type')
            ->selectRaw('chart_of_accounts.account_code as account_code, chart_of_accounts.account_name as account_name, chart_of_accounts.account_type as account_type, COALESCE(SUM(financial_ledger_entries.debit), 0) as debit, COALESCE(SUM(financial_ledger_entries.credit), 0) as credit')
            ->orderBy('chart_of_accounts.account_code')
            ->get()
            ->map(fn ($row) => [
                'account_code' => $row->account_code,
                'account_name' => $row->account_name,
                'account_type' => $row->account_type,
                'debit' => round((float) $row->debit, 2),
                'credit' => round((float) $row->credit, 2),
                'balance' => round((float) $row->debit - (float) $row->credit, 2),
            ]);
    }

    /**
     * Laporan laba rugi (income statement) dari akun revenue & expense (T34.2).
     *
     * @return array<string, mixed>
     */
    public function incomeStatement(?string $from = null, ?string $to = null): array
    {
        $trial = $this->trialBalance($from, $to);

        $revenueLines = $trial->where('account_type', 'revenue')->values();
        $expenseLines = $trial->where('account_type', 'expense')->values();

        $totalRevenue = round($revenueLines->sum(fn ($line) => $line['credit'] - $line['debit']), 2);
        $totalExpense = round($expenseLines->sum(fn ($line) => $line['debit'] - $line['credit']), 2);

        return [
            'revenue_lines' => $revenueLines,
            'expense_lines' => $expenseLines,
            'total_revenue' => $totalRevenue,
            'total_expense' => $totalExpense,
            'net_income' => round($totalRevenue - $totalExpense, 2),
        ];
    }

    /**
     * Laporan aging hutang vendor (T34.3) — bucket umur berdasarkan `due_date`.
     *
     * @return array<string, mixed>
     */
    public function vendorAging(?string $asOf = null): array
    {
        $asOfDate = ($asOf ? Carbon::parse($asOf) : now())->startOfDay();

        $bills = VendorBill::query()
            ->with('vendor:id,code,company_name')
            ->whereRaw('(amount - paid_amount) > 0')
            ->orderBy('due_date')
            ->get();

        $bucketKeys = ['current', '1_30', '31_60', '61_90', 'over_90'];
        $buckets = array_fill_keys($bucketKeys, 0.0);
        $rows = [];
        $byVendor = [];

        foreach ($bills as $bill) {
            $outstanding = round((float) $bill->amount - (float) $bill->paid_amount, 2);
            if ($outstanding <= 0) {
                continue;
            }

            $due = $bill->due_date ? Carbon::parse($bill->due_date)->startOfDay() : null;
            $daysOverdue = $due ? (int) floor(($asOfDate->timestamp - $due->timestamp) / 86400) : 0;
            $bucket = $this->agingBucket($daysOverdue);

            $buckets[$bucket] = round($buckets[$bucket] + $outstanding, 2);

            $vendorId = (int) $bill->vendor_id;
            if (!isset($byVendor[$vendorId])) {
                $byVendor[$vendorId] = array_merge([
                    'vendor_id' => $vendorId,
                    'vendor_code' => $bill->vendor?->code,
                    'vendor_name' => $bill->vendor?->company_name,
                    'total_outstanding' => 0.0,
                ], array_fill_keys($bucketKeys, 0.0));
            }
            $byVendor[$vendorId]['total_outstanding'] = round($byVendor[$vendorId]['total_outstanding'] + $outstanding, 2);
            $byVendor[$vendorId][$bucket] = round($byVendor[$vendorId][$bucket] + $outstanding, 2);

            $rows[] = [
                'bill_id' => $bill->id,
                'bill_number' => $bill->bill_number,
                'vendor_id' => $vendorId,
                'vendor_name' => $bill->vendor?->company_name,
                'due_date' => $due?->toDateString(),
                'days_overdue' => $daysOverdue,
                'bucket' => $bucket,
                'amount' => round((float) $bill->amount, 2),
                'paid_amount' => round((float) $bill->paid_amount, 2),
                'outstanding' => $outstanding,
                'status' => $bill->status,
            ];
        }

        return [
            'as_of' => $asOfDate->toDateString(),
            'buckets' => $buckets,
            'total_outstanding' => round(array_sum($buckets), 2),
            'by_vendor' => array_values($byVendor),
            'bills' => $rows,
        ];
    }

    private function agingBucket(int $daysOverdue): string
    {
        if ($daysOverdue <= 0) {
            return 'current';
        }
        if ($daysOverdue <= 30) {
            return '1_30';
        }
        if ($daysOverdue <= 60) {
            return '31_60';
        }
        if ($daysOverdue <= 90) {
            return '61_90';
        }

        return 'over_90';
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
