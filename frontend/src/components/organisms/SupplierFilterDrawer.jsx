import React from 'react';
import { SlidersHorizontal, X, RotateCcw, Check } from 'lucide-react';
import SearchBar from '../molecules/SearchBar';
import ServerSideSelect from '../molecules/ServerSideSelect';

/**
 * Organism: SupplierFilterDrawer
 * Right-to-left centralized drawer for filtering master suppliers and vendors
 */
export default function SupplierFilterDrawer({
  isOpen = false,
  onClose = () => {},
  activeFilterCount = 0,
  // Search state
  searchQuery = '',
  onSearchQueryChange = () => {},
  codeSearchQuery = '',
  onCodeSearchQueryChange = () => {},
  // Filter states
  statusFilter = 'all',
  onStatusFilterChange = () => {},
  categoryFilter = 'all',
  onCategoryFilterChange = () => {},
  onResetFilters = () => {}
}) {
  const statusOptions = [
    { value: 'all', label: 'Semua Status Kemitraan' },
    { value: 'active', label: '🟢 Aktif (Kerjasama Berjalan)' },
    { value: 'inactive', label: '⚪ Nonaktif (Kemitraan Dijeda)' }
  ];

  const categoryOptions = [
    { value: 'all', label: 'Semua Kategori Pasokan' },
    { value: 'Apparel', label: 'Apparel (Jersey, Celana, Jaket)' },
    { value: 'Footwear', label: 'Footwear (Sepatu Lari, Insole)' },
    { value: 'Accessories', label: 'Accessories & Gym Gear' }
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
                <SlidersHorizontal size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-black font-sport uppercase tracking-wider text-white">
                    Filter Supplier &amp; Vendor
                  </h2>
                  {activeFilterCount > 0 && (
                    <span className="px-2 py-0.5 bg-amber-400 text-neutral-950 font-mono font-black text-[10px] rounded-none">
                      {activeFilterCount} AKTIF
                    </span>
                  )}
                </div>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Saring direktori supplier berdasarkan nama, kode, dan termin
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
            {/* 1. Pencarian Nama Perusahaan / PIC */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900">
                  Nama Perusahaan / PIC
                </label>
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => onSearchQueryChange('')}
                    className="text-[11px] font-sport font-bold uppercase text-amber-700 hover:underline cursor-pointer"
                  >
                    Reset
                  </button>
                )}
              </div>
              <SearchBar
                value={searchQuery}
                onChange={onSearchQueryChange}
                placeholder="Ketik nama vendor atau nama PIC..."
              />
            </div>

            {/* 2. Pencarian Kode Vendor */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900">
                  Kode Vendor (SKU / ID)
                </label>
                {codeSearchQuery && (
                  <button
                    type="button"
                    onClick={() => onCodeSearchQueryChange('')}
                    className="text-[11px] font-sport font-bold uppercase text-amber-700 hover:underline cursor-pointer"
                  >
                    Reset
                  </button>
                )}
              </div>
              <SearchBar
                value={codeSearchQuery}
                onChange={onCodeSearchQueryChange}
                placeholder="Contoh: VND-001..."
              />
            </div>

            {/* 3. Filter Status Kemitraan */}
            <div className="space-y-2">
              <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900">
                Status Kemitraan
              </label>
              <ServerSideSelect
                options={statusOptions}
                value={statusFilter}
                onChange={onStatusFilterChange}
                placeholder="Pilih status kemitraan..."
              />
            </div>

            {/* 4. Filter Kategori Pasokan */}
            <div className="space-y-2">
              <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900">
                Kategori Pasokan Produk
              </label>
              <ServerSideSelect
                options={categoryOptions}
                value={categoryFilter}
                onChange={onCategoryFilterChange}
                placeholder="Pilih kategori pasokan..."
              />
            </div>
          </div>

          {/* Drawer Footer */}
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
