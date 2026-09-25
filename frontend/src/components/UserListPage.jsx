import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Plus,
  Trash2,
  SlidersHorizontal,
  Edit3,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  UserCheck,
  MailWarning,
  KeyRound
} from 'lucide-react';
import IconButton from './atoms/IconButton';
import ServerSideTable from './ServerSideTable';
import UserFilterDrawer from './organisms/UserFilterDrawer';
import ConfirmationModal from './ConfirmationModal';
import RowActionMenu from './molecules/RowActionMenu';
import { userService } from '../services/userService';
import { useUserTableStore } from '../stores/useUserTableStore';

export default function UserListPage({
  onShowToast = () => {},
  onNavigateToCreate = () => {},
  onNavigateToEdit = () => {},
  onNavigateToRoles = () => {}
}) {
  const {
    page,
    limit,
    sortBy,
    sortDirection,
    filters,
    data: users,
    total,
    isLoading,
    setPage,
    setLimit,
    setSort,
    setFilter,
    resetFilters,
    fetchData
  } = useUserTableStore();

  const [selectedIds, setSelectedIds] = useState([]);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingUser, setDeletingUser] = useState(null);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);

  const loadUsers = async () => {
    try {
      await fetchData();
    } catch (err) {
      onShowToast('Gagal memuat data pengguna: ' + err.message);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const metrics = useMemo(() => {
    const adminCount = users.filter((u) => u.role === 'admin').length;
    const activeCount = users.filter((u) => u.is_active).length;
    const unverifiedCount = users.filter((u) => !u.email_verified_at).length;
    return { total, adminCount, activeCount, unverifiedCount };
  }, [users, total]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.nameSearchQuery) count++;
    if (filters.emailSearchQuery) count++;
    if (filters.phoneSearchQuery) count++;
    if (filters.roleFilter && filters.roleFilter !== 'all') count++;
    if (filters.roleIdFilter && filters.roleIdFilter !== 'all') count++;
    if (filters.statusFilter && filters.statusFilter !== 'all') count++;
    if (filters.verifiedFilter && filters.verifiedFilter !== 'all') count++;
    return count;
  }, [filters]);

  const handleResetFilters = () => {
    resetFilters();
    onShowToast('Filter master users telah direset.');
  };

  const handleToggleStatus = async (user) => {
    try {
      await userService.updateUser(user.id, { is_active: !user.is_active });
      loadUsers();
      onShowToast(`Akun "${user.name}" berhasil ${user.is_active ? 'dinonaktifkan' : 'diaktifkan'}.`);
    } catch (err) {
      onShowToast('Gagal memperbarui status akun: ' + err.message);
    }
  };

  const confirmDelete = async () => {
    if (!deletingUser) return;
    setIsSubmitting(true);
    try {
      await userService.deleteUser(deletingUser.id);
      onShowToast(`Akun "${deletingUser.name}" berhasil dihapus.`);
      setDeletingUser(null);
      loadUsers();
    } catch (err) {
      onShowToast(err.message || 'Gagal menghapus akun.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectRow = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleSelectAll = () => {
    if (selectedIds.length === users.length && users.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(users.map((u) => u.id));
    }
  };

  const confirmBulkDelete = async () => {
    setIsSubmitting(true);
    let failed = 0;
    for (const id of selectedIds) {
      try {
        await userService.deleteUser(id);
      } catch {
        failed++;
      }
    }
    const removed = selectedIds.length - failed;
    setSelectedIds([]);
    setIsBulkDeleteOpen(false);
    setIsSubmitting(false);
    loadUsers();
    onShowToast(failed > 0 ? `${removed} akun dihapus, ${failed} gagal diproses.` : `${removed} akun berhasil dihapus.`);
  };

  const columns = useMemo(() => [
    {
      key: 'name',
      label: 'PENGGUNA',
      sortable: true,
      width: 'min-w-[240px]',
      render: (val, row) => (
        <div className="space-y-0.5">
          <div className="font-sport font-black text-sm text-neutral-950 uppercase tracking-tight leading-snug">
            {row.name}
          </div>
          <div className="text-[11px] text-neutral-500 truncate max-w-[240px]">{row.email}</div>
        </div>
      )
    },
    {
      key: 'phone',
      label: 'TELEPON',
      sortable: false,
      width: 'min-w-[150px]',
      render: (val, row) => (
        <span className="font-mono text-xs text-neutral-700">{row.phone || '-'}</span>
      )
    },
    {
      key: 'role',
      label: 'ROLE & AKSES',
      sortable: true,
      width: 'min-w-[190px]',
      render: (val, row) => {
        const roles = row.roles || [];
        return (
          <div className="space-y-1">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] font-sport font-black uppercase tracking-wider border rounded-none whitespace-nowrap ${
                row.role === 'admin'
                  ? 'bg-neutral-950 text-amber-400 border-neutral-800'
                  : 'bg-neutral-100 text-neutral-700 border-neutral-300'
              }`}
            >
              <ShieldCheck size={11} className="shrink-0" />
              <span>{row.role === 'admin' ? 'Admin' : 'Customer'}</span>
            </span>
            {roles.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {roles.map((role) => (
                  <span
                    key={role.id}
                    className="inline-block px-2 py-0.5 text-[10px] font-sport font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200 rounded-none whitespace-nowrap"
                  >
                    {role.display_name || role.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        );
      }
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
      key: 'email_verified_at',
      label: 'VERIFIKASI EMAIL',
      sortable: false,
      align: 'center',
      width: 'w-40 min-w-[150px]',
      render: (val, row) =>
        row.email_verified_at ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] font-sport font-black uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-none whitespace-nowrap">
            <UserCheck size={11} className="shrink-0" />
            <span>Terverifikasi</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] font-sport font-black uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-300 rounded-none whitespace-nowrap">
            <MailWarning size={11} className="shrink-0" />
            <span>Belum</span>
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
                  <span>Ubah Akun</span>
                </button>

                <button
                  type="button"
                  onClick={() => { close(); onNavigateToRoles(row); }}
                  className="w-full px-3.5 py-2 text-xs font-sport font-bold uppercase tracking-wider text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <KeyRound size={13} className="text-neutral-500" />
                  <span>Assign Role</span>
                </button>

                <button
                  type="button"
                  onClick={() => { close(); handleToggleStatus(row); }}
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
                  onClick={() => { close(); setDeletingUser(row); }}
                  className="w-full px-3.5 py-2 text-xs font-sport font-bold uppercase tracking-wider text-rose-700 hover:bg-rose-50 hover:text-rose-800 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Trash2 size={13} className="text-rose-600" />
                  <span>Hapus Akun</span>
                </button>
              </>
            )}
          </RowActionMenu>
        </div>
      )
    }
  ], [onNavigateToEdit, onNavigateToRoles]);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-none border border-neutral-300 shadow-2xs">
        <div className="min-w-0">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-none bg-neutral-950 text-amber-400 flex items-center justify-center font-black shrink-0">
              <Users size={22} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-neutral-950 font-sport tracking-tight uppercase leading-tight">
                Master Users
              </h1>
              <p className="text-xs text-neutral-600 mt-0.5">
                Kelola akun pengguna dan akses role (user &rarr; role &rarr; menu) untuk operasional admin ERP.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start xl:self-auto">
          <IconButton icon={Plus} onClick={onNavigateToCreate} title="Tambah Pengguna Baru" variant="primary" />
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
            <span className="text-xs font-sport font-black uppercase tracking-wider">Total Pengguna</span>
            <Users size={16} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black font-sport text-neutral-950">{metrics.total}</span>
          </div>
          <div className="mt-2 text-[11px] border-t border-neutral-100 pt-1.5 text-neutral-500">Akun terdaftar</div>
        </div>

        <div className="bg-white p-4 rounded-none border border-neutral-300 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-1.5">
            <span className="text-xs font-sport font-black uppercase tracking-wider">Admin</span>
            <ShieldCheck size={16} className="text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black font-sport text-neutral-950">{metrics.adminCount}</span>
          </div>
          <div className="mt-2 text-[11px] border-t border-neutral-100 pt-1.5 text-neutral-500">Akses panel admin</div>
        </div>

        <div className="bg-white p-4 rounded-none border border-neutral-300 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-1.5">
            <span className="text-xs font-sport font-black uppercase tracking-wider">Aktif</span>
            <CheckCircle2 size={16} className="text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black font-sport text-emerald-700">{metrics.activeCount}</span>
          </div>
          <div className="mt-2 text-[11px] border-t border-neutral-100 pt-1.5 text-neutral-500">Dapat masuk sistem</div>
        </div>

        <div className="bg-white p-4 rounded-none border border-neutral-300 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-1.5">
            <span className="text-xs font-sport font-black uppercase tracking-wider">Belum Verifikasi</span>
            <MailWarning size={16} className="text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black font-sport text-amber-700">{metrics.unverifiedCount}</span>
          </div>
          <div className="mt-2 text-[11px] border-t border-neutral-100 pt-1.5 text-neutral-500">Email belum terverifikasi</div>
        </div>
      </div>

      <ServerSideTable
        columns={columns}
        data={users}
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
                <strong className="font-mono text-neutral-900">{selectedIds.length}</strong> akun dipilih
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
        emptyMessage="Belum Ada Pengguna"
        emptyDescription="Sesuaikan filter pencarian atau tambahkan akun pengguna baru."
      />

      <UserFilterDrawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        activeFilterCount={activeFilterCount}
        nameSearchQuery={filters.nameSearchQuery || ''}
        onNameSearchQueryChange={(val) => setFilter('nameSearchQuery', val)}
        emailSearchQuery={filters.emailSearchQuery || ''}
        onEmailSearchQueryChange={(val) => setFilter('emailSearchQuery', val)}
        phoneSearchQuery={filters.phoneSearchQuery || ''}
        onPhoneSearchQueryChange={(val) => setFilter('phoneSearchQuery', val)}
        roleFilter={filters.roleFilter || 'all'}
        onRoleFilterChange={(val) => setFilter('roleFilter', val)}
        roleIdFilter={filters.roleIdFilter || 'all'}
        onRoleIdFilterChange={(val) => setFilter('roleIdFilter', val)}
        statusFilter={filters.statusFilter || 'all'}
        onStatusFilterChange={(val) => setFilter('statusFilter', val)}
        verifiedFilter={filters.verifiedFilter || 'all'}
        onVerifiedFilterChange={(val) => setFilter('verifiedFilter', val)}
        onResetFilters={handleResetFilters}
      />

      <ConfirmationModal
        isOpen={Boolean(deletingUser)}
        onClose={() => setDeletingUser(null)}
        onConfirm={confirmDelete}
        title="Hapus Akun Pengguna"
        message={`Apakah Anda yakin ingin menghapus akun "${deletingUser?.name}" (${deletingUser?.email})? Riwayat transaksi terkait akan tetap tersimpan.`}
        confirmText="Hapus Akun"
        cancelText="Batal"
        variant="danger"
        isLoading={isSubmitting}
      />

      <ConfirmationModal
        isOpen={isBulkDeleteOpen}
        onClose={() => setIsBulkDeleteOpen(false)}
        onConfirm={confirmBulkDelete}
        title="Hapus Akun Terpilih"
        message={`Apakah Anda yakin ingin menghapus ${selectedIds.length} akun yang dipilih sekaligus? Tindakan ini tidak dapat dibatalkan.`}
        confirmText={`Hapus ${selectedIds.length} Akun`}
        cancelText="Batal"
        variant="danger"
        isLoading={isSubmitting}
      />
    </div>
  );
}
