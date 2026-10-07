import React, { useState, useEffect, useMemo } from 'react';
import { 
  BookOpen, 
  Plus, 
  SlidersHorizontal,
  MoreVertical, 
  Edit3, 
  Trash2, 
  Power,
  Wallet,
  CheckCircle2,
  XCircle,
  CreditCard,
  TrendingUp,
  ShieldCheck
} from 'lucide-react';
import IconButton from './atoms/IconButton';
import ServerSideTable from './ServerSideTable';
import CoaFilterDrawer from './organisms/CoaFilterDrawer';
import ConfirmationModal from './ConfirmationModal';
import { coaService } from '../services/coaService';
import { useCoaTableStore } from '../stores/useCoaTableStore';

export default function ChartOfAccountsPage({
  onShowToast = () => {},
  onNavigateToCreate = () => {},
  onNavigateToEdit = () => {},
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
  } = useCoaTableStore();

  const [selectedIds, setSelectedIds] = useState([]);
  const [activeActionMenuId, setActiveActionMenuId] = useState(null);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
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
    if (filters.typeFilter && filters.typeFilter !== 'all') count++;
    if (filters.statusFilter && filters.statusFilter !== 'all') count++;
    return count;
  }, [filters]);

  // Handler Hapus Akun
  const handleConfirmDelete = async () => {
    if (!deletingAccount) return;
    setIsSubmitting(true);
    try {
      await coaService.deleteAccount(deletingAccount.id);
      onShowToast({
        type: 'success',
        message: `Akun ${deletingAccount.account_code} - ${deletingAccount.account_name} berhasil dihapus.`,
      });
      setDeletingAccount(null);
      fetchData();
    } catch (err) {
      onShowToast({
        type: 'error',
        message: err.message || 'Gagal menghapus akun COA.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler Toggle Status Aktif
  const handleToggleStatus = async (account) => {
    try {
      const res = await coaService.toggleAccountStatus(account.id);
      onShowToast({
        type: 'success',
        message: res.message || `Status akun ${account.account_code} berhasil diperbarui.`,
      });
      fetchData();
    } catch (err) {
      onShowToast({
        type: 'error',
        message: err.message || 'Gagal mengubah status akun.',
      });
    }
  };

  // Badge tipe akun
  const renderTypeBadge = (type) => {
    const badges = {
      asset: { label: 'ASET (HARTA)', bg: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
      liability: { label: 'LIABILITAS (HUTANG)', bg: 'bg-rose-50 text-rose-800 border-rose-200' },
      equity: { label: 'EKUITAS (MODAL)', bg: 'bg-amber-50 text-amber-800 border-amber-200' },
      revenue: { label: 'PENDAPATAN', bg: 'bg-blue-50 text-blue-800 border-blue-200' },
      expense: { label: 'BEBAN & BIAYA', bg: 'bg-purple-50 text-purple-800 border-purple-200' },
    };
    const b = badges[type] || { label: type?.toUpperCase() || '-', bg: 'bg-neutral-100 text-neutral-800 border-neutral-300' };
    return (
      <span className={`inline-block px-2 py-0.5 text-[10px] font-sport font-black uppercase tracking-wider border rounded-none ${b.bg}`}>
        {b.label}
      </span>
    );
  };

  // Kolom-kolom ServerSideTable
  const columns = [
    {
      key: 'account_code',
      title: 'Kode Akun',
      sortable: true,
      className: 'w-36',
      render: (val, row) => (
        <div className="flex items-center gap-1.5">
          <span className="font-mono font-bold text-neutral-950 text-xs sm:text-sm">
            {val || row?.account_code || '-'}
          </span>
          {row?.is_system && (
            <span title="Akun Inti Sistem (Terkunci)">
              <ShieldCheck size={14} className="text-amber-500 shrink-0" />
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'account_name',
      title: 'Nama Akun Bagan',
      sortable: true,
      render: (val, row) => (
        <div>
          <span className="font-black text-xs sm:text-sm text-neutral-900 block">
            {val || row?.account_name || '-'}
          </span>
          {row?.description && (
            <span className="text-[11px] text-neutral-500 line-clamp-1 mt-0.5">
              {row.description}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'account_type',
      title: 'Klasifikasi Akun',
      sortable: true,
      className: 'w-44',
      render: (val, row) => renderTypeBadge(val || row?.account_type),
    },
    {
      key: 'ledger_entries_count',
      title: 'Pencatatan Jurnal',
      className: 'w-36 text-center',
      render: (val, row) => {
        const count = row?.ledger_entries_count ?? 0;
        return (
          <span className="font-mono text-xs font-bold text-neutral-700">
            {count} Baris
          </span>
        );
      },
    },
    {
      key: 'is_active',
      title: 'Status',
      sortable: true,
      className: 'w-28 text-center',
      render: (val, row) => {
        const isActive = Boolean(row?.is_active ?? val);
        return (
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-sport font-black uppercase tracking-wider rounded-none ${
            isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-neutral-100 text-neutral-600 border border-neutral-300'
          }`}>
            {isActive ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
            <span>{isActive ? 'Aktif' : 'Nonaktif'}</span>
          </span>
        );
      },
    },
    {
      key: 'actions',
      title: 'Aksi',
      className: 'w-16 text-right',
      render: (_, row) => {
        if (!row) return null;
        const isMenuOpen = activeActionMenuId === row.id;

        return (
          <div className="relative inline-block text-left" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setActiveActionMenuId(isMenuOpen ? null : row.id)}
              className="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-none transition-colors cursor-pointer"
              title="Menu Aksi"
            >
              <MoreVertical size={16} />
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-neutral-300 shadow-lg rounded-none z-30 py-1 animate-in fade-in zoom-in-95 duration-100 text-left">
                {/* Ubah Akun */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveActionMenuId(null);
                    onNavigateToEdit(row.id);
                  }}
                  className="w-full px-3 py-2 text-xs text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <Edit3 size={14} className="text-neutral-500" />
                  <span>Ubah / Edit</span>
                </button>

                {/* Toggle Aktif */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveActionMenuId(null);
                    handleToggleStatus(row);
                  }}
                  className="w-full px-3 py-2 text-xs text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <Power size={14} className="text-neutral-500" />
                  <span>{row.is_active ? 'Nonaktifkan' : 'Aktifkan'}</span>
                </button>

                {/* Hapus (hanya jika bukan akun sistem) */}
                {!row.is_system && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveActionMenuId(null);
                      setDeletingAccount(row);
                    }}
                    className="w-full px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700 flex items-center gap-2 cursor-pointer transition-colors border-t border-neutral-100"
                  >
                    <Trash2 size={14} />
                    <span>Hapus Akun</span>
                  </button>
                )}
              </div>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Kartu Header Halaman */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-none border border-neutral-300 shadow-2xs">
        <div className="min-w-0">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-none bg-neutral-950 text-amber-400 flex items-center justify-center font-black shrink-0">
              <BookOpen size={22} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-neutral-950 font-sport tracking-tight uppercase leading-tight">
                Master Chart of Accounts (COA)
              </h1>
              <p className="text-xs text-neutral-600 mt-0.5">
                Bagan akun standar akuntansi Tusko untuk pencatatan otomatis jurnal &amp; buku besar
              </p>
            </div>
          </div>
        </div>

        {/* Kontrol Header: Tambah (Primary) + Filter (Secondary) */}
        <div className="flex items-center gap-2 shrink-0 self-end xl:self-auto">
          <IconButton
            variant="primary"
            icon={Plus}
            onClick={onNavigateToCreate}
            tooltip="Tambah Akun COA Baru"
            ariaLabel="Tambah Akun COA"
          />
          <IconButton
            variant="secondary"
            icon={SlidersHorizontal}
            onClick={() => setIsFilterDrawerOpen(true)}
            tooltip="Buka Filter Akun COA"
            ariaLabel="Filter Akun COA"
            badge={activeFilterCount > 0 ? activeFilterCount : null}
          />
        </div>
      </div>

      {/* Grid KPI Metrik Akun */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4">
        {/* KPI 1: Total Bagan Akun */}
        <div className="bg-white p-4 rounded-none border border-neutral-300 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-1.5">
            <span className="text-xs font-sport font-black uppercase tracking-wider">
              Total Bagan Akun
            </span>
            <BookOpen size={16} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black font-sport text-neutral-950">
              {summary?.total_count ?? totalCount}
            </span>
            <span className="text-[11px] font-mono font-bold text-neutral-400">
              AKUN
            </span>
          </div>
          <div className="mt-2 text-[11px] border-t border-neutral-100 pt-1.5 text-neutral-500 font-medium">
            <strong className="text-emerald-700 font-bold">{summary?.active_count ?? 0} Aktif</strong> siap menjurnal
          </div>
        </div>

        {/* KPI 2: Akun Aset */}
        <div className="bg-white p-4 rounded-none border border-neutral-300 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-1.5">
            <span className="text-xs font-sport font-black uppercase tracking-wider">
              Akun Aset &amp; Harta
            </span>
            <Wallet size={16} className="text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black font-sport text-neutral-950">
              {summary?.asset_count ?? 0}
            </span>
            <span className="text-[11px] font-mono font-bold text-neutral-400">
              AKUN
            </span>
          </div>
          <div className="mt-2 text-[11px] border-t border-neutral-100 pt-1.5 text-neutral-500 font-medium">
            Kas, Bank BCA, Kliring, Persediaan
          </div>
        </div>

        {/* KPI 3: Akun Kewajiban & Ekuitas */}
        <div className="bg-white p-4 rounded-none border border-neutral-300 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-1.5">
            <span className="text-xs font-sport font-black uppercase tracking-wider">
              Liabilitas &amp; Modal
            </span>
            <CreditCard size={16} className="text-amber-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black font-sport text-neutral-950">
              {(summary?.liability_count ?? 0) + (summary?.equity_count ?? 0)}
            </span>
            <span className="text-[11px] font-mono font-bold text-neutral-400">
              AKUN
            </span>
          </div>
          <div className="mt-2 text-[11px] border-t border-neutral-100 pt-1.5 text-neutral-500 font-medium">
            Hutang Vendor &amp; Modal Pemilik
          </div>
        </div>

        {/* KPI 4: Akun Pendapatan & Beban */}
        <div className="bg-white p-4 rounded-none border border-neutral-300 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-1.5">
            <span className="text-xs font-sport font-black uppercase tracking-wider">
              Pendapatan &amp; Beban
            </span>
            <TrendingUp size={16} className="text-blue-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black font-sport text-neutral-950">
              {(summary?.revenue_count ?? 0) + (summary?.expense_count ?? 0)}
            </span>
            <span className="text-[11px] font-mono font-bold text-neutral-400">
              AKUN
            </span>
          </div>
          <div className="mt-2 text-[11px] border-t border-neutral-100 pt-1.5 text-neutral-500 font-medium">
            Penjualan, HPP, &amp; Operasional
          </div>
        </div>
      </div>

      {/* Tabel Data Tunggal ServerSideTable */}
      <ServerSideTable
        data={accounts}
        columns={columns}
        isLoading={isLoading}
        selectable={true}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        currentPage={page}
        totalItems={totalCount}
        itemsPerPage={limit}
        onPageChange={setPage}
        onLimitChange={setLimit}
        sortBy={sortBy}
        sortDirection={sortDirection}
        onSort={(col, dir) => setSort(col, dir)}
        limitOptions={[10, 25, 50, 100]}
        emptyMessage="Tidak ada data akun COA yang cocok dengan filter."
      />

      {/* Laci Filter Kanan */}
      <CoaFilterDrawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        activeFilterCount={activeFilterCount}
        searchQuery={filters.searchQuery}
        onSearchQueryChange={(val) => setFilter('searchQuery', val)}
        typeFilter={filters.typeFilter}
        onTypeFilterChange={(val) => setFilter('typeFilter', val)}
        statusFilter={filters.statusFilter}
        onStatusFilterChange={(val) => setFilter('statusFilter', val)}
        onResetFilters={resetFilters}
      />

      {/* Modal Konfirmasi Hapus */}
      <ConfirmationModal
        isOpen={Boolean(deletingAccount)}
        title="Hapus Akun Chart of Account?"
        message={`Apakah Anda yakin ingin menghapus akun ${deletingAccount?.account_code} - "${deletingAccount?.account_name}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel={isSubmitting ? 'Menghapus...' : 'Ya, Hapus Akun'}
        variant="danger"
        onConfirm={handleConfirmDelete}
        onClose={() => setDeletingAccount(null)}
      />
    </div>
  );
}
