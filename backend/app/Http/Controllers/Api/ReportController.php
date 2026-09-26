<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ReportQueryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    /**
     * Laporan laba kotor (revenue - HPP/COGS) beserta rincian per produk.
     */
    public function profit(Request $request, ReportQueryService $reports): JsonResponse
    {
        $from = $request->query('start_date');
        $to = $request->query('end_date');

        $revenue = $reports->revenue($from, $to);
        $cogs = $reports->cogs($from, $to);
        $grossProfit = round($revenue - $cogs, 2);
        $margin = $revenue > 0 ? round(($grossProfit / $revenue) * 100, 2) : 0.0;

        return response()->json([
            'status' => 'success',
            'period' => [
                'start_date' => $from,
                'end_date' => $to,
            ],
            'summary' => [
                'revenue' => $revenue,
                'cogs' => $cogs,
                'gross_profit' => $grossProfit,
                'margin_percentage' => $margin,
            ],
            'data' => $reports->profitByProduct($from, $to)->sortByDesc('gross_profit')->values(),
        ]);
    }

    /**
     * Laporan laba rugi (income statement) — T34.2.
     */
    public function incomeStatement(Request $request, ReportQueryService $reports): JsonResponse
    {
        $from = $request->query('start_date');
        $to = $request->query('end_date');

        return response()->json([
            'status' => 'success',
            'period' => ['start_date' => $from, 'end_date' => $to],
            'data' => $reports->incomeStatement($from, $to),
        ]);
    }

    /**
     * Neraca saldo (trial balance) — T34.2.
     */
    public function trialBalance(Request $request, ReportQueryService $reports): JsonResponse
    {
        $from = $request->query('start_date');
        $to = $request->query('end_date');

        $lines = $reports->trialBalance($from, $to);

        return response()->json([
            'status' => 'success',
            'period' => ['start_date' => $from, 'end_date' => $to],
            'summary' => [
                'total_debit' => round($lines->sum('debit'), 2),
                'total_credit' => round($lines->sum('credit'), 2),
            ],
            'data' => $lines,
        ]);
    }

    /**
     * Laporan aging hutang vendor (T34.3).
     */
    public function vendorAging(Request $request, ReportQueryService $reports): JsonResponse
    {
        $asOf = $request->query('as_of');

        return response()->json([
            'status' => 'success',
            'data' => $reports->vendorAging($asOf),
        ]);
    }
}
