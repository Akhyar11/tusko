import React, { useState, useEffect, useMemo } from 'react';
import {
  CreditCard,
  Plus,
  SlidersHorizontal,
  MoreVertical,
  Edit3,
  Trash2,
  Power,
  CheckCircle2,
  XCircle,
  Zap,
  HandCoins
} from 'lucide-react';
import IconButton from './atoms/IconButton';
import ServerSideTable from './ServerSideTable';
import PaymentMethodFilterDrawer from './organisms/PaymentMethodFilterDrawer';
import ConfirmationModal from './ConfirmationModal';
import { paymentMethodService } from '../services/paymentMethodService';
import { usePaymentMethodTableStore } from '../stores/usePaymentMethodTableStore';
import { formatRupiah } from '../utils/formatters';

export default function PaymentMethodsPage({
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
    data: methods,
    total: totalCount,
    summary,
    isLoading,
    setPage,
    setLimit,
    setSort,
    setFilter,
    resetFilters,
    fetchData,
  } = usePaymentMethodTableStore();

  const [selectedIds, setSelectedIds] = useState([]);
  const [activeActionMenuId, setActiveActionMenuId] = useState(null);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [deletingMethod, setDeletingMethod] = useState(null);
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

  // Handler Hapus Metode
  const handleConfirmDelete = async () => {
    if (!deletingMethod) return;
    setIsSubmitting(true);
    try {
      await paymentMethodService.deleteMethod(deletingMethod.id);
      onShowToast({
        type: 'success',
        message: `Metode pembayaran ${deletingMethod.name} berhasil dihapus.`,
      });
      setDeletingMethod(null);
      fetchData();
    } catch (err) {
      onShowToast({
        type: 'error',
        message: err.message || 'Gagal menghapus metode pembayaran.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler Toggle Status Aktif
  const handleToggleStatus = async (method) => {
    try {
      const res = await paymentMethodService.toggleMethodStatus(method.id);
      onShowToast({
        type: 'success',
        message: res.message || `Status kanal ${method.name} berhasil diperbarui.`,
      });
      fetchData();
    } catch (err) {
      onShowToast({
        type: 'error',
        message: err.message || 'Gagal mengubah status kanal.',
      });
    }
  };

  const formatFee = (row) => {
    const pct = Number(row?.fee_percent) || 0;
    const fix = Number(row?.fee_fixed) || 0;
    if (pct <= 0 && fix <= 0) return 'Bebas Biaya';
    const parts = [];
    if (pct > 0) parts.push(`${pct}%`);
    if (fix > 0) parts.push(formatRupiah(fix));
    return parts.join(' + ');
  };

  // Kolom-kolom ServerSideTable
  const columns = [
    {
      key: 'code',
      label: 'KODE KANAL',
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
      label: 'NAMA KANAL',
      sortable: true,
      render: (val, row) => (
        <div>
          <span className="font-black text-xs sm:text-sm text-neutral-900 block">
            {val || row?.name || '-'}
          </span>
          {row?.category && (
            <span className="text-[11px] text-neutral-500 line-clamp-1 mt-0.5">
              {row.category}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'type',
      label: 'TIPE',
      sortable: true,
      align: 'center',
      className: 'w-32 text-center',
      render: (val, row) => {
        const type = row?.type ?? val;
        const isMidtrans = type === 'midtrans';
        return (
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-sport font-black uppercase tracking-wider rounded-none border ${
            isMidtrans ? 'bg-amber-50 text-amber-800 border-amber-300' : 'bg-neutral-100 text-neutral-600 border-neutral-300'
          }`}>
            {isMidtrans ? <Zap size={11} /> : <HandCoins size={11} />}
            <span>{isMidtrans ? 'Midtrans' : 'Manual'}</span>
          </span>
        );
      },
    },
    {
      key: 'fee_percent',
      label: 'ADMIN FEE',
      sortable: true,
      align: 'right',
      className: 'w-44 text-right',
      render: (val, row) => (
        <span className="font-mono text-xs font-bold text-neutral-700">
          {formatFee(row)}
        </span>
      ),
    },
    {
      key: 'is_active',
      label: 'STATUS',
      sortable: true,
      align: 'center',
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
      label: 'AKSI',
      align: 'right',
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
                {/* Ubah Metode */}
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

                {/* Hapus Metode */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveActionMenuId(null);
                    setDeletingMethod(row);
                  }}
                  className="w-full px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700 flex items-center gap-2 cursor-pointer transition-colors border-t border-neutral-100"
                >
                  <Trash2 size={14} />
                  <span>Hapus Kanal</span>
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
              <CreditCard size={22} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-neutral-950 font-sport tracking-tight uppercase leading-tight">
                Master Metode Pembayaran
              </h1>
              <p className="text-xs text-neutral-600 mt-0.5">
                Kelola kanal pembayaran Midtrans &amp; admin fee per metode
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
            tooltip="Tambah Metode Pembayaran Baru"
            ariaLabel="Tambah Metode"
          />
          <IconButton
            variant="secondary"
            icon={SlidersHorizontal}
            onClick={() => setIsFilterDrawerOpen(true)}
            tooltip="Buka Filter Metode Pembayaran"
            ariaLabel="Filter Metode"
            badge={activeFilterCount > 0 ? activeFilterCount : null}
          />
        </div>
      </div>

      {/* Grid KPI Metrik */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4">
        {/* KPI 1: Total Kanal */}
        <div className="bg-white p-4 rounded-none border border-neutral-300 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-1.5">
            <span className="text-xs font-sport font-black uppercase tracking-wider">
              Total Kanal
            </span>
            <CreditCard size={16} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black font-sport text-neutral-950">
              {summary?.total_count ?? totalCount}
            </span>
            <span className="text-[11px] font-mono font-bold text-neutral-400">
              KANAL
            </span>
          </div>
          <div className="mt-2 text-[11px] border-t border-neutral-100 pt-1.5 text-neutral-500 font-medium">
            Tersimpan di master database
          </div>
        </div>

        {/* KPI 2: Kanal Aktif */}
        <div className="bg-white p-4 rounded-none border border-neutral-300 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-1.5">
            <span className="text-xs font-sport font-black uppercase tracking-wider">
              Kanal Aktif
            </span>
            <CheckCircle2 size={16} className="text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black font-sport text-neutral-950">
              {summary?.active_count ?? 0}
            </span>
            <span className="text-[11px] font-mono font-bold text-neutral-400">
              KANAL
            </span>
          </div>
          <div className="mt-2 text-[11px] border-t border-neutral-100 pt-1.5 text-neutral-500 font-medium">
            Tampil di halaman checkout
          </div>
        </div>

        {/* KPI 3: Kanal Midtrans */}
        <div className="bg-white p-4 rounded-none border border-neutral-300 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-1.5">
            <span className="text-xs font-sport font-black uppercase tracking-wider">
              Midtrans
            </span>
            <Zap size={16} className="text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black font-sport text-neutral-950">
              {summary?.midtrans_count ?? 0}
            </span>
            <span className="text-[11px] font-mono font-bold text-neutral-400">
              KANAL
            </span>
          </div>
          <div className="mt-2 text-[11px] border-t border-neutral-100 pt-1.5 text-neutral-500 font-medium">
            Verifikasi pembayaran otomatis
          </div>
        </div>

        {/* KPI 4: Kanal Manual */}
        <div className="bg-white p-4 rounded-none border border-neutral-300 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-1.5">
            <span className="text-xs font-sport font-black uppercase tracking-wider">
              Manual
            </span>
            <HandCoins size={16} className="text-neutral-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black font-sport text-neutral-950">
              {summary?.manual_count ?? 0}
            </span>
            <span className="text-[11px] font-mono font-bold text-neutral-400">
              KANAL
            </span>
          </div>
          <div className="mt-2 text-[11px] border-t border-neutral-100 pt-1.5 text-neutral-500 font-medium">
            Verifikasi manual oleh penjual
          </div>
        </div>
      </div>

      {/* Tabel Data Tunggal ServerSideTable */}
      <ServerSideTable
        data={methods}
        columns={columns}
        total={totalCount}
        page={page}
        limit={limit}
        sortBy={sortBy}
        sortDirection={sortDirection}
        isLoading={isLoading}
        selectable={true}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        onPageChange={setPage}
        onLimitChange={setLimit}
        onSortChange={({ sortBy: sb, sortDirection: sd }) => setSort(sb, sd)}
        limitOptions={[10, 25, 50, 100]}
        emptyMessage="Tidak ada kanal pembayaran yang cocok dengan filter."
      />

      {/* Laci Filter Kanan */}
      <PaymentMethodFilterDrawer
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
        isOpen={Boolean(deletingMethod)}
        title="Hapus Metode Pembayaran?"
        message={`Apakah Anda yakin ingin menghapus kanal "${deletingMethod?.name}" (${deletingMethod?.code})? Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel={isSubmitting ? 'Menghapus...' : 'Ya, Hapus Kanal'}
        variant="danger"
        onConfirm={handleConfirmDelete}
        onClose={() => setDeletingMethod(null)}
      />
    </div>
  );
}
