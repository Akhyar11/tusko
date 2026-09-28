import React, { useState, useEffect, useCallback } from 'react';
import { Hourglass, Filter, Download, Building2, AlertTriangle } from 'lucide-react';
import IconButton from './atoms/IconButton';
import TextInput from './molecules/TextInput';
import ServerSideTable from './ServerSideTable';
import ReportFilterDrawer from './organisms/ReportFilterDrawer';
import { formatRupiah } from '../utils/formatters';
import { reportService } from '../services/reportService';

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default function VendorAgingPage({ onShowToast = () => {} }) {
  const [asOf, setAsOf] = useState(todayIso());
  const [localAsOf, setLocalAsOf] = useState(todayIso());
  const [bills, setBills] = useState([]);
  const [summary, setSummary] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const load = useCallback(async (date) => {
    setIsLoading(true);
    try {
      const result = await reportService.fetchVendorAging({ as_of: date });
      setBills(result.bills || []);
      const { bills: _b, ...rest } = result;
      setSummary(rest);
    } catch (err) {
      onShowToast(err?.message || 'Gagal memuat aging hutang.', { type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [onShowToast]);

  useEffect(() => {
    load(asOf);
  }, []);

  const applyFilters = () => {
    setAsOf(localAsOf);
    setIsFilterOpen(false);
    load(localAsOf);
  };

  const handleReset = () => {
    const today = todayIso();
    setLocalAsOf(today);
    setAsOf(today);
    setIsFilterOpen(false);
    load(today);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await reportService.downloadVendorAgingCsv({ as_of: asOf });
      onShowToast('CSV aging hutang berhasil diunduh.');
    } catch (err) {
      onShowToast(err?.message || 'Gagal mengunduh CSV.', { type: 'error' });
    } finally {
      setIsExporting(false);
    }
  };

  const totalOutstanding = bills.reduce((sum, b) => sum + (Number(b.outstanding) || 0), 0);
  const overdueCount = bills.filter((b) => Number(b.days_overdue) > 0).length;

  const billColumns = [
    { key: 'bill_number', label: 'Nomor Tagihan', render: (row) => (<span className="font-mono font-bold text-[11px]">{row.bill_number}</span>) },
    { key: 'vendor_name', label: 'Vendor', render: (row) => (<span className="text-xs font-medium">{row.vendor_name}</span>) },
    { key: 'due_date', label: 'Jatuh Tempo', render: (row) => (<span className="text-xs">{row.due_date || '-'}</span>) },
    { key: 'days_overdue', label: 'Terlambat (hari)', align: 'right', render: (row) => (<span className={`font-mono font-bold text-[11px] ${Number(row.days_overdue) > 0 ? 'text-rose-600' : 'text-neutral-600'}`}>{row.days_overdue ?? 0}</span>) },
    { key: 'bucket', label: 'Bucket', render: (row) => (<span className="text-[10px] font-sport font-black uppercase px-2 py-0.5 rounded-none bg-neutral-100 border border-neutral-200">{row.bucket || '-'}</span>) },
    { key: 'outstanding', label: 'Sisa', align: 'right', render: (row) => (<span className="font-mono font-bold text-[11px]">{formatRupiah(row.outstanding)}</span>) },
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
              <Hourglass size={22} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-neutral-950 font-sport tracking-tight uppercase leading-tight">Aging Hutang Vendor</h1>
              <p className="text-xs text-neutral-600 mt-0.5">Umur tagihan vendor yang belum lunas.</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <IconButton icon={Download} variant="secondary" title="Ekspor CSV" onClick={handleExport} disabled={isExporting} />
          <IconButton icon={Filter} variant="secondary" title="Filter tanggal" onClick={() => setIsFilterOpen(true)} />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4">
        <div className="bg-white p-4 rounded-none border border-neutral-300 shadow-2xs col-span-2">
          <div className="flex items-center justify-between text-neutral-500 mb-1.5">
            <span className="text-xs font-sport font-black uppercase tracking-wider">Total Sisa Hutang</span>
            <Building2 size={16} />
          </div>
          <div className="flex items-baseline gap-2"><span className="text-2xl font-black font-sport">{formatRupiah(totalOutstanding)}</span></div>
          <div className="mt-2 text-[11px] border-t border-neutral-100 pt-1.5 text-neutral-500">Akumulasi tagihan belum lunas.</div>
        </div>
        <div className="bg-white p-4 rounded-none border border-neutral-300 shadow-2xs col-span-2">
          <div className="flex items-center justify-between text-neutral-500 mb-1.5">
            <span className="text-xs font-sport font-black uppercase tracking-wider">Tagihan Terlambat</span>
            <AlertTriangle size={16} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-black font-sport ${overdueCount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{overdueCount}</span>
            <span className="text-[11px] font-mono font-bold text-neutral-400">tagihan</span>
          </div>
          <div className="mt-2 text-[11px] border-t border-neutral-100 pt-1.5 text-neutral-500">Melewati jatuh tempo.</div>
        </div>
      </div>

      <ServerSideTable
        columns={billColumns}
        data={bills}
        meta={staticMeta(bills)}
        isLoading={isLoading}
        selectable={true}
        limitOptions={[10, 25, 50, 100]}
        onPageChange={() => {}}
        onLimitChange={() => {}}
        onSortChange={() => {}}
        emptyMessage="Tidak ada tagihan belum lunas"
      />

      <ReportFilterDrawer
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onApply={applyFilters}
        onReset={handleReset}
        title="Filter Tanggal"
        subtitle="Tampilkan posisi hutang per tanggal tertentu."
      >
        <div>
          <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">Per Tanggal</label>
          <TextInput type="date" value={localAsOf} onChange={setLocalAsOf} />
        </div>
      </ReportFilterDrawer>
    </div>
  );
}
