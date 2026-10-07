import React, { useState, useEffect, useMemo } from 'react';
import { BookOpenText, Filter, X, Scale, ArrowLeftRight } from 'lucide-react';
import IconButton from './atoms/IconButton';
import ServerSideTable from './ServerSideTable';
import SearchBar from './molecules/SearchBar';
import ServerSideSelect from './molecules/ServerSideSelect';
import TextInput from './molecules/TextInput';
import { formatRupiah } from '../utils/formatters';
import { useJournalTableStore } from '../stores/useJournalTableStore';
import { reportService } from '../services/reportService';

export default function JournalEntriesPage({ onShowToast = () => {} }) {
  const {
    data: entries,
    meta,
    total,
    page,
    limit,
    sortBy,
    sortDirection,
    summary,
    filters,
    isLoading,
    setPage,
    setLimit,
    setSort,
    setFilter,
    resetFilters,
    fetchData,
  } = useJournalTableStore();

  useEffect(() => {
    fetchData();
  }, []);

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState('');
  const [localAccount, setLocalAccount] = useState('all');
  const [localStart, setLocalStart] = useState('');
  const [localEnd, setLocalEnd] = useState('');
  const [accountOptions, setAccountOptions] = useState([]);

  // Daftar akun dinamis dari database (dilarang hardcode, G6).
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const accounts = await reportService.fetchChartOfAccounts();
        if (!active) return;
        setAccountOptions((accounts || []).map((a) => ({
          value: String(a.account_code),
          label: `${a.account_code} — ${a.account_name}`,
        })));
      } catch {
        // Abaikan; filter akun opsional.
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.searchQuery) count += 1;
    if (filters.accountCode && filters.accountCode !== 'all') count += 1;
    if (filters.startDate || filters.endDate) count += 1;
    return count;
  }, [filters]);

  const applyFilters = () => {
    setFilter('searchQuery', localSearch);
    setFilter('accountCode', localAccount);
    setFilter('startDate', localStart);
    setFilter('endDate', localEnd);
    setIsFilterOpen(false);
  };

  const handleReset = () => {
    setLocalSearch('');
    setLocalAccount('all');
    setLocalStart('');
    setLocalEnd('');
    resetFilters();
    setIsFilterOpen(false);
  };

  const totalDebit = Number(summary?.total_debit) || 0;
  const totalCredit = Number(summary?.total_credit) || 0;
  const isBalanced = summary ? Boolean(summary.is_balanced) : totalDebit === totalCredit;

  const columns = useMemo(() => ([
    {
      key: 'created_at',
      label: 'Tanggal',
      sortable: true,
      render: (_val, row) => (row.created_at ? new Date(row.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'),
    },
    { key: 'transaction_number', label: 'Nomor Transaksi', render: (_val, row) => (<span className="font-mono font-bold text-[11px]">{row.transaction_number || '-'}</span>) },
    { key: 'account_code', label: 'Kode Akun', render: (_val, row) => (<span className="font-mono font-bold text-[11px]">{row.account_code || '-'}</span>) },
    { key: 'account_name', label: 'Nama Akun', render: (_val, row) => (<span className="text-xs font-medium">{row.account_name || '-'}</span>) },
    {
      key: 'debit',
      label: 'Debit',
      align: 'right',
      render: (_val, row) => (<span className="font-mono font-bold text-[11px]">{Number(row.debit) > 0 ? formatRupiah(row.debit) : '-'}</span>),
    },
    {
      key: 'credit',
      label: 'Kredit',
      align: 'right',
      render: (_val, row) => (<span className="font-mono font-bold text-[11px]">{Number(row.credit) > 0 ? formatRupiah(row.credit) : '-'}</span>),
    },
    { key: 'notes', label: 'Keterangan', render: (_val, row) => (<span className="text-xs text-neutral-600 line-clamp-2">{row.notes || '-'}</span>) },
  ]), []);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-none border border-neutral-300 shadow-2xs">
        <div className="min-w-0">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-none bg-neutral-950 text-amber-400 flex items-center justify-center font-black shrink-0">
              <BookOpenText size={22} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-neutral-950 font-sport tracking-tight uppercase leading-tight">Jurnal Umum</h1>
              <p className="text-xs text-neutral-600 mt-0.5">Rincian double-entry seluruh transaksi keuangan toko.</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <IconButton icon={Filter} variant="secondary" title="Filter jurnal" onClick={() => setIsFilterOpen(true)} />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 rounded-none bg-amber-400 text-neutral-950 text-[10px] font-black flex items-center justify-center border border-amber-500">{activeFilterCount}</span>
            )}
          </div>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4">
        <div className="bg-white p-4 rounded-none border border-neutral-300 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-1.5">
            <span className="text-xs font-sport font-black uppercase tracking-wider">Total Debit</span>
            <ArrowLeftRight size={16} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black font-sport">{formatRupiah(totalDebit)}</span>
          </div>
          <div className="mt-2 text-[11px] border-t border-neutral-100 pt-1.5 text-neutral-500">Akumulasi sisi debit filter aktif.</div>
        </div>
        <div className="bg-white p-4 rounded-none border border-neutral-300 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-1.5">
            <span className="text-xs font-sport font-black uppercase tracking-wider">Total Kredit</span>
            <ArrowLeftRight size={16} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black font-sport">{formatRupiah(totalCredit)}</span>
          </div>
          <div className="mt-2 text-[11px] border-t border-neutral-100 pt-1.5 text-neutral-500">Akumulasi sisi kredit filter aktif.</div>
        </div>
        <div className="bg-white p-4 rounded-none border border-neutral-300 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-1.5">
            <span className="text-xs font-sport font-black uppercase tracking-wider">Status Seimbang</span>
            <Scale size={16} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-black font-sport ${isBalanced ? 'text-emerald-600' : 'text-rose-600'}`}>{isBalanced ? 'Seimbang' : 'Selisih'}</span>
          </div>
          <div className="mt-2 text-[11px] border-t border-neutral-100 pt-1.5 text-neutral-500">Debit wajib sama dengan kredit.</div>
        </div>
        <div className="bg-white p-4 rounded-none border border-neutral-300 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-1.5">
            <span className="text-xs font-sport font-black uppercase tracking-wider">Jumlah Entri</span>
            <BookOpenText size={16} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black font-sport">{Number(meta?.total) || 0}</span>
            <span className="text-[11px] font-mono font-bold text-neutral-400">baris</span>
          </div>
          <div className="mt-2 text-[11px] border-t border-neutral-100 pt-1.5 text-neutral-500">Total baris jurnal filter aktif.</div>
        </div>
      </div>

      {/* Tabel */}
      <ServerSideTable
        columns={columns}
        data={entries}
        total={total}
        page={page}
        limit={limit}
        sortBy={sortBy}
        sortDirection={sortDirection}
        isLoading={isLoading}
        selectable={true}
        limitOptions={[10, 25, 50, 100]}
        onPageChange={setPage}
        onLimitChange={setLimit}
        onSortChange={({ sortBy, sortDirection }) => setSort(sortBy, sortDirection)}
        emptyMessage="Belum ada entri jurnal pada filter ini"
      />

      {/* Filter Drawer */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-50">
          <div className="fixed inset-0 bg-neutral-950/60" onClick={() => setIsFilterOpen(false)} />
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col translate-x-0">
              <div className="p-5 sm:p-6 bg-neutral-950 text-white flex items-center justify-between border-b border-neutral-800 shrink-0">
                <div>
                  <h2 className="text-sm font-black font-sport uppercase tracking-wider">Filter Jurnal</h2>
                  <p className="text-[11px] text-neutral-400 mt-0.5">Saring entri berdasarkan kata kunci, akun, dan periode.</p>
                </div>
                <IconButton icon={X} variant="secondary" title="Tutup filter" onClick={() => setIsFilterOpen(false)} />
              </div>
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
                <div>
                  <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">Pencarian</label>
                  <SearchBar value={localSearch} onChange={setLocalSearch} placeholder="Cari nomor transaksi, akun, atau keterangan..." />
                </div>
                <div>
                  <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">Akun</label>
                  <ServerSideSelect value={localAccount} onChange={setLocalAccount} options={[{ value: 'all', label: 'Semua akun' }, ...accountOptions]} placeholder="Pilih akun jurnal..." />
                </div>
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
              </div>
              <div className="p-5 sm:p-6 bg-white border-t border-neutral-200 flex items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex-1 py-2 bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 text-neutral-800 text-xs font-sport font-black uppercase tracking-wider transition-colors cursor-pointer rounded-none"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={applyFilters}
                  className="flex-1 py-2.5 bg-amber-400 hover:bg-amber-300 border border-amber-500 text-neutral-950 text-xs font-sport font-black uppercase tracking-wider transition-all shadow-xs cursor-pointer rounded-none"
                >
                  Terapkan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
