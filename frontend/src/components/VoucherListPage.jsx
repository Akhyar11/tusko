import React, { useState, useEffect, useMemo } from 'react';
import {
  TicketPercent,
  Plus,
  SlidersHorizontal,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Layers,
  Pencil,
  CalendarDays,
} from 'lucide-react';
import IconButton from './atoms/IconButton';
import ServerSideTable from './ServerSideTable';
import VoucherFilterDrawer from './organisms/VoucherFilterDrawer';
import ConfirmationModal from './ConfirmationModal';
import RowActionMenu from './molecules/RowActionMenu';
import { voucherService } from '../services/voucherService';
import { useVoucherTableStore } from '../stores/useVoucherTableStore';
import { formatRupiah } from '../utils/formatters';

function formatDate(value) {
  if (!value) return 'Tanpa batas';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

/**
 * VoucherListPage — daftar Voucher & Promo Admin (T15.3).
 * Tabel tunggal server-side + FilterDrawer kanan; aksi baris via MoreVertical dropdown (portal).
 */
export default function VoucherListPage({
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
    data: tableVouchers,
    total: totalVouchers,
    isLoading,
    setPage,
    setLimit,
    setSort,
    setFilter,
    resetFilters,
    fetchData,
  } = useVoucherTableStore();

  const [selectedVoucherIds, setSelectedVoucherIds] = useState([]);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingVoucher, setDeletingVoucher] = useState(null);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);

  useEffect(() => {
    fetchData().catch((err) => {
      onShowToast('Gagal memuat data voucher: ' + err.message);
    });
  }, []);

  const metrics = useMemo(() => {
    const list = tableVouchers;
    const active = list.filter((v) => Boolean(v.is_active)).length;
    const used = list.reduce((acc, v) => acc + (Number(v.used_count) || 0), 0);

    return {
      total: totalVouchers,
      active,
      inactive: Math.max(0, list.length - active),
      used,
    };
  }, [tableVouchers, totalVouchers]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.codeSearchQuery?.trim()) count++;
    if (filters.titleSearchQuery?.trim()) count++;
    if (filters.discountTypeFilter && filters.discountTypeFilter !== 'all') count++;
    if (filters.statusFilter && filters.statusFilter !== 'all') count++;
    if (filters.discountValueMin !== '' || filters.discountValueMax !== '') count++;
    if (filters.minPurchaseMin !== '' || filters.minPurchaseMax !== '') count++;
    if (filters.quotaMin !== '' || filters.quotaMax !== '') count++;
    if (filters.expiresFrom !== '' || filters.expiresTo !== '') count++;
    return count;
  }, [filters]);

  const refresh = () => {
    fetchData().catch((err) => onShowToast('Gagal memuat data voucher: ' + err.message));
  };

  const handleToggleStatus = async (voucher) => {
    try {
      await voucherService.toggleStatus(voucher);
      refresh();
      onShowToast(`Voucher "${voucher.code}" berhasil ${voucher.is_active ? 'dinonaktifkan' : 'diaktifkan'}.`);
    } catch (err) {
      onShowToast('Gagal mengubah status voucher: ' + err.message);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingVoucher) return;
    setIsSubmitting(true);
    try {
      await voucherService.deleteVoucher(deletingVoucher.id);
      const code = deletingVoucher.code;
      setDeletingVoucher(null);
      refresh();
      onShowToast(`Voucher "${code}" berhasil dihapus.`);
    } catch (err) {
      onShowToast('Gagal menghapus voucher: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmBulkDelete = async () => {
    setIsSubmitting(true);
    try {
      for (const id of selectedVoucherIds) {
        await voucherService.deleteVoucher(id);
      }
      const count = selectedVoucherIds.length;
      setSelectedVoucherIds([]);
      setIsBulkDeleteOpen(false);
      refresh();
      onShowToast(`${count} voucher berhasil dihapus.`);
    } catch (err) {
      onShowToast('Gagal menghapus voucher: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectRow = (id) => {
    setSelectedVoucherIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleSelectAll = () => {
    if (selectedVoucherIds.length === tableVouchers.length && tableVouchers.length > 0) {
      setSelectedVoucherIds([]);
    } else {
      setSelectedVoucherIds(tableVouchers.map((v) => v.id));
    }
  };

  const columns = useMemo(() => [
    {
      key: 'code',
      label: 'KODE VOUCHER',
      sortable: true,
      width: 'w-40 min-w-[150px]',
      render: (val, row) => {
        const r = row || {};
        const code = (typeof val === 'string' ? val : null) || r.code || '-';
        return (
          <span className="font-mono font-bold text-xs text-neutral-950 bg-neutral-100 px-2 py-0.5 border border-neutral-300 rounded-none whitespace-nowrap inline-block">
            {code}
          </span>
        );
      },
    },
    {
      key: 'title',
      label: 'JUDUL & BADGE',
      sortable: true,
      width: 'min-w-[240px]',
      render: (val, row) => {
        const r = row || {};
        return (
          <div className="space-y-0.5">
            <div className="font-sport font-black text-sm text-neutral-950 uppercase tracking-tight leading-snug">
              {(typeof val === 'string' ? val : null) || r.title || '-'}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="px-1.5 py-0.5 text-[10px] font-sport font-bold uppercase tracking-wider bg-amber-50 border border-amber-300 text-amber-800 rounded-none">
                {r.badge || 'PROMO'}
              </span>
              {r.description && (
                <span className="text-[11px] text-neutral-500 truncate max-w-[200px]" title={r.description}>
                  {r.description}
                </span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: 'discount_value',
      label: 'NILAI DISKON',
      sortable: true,
      width: 'min-w-[150px]',
      render: (val, row) => {
        const r = row || {};
        const isPercent = r.discount_type === 'percent';
        return (
          <div className="text-xs whitespace-nowrap">
            <div className="font-mono font-black text-neutral-950 text-sm">
              {isPercent ? `${Number(r.discount_value || 0)}%` : formatRupiah(Number(r.discount_value || 0))}
            </div>
            {isPercent && r.max_discount ? (
              <div className="text-[11px] text-neutral-500">Maks {formatRupiah(Number(r.max_discount))}</div>
            ) : null}
          </div>
        );
      },
    },
    {
      key: 'min_purchase',
      label: 'MIN BELANJA',
      sortable: true,
      width: 'min-w-[140px]',
      render: (val, row) => {
        const r = row || {};
        const min = Number(r.min_purchase || 0);
        return (
          <span className="font-mono text-xs text-neutral-800 whitespace-nowrap">
            {min > 0 ? formatRupiah(min) : 'Tanpa minimum'}
          </span>
        );
      },
    },
    {
      key: 'quota',
      label: 'KUOTA & TERPAKAI',
      sortable: true,
      width: 'min-w-[130px]',
      render: (val, row) => {
        const r = row || {};
        const used = Number(r.used_count || 0);
        const quota = r.quota === null || r.quota === undefined ? null : Number(r.quota);
        return (
          <span className="font-mono text-xs text-neutral-800 whitespace-nowrap">
            <strong className="text-neutral-950">{used}</strong> / {quota === null ? '∞' : quota}
          </span>
        );
      },
    },
    {
      key: 'expires_at',
      label: 'MASA BERLAKU',
      sortable: true,
      width: 'min-w-[150px]',
      render: (val, row) => {
        const r = row || {};
        return (
          <span className="text-xs text-neutral-700 whitespace-nowrap flex items-center gap-1.5">
            <CalendarDays size={12} className="text-neutral-400 shrink-0" />
            {formatDate(r.expires_at)}
          </span>
        );
      },
    },
    {
      key: 'is_active',
      label: 'STATUS',
      sortable: true,
      align: 'center',
      width: 'w-28 min-w-[110px]',
      render: (val, row) => {
        const r = row || {};
        const isActive = val !== undefined && typeof val === 'boolean' ? val : Boolean(r.is_active);
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] font-sport font-black uppercase tracking-wider border rounded-none whitespace-nowrap ${
              isActive
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-neutral-100 text-neutral-600 border-neutral-300'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-none shrink-0 ${isActive ? 'bg-emerald-500' : 'bg-neutral-400'}`} />
            <span>{isActive ? 'Aktif' : 'Nonaktif'}</span>
          </span>
        );
      },
    },
    {
      key: 'actions',
      label: 'AKSI',
      align: 'center',
      width: 'w-16 min-w-[64px]',
      render: (val, row) => {
        const r = row || {};
        return (
          <RowActionMenu buttonTitle="Menu Aksi Voucher">
            {(close) => (
              <>
                <button
                  type="button"
                  onClick={() => {
                    close();
                    onNavigateToEdit(r);
                  }}
                  className="w-full px-3.5 py-2 text-xs font-sport font-bold uppercase tracking-wider text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Pencil size={13} className="text-neutral-500" />
                  <span>Edit Voucher</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    close();
                    handleToggleStatus(r);
                  }}
                  className="w-full px-3.5 py-2 text-xs font-sport font-bold uppercase tracking-wider text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  {r.is_active ? (
                    <>
                      <XCircle size={13} className="text-neutral-500" />
                      <span>Nonaktifkan</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={13} className="text-neutral-500" />
                      <span>Aktifkan</span>
                    </>
                  )}
                </button>

                <div className="border-t border-neutral-200 my-1" />

                <button
                  type="button"
                  onClick={() => {
                    close();
                    setDeletingVoucher(r);
                  }}
                  className="w-full px-3.5 py-2 text-xs font-sport font-bold uppercase tracking-wider text-rose-700 hover:bg-rose-50 hover:text-rose-800 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Trash2 size={13} className="text-rose-600" />
                  <span>Hapus Voucher</span>
                </button>
              </>
            )}
          </RowActionMenu>
        );
      },
    },
  ], [onNavigateToEdit]);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Header Card */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-none border border-neutral-300 shadow-2xs">
        <div className="min-w-0">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-none bg-neutral-950 text-amber-400 flex items-center justify-center font-black shrink-0">
              <TicketPercent size={22} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-neutral-950 font-sport tracking-tight uppercase leading-tight">
                Voucher &amp; Promo Toko
              </h1>
              <p className="text-xs text-neutral-600 mt-0.5">
                Kelola kupon diskon, kuota pemakaian, cakupan produk, dan masa berlaku promo storefront.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start xl:self-auto">
          <IconButton
            icon={Plus}
            onClick={onNavigateToCreate}
            title="Tambah Voucher Baru"
            variant="primary"
          />

          <div className="relative">
            <IconButton
              icon={SlidersHorizontal}
              onClick={() => setIsFilterDrawerOpen(true)}
              title="Buka Filter & Pencarian"
              variant={activeFilterCount > 0 ? 'primary' : 'outline'}
            />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 text-white font-mono font-black text-[9px] flex items-center justify-center rounded-none shadow-xs pointer-events-none">
                {activeFilterCount}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4">
        <div className="bg-white p-4 rounded-none border border-neutral-300 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs font-sport font-bold uppercase tracking-wider">
            <span>Total Voucher</span>
            <TicketPercent size={16} className="text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-neutral-950 mt-1.5">{metrics.total}</div>
          <div className="text-[11px] text-neutral-500 mt-1">Terdaftar di katalog promo</div>
        </div>

        <div className="bg-white p-4 rounded-none border border-neutral-300 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs font-sport font-bold uppercase tracking-wider">
            <span>Voucher Aktif</span>
            <CheckCircle2 size={16} className="text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-700 mt-1.5">{metrics.active}</div>
          <div className="text-[11px] text-neutral-500 mt-1">Sedang tayang di halaman ini</div>
        </div>

        <div className="bg-white p-4 rounded-none border border-neutral-300 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs font-sport font-bold uppercase tracking-wider">
            <span>Voucher Nonaktif</span>
            <AlertCircle size={16} className="text-neutral-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-neutral-700 mt-1.5">{metrics.inactive}</div>
          <div className="text-[11px] text-neutral-500 mt-1">Ditangguhkan sementara</div>
        </div>

        <div className="bg-white p-4 rounded-none border border-neutral-300 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs font-sport font-bold uppercase tracking-wider">
            <span>Total Pemakaian</span>
            <Layers size={16} className="text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-neutral-950 mt-1.5">{metrics.used}</div>
          <div className="text-[11px] text-neutral-500 mt-1">Kupon terpakai (halaman ini)</div>
        </div>
      </div>

      {/* ServerSideTable (single table view only) */}
      <ServerSideTable
        columns={columns}
        data={tableVouchers}
        total={totalVouchers}
        page={page}
        limit={limit}
        limitOptions={[10, 25, 50, 100]}
        onPageChange={(p) => setPage(p)}
        onLimitChange={(newLimit) => {
          setLimit(newLimit);
          setPage(1);
        }}
        sortBy={sortBy}
        sortDirection={sortDirection}
        onSortChange={({ sortBy: newSortBy, sortDirection: newDir }) => setSort(newSortBy, newDir)}
        isLoading={isLoading}
        selectable={true}
        selectedIds={selectedVoucherIds}
        onSelectRow={handleSelectRow}
        onSelectAll={handleSelectAll}
        idKey="id"
        bulkActions={
          selectedVoucherIds.length > 0 ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-600 font-medium">
                <strong className="font-mono text-neutral-900">{selectedVoucherIds.length}</strong> voucher dipilih
              </span>
              <button
                type="button"
                onClick={() => setIsBulkDeleteOpen(true)}
                className="px-2.5 py-1 bg-rose-700 hover:bg-rose-600 text-white font-sport font-bold text-[11px] uppercase rounded-none cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 size={12} />
                <span>Hapus Terpilih</span>
              </button>
            </div>
          ) : null
        }
        emptyMessage="Belum Ada Voucher Ditemukan"
        emptyDescription="Sesuaikan kata kunci pencarian atau tambahkan voucher promo baru."
      />

      {/* Filter Drawer */}
      <VoucherFilterDrawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        activeFilterCount={activeFilterCount}
        codeSearchQuery={filters.codeSearchQuery || ''}
        onCodeSearchQueryChange={(val) => setFilter('codeSearchQuery', val)}
        titleSearchQuery={filters.titleSearchQuery || ''}
        onTitleSearchQueryChange={(val) => setFilter('titleSearchQuery', val)}
        discountTypeFilter={filters.discountTypeFilter || 'all'}
        onDiscountTypeFilterChange={(val) => setFilter('discountTypeFilter', val)}
        statusFilter={filters.statusFilter || 'all'}
        onStatusFilterChange={(val) => setFilter('statusFilter', val)}
        discountValueMin={filters.discountValueMin || ''}
        onDiscountValueMinChange={(val) => setFilter('discountValueMin', val)}
        discountValueMax={filters.discountValueMax || ''}
        onDiscountValueMaxChange={(val) => setFilter('discountValueMax', val)}
        minPurchaseMin={filters.minPurchaseMin || ''}
        onMinPurchaseMinChange={(val) => setFilter('minPurchaseMin', val)}
        minPurchaseMax={filters.minPurchaseMax || ''}
        onMinPurchaseMaxChange={(val) => setFilter('minPurchaseMax', val)}
        quotaMin={filters.quotaMin || ''}
        onQuotaMinChange={(val) => setFilter('quotaMin', val)}
        quotaMax={filters.quotaMax || ''}
        onQuotaMaxChange={(val) => setFilter('quotaMax', val)}
        expiresFrom={filters.expiresFrom || ''}
        onExpiresFromChange={(val) => setFilter('expiresFrom', val)}
        expiresTo={filters.expiresTo || ''}
        onExpiresToChange={(val) => setFilter('expiresTo', val)}
        onResetFilters={resetFilters}
      />

      {/* Delete Confirmation (single) */}
      <ConfirmationModal
        isOpen={!!deletingVoucher}
        onClose={() => setDeletingVoucher(null)}
        onConfirm={handleConfirmDelete}
        title="Hapus Voucher"
        subtitle="Tindakan ini tidak dapat dibatalkan."
        message={`Apakah Anda yakin ingin menghapus voucher "${deletingVoucher?.code}"? Riwayat pemakaian kupon terkait akan ikut terhapus.`}
        confirmText="Hapus Voucher"
        variant="danger"
        isLoading={isSubmitting}
      >
        {deletingVoucher && (
          <div className="bg-neutral-50 p-3 rounded-none border border-neutral-200 text-xs font-sport space-y-1">
            <div className="flex justify-between">
              <span className="text-neutral-500">Kode:</span>
              <span className="font-mono font-bold text-neutral-900">{deletingVoucher.code}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Judul:</span>
              <span className="font-bold text-neutral-900">{deletingVoucher.title}</span>
            </div>
          </div>
        )}
      </ConfirmationModal>

      {/* Delete Confirmation (bulk) */}
      <ConfirmationModal
        isOpen={isBulkDeleteOpen}
        onClose={() => setIsBulkDeleteOpen(false)}
        onConfirm={confirmBulkDelete}
        title="Konfirmasi Hapus Massal Voucher"
        subtitle="Tindakan ini tidak dapat dibatalkan."
        message={`Apakah Anda yakin ingin menghapus ${selectedVoucherIds.length} voucher terpilih? Seluruh data kupon yang dipilih akan dihapus permanen.`}
        confirmText={`Hapus ${selectedVoucherIds.length} Voucher`}
        variant="danger"
        isLoading={isSubmitting}
      />
    </div>
  );
}
