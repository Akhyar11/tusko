<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Product;
use App\Services\ReportQueryService;
use App\Services\Settings\SettingsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;

class DashboardController extends Controller
{
    /**
     * Ringkasan BI dashboard admin (T19.1) — agregasi + cache.
     */
    public function summary(ReportQueryService $reports, SettingsService $settings): JsonResponse
    {
        $data = Cache::remember('dashboard.summary', 300, function () use ($reports, $settings) {
            $from = now()->startOfMonth()->toDateString();
            $to = now()->toDateString();

            $pointsOutstanding = $reports->pointsLiability();
            $redeemValue = max(1, (int) $settings->get('loyalty.points_redeem_value', 1));

            return [
                'period' => ['start_date' => $from, 'end_date' => $to],
                'kpi' => [
                    'revenue' => $reports->revenue($from, $to),
                    'gross_profit' => $reports->grossProfit($from, $to),
                    'net_cashflow' => $reports->netCashflow($from, $to),
                    'orders_total' => Order::count(),
                    'orders_paid' => Order::where('payment_status', 'paid')->count(),
                    'orders_pending' => Order::where('status', 'pending')->count(),
                    'products_total' => Product::count(),
                    'low_stock' => Product::whereColumn('stock', '<=', 'stock_minimum')->count(),
                    'points_liability' => $pointsOutstanding,
                    'account_balance' => $reports->accountBalance(),
                ],
                'chart' => [
                    'monthly' => $reports->revenueSeriesMonths(6),
                    'weekly' => $reports->revenueSeriesWeeks(),
                ],
                'loyalty' => [
                    'points_outstanding' => $pointsOutstanding,
                    'redeem_value' => $redeemValue,
                    'liability' => $pointsOutstanding * $redeemValue,
                ],
                'trend' => $reports->revenueTrend(30)->toArray(),
                'fast_moving' => $reports->fastMovingProducts(5)->toArray(),
                'slow_moving' => $reports->slowMovingProducts(5)->toArray(),
            ];
        });

        return response()->json([
            'status' => 'success',
            'data' => $data,
            'cached' => Cache::has('dashboard.summary'),
        ]);
    }
}
