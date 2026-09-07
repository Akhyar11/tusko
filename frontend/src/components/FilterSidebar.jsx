import React, { useState } from 'react';
import { 
  Filter, 
  RotateCcw, 
  ChevronDown, 
  ChevronUp, 
  Star, 
  Check, 
  BadgeCheck, 
  Truck, 
  Percent,
  X
} from 'lucide-react';
import { formatRupiah } from '../utils/formatters';

export default function FilterSidebar({
  categories = [],
  selectedCategoryId = null,
  onSelectCategory = () => {},
  minPrice = '',
  maxPrice = '',
  onPriceChange = () => {},
  onlyOfficial = false,
  onToggleOfficial = () => {},
  onlyFreeShipping = false,
  onToggleFreeShipping = () => {},
  onlyDiscount = false,
  onToggleDiscount = () => {},
  minRating = 0,
  onSelectMinRating = () => {},
  selectedLocation = '',
  onSelectLocation = () => {},
  locations = [],
  productCountsByCategory = {},
  onResetFilters = () => {},
  isMobileOpen = false,
  onCloseMobile = () => {}
}) {
  const [openSections, setOpenSections] = useState({
    category: true,
    price: true,
    offer: true,
    rating: true,
    location: true
  });

  const toggleSection = (section) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const hasActiveFilters = 
    selectedCategoryId !== null ||
    minPrice !== '' ||
    maxPrice !== '' ||
    onlyOfficial ||
    onlyFreeShipping ||
    onlyDiscount ||
    minRating > 0 ||
    selectedLocation !== '';

  const content = (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 shadow-2xs space-y-5">
      {/* Sidebar Header */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-200">
        <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
          <Filter size={16} className="text-emerald-600" />
          <span>Filter Produk</span>
        </h3>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw size={12} />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* 1. Kategori Section */}
      <div>
        <button
          type="button"
          onClick={() => toggleSection('category')}
          className="w-full flex items-center justify-between text-xs font-bold text-gray-900 mb-2.5 cursor-pointer"
        >
          <span>Kategori</span>
          {openSections.category ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {openSections.category && (
          <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
            <button
              type="button"
              onClick={() => onSelectCategory(null)}
              className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer ${
                selectedCategoryId === null
                  ? 'bg-emerald-50 text-emerald-700 font-bold'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span>Semua Kategori</span>
            </button>

            {categories.map((cat) => {
              const count = productCountsByCategory[cat.id] || 0;
              const isSelected = selectedCategoryId === cat.id;

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => onSelectCategory(isSelected ? null : cat.id)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-50 text-emerald-700 font-bold'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span className="truncate">{cat.name}</span>
                  <span className="text-[10px] text-gray-400 font-normal ml-1">({count})</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. Penawaran & Badge Section */}
      <div className="pt-3 border-t border-gray-100">
        <button
          type="button"
          onClick={() => toggleSection('offer')}
          className="w-full flex items-center justify-between text-xs font-bold text-gray-900 mb-2.5 cursor-pointer"
        >
          <span>Penawaran</span>
          {openSections.offer ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {openSections.offer && (
          <div className="space-y-2 text-xs">
            <label className="flex items-center gap-2 text-gray-700 hover:text-gray-900 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={onlyOfficial}
                onChange={onToggleOfficial}
                className="rounded text-emerald-600 focus:ring-emerald-500 border-gray-300 w-4 h-4"
              />
              <span className="flex items-center gap-1 font-medium">
                <BadgeCheck size={14} className="text-emerald-600" />
                Official Store
              </span>
            </label>

            <label className="flex items-center gap-2 text-gray-700 hover:text-gray-900 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={onlyFreeShipping}
                onChange={onToggleFreeShipping}
                className="rounded text-emerald-600 focus:ring-emerald-500 border-gray-300 w-4 h-4"
              />
              <span className="flex items-center gap-1 font-medium">
                <Truck size={14} className="text-amber-500" />
                Bebas Ongkir
              </span>
            </label>

            <label className="flex items-center gap-2 text-gray-700 hover:text-gray-900 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={onlyDiscount}
                onChange={onToggleDiscount}
                className="rounded text-emerald-600 focus:ring-emerald-500 border-gray-300 w-4 h-4"
              />
              <span className="flex items-center gap-1 font-medium">
                <Percent size={14} className="text-rose-500" />
                Lagi Diskon
              </span>
            </label>
          </div>
        )}
      </div>

      {/* 3. Rentang Harga Section */}
      <div className="pt-3 border-t border-gray-100">
        <button
          type="button"
          onClick={() => toggleSection('price')}
          className="w-full flex items-center justify-between text-xs font-bold text-gray-900 mb-2.5 cursor-pointer"
        >
          <span>Harga (Rp)</span>
          {openSections.price ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {openSections.price && (
          <div className="space-y-2">
            <div className="relative">
              <span className="absolute left-2.5 top-2 text-[11px] text-gray-400 font-semibold">Rp</span>
              <input
                type="number"
                placeholder="Harga Minimum"
                value={minPrice}
                onChange={(e) => onPriceChange('min', e.target.value)}
                className="w-full pl-8 pr-2 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500 focus:bg-white"
              />
            </div>
            <div className="relative">
              <span className="absolute left-2.5 top-2 text-[11px] text-gray-400 font-semibold">Rp</span>
              <input
                type="number"
                placeholder="Harga Maksimum"
                value={maxPrice}
                onChange={(e) => onPriceChange('max', e.target.value)}
                className="w-full pl-8 pr-2 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500 focus:bg-white"
              />
            </div>

            {/* Quick Price Filters */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => { onPriceChange('min', ''); onPriceChange('max', '100000'); }}
                className="px-2 py-1 bg-gray-100 hover:bg-emerald-50 hover:text-emerald-700 text-gray-600 rounded text-[10px] cursor-pointer"
              >
                &lt; 100 rb
              </button>
              <button
                type="button"
                onClick={() => { onPriceChange('min', '100000'); onPriceChange('max', '1000000'); }}
                className="px-2 py-1 bg-gray-100 hover:bg-emerald-50 hover:text-emerald-700 text-gray-600 rounded text-[10px] cursor-pointer"
              >
                100 rb - 1 jt
              </button>
              <button
                type="button"
                onClick={() => { onPriceChange('min', '1000000'); onPriceChange('max', ''); }}
                className="px-2 py-1 bg-gray-100 hover:bg-emerald-50 hover:text-emerald-700 text-gray-600 rounded text-[10px] cursor-pointer"
              >
                &gt; 1 jt
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. Rating Section */}
      <div className="pt-3 border-t border-gray-100">
        <button
          type="button"
          onClick={() => toggleSection('rating')}
          className="w-full flex items-center justify-between text-xs font-bold text-gray-900 mb-2.5 cursor-pointer"
        >
          <span>Rating</span>
          {openSections.rating ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {openSections.rating && (
          <div className="space-y-1.5 text-xs">
            {[4.8, 4.5, 4.0].map((starVal) => (
              <button
                key={starVal}
                type="button"
                onClick={() => onSelectMinRating(minRating === starVal ? 0 : starVal)}
                className={`w-full flex items-center gap-1.5 px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                  minRating === starVal
                    ? 'bg-emerald-50 text-emerald-700 font-bold'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center text-amber-500">
                  <Star size={13} className="fill-current" />
                </div>
                <span>{starVal} ke atas</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 5. Lokasi Pengiriman */}
      {locations.length > 0 && (
        <div className="pt-3 border-t border-gray-100">
          <button
            type="button"
            onClick={() => toggleSection('location')}
            className="w-full flex items-center justify-between text-xs font-bold text-gray-900 mb-2.5 cursor-pointer"
          >
            <span>Lokasi</span>
            {openSections.location ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {openSections.location && (
            <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
              {locations.map((loc) => {
                const isSelected = selectedLocation === loc;
                return (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => onSelectLocation(isSelected ? '' : loc)}
                    className={`w-full text-left px-2 py-1 rounded-lg text-xs truncate transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50 text-emerald-700 font-bold'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {loc}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Always rendered in grid layout) */}
      <aside className="hidden lg:block w-64 shrink-0">
        <div className="sticky top-20">
          {content}
        </div>
      </aside>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div 
            onClick={onCloseMobile}
            className="fixed inset-0 bg-black/50 backdrop-blur-2xs"
          />

          {/* Drawer Content */}
          <div className="relative ml-auto w-4/5 max-w-sm h-full bg-white shadow-2xl p-4 overflow-y-auto z-10 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-200">
                <h3 className="font-bold text-gray-900 text-sm">Filter Produk</h3>
                <button
                  onClick={onCloseMobile}
                  className="p-1 rounded-lg text-gray-500 hover:bg-gray-100 cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>
              {content}
            </div>

            <div className="pt-4 mt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onCloseMobile}
                className="w-full py-2.5 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
              >
                Terapkan Filter
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
