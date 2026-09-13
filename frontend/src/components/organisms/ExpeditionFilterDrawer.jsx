import React from 'react';
import { SlidersHorizontal, X, RotateCcw, Check, Truck } from 'lucide-react';
import SearchBar from '../molecules/SearchBar';
import ServerSideSelect from '../molecules/ServerSideSelect';

/**
 * Organism: ExpeditionFilterDrawer
 * Right-to-left centralized drawer for Expedition & Shipping courier filtering
 */
export default function ExpeditionFilterDrawer({
  isOpen = false,
  onClose = () => {},
  activeFilterCount = 0,
  totalFiltered = 0,
  totalExpeditions = 0,
  searchQuery = '',
  onSearchChange = () => {},
  selectedCategory = 'Semua Kategori',
  onCategoryChange = () => {},
  categories = [],
  statusFilter = 'all',
  onStatusFilterChange = () => {},
  onResetFilters = () => {}
}) {
  const statusOptions = [
    { value: 'all', label: 'Semua Status Layanan' },
    { value: 'active', label: 'Layanan Aktif (Bisa Dipilih)' },
    { value: 'inactive', label: 'Layanan Nonaktif' }
  ];

  const categoryOptions = [
    { value: 'Semua Kategori', label: 'Semua Kategori Layanan' },
    ...categories.filter(c => c !== 'Semua Kategori').map((cat) => ({
      value: cat,
      label: cat
    }))
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
                    Filter Jasa Ekspedisi
                  </h2>
                  {activeFilterCount > 0 && (
                    <span className="px-1.5 py-0.2 bg-amber-400 text-black font-mono font-bold text-[10px] rounded-none">
                      {activeFilterCount}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Menampilkan {totalFiltered} dari {totalExpeditions} kurir ekspedisi
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-900 rounded-none transition-colors cursor-pointer"
              title="Tutup Filter Drawer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Drawer Body Form Controls */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
            
            {/* 1. Pencarian Ekspedisi */}
            <div className="space-y-2">
              <label className="block text-xs font-black uppercase font-sport tracking-wider text-neutral-900">
                Pencarian Nama Kurir & Layanan
              </label>
              <SearchBar
                value={searchQuery}
                onChange={onSearchChange}
                placeholder="Cari kurir (J&T, JNE, SiCepat, dll)..."
                autoFocus={isOpen}
              />
            </div>

            {/* 2. Kategori Layanan */}
            <div className="space-y-2">
              <label className="block text-xs font-black uppercase font-sport tracking-wider text-neutral-900">
                Kategori Layanan Kurir
              </label>
              <ServerSideSelect
                options={categoryOptions}
                value={selectedCategory}
                onChange={onCategoryChange}
                placeholder="Pilih kategori layanan..."
              />
            </div>

            {/* 3. Status Layanan */}
            <div className="space-y-2">
              <label className="block text-xs font-black uppercase font-sport tracking-wider text-neutral-900">
                Status Keaktifan Ekspedisi
              </label>
              <ServerSideSelect
                options={statusOptions}
                value={statusFilter}
                onChange={onStatusFilterChange}
                placeholder="Pilih status layanan..."
              />
            </div>
          </div>

          {/* Drawer Footer Actions */}
          <div className="p-4 sm:p-5 bg-neutral-50 border-t border-neutral-300 flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onResetFilters}
              disabled={activeFilterCount === 0}
              className={`flex-1 py-2.5 px-4 font-sport font-black uppercase text-xs rounded-none border transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                activeFilterCount > 0
                  ? 'bg-white hover:bg-neutral-100 text-neutral-900 border-neutral-300 shadow-2xs'
                  : 'bg-neutral-100 text-neutral-400 border-neutral-200 cursor-not-allowed'
              }`}
            >
              <RotateCcw size={14} />
              <span>Reset Filter</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 bg-neutral-950 hover:bg-neutral-900 text-white font-sport font-black uppercase text-xs rounded-none transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <Check size={14} className="text-amber-400" />
              <span>Terapkan ({totalFiltered})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
