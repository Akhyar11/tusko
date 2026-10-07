import React, { useState, useEffect, useCallback } from 'react';
import { ChartColumn, Filter, TrendingUp, Package, Percent } from 'lucide-react';
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

export default function ProfitReportPage({ onShowToast = () => {} }) {
  const [startDate, setStartDate] = useState(firstDayIso());
  const [endDate, setEndDate] = useState(todayIso());
  const [localStart, setLocalStart] = useState(firstDayIso());
  const [localEnd, setLocalEnd] = useState(todayIso());
  const [summary, setSummary] = useState({ revenue: 0, cogs: 0, gross_profit: 0, margin_percentage: 0 });
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const load = useCallback(async (from, to) => {
    setIsLoading(true);
    try {
      const result = await reportService.fetchProfit({ start_date: from, end_date: to });
      setSummary(result.summary || { revenue: 0, cogs: 0, gross_profit: 0, margin_percentage: 0 });
      setRows(result.data || []);
    } catch (err) {
      onShowToast(err?.message || 'Gagal memuat laporan profit.', { type: 'error' });
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

  const productColumns = [
    { key: 'product_name', label: 'Produk', render: (_val, row) => (<span className="text-xs font-medium">{row.product_name}</span>) },
    { key: 'quantity_sold', label: 'Terjual', align: 'right', render: (_val, row) => (<span className="font-mono font-bold text-[11px]">{row.quantity_sold}</span>) },
    { key: 'revenue', label: 'Pendapatan', align: 'right', render: (_val, row) => (<span className="font-mono text-[11px]">{formatRupiah(row.revenue)}</span>) },
    { key: 'cogs', label: 'HPP', align: 'right', render: (_val, row) => (<span className="font-mono text-[11px]">{formatRupiah(row.cogs)}</span>) },
    { key: 'gross_profit', label: 'Laba Kotor', align: 'right', render: (_val, row) => (<span className={`font-mono font-bold text-[11px] ${Number(row.gross_profit) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{formatRupiah(row.gross_profit)}</span>) },
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
              <ChartColumn size={22} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-neutral-950 font-sport tracking-tight uppercase leading-tight">Laporan Profit & HPP</h1>
              <p className="text-xs text-neutral-600 mt-0.5">Laba kotor penjualan setelah HPP per produk.</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <IconButton icon={Filter} variant="secondary" title="Filter periode" onClick={() => setIsFilterOpen(true)} />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4">
        <div className="bg-white p-4 rounded-none border border-neutral-300 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-1.5">
            <span className="text-xs font-sport font-black uppercase tracking-wider">Pendapatan</span>
            <TrendingUp size={16} />
          </div>
          <div className="flex items-baseline gap-2"><span className="text-2xl font-black font-sport">{formatRupiah(summary.revenue)}</span></div>
          <div className="mt-2 text-[11px] border-t border-neutral-100 pt-1.5 text-neutral-500">Penjualan lunas periode.</div>
        </div>
        <div className="bg-white p-4 rounded-none border border-neutral-300 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-1.5">
            <span className="text-xs font-sport font-black uppercase tracking-wider">HPP / COGS</span>
            <Package size={16} />
          </div>
          <div className="flex items-baseline gap-2"><span className="text-2xl font-black font-sport">{formatRupiah(summary.cogs)}</span></div>
          <div className="mt-2 text-[11px] border-t border-neutral-100 pt-1.5 text-neutral-500">Beban pokok penjualan.</div>
        </div>
        <div className="bg-white p-4 rounded-none border border-neutral-300 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-1.5">
            <span className="text-xs font-sport font-black uppercase tracking-wider">Laba Kotor</span>
            <TrendingUp size={16} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-black font-sport ${Number(summary.gross_profit) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{formatRupiah(summary.gross_profit)}</span>
          </div>
          <div className="mt-2 text-[11px] border-t border-neutral-100 pt-1.5 text-neutral-500">Pendapatan dikurangi HPP.</div>
        </div>
        <div className="bg-white p-4 rounded-none border border-neutral-300 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-1.5">
            <span className="text-xs font-sport font-black uppercase tracking-wider">Margin</span>
            <Percent size={16} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black font-sport">{Number(summary.margin_percentage) || 0}</span>
            <span className="text-[11px] font-mono font-bold text-neutral-400">%</span>
          </div>
          <div className="mt-2 text-[11px] border-t border-neutral-100 pt-1.5 text-neutral-500">Rasio laba kotor.</div>
        </div>
      </div>

      <ServerSideTable
        columns={productColumns}
        data={rows}
        total={rows.length}
        page={1}
        limit={Math.max(rows.length, 10)}
        isLoading={isLoading}
        selectable={true}
        limitOptions={[10, 25, 50, 100]}
        onPageChange={() => {}}
        onLimitChange={() => {}}
        onSortChange={() => {}}
        emptyMessage="Tidak ada penjualan lunas pada periode ini"
      />

      <ReportFilterDrawer
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onApply={applyFilters}
        onReset={handleReset}
        title="Filter Periode"
        subtitle="Pilih rentang tanggal laporan profit."
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
