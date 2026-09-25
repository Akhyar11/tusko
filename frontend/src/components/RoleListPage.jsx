import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  Plus,
  Trash2,
  SlidersHorizontal,
  Edit3,
  Users,
  LayoutGrid,
  Lock
} from 'lucide-react';
import IconButton from './atoms/IconButton';
import ServerSideTable from './ServerSideTable';
import RoleFilterDrawer from './organisms/RoleFilterDrawer';
import ConfirmationModal from './ConfirmationModal';
import RowActionMenu from './molecules/RowActionMenu';
import { roleService } from '../services/roleService';
import { useRoleTableStore } from '../stores/useRoleTableStore';

export default function RoleListPage({
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
    data: roles,
    total,
    isLoading,
    setPage,
    setLimit,
    setSort,
    setFilter,
    resetFilters,
    fetchData
  } = useRoleTableStore();

  const [selectedIds, setSelectedIds] = useState([]);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingRole, setDeletingRole] = useState(null);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);

  const loadRoles = async () => {
    try {
      await fetchData();
    } catch (err) {
      onShowToast('Gagal memuat data role: ' + err.message);
    }
  };

  useEffect(() => {
    loadRoles();
  }, []);

  const metrics = useMemo(() => {
    const systemCount = roles.filter((r) => r.is_system).length;
    const customCount = roles.filter((r) => !r.is_system).length;
    const menuAssignments = roles.reduce((sum, r) => sum + (r.menus_count || 0), 0);
    return { total, systemCount, customCount, menuAssignments };
  }, [roles, total]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.nameSearchQuery) count++;
    if (filters.displayNameSearchQuery) count++;
    if (filters.systemFilter && filters.systemFilter !== 'all') count++;
    if (filters.usersMin !== '' && filters.usersMin !== null) count++;
    if (filters.usersMax !== '' && filters.usersMax !== null) count++;
    if (filters.menusMin !== '' && filters.menusMin !== null) count++;
    if (filters.menusMax !== '' && filters.menusMax !== null) count++;
    return count;
  }, [filters]);

  const handleResetFilters = () => {
    resetFilters();
    onShowToast('Filter master role telah direset.');
  };

  const confirmDelete = async () => {
    if (!deletingRole) return;
    setIsSubmitting(true);
    try {
      await roleService.deleteRole(deletingRole.id);
      onShowToast(`Role "${deletingRole.display_name}" berhasil dihapus.`);
      setDeletingRole(null);
      loadRoles();
    } catch (err) {
      onShowToast(err.message || 'Gagal menghapus role.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectRow = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleSelectAll = () => {
    if (selectedIds.length === roles.length && roles.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(roles.map((r) => r.id));
    }
  };

  const confirmBulkDelete = async () => {
    setIsSubmitting(true);
    let failed = 0;
    for (const id of selectedIds) {
      try {
        await roleService.deleteRole(id);
      } catch {
        failed++;
      }
    }
    const removed = selectedIds.length - failed;
    setSelectedIds([]);
    setIsBulkDeleteOpen(false);
    setIsSubmitting(false);
    loadRoles();
    onShowToast(failed > 0 ? `${removed} role dihapus, ${failed} gagal (sistem/terpakai).` : `${removed} role berhasil dihapus.`);
  };

  const columns = useMemo(() => [
    {
      key: 'name',
      label: 'NAMA ROLE (KEY)',
      sortable: true,
      width: 'min-w-[180px]',
      render: (val, row) => (
        <span className="font-mono font-bold text-xs text-neutral-950 bg-neutral-100 px-2 py-0.5 border border-neutral-300 rounded-none whitespace-nowrap inline-block">
          {row.name}
        </span>
      )
    },
    {
      key: 'display_name',
      label: 'NAMA TAMPILAN',
      sortable: true,
      width: 'min-w-[220px]',
      render: (val, row) => (
        <div className="space-y-0.5">
          <div className="font-sport font-black text-sm text-neutral-950 uppercase tracking-tight leading-snug">
            {row.display_name}
          </div>
          {row.description && (
            <div className="text-[11px] text-neutral-500 truncate max-w-[260px]">{row.description}</div>
          )}
        </div>
      )
    },
    {
      key: 'is_system',
      label: 'TIPE',
      sortable: true,
      align: 'center',
      width: 'w-36 min-w-[120px]',
      render: (val, row) =>
        row.is_system ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] font-sport font-black uppercase tracking-wider bg-neutral-950 text-amber-400 border border-neutral-800 rounded-none whitespace-nowrap">
            <Lock size={11} className="shrink-0" />
            <span>Sistem</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] font-sport font-black uppercase tracking-wider bg-neutral-100 text-neutral-700 border border-neutral-300 rounded-none whitespace-nowrap">
            <ShieldCheck size={11} className="shrink-0" />
            <span>Kustom</span>
          </span>
        )
    },
    {
      key: 'users_count',
      label: 'PENGGUNA',
      sortable: true,
      align: 'center',
      width: 'w-28 min-w-[100px]',
      render: (val, row) => (
        <span className="inline-flex items-center gap-1.5 font-mono font-bold text-xs text-neutral-800">
          <Users size={12} className="text-neutral-400" />
          {row.users_count}
        </span>
      )
    },
    {
      key: 'menus_count',
      label: 'MENU AKSES',
      sortable: true,
      align: 'center',
      width: 'w-32 min-w-[110px]',
      render: (val, row) => (
        <span className="inline-flex items-center gap-1.5 font-mono font-bold text-xs text-neutral-800">
          <LayoutGrid size={12} className="text-neutral-400" />
          {row.menus_count}
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
                  onClick={() => { close(); onNavigateToEdit(row); }}
                  className="w-full px-3.5 py-2 text-xs font-sport font-bold uppercase tracking-wider text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Edit3 size={13} className="text-neutral-500" />
                  <span>Ubah Role</span>
                </button>

                <button
                  type="button"
                  onClick={() => { close(); setDeletingRole(row); }}
                  className="w-full px-3.5 py-2 text-xs font-sport font-bold uppercase tracking-wider text-rose-700 hover:bg-rose-50 hover:text-rose-800 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Trash2 size={13} className="text-rose-600" />
                  <span>Hapus Role</span>
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
              <ShieldCheck size={22} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-neutral-950 font-sport tracking-tight uppercase leading-tight">
                Master Role
              </h1>
              <p className="text-xs text-neutral-600 mt-0.5">
                Kelola peran RBAC (user &rarr; role &rarr; menu) untuk akses panel admin ERP.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start xl:self-auto">
          <IconButton icon={Plus} onClick={onNavigateToCreate} title="Tambah Role Baru" variant="primary" />
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
            <span className="text-xs font-sport font-black uppercase tracking-wider">Total Role</span>
            <ShieldCheck size={16} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black font-sport text-neutral-950">{metrics.total}</span>
          </div>
          <div className="mt-2 text-[11px] border-t border-neutral-100 pt-1.5 text-neutral-500">Role terdaftar</div>
        </div>

        <div className="bg-white p-4 rounded-none border border-neutral-300 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-1.5">
            <span className="text-xs font-sport font-black uppercase tracking-wider">Role Sistem</span>
            <Lock size={16} className="text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black font-sport text-neutral-950">{metrics.systemCount}</span>
          </div>
          <div className="mt-2 text-[11px] border-t border-neutral-100 pt-1.5 text-neutral-500">Terkunci (bawaan)</div>
        </div>

        <div className="bg-white p-4 rounded-none border border-neutral-300 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-1.5">
            <span className="text-xs font-sport font-black uppercase tracking-wider">Role Kustom</span>
            <ShieldCheck size={16} className="text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black font-sport text-emerald-700">{metrics.customCount}</span>
          </div>
          <div className="mt-2 text-[11px] border-t border-neutral-100 pt-1.5 text-neutral-500">Dibuat admin</div>
        </div>

        <div className="bg-white p-4 rounded-none border border-neutral-300 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-1.5">
            <span className="text-xs font-sport font-black uppercase tracking-wider">Akses Menu</span>
            <LayoutGrid size={16} className="text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black font-sport text-amber-700">{metrics.menuAssignments}</span>
          </div>
          <div className="mt-2 text-[11px] border-t border-neutral-100 pt-1.5 text-neutral-500">Penugasan menu</div>
        </div>
      </div>

      <ServerSideTable
        columns={columns}
        data={roles}
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
        onSelectRow={handleSelectRow}
        onSelectAll={handleSelectAll}
        idKey="id"
        bulkActions={
          selectedIds.length > 0 ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-600 font-medium">
                <strong className="font-mono text-neutral-900">{selectedIds.length}</strong> role dipilih
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
        emptyMessage="Belum Ada Role"
        emptyDescription="Sesuaikan filter pencarian atau tambahkan role baru."
      />

      <RoleFilterDrawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        activeFilterCount={activeFilterCount}
        nameSearchQuery={filters.nameSearchQuery || ''}
        onNameSearchQueryChange={(val) => setFilter('nameSearchQuery', val)}
        displayNameSearchQuery={filters.displayNameSearchQuery || ''}
        onDisplayNameSearchQueryChange={(val) => setFilter('displayNameSearchQuery', val)}
        systemFilter={filters.systemFilter || 'all'}
        onSystemFilterChange={(val) => setFilter('systemFilter', val)}
        usersMin={filters.usersMin || ''}
        onUsersMinChange={(val) => setFilter('usersMin', val)}
        usersMax={filters.usersMax || ''}
        onUsersMaxChange={(val) => setFilter('usersMax', val)}
        menusMin={filters.menusMin || ''}
        onMenusMinChange={(val) => setFilter('menusMin', val)}
        menusMax={filters.menusMax || ''}
        onMenusMaxChange={(val) => setFilter('menusMax', val)}
        onResetFilters={handleResetFilters}
      />

      <ConfirmationModal
        isOpen={Boolean(deletingRole)}
        onClose={() => setDeletingRole(null)}
        onConfirm={confirmDelete}
        title="Hapus Role"
        message={`Apakah Anda yakin ingin menghapus role "${deletingRole?.display_name}" (${deletingRole?.name})? Role sistem atau yang masih dipakai pengguna/menu tidak dapat dihapus.`}
        confirmText="Hapus Role"
        cancelText="Batal"
        variant="danger"
        isLoading={isSubmitting}
      />

      <ConfirmationModal
        isOpen={isBulkDeleteOpen}
        onClose={() => setIsBulkDeleteOpen(false)}
        onConfirm={confirmBulkDelete}
        title="Hapus Role Terpilih"
        message={`Apakah Anda yakin ingin menghapus ${selectedIds.length} role yang dipilih? Role sistem/terpakai akan diabaikan demi integritas data.`}
        confirmText={`Hapus ${selectedIds.length} Role`}
        cancelText="Batal"
        variant="danger"
        isLoading={isSubmitting}
      />
    </div>
  );
}
