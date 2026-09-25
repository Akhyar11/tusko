import React, { useState, useEffect, useMemo } from 'react';
import {
  Menu as MenuIcon,
  Plus,
  Trash2,
  SlidersHorizontal,
  Edit3,
  CheckCircle2,
  XCircle,
  LayoutGrid,
  MonitorSmartphone,
  ShieldCheck
} from 'lucide-react';
import IconButton from './atoms/IconButton';
import ServerSideTable from './ServerSideTable';
import MenuFilterDrawer from './organisms/MenuFilterDrawer';
import ConfirmationModal from './ConfirmationModal';
import RowActionMenu from './molecules/RowActionMenu';
import { menuService } from '../services/menuService';
import { useMenuTableStore } from '../stores/useMenuTableStore';

export default function MenuListPage({
  onShowToast = () => {},
  onNavigateToCreate = () => {},
  onNavigateToEdit = () => {}
}) {
  const {
    page,
    limit,
    sortBy,
    sortDirection,
    filters,
    data: menus,
    total,
    isLoading,
    setPage,
    setLimit,
    setSort,
    setFilter,
    resetFilters,
    fetchData
  } = useMenuTableStore();

  const [selectedIds, setSelectedIds] = useState([]);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingMenu, setDeletingMenu] = useState(null);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);

  const loadMenus = async () => {
    try {
      await fetchData();
    } catch (err) {
      onShowToast('Gagal memuat data menu: ' + err.message);
    }
  };

  useEffect(() => {
    loadMenus();
  }, []);

  const metrics = useMemo(() => {
    const adminCount = menus.filter((m) => m.environment === 'admin').length;
    const storefrontCount = menus.filter((m) => m.environment === 'storefront').length;
    const activeCount = menus.filter((m) => m.is_active).length;

    return { total, adminCount, storefrontCount, activeCount };
  }, [menus, total]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.searchQuery) count++;
    if (filters.pathSearchQuery) count++;
    if (filters.viewSearchQuery) count++;
    if (filters.sectionSearchQuery) count++;
    if (filters.environmentFilter && filters.environmentFilter !== 'all') count++;
    if (filters.roleFilter && filters.roleFilter !== 'all') count++;
    if (filters.statusFilter && filters.statusFilter !== 'all') count++;
    if (filters.featureFlagFilter && filters.featureFlagFilter !== 'all') count++;
    if (filters.sortOrderMin !== '' && filters.sortOrderMin !== null) count++;
    if (filters.sortOrderMax !== '' && filters.sortOrderMax !== null) count++;
    return count;
  }, [filters]);

  const handleResetFilters = () => {
    resetFilters();
    onShowToast('Filter master menu telah direset.');
  };

  const handleToggleStatus = async (menu) => {
    try {
      const updated = await menuService.toggleStatus(menu.id);
      loadMenus();
      const isActive = updated?.is_active;
      onShowToast(`Menu "${menu.label}" berhasil ${isActive ? 'diaktifkan' : 'dinonaktifkan'}.`);
    } catch (err) {
      onShowToast('Gagal memperbarui status menu: ' + err.message);
    }
  };

  const confirmDelete = async () => {
    if (!deletingMenu) return;
    setIsSubmitting(true);
    try {
      await menuService.deleteMenu(deletingMenu.id);
      onShowToast(`Menu "${deletingMenu.label}" berhasil dihapus.`);
      setDeletingMenu(null);
      loadMenus();
    } catch (err) {
      onShowToast(err.message || 'Gagal menghapus menu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectRow = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleSelectAll = () => {
    if (selectedIds.length === menus.length && menus.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(menus.map((m) => m.id));
    }
  };

  const confirmBulkDelete = async () => {
    setIsSubmitting(true);
    let failed = 0;
    for (const id of selectedIds) {
      try {
        await menuService.deleteMenu(id);
      } catch {
        failed++;
      }
    }
    const removed = selectedIds.length - failed;
    setSelectedIds([]);
    setIsBulkDeleteOpen(false);
    setIsSubmitting(false);
    loadMenus();
    onShowToast(failed > 0 ? `${removed} menu dihapus, ${failed} gagal diproses.` : `${removed} menu berhasil dihapus.`);
  };

  const columns = useMemo(() => [
    {
      key: 'label',
      label: 'LABEL MENU',
      sortable: true,
      width: 'min-w-[240px]',
      render: (val, row) => (
        <div className="space-y-0.5">
          <div className="font-sport font-black text-sm text-neutral-950 uppercase tracking-tight leading-snug">
            {row.label}
          </div>
          <div className="text-[11px] text-neutral-500 flex items-center gap-1.5">
            <LayoutGrid size={11} className="text-neutral-400 shrink-0" />
            <span className="truncate max-w-[220px]">{row.section || '-'}</span>
          </div>
          {row.sublabel && (
            <div className="text-[11px] text-neutral-400 truncate max-w-[240px]">{row.sublabel}</div>
          )}
        </div>
      )
    },
    {
      key: 'path_prefix',
      label: 'PATH PREFIX',
      sortable: true,
      width: 'min-w-[180px]',
      render: (val, row) => (
        <span className="font-mono font-bold text-xs text-neutral-950 bg-neutral-100 px-2 py-0.5 border border-neutral-300 rounded-none whitespace-nowrap inline-block">
          {row.path_prefix}
        </span>
      )
    },
    {
      key: 'view_key',
      label: 'VIEW KEY',
      width: 'min-w-[140px]',
      render: (val, row) => (
        <span className="font-mono text-[11px] text-neutral-600">{row.view_key || '-'}</span>
      )
    },
    {
      key: 'environment',
      label: 'ENVIRONMENT',
      sortable: true,
      align: 'center',
      width: 'w-40 min-w-[140px]',
      render: (val, row) =>
        row.environment === 'admin' ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] font-sport font-black uppercase tracking-wider bg-neutral-950 text-amber-400 border border-neutral-800 rounded-none whitespace-nowrap">
            <ShieldCheck size={11} className="shrink-0" />
            <span>Admin ERP</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] font-sport font-black uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-none whitespace-nowrap">
            <MonitorSmartphone size={11} className="shrink-0" />
            <span>Storefront</span>
          </span>
        )
    },
    {
      key: 'roles',
      label: 'AKSES ROLE',
      align: 'center',
      width: 'min-w-[160px]',
      render: (val, row) => {
        const roles = row.roles || [];
        if (row.environment !== 'admin') {
          return <span className="text-[10px] font-mono text-neutral-400 uppercase">Publik</span>;
        }
        if (roles.length === 0) {
          return <span className="text-[10px] font-mono text-rose-600 uppercase">Tanpa Role</span>;
        }
        return (
          <div className="flex flex-wrap items-center justify-center gap-1">
            {roles.slice(0, 2).map((role) => (
              <span
                key={role.id}
                className="inline-block px-2 py-0.5 text-[10px] font-sport font-bold uppercase tracking-wider bg-neutral-100 text-neutral-800 border border-neutral-300 rounded-none whitespace-nowrap"
              >
                {role.display_name || role.name}
              </span>
            ))}
            {roles.length > 2 && (
              <span className="inline-block px-2 py-0.5 text-[10px] font-mono font-black bg-amber-100 text-amber-900 border border-amber-300 rounded-none">
                +{roles.length - 2}
              </span>
            )}
          </div>
        );
      }
    },
    {
      key: 'sort_order',
      label: 'URUTAN',
      sortable: true,
      align: 'center',
      width: 'w-24 min-w-[80px]',
      render: (val, row) => (
        <span className="font-mono font-bold text-xs text-neutral-800">{row.sort_order}</span>
      )
    },
    {
      key: 'is_active',
      label: 'STATUS',
      sortable: true,
      align: 'center',
      width: 'w-28 min-w-[110px]',
      render: (val, row) => (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] font-sport font-black uppercase tracking-wider border rounded-none whitespace-nowrap ${
            row.is_active
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
              : 'bg-neutral-100 text-neutral-600 border-neutral-300'
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-none shrink-0 ${row.is_active ? 'bg-emerald-500' : 'bg-neutral-400'}`} />
          <span>{row.is_active ? 'Aktif' : 'Nonaktif'}</span>
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
                  onClick={() => {
                    close();
                    onNavigateToEdit(row);
                  }}
                  className="w-full px-3.5 py-2 text-xs font-sport font-bold uppercase tracking-wider text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Edit3 size={13} className="text-neutral-500" />
                  <span>Ubah Menu</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    close();
                    handleToggleStatus(row);
                  }}
                  className="w-full px-3.5 py-2 text-xs font-sport font-bold uppercase tracking-wider text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  {row.is_active ? (
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
                    close();
                    setDeletingMenu(row);
                  }}
                  className="w-full px-3.5 py-2 text-xs font-sport font-bold uppercase tracking-wider text-rose-700 hover:bg-rose-50 hover:text-rose-800 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Trash2 size={13} className="text-rose-600" />
                  <span>Hapus Menu</span>
                </button>
              </>
            )}
          </RowActionMenu>
        </div>
      )
    }
  ], [onNavigateToEdit]);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-none border border-neutral-300 shadow-2xs">
        <div className="min-w-0">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-none bg-neutral-950 text-amber-400 flex items-center justify-center font-black shrink-0">
              <MenuIcon size={22} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-neutral-950 font-sport tracking-tight uppercase leading-tight">
                Master Menu &amp; Akses
              </h1>
              <p className="text-xs text-neutral-600 mt-0.5">
                Kelola navigasi admin/storefront dari database dan tentukan akses halaman per-role (user &rarr; role &rarr; menu).
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start xl:self-auto">
          <IconButton icon={Plus} onClick={onNavigateToCreate} title="Tambah Menu Baru" variant="primary" />
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
            <span className="text-xs font-sport font-black uppercase tracking-wider">Total Menu</span>
            <MenuIcon size={16} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black font-sport text-neutral-950">{metrics.total}</span>
          </div>
          <div className="mt-2 text-[11px] border-t border-neutral-100 pt-1.5 text-neutral-500">Navigasi terdaftar</div>
        </div>

        <div className="bg-white p-4 rounded-none border border-neutral-300 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-1.5">
            <span className="text-xs font-sport font-black uppercase tracking-wider">Menu Admin</span>
            <ShieldCheck size={16} className="text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black font-sport text-neutral-950">{metrics.adminCount}</span>
          </div>
          <div className="mt-2 text-[11px] border-t border-neutral-100 pt-1.5 text-neutral-500">Halaman admin ERP</div>
        </div>

        <div className="bg-white p-4 rounded-none border border-neutral-300 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-1.5">
            <span className="text-xs font-sport font-black uppercase tracking-wider">Menu Storefront</span>
            <MonitorSmartphone size={16} className="text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black font-sport text-neutral-950">{metrics.storefrontCount}</span>
          </div>
          <div className="mt-2 text-[11px] border-t border-neutral-100 pt-1.5 text-neutral-500">Publik tanpa role</div>
        </div>

        <div className="bg-white p-4 rounded-none border border-neutral-300 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-1.5">
            <span className="text-xs font-sport font-black uppercase tracking-wider">Menu Aktif</span>
            <CheckCircle2 size={16} className="text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black font-sport text-emerald-700">{metrics.activeCount}</span>
          </div>
          <div className="mt-2 text-[11px] border-t border-neutral-100 pt-1.5 text-neutral-500">Tampil di navigasi</div>
        </div>
      </div>

      <ServerSideTable
        columns={columns}
        data={menus}
        total={total}
        page={page}
        limit={limit}
        limitOptions={[10, 25, 50, 100]}
        onPageChange={(p) => {
          setPage(p);
        }}
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
        selectedIds={selectedIds}
        onSelectRow={handleSelectRow}
        onSelectAll={handleSelectAll}
        idKey="id"
        bulkActions={
          selectedIds.length > 0 ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-600 font-medium">
                <strong className="font-mono text-neutral-900">{selectedIds.length}</strong> menu dipilih
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
        emptyMessage="Belum Ada Menu Terdaftar"
        emptyDescription="Sesuaikan filter pencarian atau tambahkan entri menu navigasi baru."
      />

      <MenuFilterDrawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        activeFilterCount={activeFilterCount}
        searchQuery={filters.searchQuery || ''}
        onSearchQueryChange={(val) => setFilter('searchQuery', val)}
        pathSearchQuery={filters.pathSearchQuery || ''}
        onPathSearchQueryChange={(val) => setFilter('pathSearchQuery', val)}
        viewSearchQuery={filters.viewSearchQuery || ''}
        onViewSearchQueryChange={(val) => setFilter('viewSearchQuery', val)}
        sectionSearchQuery={filters.sectionSearchQuery || ''}
        onSectionSearchQueryChange={(val) => setFilter('sectionSearchQuery', val)}
        environmentFilter={filters.environmentFilter || 'all'}
        onEnvironmentFilterChange={(val) => setFilter('environmentFilter', val)}
        roleFilter={filters.roleFilter || 'all'}
        onRoleFilterChange={(val) => setFilter('roleFilter', val)}
        statusFilter={filters.statusFilter || 'all'}
        onStatusFilterChange={(val) => setFilter('statusFilter', val)}
        featureFlagFilter={filters.featureFlagFilter || 'all'}
        onFeatureFlagFilterChange={(val) => setFilter('featureFlagFilter', val)}
        sortOrderMin={filters.sortOrderMin || ''}
        onSortOrderMinChange={(val) => setFilter('sortOrderMin', val)}
        sortOrderMax={filters.sortOrderMax || ''}
        onSortOrderMaxChange={(val) => setFilter('sortOrderMax', val)}
        onResetFilters={handleResetFilters}
      />

      <ConfirmationModal
        isOpen={Boolean(deletingMenu)}
        onClose={() => setDeletingMenu(null)}
        onConfirm={confirmDelete}
        title="Hapus Menu Navigasi"
        message={`Apakah Anda yakin ingin menghapus menu "${deletingMenu?.label}" (${deletingMenu?.path_prefix})? Akses halaman terkait pada role yang memakainya akan dicabut.`}
        confirmText="Hapus Menu"
        cancelText="Batal"
        variant="danger"
        isLoading={isSubmitting}
      />

      <ConfirmationModal
        isOpen={isBulkDeleteOpen}
        onClose={() => setIsBulkDeleteOpen(false)}
        onConfirm={confirmBulkDelete}
        title="Hapus Menu Terpilih"
        message={`Apakah Anda yakin ingin menghapus ${selectedIds.length} menu yang dipilih sekaligus? Tindakan ini mengubah navigasi dan akses role secara langsung.`}
        confirmText={`Hapus ${selectedIds.length} Menu`}
        cancelText="Batal"
        variant="danger"
        isLoading={isSubmitting}
      />
    </div>
  );
}
