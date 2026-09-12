import React from 'react';
import { SlidersHorizontal, X, RotateCcw, Check } from 'lucide-react';
import ServerSideSelect from '../molecules/ServerSideSelect';

/**
 * Organism: CategoryFilterDrawer
 * Right-to-left centralized drawer for filtering master categories
 */
export default function CategoryFilterDrawer({
  isOpen = false,
  onClose = () => {},
  activeFilterCount = 0,
  totalFiltered = 0,
  totalCategories = 0,
  // Filter states
  productStatusFilter = 'all',
  onProductStatusFilterChange = () => {},
  iconFilter = 'all',
  onIconFilterChange = () => {},
  sortOption = 'name_asc',
  onSortOptionChange = () => {},
  onResetFilters = () => {}
}) {
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
                    Filter Master Kategori
                  </h2>
                  {activeFilterCount > 0 && (
                    <span className="px-2 py-0.5 bg-amber-400 text-neutral-950 font-mono font-black text-[10px] rounded-none">
                      {activeFilterCount} AKTIF
                    </span>
                  )}
                </div>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Saring master kategori berdasarkan relasi produk & simbol
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
            {/* 1. Kondisi Produk Terkait */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900">
                  Kondisi Produk Terkait
                </label>
                {productStatusFilter !== 'all' && (
                  <button
                    type="button"
                    onClick={() => onProductStatusFilterChange('all')}
                    className="text-[11px] font-sport font-bold uppercase text-amber-700 hover:underline cursor-pointer"
                  >
                    Reset Kondisi
                  </button>
                )}
              </div>
              <ServerSideSelect
                value={productStatusFilter === 'all' ? '' : productStatusFilter}
                onChange={(val) => onProductStatusFilterChange(val || 'all')}
                options={[
                  { value: 'all', label: 'Semua Kondisi' },
                  { value: 'with_products', label: '📦 Kategori Berisi Produk (≥ 1)' },
                  { value: 'empty', label: '⚪ Kategori Kosong (0 Produk)' }
                ]}
                placeholder="Pilih kondisi pengisian..."
                isClearable={productStatusFilter !== 'all'}
                scrollPadding={30}
              />
            </div>

            {/* 2. Simbol Ikon Kategori */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900">
                  Simbol Ikon Kategori
                </label>
                {iconFilter !== 'all' && (
                  <button
                    type="button"
                    onClick={() => onIconFilterChange('all')}
                    className="text-[11px] font-sport font-bold uppercase text-amber-700 hover:underline cursor-pointer"
                  >
                    Reset Ikon
                  </button>
                )}
              </div>
              <ServerSideSelect
                value={iconFilter === 'all' ? '' : iconFilter}
                onChange={(val) => onIconFilterChange(val || 'all')}
                options={[
                  { value: 'all', label: 'Semua Simbol Ikon' },
                  { value: 'Shirt', label: '👕 Shirt (Jersey & Pakaian)' },
                  { value: 'Footprints', label: '👟 Footprints (Sepatu & Boots)' },
                  { value: 'Dumbbell', label: '🏋️ Dumbbell (Peralatan & Gym)' },
                  { value: 'Shield', label: '🛡️ Shield (Aksesoris & Deker)' },
                  { value: 'Zap', label: '⚡ Zap (Running & Marathon)' },
                  { value: 'Trophy', label: '🏆 Trophy (Futsal & Sepakbola)' },
                  { value: 'Activity', label: '📈 Activity (Training & Fitness)' },
                  { value: 'Sparkles', label: '✨ Sparkles (Koleksi Pro Player)' },
                  { value: 'Tag', label: '🏷️ Tag (Kategori Umum)' }
                ]}
                placeholder="Pilih simbol ikon..."
                isClearable={iconFilter !== 'all'}
                scrollPadding={30}
              />
            </div>

            {/* 3. Urutan Master Kategori */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900">
                  Urutan Katalog Master
                </label>
                {sortOption !== 'name_asc' && (
                  <button
                    type="button"
                    onClick={() => onSortOptionChange('name_asc')}
                    className="text-[11px] font-sport font-bold uppercase text-amber-700 hover:underline cursor-pointer"
                  >
                    Reset Urutan
                  </button>
                )}
              </div>
              <ServerSideSelect
                value={sortOption === 'name_asc' ? '' : sortOption}
                onChange={(val) => onSortOptionChange(val || 'name_asc')}
                options={[
                  { value: 'name_asc', label: 'Nama Kategori (A - Z)' },
                  { value: 'name_desc', label: 'Nama Kategori (Z - A)' },
                  { value: 'products_desc', label: 'Jumlah Produk Terbanyak' },
                  { value: 'products_asc', label: 'Jumlah Produk Tersedikit' },
                  { value: 'newest', label: 'Terkini / ID Terbaru' }
                ]}
                placeholder="Pilih urutan kategori..."
                isClearable={sortOption !== 'name_asc'}
                scrollPadding={30}
              />
            </div>
          </div>

          {/* Drawer Footer Actions */}
          <div className="p-4 sm:p-5 bg-neutral-50 border-t border-neutral-300 flex items-center justify-between gap-3 shrink-0">
            <button
              type="button"
              onClick={onResetFilters}
              disabled={activeFilterCount === 0}
              className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-neutral-100 text-neutral-800 border border-neutral-300 font-sport font-black uppercase text-xs rounded-none transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RotateCcw size={14} />
              <span>Reset Filter</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 bg-black hover:bg-neutral-800 text-white font-sport font-black uppercase text-xs rounded-none transition-colors cursor-pointer shadow-xs"
            >
              <Check size={15} className="text-amber-400" />
              <span>Terapkan Filter ({totalFiltered})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
