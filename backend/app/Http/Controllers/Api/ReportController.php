<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ReportQueryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

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
    public function incomeStatement(Request $request, ReportQueryService $reports): JsonResponse|StreamedResponse
    {
        $from = $request->query('start_date');
        $to = $request->query('end_date');
        $data = $reports->incomeStatement($from, $to);

        if ($this->wantsCsv($request)) {
            $rows = [];
            foreach ($data['revenue_lines'] as $line) {
                $rows[] = ['Pendapatan', $line['account_code'], $line['account_name'], $line['debit'], $line['credit'], $line['balance']];
            }
            foreach ($data['expense_lines'] as $line) {
                $rows[] = ['Beban', $line['account_code'], $line['account_name'], $line['debit'], $line['credit'], $line['balance']];
            }
            $rows[] = ['TOTAL', '', 'Pendapatan', '', '', $data['total_revenue']];
            $rows[] = ['TOTAL', '', 'Beban', '', '', $data['total_expense']];
            $rows[] = ['TOTAL', '', 'Laba Bersih', '', '', $data['net_income']];

            return $this->csv('laporan-laba-rugi.csv', ['Kelompok', 'Kode Akun', 'Nama Akun', 'Debit', 'Kredit', 'Saldo'], $rows);
        }

        return response()->json([
            'status' => 'success',
            'period' => ['start_date' => $from, 'end_date' => $to],
            'data' => $data,
        ]);
    }

    /**
     * Neraca saldo (trial balance) — T34.2.
     */
    public function trialBalance(Request $request, ReportQueryService $reports): JsonResponse|StreamedResponse
    {
        $from = $request->query('start_date');
        $to = $request->query('end_date');

        $lines = $reports->trialBalance($from, $to);

        if ($this->wantsCsv($request)) {
            $rows = $lines->map(fn ($line) => [
                $line['account_code'], $line['account_name'], $line['account_type'], $line['debit'], $line['credit'], $line['balance'],
            ])->all();
            $rows[] = ['TOTAL', '', '', round($lines->sum('debit'), 2), round($lines->sum('credit'), 2), ''];

            return $this->csv('neraca-saldo.csv', ['Kode Akun', 'Nama Akun', 'Tipe', 'Debit', 'Kredit', 'Saldo'], $rows);
        }

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
    public function vendorAging(Request $request, ReportQueryService $reports): JsonResponse|StreamedResponse
    {
        $asOf = $request->query('as_of');
        $data = $reports->vendorAging($asOf);

        if ($this->wantsCsv($request)) {
            $rows = array_map(fn ($bill) => [
                $bill['bill_number'], $bill['vendor_name'], $bill['due_date'], $bill['days_overdue'],
                $bill['bucket'], $bill['amount'], $bill['paid_amount'], $bill['outstanding'],
            ], $data['bills']);

            return $this->csv(
                'aging-hutang-vendor.csv',
                ['Nomor Tagihan', 'Vendor', 'Jatuh Tempo', 'Hari Terlambat', 'Bucket', 'Jumlah', 'Dibayar', 'Sisa'],
                $rows
            );
        }

        return response()->json([
            'status' => 'success',
            'data' => $data,
        ]);
    }

    private function wantsCsv(Request $request): bool
    {
        return strtolower((string) $request->query('format')) === 'csv';
    }

    /**
     * @param  array<int, string>  $headers
     * @param  array<int, array<int, mixed>>  $rows
     */
    private function csv(string $filename, array $headers, array $rows): StreamedResponse
    {
        return response()->streamDownload(function () use ($headers, $rows) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, $headers);
            foreach ($rows as $row) {
                fputcsv($handle, $row);
            }
            fclose($handle);
        }, $filename, ['Content-Type' => 'text/csv; charset=UTF-8']);
    }
}
