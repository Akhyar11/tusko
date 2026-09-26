import React, { useState, useEffect, useMemo } from 'react';
import {
  RotateCcw,
  SlidersHorizontal,
  Eye,
  Clock,
  BadgeCheck,
  Wallet,
  FileText
} from 'lucide-react';
import IconButton from './atoms/IconButton';
import ServerSideTable from './ServerSideTable';
import ReturnFilterDrawer from './organisms/ReturnFilterDrawer';
import RowActionMenu from './molecules/RowActionMenu';
import { useReturnTableStore } from '../stores/useReturnTableStore';

const STATUS_STYLES = {
  pending: 'bg-amber-50 text-amber-800 border-amber-300',
  approved: 'bg-sky-50 text-sky-800 border-sky-300',
  rejected: 'bg-rose-50 text-rose-700 border-rose-300',
  refunded: 'bg-emerald-50 text-emerald-800 border-emerald-300'
};

const STATUS_LABELS = {
  pending: 'Menunggu',
  approved: 'Disetujui',
  rejected: 'Ditolak',
  refunded: 'Direfund'
};

export default function ReturnListPage({
  onShowToast = () => {},
  onNavigateToDetail = () => {}
}) {
  const {
    page,
    limit,
    sortBy,
    sortDirection,
    filters,
    data: returns,
    total,
    isLoading,
    setPage,
    setLimit,
    setSort,
    setFilter,
    resetFilters,
    fetchData
  } = useReturnTableStore();

  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  const loadReturns = async () => {
    try {
      await fetchData();
    } catch (err) {
      onShowToast('Gagal memuat data retur: ' + err.message);
    }
  };

  useEffect(() => {
    loadReturns();
  }, []);

  const metrics = useMemo(() => {
    const sum = (status) => returns.filter((r) => r.status === status).length;
    return { total, pending: sum('pending'), approved: sum('approved'), refunded: sum('refunded') };
  }, [returns, total]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.searchQuery) count++;
    if (filters.userSearchQuery) count++;
    if (filters.statusFilter && filters.statusFilter !== 'all') count++;
    if (filters.requestedFrom) count++;
    if (filters.requestedTo) count++;
    if (filters.itemsMin !== '' && filters.itemsMin !== null) count++;
    if (filters.itemsMax !== '' && filters.itemsMax !== null) count++;
    if (filters.refundAmountMin !== '' && filters.refundAmountMin !== null) count++;
    if (filters.refundAmountMax !== '' && filters.refundAmountMax !== null) count++;
    return count;
  }, [filters]);

  const handleResetFilters = () => {
    resetFilters();
    onShowToast('Filter retur telah direset.');
  };

  const columns = useMemo(() => [
    {
      key: 'return_number',
      label: 'NOMOR RETUR',
      sortable: false,
      width: 'min-w-[170px]',
      render: (val, row) => (
        <span className="font-mono font-bold text-xs text-neutral-950 bg-neutral-100 px-2 py-0.5 border border-neutral-300 rounded-none whitespace-nowrap inline-block">
          {row.return_number}
        </span>
      )
    },
    {
      key: 'order_number',
      label: 'PESANAN',
      sortable: false,
      width: 'min-w-[150px]',
      render: (val, row) => (
        <span className="font-mono text-[11px] text-neutral-700">{row.order_number || '-'}</span>
      )
    },
    {
      key: 'user',
      label: 'PELANGGAN',
      sortable: false,
      width: 'min-w-[180px]',
      render: (val, row) => (
        <div className="text-xs space-y-0.5">
          <div className="font-bold text-neutral-900">{row.user?.name || '-'}</div>
          <div className="text-[11px] text-neutral-500 truncate max-w-[170px]">{row.user?.email || '-'}</div>
        </div>
      )
    },
    {
      key: 'items_count',
      label: 'ITEM',
      sortable: false,
      align: 'center',
      width: 'w-20 min-w-[70px]',
      render: (val, row) => (
        <span className="font-mono font-bold text-xs text-neutral-800">{row.items_count ?? 0}</span>
      )
    },
    {
      key: 'refund_amount',
      label: 'NOMINAL REFUND',
      sortable: true,
      align: 'right',
      width: 'min-w-[150px]',
      render: (val, row) => (
        <span className="font-mono font-bold text-xs text-neutral-950">
          {`Rp ${(Number(row.refund_amount) || 0).toLocaleString('id-ID')}`}
        </span>
      )
    },
    {
      key: 'status',
      label: 'STATUS',
      sortable: true,
      align: 'center',
      width: 'w-32 min-w-[120px]',
      render: (val, row) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 text-[10px] font-sport font-black uppercase tracking-wider border rounded-none whitespace-nowrap ${STATUS_STYLES[row.status] || STATUS_STYLES.pending}`}>
          {STATUS_LABELS[row.status] || row.status}
        </span>
      )
    },
    {
      key: 'requested_at',
      label: 'TANGGAL',
      sortable: true,
      width: 'min-w-[130px]',
      render: (val, row) => (
        <span className="font-mono text-[11px] text-neutral-600">
          {row.requested_at ? String(row.requested_at).slice(0, 10) : '-'}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'AKSI',
      align: 'center',
      width: 'w-16 min-w-[64px]',
      render: (val, row) => (
        <div className="inline-flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
          <RowActionMenu buttonTitle="Menu Aksi">
            {(close) => (
              <button
                type="button"
                onClick={() => { close(); onNavigateToDetail(row); }}
                className="w-full px-3.5 py-2 text-xs font-sport font-bold uppercase tracking-wider text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Eye size={13} className="text-neutral-500" />
                <span>Lihat Detail</span>
              </button>
            )}
          </RowActionMenu>
        </div>
      )
    }
  ], [onNavigateToDetail]);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-none border border-neutral-300 shadow-2xs">
        <div className="min-w-0">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-none bg-neutral-950 text-amber-400 flex items-center justify-center font-black shrink-0">
              <RotateCcw size={22} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-neutral-950 font-sport tracking-tight uppercase leading-tight">
                Retur &amp; Refund
              </h1>
              <p className="text-xs text-neutral-600 mt-0.5">
                Kelola pengajuan retur pelanggan: tinjau, setujui/tolak, dan proses refund (stok &amp; poin otomatis).
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start xl:self-auto">
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

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4">
        <div className="bg-white p-4 rounded-none border border-neutral-300 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-1.5">
            <span className="text-xs font-sport font-black uppercase tracking-wider">Total Retur</span>
            <FileText size={16} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black font-sport text-neutral-950">{metrics.total}</span>
          </div>
          <div className="mt-2 text-[11px] border-t border-neutral-100 pt-1.5 text-neutral-500">Semua pengajuan</div>
        </div>

        <div className="bg-white p-4 rounded-none border border-neutral-300 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-1.5">
            <span className="text-xs font-sport font-black uppercase tracking-wider">Menunggu</span>
            <Clock size={16} className="text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black font-sport text-amber-700">{metrics.pending}</span>
          </div>
          <div className="mt-2 text-[11px] border-t border-neutral-100 pt-1.5 text-neutral-500">Perlu ditinjau</div>
        </div>

        <div className="bg-white p-4 rounded-none border border-neutral-300 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-1.5">
            <span className="text-xs font-sport font-black uppercase tracking-wider">Disetujui</span>
            <BadgeCheck size={16} className="text-sky-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black font-sport text-sky-700">{metrics.approved}</span>
          </div>
          <div className="mt-2 text-[11px] border-t border-neutral-100 pt-1.5 text-neutral-500">Siap direfund</div>
        </div>

        <div className="bg-white p-4 rounded-none border border-neutral-300 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-1.5">
            <span className="text-xs font-sport font-black uppercase tracking-wider">Direfund</span>
            <Wallet size={16} className="text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black font-sport text-emerald-700">{metrics.refunded}</span>
          </div>
          <div className="mt-2 text-[11px] border-t border-neutral-100 pt-1.5 text-neutral-500">Selesai diproses</div>
        </div>
      </div>

      <ServerSideTable
        columns={columns}
        data={returns}
        total={total}
        page={page}
        limit={limit}
        limitOptions={[10, 25, 50, 100]}
        onPageChange={(p) => setPage(p)}
        onLimitChange={(newLimit) => { setLimit(newLimit); setPage(1); }}
        sortBy={sortBy}
        sortDirection={sortDirection}
        onSortChange={({ sortBy: newSortBy, sortDirection: newDir }) => setSort(newSortBy, newDir)}
        isLoading={isLoading}
        selectable={true}
        idKey="id"
        emptyMessage="Belum Ada Pengajuan Retur"
        emptyDescription="Pengajuan retur dari pelanggan akan muncul di sini."
      />

      <ReturnFilterDrawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        activeFilterCount={activeFilterCount}
        searchQuery={filters.searchQuery || ''}
        onSearchQueryChange={(val) => setFilter('searchQuery', val)}
        statusFilter={filters.statusFilter || 'all'}
        onStatusFilterChange={(val) => setFilter('statusFilter', val)}
        userSearchQuery={filters.userSearchQuery || ''}
        onUserSearchQueryChange={(val) => setFilter('userSearchQuery', val)}
        requestedFrom={filters.requestedFrom || ''}
        onRequestedFromChange={(val) => setFilter('requestedFrom', val)}
        requestedTo={filters.requestedTo || ''}
        onRequestedToChange={(val) => setFilter('requestedTo', val)}
        itemsMin={filters.itemsMin || ''}
        onItemsMinChange={(val) => setFilter('itemsMin', val)}
        itemsMax={filters.itemsMax || ''}
        onItemsMaxChange={(val) => setFilter('itemsMax', val)}
        refundAmountMin={filters.refundAmountMin || ''}
        onRefundAmountMinChange={(val) => setFilter('refundAmountMin', val)}
        refundAmountMax={filters.refundAmountMax || ''}
        onRefundAmountMaxChange={(val) => setFilter('refundAmountMax', val)}
        onResetFilters={handleResetFilters}
      />
    </div>
  );
}
