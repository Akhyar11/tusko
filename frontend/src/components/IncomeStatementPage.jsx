import React, { useState, useEffect, useCallback } from 'react';
import { FileText, Filter, Download, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import IconButton from './atoms/IconButton';
import TextInput from './molecules/TextInput';
import ServerSideTable from './ServerSideTable';
import ReportFilterDrawer from './organisms/ReportFilterDrawer';
import { formatRupiah } from '../utils/formatters';
import { reportService } from '../services/reportService';

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}
function firstDayIso() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

export default function IncomeStatementPage({ onShowToast = () => {} }) {
  const [startDate, setStartDate] = useState(firstDayIso());
  const [endDate, setEndDate] = useState(todayIso());
  const [localStart, setLocalStart] = useState(firstDayIso());
  const [localEnd, setLocalEnd] = useState(todayIso());
  const [data, setData] = useState({ revenue_lines: [], expense_lines: [], total_revenue: 0, total_expense: 0, net_income: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const load = useCallback(async (from, to) => {
    setIsLoading(true);
    try {
      const result = await reportService.fetchIncomeStatement({ start_date: from, end_date: to });
      setData({
        revenue_lines: result.revenue_lines || [],
        expense_lines: result.expense_lines || [],
        total_revenue: Number(result.total_revenue) || 0,
        total_expense: Number(result.total_expense) || 0,
        net_income: Number(result.net_income) || 0,
      });
    } catch (err) {
      onShowToast(err?.message || 'Gagal memuat laporan laba rugi.', { type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [onShowToast]);

  useEffect(() => {
    load(startDate, endDate);
  }, []);

  const applyFilters = () => {
    setStartDate(localStart);
    setEndDate(localEnd);
    setIsFilterOpen(false);
    load(localStart, localEnd);
  };

  const handleReset = () => {
    const first = firstDayIso();
    const today = todayIso();
    setLocalStart(first);
    setLocalEnd(today);
    setStartDate(first);
    setEndDate(today);
    setIsFilterOpen(false);
    load(first, today);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await reportService.downloadIncomeStatementCsv({ start_date: startDate, end_date: endDate });
      onShowToast('CSV laporan laba rugi berhasil diunduh.');
    } catch (err) {
      onShowToast(err?.message || 'Gagal mengunduh CSV.', { type: 'error' });
    } finally {
      setIsExporting(false);
    }
  };

  const lineColumns = [
    { key: 'account_code', label: 'Kode', render: (_val, row) => (<span className="font-mono font-bold text-[11px]">{row.account_code}</span>) },
    { key: 'account_name', label: 'Nama Akun', render: (_val, row) => (<span className="text-xs font-medium">{row.account_name}</span>) },
    { key: 'debit', label: 'Debit', align: 'right', render: (_val, row) => (<span className="font-mono text-[11px]">{Number(row.debit) > 0 ? formatRupiah(row.debit) : '-'}</span>) },
    { key: 'credit', label: 'Kredit', align: 'right', render: (_val, row) => (<span className="font-mono text-[11px]">{Number(row.credit) > 0 ? formatRupiah(row.credit) : '-'}</span>) },
    { key: 'balance', label: 'Saldo', align: 'right', render: (_val, row) => (<span className="font-mono font-bold text-[11px]">{formatRupiah(row.balance)}</span>) },
  ];

  const staticMeta = (rows) => ({
    current_page: 1,
    last_page: 1,
    per_page: Math.max(rows.length, 10),
    total: rows.length,
  });

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-none border border-neutral-300 shadow-2xs">
        <div className="min-w-0">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-none bg-neutral-950 text-amber-400 flex items-center justify-center font-black shrink-0">
              <FileText size={22} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-neutral-950 font-sport tracking-tight uppercase leading-tight">Laporan Laba Rugi</h1>
              <p className="text-xs text-neutral-600 mt-0.5">Pendapatan, beban, dan laba bersih periode berjalan.</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <IconButton icon={Download} variant="secondary" title="Ekspor CSV" onClick={handleExport} disabled={isExporting} />
          <IconButton icon={Filter} variant="secondary" title="Filter periode" onClick={() => setIsFilterOpen(true)} />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4">
        <div className="bg-white p-4 rounded-none border border-neutral-300 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-1.5">
            <span className="text-xs font-sport font-black uppercase tracking-wider">Pendapatan</span>
            <TrendingUp size={16} />
          </div>
          <div className="flex items-baseline gap-2"><span className="text-2xl font-black font-sport">{formatRupiah(data.total_revenue)}</span></div>
          <div className="mt-2 text-[11px] border-t border-neutral-100 pt-1.5 text-neutral-500">Total pendapatan periode.</div>
        </div>
        <div className="bg-white p-4 rounded-none border border-neutral-300 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-1.5">
            <span className="text-xs font-sport font-black uppercase tracking-wider">Beban</span>
            <TrendingDown size={16} />
          </div>
          <div className="flex items-baseline gap-2"><span className="text-2xl font-black font-sport">{formatRupiah(data.total_expense)}</span></div>
          <div className="mt-2 text-[11px] border-t border-neutral-100 pt-1.5 text-neutral-500">Total beban periode.</div>
        </div>
        <div className="bg-white p-4 rounded-none border border-neutral-300 shadow-2xs col-span-2">
          <div className="flex items-center justify-between text-neutral-500 mb-1.5">
            <span className="text-xs font-sport font-black uppercase tracking-wider">Laba Bersih</span>
            <Wallet size={16} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-black font-sport ${data.net_income >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{formatRupiah(data.net_income)}</span>
          </div>
          <div className="mt-2 text-[11px] border-t border-neutral-100 pt-1.5 text-neutral-500">Pendapatan dikurangi beban.</div>
        </div>
      </div>

      <div className="bg-white rounded-none border border-neutral-300 shadow-2xs">
        <div className="p-5 sm:p-6 border-b border-neutral-200">
          <h2 className="text-sm font-black font-sport text-neutral-950 uppercase tracking-wider">Rincian Pendapatan</h2>
        </div>
        <ServerSideTable
          columns={lineColumns}
          data={data.revenue_lines}
          total={data.revenue_lines.length}
          page={1}
          limit={Math.max(data.revenue_lines.length, 10)}
          isLoading={isLoading}
          selectable={true}
          limitOptions={[10, 25, 50, 100]}
          onPageChange={() => {}}
          onLimitChange={() => {}}
          onSortChange={() => {}}
          emptyMessage="Tidak ada baris pada periode ini"
        />
      </div>

      <div className="bg-white rounded-none border border-neutral-300 shadow-2xs">
        <div className="p-5 sm:p-6 border-b border-neutral-200">
          <h2 className="text-sm font-black font-sport text-neutral-950 uppercase tracking-wider">Rincian Beban</h2>
        </div>
        <ServerSideTable
          columns={lineColumns}
          data={data.expense_lines}
          total={data.expense_lines.length}
          page={1}
          limit={Math.max(data.expense_lines.length, 10)}
          isLoading={isLoading}
          selectable={true}
          limitOptions={[10, 25, 50, 100]}
          onPageChange={() => {}}
          onLimitChange={() => {}}
          onSortChange={() => {}}
          emptyMessage="Tidak ada baris pada periode ini"
        />
      </div>

      <ReportFilterDrawer
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onApply={applyFilters}
        onReset={handleReset}
        title="Filter Periode"
        subtitle="Pilih rentang tanggal laporan laba rugi."
      >
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">Dari Tanggal</label>
            <TextInput type="date" value={localStart} onChange={setLocalStart} />
          </div>
          <div>
            <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">Sampai Tanggal</label>
            <TextInput type="date" value={localEnd} onChange={setLocalEnd} />
          </div>
        </div>
      </ReportFilterDrawer>
    </div>
  );
}
