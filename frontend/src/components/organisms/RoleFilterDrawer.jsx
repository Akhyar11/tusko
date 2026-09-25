import React from 'react';
import { SlidersHorizontal, X, RotateCcw, Check } from 'lucide-react';
import SearchBar from '../molecules/SearchBar';
import ServerSideSelect from '../molecules/ServerSideSelect';
import TextInput from '../molecules/TextInput';
import IconButton from '../atoms/IconButton';

/**
 * Organism: RoleFilterDrawer
 * Sidebar filter kanan-ke-kiri Master Role (T24.3) — mencakup 100% kolom tabel.
 */
export default function RoleFilterDrawer({
  isOpen = false,
  onClose = () => {},
  activeFilterCount = 0,
  nameSearchQuery = '',
  onNameSearchQueryChange = () => {},
  displayNameSearchQuery = '',
  onDisplayNameSearchQueryChange = () => {},
  systemFilter = 'all',
  onSystemFilterChange = () => {},
  usersMin = '',
  onUsersMinChange = () => {},
  usersMax = '',
  onUsersMaxChange = () => {},
  menusMin = '',
  onMenusMinChange = () => {},
  menusMax = '',
  onMenusMaxChange = () => {},
  onResetFilters = () => {}
}) {
  const systemOptions = [
    { value: 'all', label: 'Semua Tipe Role' },
    { value: 'system', label: 'Role Sistem' },
    { value: 'custom', label: 'Role Kustom' }
  ];

  return (
    <div
      className={`fixed inset-0 z-50 transition-all duration-300 ${
        isOpen ? 'visible opacity-100 pointer-events-auto' : 'invisible opacity-0 pointer-events-none'
      }`}
      aria-hidden={!isOpen}
    >
      <div className="fixed inset-0 bg-neutral-950/60 backdrop-blur-[2px] transition-opacity" onClick={onClose} />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div
          className={`w-screen max-w-md bg-white border-l border-neutral-300 shadow-2xl flex flex-col transform transition-transform duration-300 ease-out rounded-none ${
            isOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="p-5 sm:p-6 bg-neutral-950 text-white flex items-center justify-between border-b border-neutral-800 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-neutral-900 border border-neutral-700 text-amber-400 flex items-center justify-center rounded-none font-black">
                <SlidersHorizontal size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-black font-sport uppercase tracking-wider text-white">Filter Master Role</h2>
                  {activeFilterCount > 0 && (
                    <span className="px-2 py-0.5 bg-amber-400 text-neutral-950 font-mono font-black text-[10px] rounded-none">
                      {activeFilterCount} AKTIF
                    </span>
                  )}
                </div>
                <p className="text-xs text-neutral-400 mt-0.5">Saring role berdasarkan nama, tipe, jumlah pengguna & menu</p>
              </div>
            </div>

            <IconButton icon={X} onClick={onClose} title="Tutup Filter" variant="dark" />
          </div>

          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
            <div className="space-y-2">
              <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900">Nama Role (key)</label>
              <SearchBar value={nameSearchQuery} onChange={onNameSearchQueryChange} placeholder="Contoh: warehouse_staff..." />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900">Nama Tampilan</label>
              <SearchBar value={displayNameSearchQuery} onChange={onDisplayNameSearchQueryChange} placeholder="Contoh: Staf Gudang..." />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900">Tipe Role</label>
              <ServerSideSelect
                options={systemOptions}
                value={systemFilter}
                onChange={onSystemFilterChange}
                placeholder="Pilih tipe role..."
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900">Jumlah Pengguna</label>
              <div className="grid grid-cols-2 gap-3">
                <TextInput type="number" min={0} value={usersMin} onChange={onUsersMinChange} placeholder="Min" weight="mono" />
                <TextInput type="number" min={0} value={usersMax} onChange={onUsersMaxChange} placeholder="Maks" weight="mono" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900">Jumlah Menu Akses</label>
              <div className="grid grid-cols-2 gap-3">
                <TextInput type="number" min={0} value={menusMin} onChange={onMenusMinChange} placeholder="Min" weight="mono" />
                <TextInput type="number" min={0} value={menusMax} onChange={onMenusMaxChange} placeholder="Maks" weight="mono" />
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-6 bg-neutral-50 border-t border-neutral-200 flex items-center justify-between gap-3 shrink-0">
            <button
              type="button"
              onClick={onResetFilters}
              className="px-4 py-2.5 bg-white hover:bg-neutral-100 text-neutral-700 border border-neutral-300 text-xs font-sport font-black uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-2 rounded-none"
            >
              <RotateCcw size={14} />
              <span>Reset Filter</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-amber-400 hover:bg-amber-300 text-neutral-950 border border-amber-500 text-xs font-sport font-black uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-2 rounded-none shadow-xs"
            >
              <Check size={15} />
              <span>Terapkan Filter</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
