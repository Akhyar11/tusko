import React, { useState, useMemo, useEffect } from 'react';
import { 
  Truck, 
  Plus, 
  SlidersHorizontal, 
  Star, 
  Edit, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  MoreVertical,
  Check,
  X
} from 'lucide-react';
import IconButton from './atoms/IconButton';
import ServerSideTable from './ServerSideTable';
import ExpeditionFilterDrawer from './organisms/ExpeditionFilterDrawer';
import ConfirmationModal from './ConfirmationModal';
import { formatRupiah } from '../utils/formatters';
import { initialExpeditions, expeditionCategoriesList } from '../data/mockExpeditionSettings';
import { useExpeditionTableStore } from '../stores/useExpeditionTableStore';

export default function ExpeditionSettingsPage({
  expeditions = initialExpeditions,
  onBack = () => {},
  onAddExpedition = () => {},
  onDeleteExpedition = () => {},
  onEditRate = () => {},
  onSetDefault = () => {},
  onToggleActive = () => {},
  onShowToast = () => {},
  onNavigateToCreate = () => {},
  onNavigateToEdit = () => {}
}) {
  // Centralized Zustand Table Store (100% Server-Side Data Operations)
  const {
    page,
    limit,
    sortBy,
    sortDirection,
    filters,
    data: storeExpeditions,
    total: totalExpeditionsCount,
    isLoading,
    setPage,
    setLimit,
    setSort,
    setFilter,
    resetFilters,
    fetchData,
  } = useExpeditionTableStore();

  useEffect(() => {
    fetchData();
  }, []);

  // Filter drawer & active filters
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [selectedExpeditionIds, setSelectedExpeditionIds] = useState([]);
  const [activeActionMenuId, setActiveActionMenuId] = useState(null);

  // Modals state
  const [expeditionToDelete, setExpeditionToDelete] = useState(null);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);

  // Close action popup when clicking outside
  useEffect(() => {
    const handleGlobalClick = () => setActiveActionMenuId(null);
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  // Courier brand color helper
  const getCourierColor = (code) => {
    switch (code) {
      case 'jne':
        return 'bg-blue-600 text-white';
      case 'sicepat':
        return 'bg-rose-600 text-white';
      case 'jnt':
        return 'bg-red-600 text-white';
      case 'gosend':
        return 'bg-emerald-600 text-white';
      case 'grab':
        return 'bg-green-600 text-white';
      case 'anteraja':
        return 'bg-amber-600 text-white';
      default:
        return 'bg-neutral-900 text-white';
    }
  };

  // Paginated records directly from server-side store
  const paginatedExpeditions = storeExpeditions.length > 0 || totalExpeditionsCount === 0 ? storeExpeditions : expeditions;
  const totalFiltered = totalExpeditionsCount > 0 || storeExpeditions.length > 0 ? totalExpeditionsCount : expeditions.length;

  // Statistics
  const totalCount = totalFiltered;
  const activeCount = paginatedExpeditions.filter(e => e.isActive || e.is_active).length;
  const defaultExp = paginatedExpeditions.find(e => e.isDefault || e.is_default) || paginatedExpeditions[0];
  const avgRate = paginatedExpeditions.length > 0 
    ? Math.round(paginatedExpeditions.reduce((s, e) => s + (e.baseRate || e.cost || e.base_rate || 0), 0) / paginatedExpeditions.length)
    : 0;

  // Active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.searchQuery && filters.searchQuery.trim() !== '') count++;
    if (filters.searchEtd && filters.searchEtd.trim() !== '') count++;
    if (filters.selectedCategory && filters.selectedCategory !== 'Semua Kategori' && filters.selectedCategory !== 'all') count++;
    if (filters.statusFilter && filters.statusFilter !== 'all') count++;
    if (filters.defaultFilter && filters.defaultFilter !== 'all') count++;
    if (filters.minRate) count++;
    if (filters.maxRate) count++;
    return count;
  }, [filters]);

  const handleResetFilters = () => {
    resetFilters();
  };

  // Selection handlers
  const handleSelectRow = (id) => {
    setSelectedExpeditionIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    const currentPageIds = paginatedExpeditions.map(e => e.id);
    const allSelected = currentPageIds.every(id => selectedExpeditionIds.includes(id));

    if (allSelected) {
      setSelectedExpeditionIds(prev => prev.filter(id => !currentPageIds.includes(id)));
    } else {
      const merged = new Set([...selectedExpeditionIds, ...currentPageIds]);
      setSelectedExpeditionIds(Array.from(merged));
    }
  };

  const handleBulkDelete = () => {
    if (selectedExpeditionIds.length === 0) return;
    setIsBulkDeleteOpen(true);
  };

  const confirmBulkDelete = () => {
    selectedExpeditionIds.forEach(id => {
      const target = expeditions.find(e => e.id === id);
      if (target) onDeleteExpedition(target);
    });
    onShowToast(`${selectedExpeditionIds.length} ekspedisi berhasil dihapus.`);
    setSelectedExpeditionIds([]);
    setIsBulkDeleteOpen(false);
  };

  const confirmDeleteSingle = () => {
    if (!expeditionToDelete) return;
    onDeleteExpedition(expeditionToDelete);
    onShowToast(`Layanan ${expeditionToDelete.name} berhasil dihapus.`);
    setExpeditionToDelete(null);
  };

  // Table Columns Definition
  const tableColumns = useMemo(() => [
    {
      key: 'name',
      label: 'Ekspedisi & Layanan',
      sortable: true,
      width: 'min-w-[240px]',
      render: (_, exp) => {
        return (
          <div className="flex items-center gap-3">
            <div className={`px-2 py-1 rounded-none font-black text-[11px] tracking-wider uppercase shrink-0 font-sport ${getCourierColor(exp.code)}`}>
              {exp.code || exp.name.slice(0, 3)}
            </div>
            <div>
              <div className="font-sport font-black uppercase text-xs text-neutral-950">
                {exp.name}
              </div>
              <div className="text-[10px] text-neutral-500 font-mono">
                Layanan: {exp.service}
              </div>
            </div>
          </div>
        );
      }
    },
    {
      key: 'category',
      label: 'Kategori',
      width: 'w-36',
      render: (cat) => (
        <span className="px-2 py-0.5 bg-neutral-100 border border-neutral-300 font-sport font-bold text-[10px] uppercase rounded-none text-neutral-800">
          {cat || 'Reguler'}
        </span>
      )
    },
    {
      key: 'etd',
      label: 'Estimasi (ETD)',
      width: 'w-32',
      render: (etd) => (
        <span className="text-xs font-mono text-neutral-700">
          {etd || '1-3 Hari'}
        </span>
      )
    },
    {
      key: 'baseRate',
      label: 'Tarif Dasar',
      sortable: true,
      align: 'right',
      width: 'w-36',
      render: (_, exp) => {
        const rate = exp.baseRate || exp.cost || 0;
        return (
          <div>
            <div className="font-mono font-black text-sm text-neutral-950">
              {formatRupiah(rate)}
            </div>
            <div className="text-[10px] text-neutral-400 font-mono">
              {exp.rateType === 'per_kg' ? 'per kilogram' : 'tarif flat'}
            </div>
          </div>
        );
      }
    },
    {
      key: 'isDefault',
      label: 'Ekspedisi Utama',
      align: 'center',
      width: 'w-36',
      render: (isDef) => (
        isDef ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 border border-amber-300 text-amber-900 font-sport font-black text-[10px] uppercase rounded-none">
            <Star size={11} className="fill-amber-500 text-amber-500" />
            <span>Utama</span>
          </span>
        ) : (
          <span className="text-[10px] text-neutral-400 font-mono">Standar</span>
        )
      )
    },
    {
      key: 'isActive',
      label: 'Status',
      align: 'center',
      width: 'w-32',
      render: (_, exp) => (
        <button
          type="button"
          onClick={() => onToggleActive(exp)}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-none text-[10px] font-sport font-bold uppercase tracking-wider cursor-pointer transition-all border ${
            exp.isActive
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
              : 'bg-neutral-100 text-neutral-600 border-neutral-300 hover:bg-neutral-200'
          }`}
          title={exp.isActive ? 'Klik untuk nonaktifkan kurir' : 'Klik untuk aktifkan kurir'}
        >
          <span className={`w-1.5 h-1.5 rounded-none ${exp.isActive ? 'bg-emerald-600' : 'bg-neutral-400'}`} />
          <span>{exp.isActive ? 'Aktif' : 'Nonaktif'}</span>
        </button>
      )
    },
    {
      key: 'actions',
      label: 'Aksi',
      sortable: false,
      align: 'right',
      width: 'w-24',
      render: (_, exp, rowIdx) => {
        const isOpen = activeActionMenuId === exp.id;
        const isNearBottom = rowIdx >= paginatedExpeditions.length - 2 && paginatedExpeditions.length > 3;

        return (
          <div className="relative inline-block text-left" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setActiveActionMenuId(isOpen ? null : exp.id)}
              className={`p-1.5 rounded-none border transition-colors cursor-pointer ${
                isOpen 
                  ? 'bg-neutral-950 text-white border-neutral-950 shadow-xs' 
                  : 'text-neutral-700 hover:text-black hover:bg-neutral-100 border-neutral-300 bg-white shadow-2xs'
              }`}
              title="Menu Aksi Ekspedisi"
            >
              <MoreVertical size={16} />
            </button>

            {isOpen && (
              <div 
                className={`absolute right-0 ${
                  isNearBottom ? 'bottom-full mb-1' : 'top-full mt-1'
                } w-48 bg-white border border-neutral-300 rounded-none shadow-xl z-50 py-1 text-left animate-in fade-in zoom-in-95 duration-100`}
              >
                {/* 1. Atur Tarif */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveActionMenuId(null);
                    onNavigateToEdit(exp);
                  }}
                  className="w-full px-3.5 py-2 text-xs font-bold text-neutral-700 hover:bg-neutral-50 hover:text-neutral-950 flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <Edit size={14} className="text-neutral-500" />
                  <span>Atur Tarif Ongkir</span>
                </button>

                {/* 2. Jadikan Utama */}
                {!exp.isDefault && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveActionMenuId(null);
                      onSetDefault(exp);
                    }}
                    className="w-full px-3.5 py-2 text-xs font-bold text-neutral-700 hover:bg-neutral-50 hover:text-neutral-950 flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <Star size={14} className="text-amber-500" />
                    <span>Jadikan Ekspedisi Utama</span>
                  </button>
                )}

                {/* 3. Hapus (Destructive Red) */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveActionMenuId(null);
                    setExpeditionToDelete(exp);
                  }}
                  className="w-full px-3.5 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50 flex items-center gap-2 cursor-pointer border-t border-neutral-100 transition-colors"
                >
                  <Trash2 size={14} className="text-rose-600" />
                  <span>Hapus Layanan</span>
                </button>
              </div>
            )}
          </div>
        );
      }
    }
  ], [paginatedExpeditions, activeActionMenuId, onNavigateToEdit]);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      
      {/* 1. Header Bar Bersih (Icon-only Controls, 0 Redundant Breadcrumbs) */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-none border border-neutral-300 shadow-2xs">
        <div className="min-w-0">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-none bg-neutral-950 text-amber-400 flex items-center justify-center font-black shrink-0">
              <Truck size={22} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-neutral-950 font-sport tracking-tight uppercase leading-tight">
                Pengaturan Jasa Ekspedisi
              </h1>
              <p className="text-xs text-neutral-600 mt-0.5">
                Kelola daftar kurir logistik aktif, konfigurasi tarif ongkos kirim, dan opsi ekspedisi prioritas toko.
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls: [Tambah Ekspedisi] -> [Filter] */}
        <div className="flex items-center gap-2 self-start xl:self-auto">
          <IconButton
            icon={Plus}
            onClick={onNavigateToCreate}
            tooltip="Tambah Ekspedisi Baru"
            variant="primary"
          />
          <IconButton
            icon={SlidersHorizontal}
            onClick={() => setIsFilterDrawerOpen(true)}
            tooltip="Buka Filter Ekspedisi"
            variant={activeFilterCount > 0 ? 'dark' : 'secondary'}
            badge={activeFilterCount > 0 ? activeFilterCount : null}
          />
        </div>
      </div>

      {/* 2. 4 Kartu KPI Ekspedisi */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4">
        <div className="bg-white p-4 rounded-none border border-neutral-300 shadow-2xs">
          <span className="text-xs font-sport font-black uppercase tracking-wider text-neutral-500 block">
            Total Layanan
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-neutral-950 font-sport font-mono">{totalCount}</span>
            <span className="text-[10px] font-mono text-neutral-400">Kurir</span>
          </div>
          <p className="text-[10px] text-neutral-500 border-t border-neutral-100 pt-1">
            Layanan pengiriman terkonfigurasi
          </p>
        </div>

        <div className="bg-white p-4 rounded-none border border-neutral-300 shadow-2xs">
          <span className="text-xs font-sport font-black uppercase tracking-wider text-emerald-700 block">
            Ekspedisi Aktif
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-700 font-sport font-mono">{activeCount}</span>
            <span className="text-[10px] font-mono text-emerald-600/70">Layanan</span>
          </div>
          <p className="text-[10px] text-neutral-500 border-t border-neutral-100 pt-1">
            Tersedia untuk dipilih pembeli
          </p>
        </div>

        <div className="bg-white p-4 rounded-none border border-neutral-300 shadow-2xs">
          <span className="text-xs font-sport font-black uppercase tracking-wider text-amber-700 block">
            Ekspedisi Utama
          </span>
          <div className="flex items-baseline gap-2 truncate">
            <span className="text-lg sm:text-xl font-black text-neutral-950 font-sport uppercase truncate">
              {defaultExp?.name || '-'}
            </span>
          </div>
          <p className="text-[10px] text-neutral-500 border-t border-neutral-100 pt-1 truncate">
            {defaultExp?.service} (Default toko)
          </p>
        </div>

        <div className="bg-white p-4 rounded-none border border-neutral-300 shadow-2xs">
          <span className="text-xs font-sport font-black uppercase tracking-wider text-neutral-500 block">
            Rata-rata Tarif
          </span>
          <div className="text-xl sm:text-2xl font-black text-neutral-950 font-mono truncate">
            {formatRupiah(avgRate)}
          </div>
          <p className="text-[10px] text-neutral-500 border-t border-neutral-100 pt-1">
            Biaya rata-rata ongkir per paket
          </p>
        </div>
      </div>

      {/* 3. Main Data Table: Single Table View Only */}
      <ServerSideTable
        columns={tableColumns}
        data={paginatedExpeditions}
        total={totalFiltered}
        page={page}
        limit={limit}
        limitOptions={[10, 25, 50, 100]}
        onPageChange={setPage}
        onLimitChange={(newLimit) => {
          setLimit(newLimit);
          setPage(1);
        }}
        sortBy={sortBy}
        sortDirection={sortDirection}
        onSortChange={({ sortBy: newSortBy, sortDirection: newDir }) => {
          setSort(newSortBy, newDir);
        }}
        isLoading={isLoading}
        selectable={true}
        selectedIds={selectedExpeditionIds}
        onSelectRow={handleSelectRow}
        onSelectAll={handleSelectAll}
        idKey="id"
        emptyMessage="Tidak Ada Layanan Ekspedisi Ditemukan"
        emptyDescription="Sesuaikan kata kunci pencarian atau ubah filter status kurir."
        bulkActions={
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleBulkDelete}
              className="px-2.5 py-1 bg-rose-700 hover:bg-rose-600 text-white font-sport font-bold text-[11px] uppercase rounded-none transition-colors cursor-pointer"
            >
              Hapus Terpilih ({selectedExpeditionIds.length})
            </button>
          </div>
        }
      />

      {/* 4. Centralized Filter Sidebar Organism */}
      <ExpeditionFilterDrawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        activeFilterCount={activeFilterCount}
        totalFiltered={totalFiltered}
        totalExpeditions={totalFiltered}
        searchQuery={filters.searchQuery || ''}
        onSearchChange={(val) => setFilter('searchQuery', val)}
        searchEtd={filters.searchEtd || ''}
        onSearchEtdChange={(val) => setFilter('searchEtd', val)}
        selectedCategory={filters.selectedCategory || 'Semua Kategori'}
        onCategoryChange={(val) => setFilter('selectedCategory', val)}
        categories={expeditionCategoriesList}
        statusFilter={filters.statusFilter || 'all'}
        onStatusFilterChange={(val) => setFilter('statusFilter', val)}
        defaultFilter={filters.defaultFilter || 'all'}
        onDefaultFilterChange={(val) => setFilter('defaultFilter', val)}
        minRate={filters.minRate || ''}
        onMinRateChange={(val) => setFilter('minRate', val)}
        maxRate={filters.maxRate || ''}
        onMaxRateChange={(val) => setFilter('maxRate', val)}
        onResetFilters={handleResetFilters}
      />

      {/* Confirmation Modal - Single Expedition Delete */}
      <ConfirmationModal
        isOpen={!!expeditionToDelete}
        onClose={() => setExpeditionToDelete(null)}
        onConfirm={confirmDeleteSingle}
        title="Konfirmasi Hapus Layanan Ekspedisi"
        subtitle="Tindakan ini tidak dapat dibatalkan."
        message={`Apakah Anda yakin ingin menghapus layanan ${expeditionToDelete?.name} (${expeditionToDelete?.service})?`}
        confirmText="Hapus Layanan"
        variant="danger"
      >
        {expeditionToDelete && (
          <div className="bg-neutral-50 p-3 rounded-none border border-neutral-200 text-xs font-sport space-y-1">
            <div className="flex justify-between">
              <span className="text-neutral-500">Kode Ekspedisi:</span>
              <span className="font-mono font-bold text-neutral-900 uppercase">{expeditionToDelete.code}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Tarif Dasar:</span>
              <span className="font-mono font-bold text-neutral-900">{formatRupiah(expeditionToDelete.base_cost || 0)}</span>
            </div>
          </div>
        )}
      </ConfirmationModal>

      {/* Confirmation Modal - Bulk Expedition Delete */}
      <ConfirmationModal
        isOpen={isBulkDeleteOpen}
        onClose={() => setIsBulkDeleteOpen(false)}
        onConfirm={confirmBulkDelete}
        title="Konfirmasi Hapus Massal Ekspedisi"
        subtitle="Tindakan ini tidak dapat dibatalkan."
        message={`Apakah Anda yakin ingin menghapus ${selectedExpeditionIds.length} layanan ekspedisi terpilih? Seluruh konfigurasi tarif layanan terkait akan dihapus.`}
        confirmText={`Hapus ${selectedExpeditionIds.length} Ekspedisi`}
        variant="danger"
      />
    </div>
  );
}
