import React from 'react';
import { SlidersHorizontal, X, RotateCcw, Check, Building2 } from 'lucide-react';
import SearchBar from '../molecules/SearchBar';
import ServerSideSelect from '../molecules/ServerSideSelect';

/**
 * Organism: BankFilterDrawer
 * Right-to-left centralized drawer for filtering Master Bank
 */
export default function BankFilterDrawer({
  isOpen = false,
  onClose = () => {},
  activeFilterCount = 0,
  searchQuery = '',
  onSearchQueryChange = () => {},
  statusFilter = 'all',
  onStatusFilterChange = () => {},
  onResetFilters = () => {}
}) {
  const statusOptions = [
    { value: 'all', label: 'Semua Status Bank' },
    { value: 'true', label: '🟢 Aktif (Bisa Dipilih)' },
    { value: 'false', label: '⚪ Nonaktif (Ditutup)' }
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
                <Building2 size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-black font-sport uppercase tracking-wider text-white">
                    Filter Master Bank
                  </h2>
                  {activeFilterCount > 0 && (
                    <span className="px-2 py-0.5 bg-amber-400 text-neutral-950 font-mono font-black text-[10px] rounded-none">
                      {activeFilterCount} AKTIF
                    </span>
                  )}
                </div>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Saring data lembaga perbankan berdasarkan kode dan nama
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-900 border border-transparent hover:border-neutral-800 rounded-none transition-colors cursor-pointer"
              title="Tutup Filter"
            >
              <X size={18} />
            </button>
          </div>

          {/* Drawer Body - Filter Controls */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
            {/* Filter 1: Pencarian Kode / Nama Bank */}
            <div className="space-y-2">
              <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900">
                Pencarian Nama / Kode Bank
              </label>
              <SearchBar
                value={searchQuery}
                onChange={onSearchQueryChange}
                placeholder="Cari kode (BCA, MANDIRI) atau nama bank..."
              />
            </div>

            {/* Filter 2: Status Aktif Bank */}
            <div className="space-y-2">
              <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900">
                Status Operasional Bank
              </label>
              <ServerSideSelect
                value={statusFilter}
                onChange={onStatusFilterChange}
                options={statusOptions}
                placeholder="Pilih status bank..."
              />
            </div>
          </div>

          {/* Drawer Footer - Action Buttons */}
          <div className="p-4 sm:p-5 bg-neutral-50 border-t border-neutral-300 flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onResetFilters}
              disabled={activeFilterCount === 0 && !searchQuery}
              className="flex-1 py-2.5 px-3 bg-white hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed border border-neutral-300 text-neutral-800 text-xs font-sport font-black uppercase tracking-wider flex items-center justify-center gap-2 rounded-none transition-colors cursor-pointer"
            >
              <RotateCcw size={14} />
              <span>Reset Filter</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-3 bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-sport font-black uppercase tracking-wider flex items-center justify-center gap-2 rounded-none transition-colors cursor-pointer"
            >
              <Check size={14} className="text-amber-400" />
              <span>Terapkan</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
