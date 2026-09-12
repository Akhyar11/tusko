import React from 'react';
import { SlidersHorizontal, X, RotateCcw, Check } from 'lucide-react';
import SearchBar from '../molecules/SearchBar';

/**
 * Organism: ProductFilterDrawer
 * Right-to-left centralized drawer for all product catalog filters & search
 */
export default function ProductFilterDrawer({
  isOpen = false,
  onClose = () => {},
  activeFilterCount = 0,
  totalFiltered = 0,
  totalProducts = 0,
  // Search State
  searchQuery = '',
  onSearchChange = () => {},
  // Filter States
  selectedStatus = 'all',
  onStatusChange = () => {},
  selectedCategory = 'all',
  onCategoryChange = () => {},
  categories = [],
  products = [],
  stockCondition = 'all',
  onStockConditionChange = () => {},
  minPrice = '',
  onMinPriceChange = () => {},
  maxPrice = '',
  onMaxPriceChange = () => {},
  sortBy = 'created_at',
  sortDirection = 'desc',
  onSortChange = () => {},
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
                    Filter & Pencarian
                  </h2>
                  {activeFilterCount > 0 && (
                    <span className="px-2 py-0.5 bg-amber-400 text-black text-[10px] font-mono font-black uppercase rounded-none">
                      {activeFilterCount} Aktif
                    </span>
                  )}
                </div>
                <p className="text-xs text-neutral-400 font-mono mt-0.5">
                  Saring katalog menurut parameter spesifik
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-none bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-700 flex items-center justify-center transition-colors cursor-pointer"
              title="Tutup Filter (Esc)"
            >
              <X size={18} />
            </button>
          </div>

          {/* Drawer Content (Scrollable) */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
            
            {/* 1. Pencarian Produk & SKU */}
            <div className="space-y-2.5 pb-5 border-b border-neutral-200">
              <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900">
                Pencarian Produk & SKU
              </label>
              <SearchBar
                value={searchQuery}
                onChange={onSearchChange}
                onReset={() => onSearchChange('')}
                placeholder="Cari nama produk, SKU, spesifikasi..."
              />
              <div className="flex items-center justify-between text-[11px] font-mono text-neutral-500 pt-0.5">
                <span>Ditemukan <strong className="text-neutral-950 font-bold">{totalFiltered}</strong> dari <strong className="text-neutral-950">{totalProducts}</strong> produk</span>
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => onSearchChange('')}
                    className="text-amber-700 font-sport font-bold uppercase hover:underline cursor-pointer"
                  >
                    Reset Cari
                  </button>
                )}
              </div>
            </div>

            {/* 2. Status Publikasi */}
            <div className="space-y-2.5">
              <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900">
                Status Publikasi Produk
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'all', label: 'Semua' },
                  { id: 'active', label: '🟢 Aktif' },
                  { id: 'inactive', label: '⚪ Draft' }
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => onStatusChange(s.id)}
                    className={`py-2 px-2.5 text-xs font-sport font-bold uppercase rounded-none border transition-colors cursor-pointer text-center ${
                      selectedStatus === s.id
                        ? 'bg-neutral-950 text-white border-neutral-950 shadow-xs'
                        : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-700 border-neutral-300'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Kategori Olahraga */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900">
                  Kategori Olahraga
                </label>
                {selectedCategory !== 'all' && (
                  <button
                    type="button"
                    onClick={() => onCategoryChange('all')}
                    className="text-[11px] font-sport font-bold uppercase text-amber-700 hover:underline cursor-pointer"
                  >
                    Reset Kategori
                  </button>
                )}
              </div>
              <div className="space-y-1.5 max-h-52 overflow-y-auto border border-neutral-200 p-2 bg-neutral-50/50 rounded-none">
                <button
                  type="button"
                  onClick={() => onCategoryChange('all')}
                  className={`w-full text-left px-3 py-2 text-xs font-sport font-bold uppercase rounded-none border transition-colors flex items-center justify-between cursor-pointer ${
                    selectedCategory === 'all'
                      ? 'bg-neutral-950 text-white border-neutral-950 shadow-xs'
                      : 'bg-white hover:bg-neutral-100 text-neutral-800 border-neutral-200'
                  }`}
                >
                  <span>Semua Kategori</span>
                  <span className="font-mono text-[11px] opacity-80">{totalProducts}</span>
                </button>
                {categories.map((cat) => {
                  const catCount = products.filter(p => p.category_id === cat.id).length;
                  const isSelected = String(selectedCategory) === String(cat.id);
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => onCategoryChange(String(cat.id))}
                      className={`w-full text-left px-3 py-2 text-xs font-sport font-bold uppercase rounded-none border transition-colors flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-neutral-950 text-white border-neutral-950 shadow-xs'
                          : 'bg-white hover:bg-neutral-100 text-neutral-800 border-neutral-200'
                      }`}
                    >
                      <span className="truncate">{cat.name}</span>
                      <span className="font-mono text-[11px] opacity-80 ml-2">{catCount}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Kondisi Stok Inventaris */}
            <div className="space-y-2.5">
              <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900">
                Kondisi Stok Inventaris
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'all', label: 'Semua Stok' },
                  { id: 'low', label: '⚠️ Perlu Restok' },
                  { id: 'empty', label: '❌ Stok Habis' },
                  { id: 'ready', label: '✅ Stok Aman' }
                ].map((stk) => (
                  <button
                    key={stk.id}
                    type="button"
                    onClick={() => onStockConditionChange(stk.id)}
                    className={`py-2 px-2.5 text-xs font-sport font-bold uppercase rounded-none border transition-colors cursor-pointer text-center ${
                      stockCondition === stk.id
                        ? 'bg-neutral-950 text-white border-neutral-950 shadow-xs'
                        : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-700 border-neutral-300'
                    }`}
                  >
                    {stk.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Rentang Harga Jual */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900">
                  Rentang Harga Jual (IDR)
                </label>
                {(minPrice || maxPrice) && (
                  <button
                    type="button"
                    onClick={() => { onMinPriceChange(''); onMaxPriceChange(''); }}
                    className="text-[11px] font-sport font-bold uppercase text-amber-700 hover:underline cursor-pointer"
                  >
                    Reset Harga
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <span className="block text-[10px] font-mono text-neutral-500 uppercase mb-1">Harga Minimum</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="Rp Min"
                    value={minPrice}
                    onChange={(e) => onMinPriceChange(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono bg-neutral-50 border border-neutral-300 rounded-none focus:outline-none focus:border-black text-neutral-900"
                  />
                </div>
                <div>
                  <span className="block text-[10px] font-mono text-neutral-500 uppercase mb-1">Harga Maksimum</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="Rp Maks"
                    value={maxPrice}
                    onChange={(e) => onMaxPriceChange(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono bg-neutral-50 border border-neutral-300 rounded-none focus:outline-none focus:border-black text-neutral-900"
                  />
                </div>
              </div>
            </div>

            {/* 5. Urutan Data (Sorting) */}
            <div className="space-y-2.5">
              <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900">
                Urutkan Katalog Berdasarkan
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Terbaru', sort: 'created_at', dir: 'desc' },
                  { label: 'Terlama', sort: 'created_at', dir: 'asc' },
                  { label: 'Harga Tertinggi', sort: 'price', dir: 'desc' },
                  { label: 'Harga Terendah', sort: 'price', dir: 'asc' },
                  { label: 'Stok Terbanyak', sort: 'stock', dir: 'desc' },
                  { label: 'Paling Laris', sort: 'sold_count', dir: 'desc' },
                ].map((sOpt, idx) => {
                  const isSelected = sortBy === sOpt.sort && sortDirection === sOpt.dir;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => onSortChange(sOpt.sort, sOpt.dir)}
                      className={`py-2 px-2 text-xs font-sport font-bold uppercase rounded-none border transition-colors cursor-pointer text-center truncate ${
                        isSelected
                          ? 'bg-neutral-950 text-white border-neutral-950 shadow-xs'
                          : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-700 border-neutral-300'
                      }`}
                    >
                      {sOpt.label}
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Drawer Footer */}
          <div className="p-4 sm:p-5 bg-neutral-50 border-t border-neutral-300 flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onResetFilters}
              disabled={activeFilterCount === 0}
              className="flex-1 h-11 bg-white hover:bg-neutral-100 disabled:opacity-50 text-neutral-900 font-sport font-black text-xs uppercase tracking-wider rounded-none border border-neutral-300 transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
            >
              <RotateCcw size={14} />
              <span>Reset Filter</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-11 bg-amber-400 hover:bg-amber-300 text-black font-sport font-black text-xs uppercase tracking-wider rounded-none border border-amber-500 transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Check size={16} strokeWidth={2.5} />
              <span>Terapkan ({totalFiltered})</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
