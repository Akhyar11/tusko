import React, { useState, useEffect, useMemo } from 'react';
import {
  Warehouse,
  Plus,
  Trash2,
  Eye,
  SlidersHorizontal,
  MoreVertical,
  MapPin,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Edit3,
  Star,
  Building,
  Check,
  X
} from 'lucide-react';
import IconButton from './atoms/IconButton';
import ServerSideTable from './ServerSideTable';
import WarehouseFilterDrawer from './organisms/WarehouseFilterDrawer';
import ConfirmationModal from './ConfirmationModal';
import { warehouseService } from '../services/warehouseService';
import { useWarehouseTableStore } from '../stores/useWarehouseTableStore';

export default function WarehouseListPage({
  onShowToast = () => {},
  onNavigateToCreate = () => {},
  onNavigateToEdit = () => {},
  onNavigateToStock = () => {}
}) {
  const [warehouses, setWarehouses] = useState([]);

  // Centralized Zustand Table Store (100% Server-Side Data Operations)
  const {
    page,
    limit,
    sortBy,
    sortDirection,
    filters,
    data: tableWarehouses,
    total: totalWarehousesCount,
    isLoading,
    setPage,
    setLimit,
    setSort,
    setFilter,
    resetFilters,
    fetchData,
  } = useWarehouseTableStore();

  const [selectedWarehouseIds, setSelectedWarehouseIds] = useState([]);
  const [activeActionMenuId, setActiveActionMenuId] = useState(null);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Detail Modal state
  const [detailWarehouse, setDetailWarehouse] = useState(null);

  // Delete Confirmation state
  const [deletingWarehouse, setDeletingWarehouse] = useState(null);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);

  // Load warehouses from store
  const loadWarehouses = async () => {
    try {
      const res = await fetchData();
      if (res?.data) setWarehouses(res.data);
    } catch (err) {
      onShowToast('Gagal memuat data gudang: ' + err.message);
    }
  };

  useEffect(() => {
    loadWarehouses();
  }, []);

  // Close action popup when clicking outside
  useEffect(() => {
    const handleGlobalClick = () => setActiveActionMenuId(null);
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  // Paginated records directly from server-side store
  const paginatedWarehouses = tableWarehouses.length > 0 || totalWarehousesCount === 0 ? tableWarehouses : warehouses;
  const totalFiltered = totalWarehousesCount > 0 || tableWarehouses.length > 0 ? totalWarehousesCount : warehouses.length;

  // Compute metrics
  const metrics = useMemo(() => {
    const list = paginatedWarehouses;
    const total = totalFiltered;
    const active = list.filter(w => w.is_active).length;
    const primary = list.filter(w => w.is_primary).length;
    const inactive = total - active;

    return {
      total,
      active,
      primary,
      inactive
    };
  }, [paginatedWarehouses, totalFiltered]);

  // Active filter counter
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.searchQuery) count++;
    if (filters.codeSearchQuery) count++;
    if (filters.citySearchQuery) count++;
    if (filters.typeFilter && filters.typeFilter !== 'all') count++;
    if (filters.statusFilter && filters.statusFilter !== 'all') count++;
    return count;
  }, [filters]);

  const handleResetFilters = () => {
    resetFilters();
    onShowToast('Filter direktori gudang telah direset.');
  };

  const handleToggleStatus = async (warehouse) => {
    try {
      const updated = await warehouseService.toggleStatus(warehouse.id);
      loadWarehouses();
      const statusText = updated?.is_active ? 'diaktifkan' : 'dinonaktifkan';
      onShowToast(`Status fasilitas "${warehouse.name}" berhasil ${statusText}.`);
    } catch (err) {
      onShowToast('Gagal memperbarui status gudang: ' + err.message);
    }
  };

  const confirmDelete = async () => {
    if (!deletingWarehouse) return;
    setIsSubmitting(true);
    try {
      await warehouseService.deleteWarehouse(deletingWarehouse.id);
      setDeletingWarehouse(null);
      loadWarehouses();
      onShowToast(`Gudang "${deletingWarehouse.name}" berhasil dihapus.`);
    } catch (err) {
      onShowToast(err.message || 'Gagal menghapus data gudang.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Checkbox list selection handlers
  const handleSelectRow = (id) => {
    setSelectedWarehouseIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedWarehouseIds.length === paginatedWarehouses.length && paginatedWarehouses.length > 0) {
      setSelectedWarehouseIds([]);
    } else {
      setSelectedWarehouseIds(paginatedWarehouses.map(w => w.id));
    }
  };

  const handleBulkDelete = () => {
    if (selectedWarehouseIds.length === 0) return;
    setIsBulkDeleteOpen(true);
  };

  const confirmBulkDelete = async () => {
    setIsSubmitting(true);
    try {
      let failedCount = 0;
      for (const id of selectedWarehouseIds) {
        try {
          await warehouseService.deleteWarehouse(id);
        } catch {
          failedCount++;
        }
      }
      setSelectedWarehouseIds([]);
      setIsBulkDeleteOpen(false);
      loadWarehouses();
      if (failedCount > 0) {
        onShowToast(`${selectedWarehouseIds.length - failedCount} gudang dihapus, ${failedCount} gagal karena memiliki transaksi.`);
      } else {
        onShowToast(`${selectedWarehouseIds.length} fasilitas gudang berhasil dihapus.`);
      }
    } catch (err) {
      onShowToast('Gagal menghapus gudang: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Table Columns Definition
  const columns = useMemo(() => [
    {
      key: 'code',
      label: 'KODE GUDANG',
      sortable: true,
      width: 'w-36 min-w-[130px]',
      render: (val, row) => {
        const r = row || (typeof val === 'object' ? val : {}) || {};
        const code = (typeof val === 'string' ? val : null) || r.code || '-';
        return (
          <span className="font-mono font-bold text-xs text-neutral-950 bg-neutral-100 px-2 py-0.5 border border-neutral-300 rounded-none whitespace-nowrap inline-block">
            {code}
          </span>
        );
      }
    },
    {
      key: 'name',
      label: 'NAMA FASILITAS & ALAMAT',
      sortable: true,
      width: 'min-w-[260px]',
      render: (val, row) => {
        const r = row || (typeof val === 'object' ? val : {}) || {};
        const name = (typeof val === 'string' ? val : null) || r.name || '-';
        return (
          <div className="space-y-0.5">
            <div className="font-sport font-black text-sm text-neutral-950 uppercase tracking-tight leading-snug">
              {name}
            </div>
            <div className="text-xs text-neutral-600 flex items-center gap-1.5 whitespace-nowrap">
              <MapPin size={12} className="text-neutral-400 shrink-0" />
              <span className="truncate max-w-[240px]" title={r.address || '-'}>{r.address || '-'}</span>
            </div>
          </div>
        );
      }
    },
    {
      key: 'city',
      label: 'KOTA & PROVINSI',
      sortable: true,
      width: 'min-w-[180px]',
      render: (val, row) => {
        const r = row || (typeof val === 'object' ? val : {}) || {};
        return (
          <div className="text-xs space-y-0.5 whitespace-nowrap">
            <div className="font-bold text-neutral-900">{r.city || '-'}</div>
            <div className="text-neutral-500 font-mono text-[11px]">{r.province || '-'} {r.postal_code ? `(${r.postal_code})` : ''}</div>
          </div>
        );
      }
    },
    {
      key: 'is_primary',
      label: 'TIPE FASILITAS',
      sortable: true,
      align: 'center',
      width: 'w-40 min-w-[150px]',
      render: (val, row) => {
        const r = row || (typeof val === 'object' ? val : {}) || {};
        const isPrimary = val !== undefined && typeof val === 'boolean' ? val : Boolean(r.is_primary);
        return isPrimary ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] font-sport font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 rounded-none whitespace-nowrap">
            <Star size={11} className="fill-amber-500 text-amber-600 shrink-0" />
            <span>Central Hub</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] font-sport font-black uppercase tracking-wider bg-neutral-100 text-neutral-700 border border-neutral-300 rounded-none whitespace-nowrap">
            <Building size={11} className="text-neutral-500 shrink-0" />
            <span>Cabang Distribusi</span>
          </span>
        );
      }
    },
    {
      key: 'is_active',
      label: 'STATUS',
      sortable: true,
      align: 'center',
      width: 'w-28 min-w-[110px]',
      render: (val, row) => {
        const r = row || (typeof val === 'object' ? val : {}) || {};
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
      }
    },
    {
      key: 'actions',
      label: 'AKSI',
      align: 'center',
      width: 'w-16 min-w-[64px]',
      render: (val, row) => {
        const r = row || (typeof val === 'object' ? val : {}) || {};
        const isMenuOpen = activeActionMenuId === r.id;

        return (
          <div className="relative inline-flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setActiveActionMenuId(isMenuOpen ? null : r.id)}
              className="p-1.5 hover:bg-neutral-200 text-neutral-700 border border-neutral-300 hover:border-neutral-400 rounded-none transition-colors cursor-pointer"
              title="Menu Aksi"
            >
              <MoreVertical size={14} />
            </button>

            {isMenuOpen && (
              <div
                className="absolute right-0 top-8 z-30 w-48 bg-white border border-neutral-300 shadow-xl py-1 text-left rounded-none animate-in fade-in zoom-in-95 duration-100"
              >
                <button
                  type="button"
                  onClick={() => {
                    setActiveActionMenuId(null);
                    setDetailWarehouse(r);
                  }}
                  className="w-full px-3.5 py-2 text-xs font-sport font-bold uppercase tracking-wider text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Eye size={13} className="text-neutral-500" />
                  <span>Lihat Detail</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveActionMenuId(null);
                    onNavigateToEdit(r);
                  }}
                  className="w-full px-3.5 py-2 text-xs font-sport font-bold uppercase tracking-wider text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Edit3 size={13} className="text-neutral-500" />
                  <span>Ubah Data</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveActionMenuId(null);
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

                <button
                  type="button"
                  onClick={() => {
                    setActiveActionMenuId(null);
                    setDeletingWarehouse(r);
                  }}
                  className="w-full px-3.5 py-2 text-xs font-sport font-bold uppercase tracking-wider text-rose-700 hover:bg-rose-50 hover:text-rose-800 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Trash2 size={13} className="text-rose-600" />
                  <span>Hapus Gudang</span>
                </button>
              </div>
            )}
          </div>
        );
      }
    }
  ], [activeActionMenuId, onNavigateToEdit]);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* 1. Header Card (Icon-Only Controls with Tooltips) */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-none border border-neutral-300 shadow-2xs">
        <div className="min-w-0">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-none bg-neutral-950 text-amber-400 flex items-center justify-center font-black shrink-0">
              <Warehouse size={22} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-neutral-950 font-sport tracking-tight uppercase leading-tight">
                Master Gudang &amp; Fasilitas
              </h1>
              <p className="text-xs text-neutral-600 mt-0.5">
                Pusat tata kelola fasilitas penyimpanan, distribusi stok atletik, dan titik penerimaan Purchase Order (PO).
              </p>
            </div>
          </div>
        </div>

        {/* Header Action Controls (Icon-Only with Tooltip: [Tambah primary] [Filter secondary + badge]) */}
        <div className="flex items-center gap-2 self-start xl:self-auto">
          <IconButton
            icon={Plus}
            onClick={onNavigateToCreate}
            title="Tambah Gudang Baru"
            variant="primary"
          />

          <div className="relative">
            <IconButton
              icon={SlidersHorizontal}
              onClick={() => setIsFilterDrawerOpen(true)}
              title="Buka Filter &amp; Pencarian"
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

      {/* 2. Metric Cards (Row of 4 Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Card 1: Total Gudang */}
        <div className="bg-white p-4 rounded-none border border-neutral-300 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs font-sport font-bold uppercase tracking-wider">
            <span>Total Gudang</span>
            <Warehouse size={16} className="text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-neutral-950 mt-1.5">
            {metrics.total}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">
            Fasilitas terdaftar di sistem
          </div>
        </div>

        {/* Card 2: Gudang Aktif */}
        <div className="bg-white p-4 rounded-none border border-neutral-300 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs font-sport font-bold uppercase tracking-wider">
            <span>Gudang Aktif</span>
            <CheckCircle2 size={16} className="text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-700 mt-1.5">
            {metrics.active}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">
            Fasilitas beroperasi normal
          </div>
        </div>

        {/* Card 3: Central Hub */}
        <div className="bg-white p-4 rounded-none border border-neutral-300 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs font-sport font-bold uppercase tracking-wider">
            <span>Gudang Utama</span>
            <Star size={16} className="text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-amber-700 mt-1.5">
            {metrics.primary}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">
            Central distribution hub
          </div>
        </div>

        {/* Card 4: Nonaktif */}
        <div className="bg-white p-4 rounded-none border border-neutral-300 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs font-sport font-bold uppercase tracking-wider">
            <span>Nonaktif / Maint.</span>
            <AlertCircle size={16} className="text-neutral-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-neutral-700 mt-1.5">
            {metrics.inactive}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">
            Operasional ditangguhkan
          </div>
        </div>
      </div>

      {/* 3. ServerSideTable (Single Table View Only) */}
      <ServerSideTable
        columns={columns}
        data={paginatedWarehouses}
        total={totalFiltered}
        page={page}
        limit={limit}
        limitOptions={[10, 25, 50, 100]}
        onPageChange={(p) => {
          setPage(p);
          setActiveActionMenuId(null);
        }}
        onLimitChange={(newLimit) => {
          setLimit(newLimit);
          setPage(1);
          setActiveActionMenuId(null);
        }}
        sortBy={sortBy}
        sortDirection={sortDirection}
        onSortChange={({ sortBy: newSortBy, sortDirection: newDir }) => {
          setSort(newSortBy, newDir);
          setActiveActionMenuId(null);
        }}
        isLoading={isLoading}
        selectable={true}
        selectedIds={selectedWarehouseIds}
        onSelectRow={handleSelectRow}
        onSelectAll={handleSelectAll}
        idKey="id"
        bulkActions={
          selectedWarehouseIds.length > 0 ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-600 font-medium">
                <strong className="font-mono text-neutral-900">{selectedWarehouseIds.length}</strong> fasilitas dipilih
              </span>
              <button
                type="button"
                onClick={handleBulkDelete}
                className="px-2.5 py-1 bg-rose-700 hover:bg-rose-600 text-white font-sport font-bold text-[11px] uppercase rounded-none cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 size={12} />
                <span>Hapus Terpilih</span>
              </button>
            </div>
          ) : null
        }
        emptyMessage="Belum Ada Data Fasilitas Gudang"
        emptyDescription="Sesuaikan kata kunci filter pencarian atau tambahkan fasilitas gudang baru."
      />

      {/* 4. Filter Drawer */}
      <WarehouseFilterDrawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        activeFilterCount={activeFilterCount}
        searchQuery={filters.searchQuery || ''}
        onSearchQueryChange={(val) => setFilter('searchQuery', val)}
        codeSearchQuery={filters.codeSearchQuery || ''}
        onCodeSearchQueryChange={(val) => setFilter('codeSearchQuery', val)}
        citySearchQuery={filters.citySearchQuery || ''}
        onCitySearchQueryChange={(val) => setFilter('citySearchQuery', val)}
        typeFilter={filters.typeFilter || 'all'}
        onTypeFilterChange={(val) => setFilter('typeFilter', val)}
        statusFilter={filters.statusFilter || 'all'}
        onStatusFilterChange={(val) => setFilter('statusFilter', val)}
        onResetFilters={handleResetFilters}
      />

      {/* 5. Detail Warehouse Modal (Read-Only Preview) */}
      {detailWarehouse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/60 backdrop-blur-[2px] animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white border border-neutral-300 shadow-2xl rounded-none flex flex-col">
            <div className="p-5 bg-neutral-950 text-white flex items-center justify-between border-b border-neutral-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-neutral-900 border border-neutral-700 text-amber-400 flex items-center justify-center rounded-none font-black">
                  <Warehouse size={20} />
                </div>
                <div>
                  <span className="font-mono text-[10px] text-amber-400 block">{detailWarehouse.code}</span>
                  <h3 className="font-sport font-black text-base uppercase text-white">
                    {detailWarehouse.name}
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setDetailWarehouse(null)}
                className="p-1 text-neutral-400 hover:text-white rounded-none transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 pb-4 border-b border-neutral-200">
                <div>
                  <span className="text-neutral-500 uppercase font-sport font-bold block mb-1">Tipe Fasilitas</span>
                  {detailWarehouse.is_primary ? (
                    <span className="inline-flex items-center gap-1 font-sport font-black text-amber-800 uppercase">
                      <Star size={12} className="fill-amber-500 text-amber-600" /> Central Hub (Utama)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 font-sport font-bold text-neutral-700 uppercase">
                      <Building size={12} /> Cabang Distribusi
                    </span>
                  )}
                </div>

                <div>
                  <span className="text-neutral-500 uppercase font-sport font-bold block mb-1">Status Operasional</span>
                  <span className={`font-sport font-black uppercase ${detailWarehouse.is_active ? 'text-emerald-700' : 'text-neutral-600'}`}>
                    {detailWarehouse.is_active ? '🟢 Aktif Beroperasi' : '⚪ Nonaktif'}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <span className="text-neutral-500 uppercase font-sport font-bold block mb-1">Alamat Lengkap</span>
                  <p className="text-neutral-900 font-medium leading-relaxed bg-neutral-50 p-2.5 border border-neutral-200">
                    {detailWarehouse.address}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-neutral-500 uppercase font-sport font-bold block mb-1">Kota / Wilayah</span>
                    <span className="font-bold text-neutral-900">{detailWarehouse.city}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 uppercase font-sport font-bold block mb-1">Provinsi</span>
                    <span className="font-bold text-neutral-900">{detailWarehouse.province}</span>
                  </div>
                </div>

                {detailWarehouse.postal_code && (
                  <div>
                    <span className="text-neutral-500 uppercase font-sport font-bold block mb-1">Kode Pos</span>
                    <span className="font-mono text-neutral-800">{detailWarehouse.postal_code}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-neutral-50 border-t border-neutral-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDetailWarehouse(null)}
                className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-sport font-black uppercase tracking-wider rounded-none border border-neutral-300 cursor-pointer"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => {
                  const target = detailWarehouse;
                  setDetailWarehouse(null);
                  onNavigateToEdit(target);
                }}
                className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-sport font-black uppercase tracking-wider rounded-none border border-amber-500 cursor-pointer flex items-center gap-1.5"
              >
                <Edit3 size={13} />
                <span>Ubah Gudang</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Single Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={Boolean(deletingWarehouse)}
        onClose={() => setDeletingWarehouse(null)}
        onConfirm={confirmDelete}
        title="Hapus Fasilitas Gudang"
        message={`Apakah Anda yakin ingin menghapus gudang "${deletingWarehouse?.name}" (${deletingWarehouse?.code})? Gudang yang telah memiliki riwayat transaksi PO atau saldo stok tidak dapat dihapus.`}
        confirmText="Hapus Gudang"
        cancelText="Batal"
        variant="danger"
        isLoading={isSubmitting}
      />

      {/* 7. Bulk Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={isBulkDeleteOpen}
        onClose={() => setIsBulkDeleteOpen(false)}
        onConfirm={confirmBulkDelete}
        title="Hapus Fasilitas Gudang Terpilih"
        message={`Apakah Anda yakin ingin menghapus ${selectedWarehouseIds.length} fasilitas gudang yang dipilih sekaligus? Fasilitas yang masih memiliki riwayat transaksi akan diabaikan demi integritas data.`}
        confirmText={`Hapus ${selectedWarehouseIds.length} Gudang`}
        cancelText="Batal"
        variant="danger"
        isLoading={isSubmitting}
      />
    </div>
  );
}
