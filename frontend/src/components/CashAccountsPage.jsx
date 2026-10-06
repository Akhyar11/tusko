import React, { useState, useEffect, useMemo } from 'react';
import { 
  Coins, 
  Plus, 
  SlidersHorizontal,
  MoreVertical, 
  Edit3, 
  Trash2, 
  Power,
  Wallet,
  CheckCircle2,
  XCircle,
  BookOpen,
  ArrowRightLeft
} from 'lucide-react';
import IconButton from './atoms/IconButton';
import ServerSideTable from './ServerSideTable';
import CashAccountFilterDrawer from './organisms/CashAccountFilterDrawer';
import ConfirmationModal from './ConfirmationModal';
import { financialAccountService } from '../services/financialAccountService';
import { useCashAccountTableStore } from '../stores/useCashAccountTableStore';
import { formatRupiah } from '../utils/formatters';
import { apiClient } from '../services/apiClient';

export default function CashAccountsPage({
  onShowToast = () => {},
  onNavigateToCreate = () => {},
  onNavigateToEdit = () => {},
  onNavigateToTransactions = () => {}
}) {
  const {
    page,
    limit,
    sortBy,
    sortDirection,
    filters,
    data: accounts,
    total: totalCount,
    summary,
    isLoading,
    setPage,
    setLimit,
    setSort,
    setFilter,
    resetFilters,
    fetchData,
  } = useCashAccountTableStore();

  const [selectedIds, setSelectedIds] = useState([]);
  const [activeActionMenuId, setActiveActionMenuId] = useState(null);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [coaOptions, setCoaOptions] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  // Muat opsi COA untuk drawer filter
  useEffect(() => {
    let isMounted = true;
    apiClient.get('/api/chart-of-accounts')
      .then(res => {
        if (!isMounted) return;
        const list = Array.isArray(res.data) ? res.data : [];
        setCoaOptions(
          list
            .filter(c => c.account_type === 'asset' || c.account_code?.startsWith('11'))
            .map(c => ({
              value: String(c.id),
              label: `${c.account_code} - ${c.account_name}`
            }))
        );
      })
      .catch(() => {});
    return () => { isMounted = false; };
  }, []);

  // Tutup dropdown menu bila klik di luar
  useEffect(() => {
    const handleGlobalClick = () => setActiveActionMenuId(null);
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  // Hitung jumlah filter aktif
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.searchQuery) count++;
    if (filters.statusFilter && filters.statusFilter !== 'all') count++;
    if (filters.coaFilter && filters.coaFilter !== 'all') count++;
    return count;
  }, [filters]);

  // Handler Hapus Akun
  const handleConfirmDelete = async () => {
    if (!deletingAccount) return;
    setIsSubmitting(true);
    try {
      await financialAccountService.deleteAccount(deletingAccount.id);
      onShowToast(`Akun kas "${deletingAccount.account_name}" berhasil dihapus.`);
      setDeletingAccount(null);
      fetchData();
    } catch (err) {
      onShowToast(err.message || 'Gagal menghapus akun kas.', { type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler Toggle Status Aktif
  const handleToggleStatus = async (account) => {
    try {
      const res = await financialAccountService.toggleAccountStatus(account.id);
      onShowToast(res.message || 'Status akun berhasil diperbarui.');
      fetchData();
    } catch (err) {
      onShowToast(err.message || 'Gagal mengubah status akun.', { type: 'error' });
    }
  };

  const columns = [
    {
      key: 'account_name',
      label: 'NAMA AKUN KAS',
      sortable: true,
      render: (val, row) => {
        const r = row || (typeof val === 'object' && val !== null ? val : {}) || {};
        return (
          <div className="py-1">
            <div className="font-sport font-black text-xs text-neutral-950 uppercase leading-snug">
              {r.account_name || (typeof val === 'string' ? val : '-')}
            </div>
            {r.notes && (
              <div className="text-[11px] text-neutral-500 mt-0.5 max-w-xs truncate">
                {r.notes}
              </div>
            )}
          </div>
        );
      }
    },
    {
      key: 'chart_of_account',
      label: 'BAGAN AKUN (COA)',
      sortable: false,
      render: (val, row) => {
        const r = row || (typeof val === 'object' && val !== null ? val : {}) || {};
        const coa = r.chart_of_account || (val && typeof val === 'object' ? val : null);
        if (!coa) return <span className="font-mono text-neutral-400 text-xs">-</span>;
        return (
          <div className="flex items-center gap-1.5">
            <span className="font-mono font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 border border-amber-200 text-[11px] rounded-none">
              {coa.account_code}
            </span>
            <span className="text-xs text-neutral-700 truncate max-w-[180px]">
              {coa.account_name}
            </span>
          </div>
        );
      }
    },
    {
      key: 'current_balance',
      label: 'SALDO KAS SAAT INI',
      sortable: true,
      render: (val, row) => {
        const r = row || (typeof val === 'object' && val !== null ? val : {}) || {};
        const bal = r.current_balance !== undefined ? r.current_balance : val;
        return (
          <div className="font-mono font-black text-xs text-neutral-950">
            {formatRupiah(parseFloat(bal) || 0)}
          </div>
        );
      }
    },
    {
      key: 'is_active',
      label: 'STATUS',
      sortable: false,
      render: (val, row) => {
        const r = row || (typeof val === 'object' && val !== null ? val : {}) || {};
        const active = r.is_active !== undefined ? r.is_active : val;
        return active ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-300 font-sport font-bold text-[10px] uppercase rounded-none">
            <CheckCircle2 size={12} className="text-emerald-600" />
            <span>Aktif</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-neutral-100 text-neutral-600 border border-neutral-300 font-sport font-bold text-[10px] uppercase rounded-none">
            <XCircle size={12} className="text-neutral-400" />
            <span>Nonaktif</span>
          </span>
        );
      }
    },
    {
      key: 'actions',
      label: 'AKSI',
      sortable: false,
      align: 'right',
      render: (_val, row) => {
        const r = row || (typeof _val === 'object' && _val !== null ? _val : {}) || {};
        return (
          <div className="relative flex justify-end" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setActiveActionMenuId(activeActionMenuId === r.id ? null : r.id)}
              className="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 border border-transparent hover:border-neutral-300 rounded-none transition-colors cursor-pointer"
              title="Menu Aksi"
            >
              <MoreVertical size={16} />
            </button>

            {activeActionMenuId === r.id && (
              <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-neutral-300 shadow-xl z-30 py-1 rounded-none animate-in fade-in zoom-in-95 duration-100">
                <button
                  type="button"
                  onClick={() => {
                    setActiveActionMenuId(null);
                    onNavigateToEdit(r.id);
                  }}
                  className="w-full text-left px-3.5 py-2 text-xs font-sport font-bold uppercase tracking-wider text-neutral-700 hover:bg-neutral-50 flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <Edit3 size={14} className="text-neutral-500" />
                  <span>Ubah Kas</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveActionMenuId(null);
                    handleToggleStatus(r);
                  }}
                  className="w-full text-left px-3.5 py-2 text-xs font-sport font-bold uppercase tracking-wider text-neutral-700 hover:bg-neutral-50 flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <Power size={14} className="text-neutral-500" />
                  <span>{r.is_active ? 'Nonaktifkan' : 'Aktifkan'}</span>
                </button>

                <div className="border-t border-neutral-200 my-1"></div>

                <button
                  type="button"
                  onClick={() => {
                    setActiveActionMenuId(null);
                    setDeletingAccount(r);
                  }}
                  className="w-full text-left px-3.5 py-2 text-xs font-sport font-bold uppercase tracking-wider text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <Trash2 size={14} className="text-rose-600" />
                  <span>Hapus Kas</span>
                </button>
              </div>
            )}
          </div>
        );
      }
    }
  ];

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* 1. Header Kartu Modul Kanonis */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-none border border-neutral-300 shadow-2xs">
        <div className="min-w-0 flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-none bg-neutral-950 text-amber-400 flex items-center justify-center font-black shrink-0">
            <Coins size={22} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-neutral-950 font-sport tracking-tight uppercase leading-tight">
              Master Kas Toko
            </h1>
            <p className="text-xs text-neutral-600 mt-0.5">
              Kelola kas kecil, kasir, brankas tunai toko &amp; pemetaan Bagan Akun (COA 1100)
            </p>
          </div>
        </div>

        {/* Header Icon-Only Actions: [Tambah primary] [Filter secondary + badge] */}
        <div className="flex items-center gap-2">
          <IconButton
            icon={Plus}
            onClick={onNavigateToCreate}
            title="Tambah Akun Kas Baru"
            variant="primary"
          />
          <div className="relative">
            <IconButton
              icon={SlidersHorizontal}
              onClick={() => setIsFilterDrawerOpen(true)}
              title="Buka Filter Kas"
              variant="secondary"
            />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 text-neutral-950 text-[10px] font-mono font-black flex items-center justify-center rounded-none shadow-xs pointer-events-none">
                {activeFilterCount}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 2. Grid KPI Metrik Kas Toko */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4">
        {/* KPI 1: Total Saldo Kas */}
        <div className="bg-white p-4 rounded-none border border-neutral-300 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-1.5">
            <span className="text-xs font-sport font-black uppercase tracking-wider">Total Saldo Kas</span>
            <Wallet size={16} className="text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-black font-sport text-neutral-950">
              {formatRupiah(summary?.total_balance || 0)}
            </span>
          </div>
          <div className="mt-2 text-[11px] border-t border-neutral-100 pt-1.5 text-neutral-500">
            Konsolidasi seluruh pos kas
          </div>
        </div>

        {/* KPI 2: Total Akun */}
        <div className="bg-white p-4 rounded-none border border-neutral-300 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-1.5">
            <span className="text-xs font-sport font-black uppercase tracking-wider">Total Akun</span>
            <Coins size={16} className="text-neutral-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black font-sport text-neutral-950">
              {summary?.total_count || totalCount || 0}
            </span>
            <span className="text-[11px] font-mono font-bold text-neutral-400">POS</span>
          </div>
          <div className="mt-2 text-[11px] border-t border-neutral-100 pt-1.5 text-neutral-500">
            Terdaftar di sistem
          </div>
        </div>

        {/* KPI 3: Akun Aktif */}
        <div className="bg-white p-4 rounded-none border border-neutral-300 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-1.5">
            <span className="text-xs font-sport font-black uppercase tracking-wider">Akun Aktif</span>
            <CheckCircle2 size={16} className="text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black font-sport text-emerald-700">
              {summary?.active_count ?? 0}
            </span>
            <span className="text-[11px] font-mono font-bold text-neutral-400">SIAP PAKAI</span>
          </div>
          <div className="mt-2 text-[11px] border-t border-neutral-100 pt-1.5 text-neutral-500">
            Dapat digunakan bertransaksi
          </div>
        </div>

        {/* KPI 4: Akun Nonaktif */}
        <div className="bg-white p-4 rounded-none border border-neutral-300 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-1.5">
            <span className="text-xs font-sport font-black uppercase tracking-wider">Akun Nonaktif</span>
            <XCircle size={16} className="text-neutral-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black font-sport text-neutral-600">
              {summary?.inactive_count ?? 0}
            </span>
            <span className="text-[11px] font-mono font-bold text-neutral-400">DIJEDA</span>
          </div>
          <div className="mt-2 text-[11px] border-t border-neutral-100 pt-1.5 text-neutral-500">
            Pos kasir tidak beroperasi
          </div>
        </div>
      </div>

      {/* 3. ServerSideTable (Langsung tanpa extra toolbar) */}
      <ServerSideTable
        data={accounts}
        columns={columns}
        totalCount={totalCount}
        currentPage={page}
        perPage={limit}
        sortBy={sortBy}
        sortDirection={sortDirection}
        isLoading={isLoading}
        selectable={true}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        onPageChange={setPage}
        onPerPageChange={setLimit}
        onSortChange={(key, dir) => setSort(key, dir)}
        emptyMessage="Belum ada akun kas terdaftar."
      />

      {/* 4. Filter Drawer Sisi Kanan */}
      <CashAccountFilterDrawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        activeFilterCount={activeFilterCount}
        searchQuery={filters.searchQuery || ''}
        onSearchQueryChange={(val) => setFilter('searchQuery', val)}
        statusFilter={filters.statusFilter || 'all'}
        onStatusFilterChange={(val) => setFilter('statusFilter', val)}
        coaFilter={filters.coaFilter || 'all'}
        onCoaFilterChange={(val) => setFilter('coaFilter', val)}
        coaOptions={coaOptions}
        onResetFilters={resetFilters}
      />

      {/* 5. Modal Konfirmasi Hapus Akun */}
      <ConfirmationModal
        isOpen={Boolean(deletingAccount)}
        onClose={() => setDeletingAccount(null)}
        onConfirm={handleConfirmDelete}
        title="Hapus Akun Kas Toko"
        subtitle="Tindakan ini tidak dapat dibatalkan jika akun berhasil dihapus."
        message={`Apakah Anda yakin ingin menghapus akun kas "${deletingAccount?.account_name}"?`}
        confirmText="Hapus Akun Kas"
        variant="danger"
        isLoading={isSubmitting}
      />
    </div>
  );
}
