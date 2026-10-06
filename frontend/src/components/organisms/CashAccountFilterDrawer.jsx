import React from 'react';
import { SlidersHorizontal, X, RotateCcw, Check, Coins } from 'lucide-react';
import SearchBar from '../molecules/SearchBar';
import ServerSideSelect from '../molecules/ServerSideSelect';

/**
 * Organism: CashAccountFilterDrawer
 * Right-to-left centralized drawer for filtering Master Kas Toko
 */
export default function CashAccountFilterDrawer({
  isOpen = false,
  onClose = () => {},
  activeFilterCount = 0,
  searchQuery = '',
  onSearchQueryChange = () => {},
  statusFilter = 'all',
  onStatusFilterChange = () => {},
  coaFilter = 'all',
  onCoaFilterChange = () => {},
  coaOptions = [],
  onResetFilters = () => {}
}) {
  const statusOptions = [
    { value: 'all', label: 'Semua Status Akun' },
    { value: 'true', label: '🟢 Aktif (Siap Digunakan)' },
    { value: 'false', label: '⚪ Nonaktif (Ditutup Sementara)' }
  ];

  const fullCoaOptions = [
    { value: 'all', label: 'Semua Bagan Akun (COA)' },
    ...coaOptions
  ];

  return (
    <div 
      className={`fixed inset-0 z-50 transition-all duration-300 ${
        isOpen ? 'visible opacity-100 pointer-events-auto' : 'invisible opacity-0 pointer-events-none'
      }`}
      aria-hidden={!isOpen}
    >
      {/* Backdrop overlay */}
      <div 
        className="fixed inset-0 bg-neutral-950/60 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
      />

      {/* Drawer panel sliding in from right */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div 
          className={`w-screen max-w-md bg-white border-l border-neutral-300 shadow-2xl flex flex-col transform transition-transform duration-300 ease-out rounded-none ${
            isOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          {/* Drawer Header */}
          <div className="p-5 sm:p-6 bg-neutral-950 text-white flex items-center justify-between border-b border-neutral-800 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-neutral-900 border border-neutral-700 text-amber-400 flex items-center justify-center rounded-none font-black">
                <Coins size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-black font-sport uppercase tracking-wider text-white">
                    Filter Kas Toko
                  </h2>
                  {activeFilterCount > 0 && (
                    <span className="px-2 py-0.5 bg-amber-400 text-neutral-950 font-mono font-black text-[10px] rounded-none">
                      {activeFilterCount} AKTIF
                    </span>
                  )}
                </div>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Saring kasir, kas kecil, dan brankas tunai toko
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-900 border border-transparent hover:border-neutral-800 rounded-none transition-colors cursor-pointer"
              title="Tutup Filter"
            >
              <X size={20} />
            </button>
          </div>

          {/* Drawer Body (Filter Controls) */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
            {/* 1. Pencarian Nama Akun Kas */}
            <div className="space-y-2">
              <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900">
                Cari Nama Akun Kas / Catatan
              </label>
              <SearchBar
                value={searchQuery}
                onChange={onSearchQueryChange}
                placeholder="Ketik nama kasir, brankas..."
              />
            </div>

            {/* 2. Status Keaktifan */}
            <div className="space-y-2">
              <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900">
                Status Operasional Akun
              </label>
              <ServerSideSelect
                value={statusFilter}
                onChange={onStatusFilterChange}
                options={statusOptions}
                placeholder="Pilih status operasional..."
              />
            </div>

            {/* 3. Pemetaan Chart of Accounts (COA) */}
            <div className="space-y-2">
              <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900">
                Chart of Accounts (COA) Terhubung
              </label>
              <ServerSideSelect
                value={coaFilter}
                onChange={onCoaFilterChange}
                options={fullCoaOptions}
                placeholder="Pilih mapping akun COA..."
              />
            </div>
          </div>

          {/* Drawer Footer Actions */}
          <div className="p-5 sm:p-6 bg-neutral-50 border-t border-neutral-200 shrink-0 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onResetFilters}
              disabled={activeFilterCount === 0 && !searchQuery}
              className="px-4 py-2.5 border border-neutral-300 hover:border-neutral-400 bg-white text-neutral-700 hover:text-neutral-900 text-xs font-sport font-bold uppercase tracking-wider rounded-none flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <RotateCcw size={14} />
              <span>Reset</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-neutral-950 hover:bg-neutral-900 text-white border border-neutral-950 text-xs font-sport font-black uppercase tracking-wider rounded-none flex items-center gap-2 cursor-pointer shadow-xs transition-all"
            >
              <Check size={15} className="text-amber-400" />
              <span>Terapkan Filter</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
