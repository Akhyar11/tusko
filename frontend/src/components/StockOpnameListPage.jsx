import React, { useState, useEffect, useMemo } from 'react';
import {
  ClipboardCheck,
  Plus,
  SlidersHorizontal,
  Eye,
  Send,
  BadgeCheck,
  Warehouse,
  LayoutList,
  Clock
} from 'lucide-react';
import IconButton from './atoms/IconButton';
import ServerSideTable from './ServerSideTable';
import StockOpnameFilterDrawer from './organisms/StockOpnameFilterDrawer';
import ConfirmationModal from './ConfirmationModal';
import RowActionMenu from './molecules/RowActionMenu';
import { stockOpnameService } from '../services/stockOpnameService';
import { useStockOpnameTableStore } from '../stores/useStockOpnameTableStore';

const STATUS_STYLES = {
  draft: 'bg-neutral-100 text-neutral-700 border-neutral-300',
  in_progress: 'bg-amber-50 text-amber-800 border-amber-300',
  approved: 'bg-emerald-50 text-emerald-800 border-emerald-300',
  rejected: 'bg-rose-50 text-rose-700 border-rose-300'
};

const STATUS_LABELS = {
  draft: 'Draft',
  in_progress: 'Diajukan',
  approved: 'Disetujui',
  rejected: 'Ditolak'
};

export default function StockOpnameListPage({
  onShowToast = () => {},
  onNavigateToCreate = () => {},
  onNavigateToDetail = () => {}
}) {
  const {
    page,
    limit,
    sortBy,
    sortDirection,
    filters,
    data: opnames,
    total,
    isLoading,
    setPage,
    setLimit,
    setSort,
    setFilter,
    resetFilters,
    fetchData
  } = useStockOpnameTableStore();

  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionOpname, setActionOpname] = useState(null);
  const [actionType, setActionType] = useState(null);

  const loadOpnames = async () => {
    try {
      await fetchData();
    } catch (err) {
      onShowToast('Gagal memuat data opname: ' + err.message);
    }
  };

  useEffect(() => {
    loadOpnames();
  }, []);

  const metrics = useMemo(() => ({
    total,
    draft: opnames.filter((o) => o.status === 'draft').length,
    inProgress: opnames.filter((o) => o.status === 'in_progress').length,
    approved: opnames.filter((o) => o.status === 'approved').length
  }), [opnames, total]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.searchQuery) count++;
    if (filters.warehouseFilter && filters.warehouseFilter !== 'all') count++;
    if (filters.statusFilter && filters.statusFilter !== 'all') count++;
    if (filters.conductedFrom) count++;
    if (filters.conductedTo) count++;
    if (filters.itemsMin !== '' && filters.itemsMin !== null) count++;
    if (filters.itemsMax !== '' && filters.itemsMax !== null) count++;
    if (filters.sortFilter && filters.sortFilter !== 'latest') count++;
    return count;
  }, [filters]);

  const handleResetFilters = () => {
    resetFilters();
    onShowToast('Filter stok opname telah direset.');
  };

  const runAction = async () => {
    if (!actionOpname || !actionType) return;
    setIsSubmitting(true);
    try {
      if (actionType === 'submit') {
        await stockOpnameService.submitOpname(actionOpname.id);
        onShowToast(`Sesi ${actionOpname.opname_number} diajukan untuk persetujuan.`);
      } else {
        await stockOpnameService.approveOpname(actionOpname.id);
        onShowToast(`Sesi ${actionOpname.opname_number} disetujui & stok disesuaikan.`);
      }
      setActionOpname(null);
      setActionType(null);
      loadOpnames();
    } catch (err) {
      onShowToast(err.message || 'Gagal memproses sesi opname.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = useMemo(() => [
    {
      key: 'opname_number',
      label: 'NOMOR OPNAME',
      sortable: false,
      width: 'min-w-[180px]',
      render: (val, row) => (
        <span className="font-mono font-bold text-xs text-neutral-950 bg-neutral-100 px-2 py-0.5 border border-neutral-300 rounded-none whitespace-nowrap inline-block">
          {row.opname_number}
        </span>
      )
    },
    {
      key: 'warehouse',
      label: 'GUDANG',
      sortable: false,
      width: 'min-w-[200px]',
      render: (val, row) => (
        <div className="space-y-0.5">
          <div className="font-sport font-black text-sm text-neutral-950 uppercase tracking-tight leading-snug">
            {row.warehouse?.name || '-'}
          </div>
          <div className="text-[11px] text-neutral-500 font-mono flex items-center gap-1.5">
            <Warehouse size={11} className="text-neutral-400" />
            {row.warehouse?.code || '-'}
          </div>
        </div>
      )
    },
    {
      key: 'items_count',
      label: 'JUMLAH ITEM',
      sortable: false,
      align: 'center',
      width: 'w-32 min-w-[110px]',
      render: (val, row) => (
        <span className="inline-flex items-center gap-1.5 font-mono font-bold text-xs text-neutral-800">
          <LayoutList size={12} className="text-neutral-400" />
          {row.items_count ?? 0}
        </span>
      )
    },
    {
      key: 'conducted_at',
      label: 'TANGGAL',
      sortable: false,
      width: 'min-w-[160px]',
      render: (val, row) => (
        <div className="text-[11px] space-y-0.5">
          <div className="flex items-center gap-1.5 text-neutral-700">
            <Clock size={11} className="text-neutral-400" />
            {row.conducted_at ? String(row.conducted_at).slice(0, 10) : '-'}
          </div>
          {row.approved_at && (
            <div className="text-emerald-700">Disetujui: {String(row.approved_at).slice(0, 10)}</div>
          )}
        </div>
      )
    },
    {
      key: 'status',
      label: 'STATUS',
      sortable: false,
      align: 'center',
      width: 'w-32 min-w-[120px]',
      render: (val, row) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 text-[10px] font-sport font-black uppercase tracking-wider border rounded-none whitespace-nowrap ${STATUS_STYLES[row.status] || STATUS_STYLES.draft}`}>
          {STATUS_LABELS[row.status] || row.status}
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
              <>
                <button
                  type="button"
                  onClick={() => { close(); onNavigateToDetail(row); }}
                  className="w-full px-3.5 py-2 text-xs font-sport font-bold uppercase tracking-wider text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Eye size={13} className="text-neutral-500" />
                  <span>Lihat Detail</span>
                </button>

                {row.status === 'draft' && (
                  <button
                    type="button"
                    onClick={() => { close(); setActionOpname(row); setActionType('submit'); }}
                    className="w-full px-3.5 py-2 text-xs font-sport font-bold uppercase tracking-wider text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Send size={13} className="text-neutral-500" />
                    <span>Ajukan Persetujuan</span>
                  </button>
                )}

                {row.status === 'in_progress' && (
                  <button
                    type="button"
                    onClick={() => { close(); setActionOpname(row); setActionType('approve'); }}
                    className="w-full px-3.5 py-2 text-xs font-sport font-bold uppercase tracking-wider text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <BadgeCheck size={13} className="text-neutral-500" />
                    <span>Setujui & Sesuaikan Stok</span>
                  </button>
                )}
              </>
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
              <ClipboardCheck size={22} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-neutral-950 font-sport tracking-tight uppercase leading-tight">
                Stock Opname
              </h1>
              <p className="text-xs text-neutral-600 mt-0.5">
                Sesi penghitungan fisik stok gudang, selisih, persetujuan, dan penyesuaian stok otoritatif.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start xl:self-auto">
          <IconButton icon={Plus} onClick={onNavigateToCreate} title="Buat Sesi Opname Baru" variant="primary" />
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
            <span className="text-xs font-sport font-black uppercase tracking-wider">Total Sesi</span>
            <ClipboardCheck size={16} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black font-sport text-neutral-950">{metrics.total}</span>
          </div>
          <div className="mt-2 text-[11px] border-t border-neutral-100 pt-1.5 text-neutral-500">Sesi terdaftar</div>
        </div>

        <div className="bg-white p-4 rounded-none border border-neutral-300 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-1.5">
            <span className="text-xs font-sport font-black uppercase tracking-wider">Draft</span>
            <Clock size={16} className="text-neutral-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black font-sport text-neutral-700">{metrics.draft}</span>
          </div>
          <div className="mt-2 text-[11px] border-t border-neutral-100 pt-1.5 text-neutral-500">Belum diajukan</div>
        </div>

        <div className="bg-white p-4 rounded-none border border-neutral-300 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-1.5">
            <span className="text-xs font-sport font-black uppercase tracking-wider">Diajukan</span>
            <Send size={16} className="text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black font-sport text-amber-700">{metrics.inProgress}</span>
          </div>
          <div className="mt-2 text-[11px] border-t border-neutral-100 pt-1.5 text-neutral-500">Menunggu persetujuan</div>
        </div>

        <div className="bg-white p-4 rounded-none border border-neutral-300 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-1.5">
            <span className="text-xs font-sport font-black uppercase tracking-wider">Disetujui</span>
            <BadgeCheck size={16} className="text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black font-sport text-emerald-700">{metrics.approved}</span>
          </div>
          <div className="mt-2 text-[11px] border-t border-neutral-100 pt-1.5 text-neutral-500">Stok telah disesuaikan</div>
        </div>
      </div>

      <ServerSideTable
        columns={columns}
        data={opnames}
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
        selectedIds={selectedIds}
        onSelectRow={(id) => setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))}
        onSelectAll={() => setSelectedIds(selectedIds.length === opnames.length ? [] : opnames.map((o) => o.id))}
        idKey="id"
        emptyMessage="Belum Ada Sesi Opname"
        emptyDescription="Buat sesi opname baru untuk mulai menghitung stok fisik gudang."
      />

      <StockOpnameFilterDrawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        activeFilterCount={activeFilterCount}
        searchQuery={filters.searchQuery || ''}
        onSearchQueryChange={(val) => setFilter('searchQuery', val)}
        warehouseFilter={filters.warehouseFilter || 'all'}
        onWarehouseFilterChange={(val) => setFilter('warehouseFilter', val)}
        statusFilter={filters.statusFilter || 'all'}
        onStatusFilterChange={(val) => setFilter('statusFilter', val)}
        conductedFrom={filters.conductedFrom || ''}
        onConductedFromChange={(val) => setFilter('conductedFrom', val)}
        conductedTo={filters.conductedTo || ''}
        onConductedToChange={(val) => setFilter('conductedTo', val)}
        itemsMin={filters.itemsMin || ''}
        onItemsMinChange={(val) => setFilter('itemsMin', val)}
        itemsMax={filters.itemsMax || ''}
        onItemsMaxChange={(val) => setFilter('itemsMax', val)}
        sortFilter={filters.sortFilter || 'latest'}
        onSortFilterChange={(val) => setFilter('sortFilter', val)}
        onResetFilters={handleResetFilters}
      />

      <ConfirmationModal
        isOpen={Boolean(actionOpname && actionType)}
        onClose={() => { setActionOpname(null); setActionType(null); }}
        onConfirm={runAction}
        title={actionType === 'approve' ? 'Setujui Sesi Opname' : 'Ajukan Sesi Opname'}
        message={
          actionType === 'approve'
            ? `Setujui sesi ${actionOpname?.opname_number}? Stok akan disesuaikan sesuai selisih fisik dan jurnal penyesuaian akan dibuat.`
            : `Ajukan sesi ${actionOpname?.opname_number} untuk proses persetujuan?`
        }
        confirmText={actionType === 'approve' ? 'Setujui & Sesuaikan' : 'Ajukan'}
        cancelText="Batal"
        variant={actionType === 'approve' ? 'warning' : 'info'}
        isLoading={isSubmitting}
      />
    </div>
  );
}
