import React, { useState, useEffect, useMemo } from 'react';
import { 
  Building2, 
  Plus, 
  SlidersHorizontal,
  MoreVertical, 
  Edit3, 
  Trash2, 
  Power,
  Landmark,
  CheckCircle2,
  XCircle,
  HelpCircle
} from 'lucide-react';
import IconButton from './atoms/IconButton';
import ServerSideTable from './ServerSideTable';
import BankFilterDrawer from './organisms/BankFilterDrawer';
import ConfirmationModal from './ConfirmationModal';
import { bankService } from '../services/bankService';
import { useBankTableStore } from '../stores/useBankTableStore';

export default function BanksPage({
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
    data: banks,
    total: totalCount,
    summary,
    isLoading,
    setPage,
    setLimit,
    setSort,
    setFilter,
    resetFilters,
    fetchData,
  } = useBankTableStore();

  const [selectedIds, setSelectedIds] = useState([]);
  const [activeActionMenuId, setActiveActionMenuId] = useState(null);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [deletingBank, setDeletingBank] = useState(null);
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
    if (filters.statusFilter && filters.statusFilter !== 'all') count++;
    return count;
  }, [filters]);

  // Handler Hapus Bank
  const handleConfirmDelete = async () => {
    if (!deletingBank) return;
    setIsSubmitting(true);
    try {
      await bankService.deleteBank(deletingBank.id);
      onShowToast({
        type: 'success',
        message: `Master Bank ${deletingBank.name} berhasil dihapus.`,
      });
      setDeletingBank(null);
      fetchData();
    } catch (err) {
      onShowToast({
        type: 'error',
        message: err.message || 'Gagal menghapus master bank.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler Toggle Status Aktif
  const handleToggleStatus = async (bank) => {
    try {
      const res = await bankService.toggleBankStatus(bank.id);
      onShowToast({
        type: 'success',
        message: res.message || `Status bank ${bank.name} berhasil diperbarui.`,
      });
      fetchData();
    } catch (err) {
      onShowToast({
        type: 'error',
        message: err.message || 'Gagal mengubah status bank.',
      });
    }
  };

  // Kolom-kolom ServerSideTable
  const columns = [
    {
      key: 'code',
      title: 'Kode Bank',
      sortable: true,
      className: 'w-36',
      render: (val, row) => (
        <span className="font-mono font-bold text-neutral-950 text-xs sm:text-sm">
          {val || row?.code || '-'}
        </span>
      ),
    },
    {
      key: 'name',
      title: 'Nama Lembaga Bank',
      sortable: true,
      render: (val, row) => (
        <div>
          <span className="font-black text-xs sm:text-sm text-neutral-900 block">
            {val || row?.name || '-'}
          </span>
          {row?.notes && (
            <span className="text-[11px] text-neutral-500 line-clamp-1 mt-0.5">
              {row.notes}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'accounts_count',
      title: 'Rekening Terkait',
      className: 'w-36 text-center',
      render: (val, row) => {
        const count = row?.accounts_count ?? 0;
        return (
          <span className="font-mono text-xs font-bold text-neutral-700">
            {count} Rekening
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
                {/* Ubah Bank */}
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

                {/* Hapus Bank */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveActionMenuId(null);
                    setDeletingBank(row);
                  }}
                  className="w-full px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700 flex items-center gap-2 cursor-pointer transition-colors border-t border-neutral-100"
                >
                  <Trash2 size={14} />
                  <span>Hapus Bank</span>
                </button>
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
              <Building2 size={22} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-neutral-950 font-sport tracking-tight uppercase leading-tight">
                Master Nama Bank
              </h1>
              <p className="text-xs text-neutral-600 mt-0.5">
                Kelola daftar nama dan lembaga perbankan operasional toko yang dinamis
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
            tooltip="Tambah Master Bank Baru"
            ariaLabel="Tambah Bank"
          />
          <IconButton
            variant="secondary"
            icon={SlidersHorizontal}
            onClick={() => setIsFilterDrawerOpen(true)}
            tooltip="Buka Filter Master Bank"
            ariaLabel="Filter Bank"
            badge={activeFilterCount > 0 ? activeFilterCount : null}
          />
        </div>
      </div>

      {/* Grid KPI Metrik */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4">
        {/* KPI 1: Total Bank Terdaftar */}
        <div className="bg-white p-4 rounded-none border border-neutral-300 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-1.5">
            <span className="text-xs font-sport font-black uppercase tracking-wider">
              Total Lembaga Bank
            </span>
            <Building2 size={16} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black font-sport text-neutral-950">
              {summary?.total_count ?? totalCount}
            </span>
            <span className="text-[11px] font-mono font-bold text-neutral-400">
              BANK
            </span>
          </div>
          <div className="mt-2 text-[11px] border-t border-neutral-100 pt-1.5 text-neutral-500 font-medium">
            Tersimpan di master database
          </div>
        </div>

        {/* KPI 2: Bank Aktif */}
        <div className="bg-white p-4 rounded-none border border-neutral-300 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-1.5">
            <span className="text-xs font-sport font-black uppercase tracking-wider">
              Bank Aktif
            </span>
            <CheckCircle2 size={16} className="text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black font-sport text-neutral-950">
              {summary?.active_count ?? 0}
            </span>
            <span className="text-[11px] font-mono font-bold text-neutral-400">
              BANK
            </span>
          </div>
          <div className="mt-2 text-[11px] border-t border-neutral-100 pt-1.5 text-neutral-500 font-medium">
            Siap dipilih di form rekening
          </div>
        </div>

        {/* KPI 3: Bank Nonaktif */}
        <div className="bg-white p-4 rounded-none border border-neutral-300 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-1.5">
            <span className="text-xs font-sport font-black uppercase tracking-wider">
              Bank Nonaktif
            </span>
            <XCircle size={16} className="text-neutral-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black font-sport text-neutral-950">
              {summary?.inactive_count ?? 0}
            </span>
            <span className="text-[11px] font-mono font-bold text-neutral-400">
              BANK
            </span>
          </div>
          <div className="mt-2 text-[11px] border-t border-neutral-100 pt-1.5 text-neutral-500 font-medium">
            Disembunyikan dari dropdown
          </div>
        </div>

        {/* KPI 4: Integrasi Form Rekening */}
        <div className="bg-white p-4 rounded-none border border-neutral-300 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-1.5">
            <span className="text-xs font-sport font-black uppercase tracking-wider">
              Koneksi Server-Side
            </span>
            <Landmark size={16} className="text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-black font-sport text-neutral-950">
              100% DINAMIS
            </span>
          </div>
          <div className="mt-2 text-[11px] border-t border-neutral-100 pt-1.5 text-neutral-500 font-medium">
            Pencarian server-side terhubung
          </div>
        </div>
      </div>

      {/* Tabel Data Tunggal ServerSideTable */}
      <ServerSideTable
        data={banks}
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
        emptyMessage="Tidak ada data bank yang cocok dengan filter."
      />

      {/* Laci Filter Kanan */}
      <BankFilterDrawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        activeFilterCount={activeFilterCount}
        searchQuery={filters.searchQuery}
        onSearchQueryChange={(val) => setFilter('searchQuery', val)}
        statusFilter={filters.statusFilter}
        onStatusFilterChange={(val) => setFilter('statusFilter', val)}
        onResetFilters={resetFilters}
      />

      {/* Modal Konfirmasi Hapus */}
      <ConfirmationModal
        isOpen={Boolean(deletingBank)}
        title="Hapus Master Bank?"
        message={`Apakah Anda yakin ingin menghapus data bank "${deletingBank?.name}" (${deletingBank?.code})? Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel={isSubmitting ? 'Menghapus...' : 'Ya, Hapus Bank'}
        variant="danger"
        onConfirm={handleConfirmDelete}
        onClose={() => setDeletingBank(null)}
      />
    </div>
  );
}
