<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Product;
use App\Services\ReportQueryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;

class DashboardController extends Controller
{
    /**
     * Ringkasan BI dashboard admin (T19.1) — agregasi + cache.
     */
    public function summary(ReportQueryService $reports): JsonResponse
    {
        $data = Cache::remember('dashboard.summary', 300, function () use ($reports) {
            $from = now()->startOfMonth()->toDateString();
            $to = now()->toDateString();

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
                    'points_liability' => $reports->pointsLiability(),
                ],
                'trend' => $reports->revenueTrend(30),
                'fast_moving' => $reports->fastMovingProducts(5),
                'slow_moving' => $reports->slowMovingProducts(5),
            ];
        });

        return response()->json([
            'status' => 'success',
            'data' => $data,
            'cached' => Cache::has('dashboard.summary'),
        ]);
    }
}
