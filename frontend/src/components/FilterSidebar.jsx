import React, { useState } from 'react';
import { 
  Filter, 
  RotateCcw, 
  ChevronDown, 
  ChevronUp, 
  Star, 
  BadgeCheck, 
  Truck, 
  Percent,
  X
} from 'lucide-react';

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
    <div className="bg-white rounded-2xl border border-neutral-200/90 p-4 sm:p-5 shadow-xs space-y-5">
      {/* Sidebar Header */}
      <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
        <h3 className="font-black text-neutral-900 text-xs uppercase tracking-wider flex items-center gap-2">
          <Filter size={15} className="text-amber-500" />
          <span>Filter Olahraga</span>
        </h3>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
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
          className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-neutral-900 mb-2.5 cursor-pointer"
        >
          <span>Kategori</span>
          {openSections.category ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {openSections.category && (
          <div className="space-y-1 max-h-52 overflow-y-auto pr-1">
            <button
              type="button"
              onClick={() => onSelectCategory(null)}
              className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                selectedCategoryId === null
                  ? 'bg-neutral-900 text-amber-400 font-bold'
                  : 'text-neutral-700 hover:bg-neutral-100 font-medium'
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
                  className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-neutral-900 text-amber-400 font-bold'
                      : 'text-neutral-700 hover:bg-neutral-100 font-medium'
                  }`}
                >
                  <span className="truncate">{cat.name}</span>
                  <span className={`text-[10px] ml-1 ${isSelected ? 'text-amber-300' : 'text-neutral-400'}`}>({count})</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. Penawaran & Badge Section */}
      <div className="pt-3 border-t border-neutral-100">
        <button
          type="button"
          onClick={() => toggleSection('offer')}
          className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-neutral-900 mb-2.5 cursor-pointer"
        >
          <span>Penawaran</span>
          {openSections.offer ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {openSections.offer && (
          <div className="space-y-2 text-xs">
            <label className="flex items-center gap-2 text-neutral-700 hover:text-neutral-950 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={onlyOfficial}
                onChange={onToggleOfficial}
                className="rounded text-amber-500 focus:ring-amber-400 border-neutral-300 w-4 h-4 cursor-pointer"
              />
              <span className="flex items-center gap-1 font-semibold">
                <BadgeCheck size={14} className="text-amber-500" />
                Tusko Pro Official
              </span>
            </label>

            <label className="flex items-center gap-2 text-neutral-700 hover:text-neutral-950 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={onlyFreeShipping}
                onChange={onToggleFreeShipping}
                className="rounded text-amber-500 focus:ring-amber-400 border-neutral-300 w-4 h-4 cursor-pointer"
              />
              <span className="flex items-center gap-1 font-semibold">
                <Truck size={14} className="text-emerald-600" />
                Bebas Ongkir
              </span>
            </label>

            <label className="flex items-center gap-2 text-neutral-700 hover:text-neutral-950 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={onlyDiscount}
                onChange={onToggleDiscount}
                className="rounded text-amber-500 focus:ring-amber-400 border-neutral-300 w-4 h-4 cursor-pointer"
              />
              <span className="flex items-center gap-1 font-semibold">
                <Percent size={14} className="text-rose-500" />
                Spesial Diskon
              </span>
            </label>
          </div>
        )}
      </div>

      {/* 3. Rentang Harga Section */}
      <div className="pt-3 border-t border-neutral-100">
        <button
          type="button"
          onClick={() => toggleSection('price')}
          className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-neutral-900 mb-2.5 cursor-pointer"
        >
          <span>Rentang Harga</span>
          {openSections.price ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {openSections.price && (
          <div className="space-y-2">
            <div className="relative">
              <span className="absolute left-2.5 top-2 text-[11px] text-neutral-400 font-bold">Rp</span>
              <input
                type="number"
                placeholder="Minimum"
                value={minPrice}
                onChange={(e) => onPriceChange('min', e.target.value)}
                className="w-full pl-8 pr-2 py-1.5 text-xs bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-amber-500 focus:bg-white"
              />
            </div>
            <div className="relative">
              <span className="absolute left-2.5 top-2 text-[11px] text-neutral-400 font-bold">Rp</span>
              <input
                type="number"
                placeholder="Maksimum"
                value={maxPrice}
                onChange={(e) => onPriceChange('max', e.target.value)}
                className="w-full pl-8 pr-2 py-1.5 text-xs bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-amber-500 focus:bg-white"
              />
            </div>

            {/* Quick Price Filters */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => { onPriceChange('min', ''); onPriceChange('max', '250000'); }}
                className="px-2 py-1 bg-neutral-100 hover:bg-amber-50 hover:text-amber-800 text-neutral-700 rounded-lg text-[10px] font-semibold cursor-pointer"
              >
                &lt; 250 rb
              </button>
              <button
                type="button"
                onClick={() => { onPriceChange('min', '250000'); onPriceChange('max', '500000'); }}
                className="px-2 py-1 bg-neutral-100 hover:bg-amber-50 hover:text-amber-800 text-neutral-700 rounded-lg text-[10px] font-semibold cursor-pointer"
              >
                250 rb - 500 rb
              </button>
              <button
                type="button"
                onClick={() => { onPriceChange('min', '500000'); onPriceChange('max', ''); }}
                className="px-2 py-1 bg-neutral-100 hover:bg-amber-50 hover:text-amber-800 text-neutral-700 rounded-lg text-[10px] font-semibold cursor-pointer"
              >
                &gt; 500 rb
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. Rating Section */}
      <div className="pt-3 border-t border-neutral-100">
        <button
          type="button"
          onClick={() => toggleSection('rating')}
          className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-neutral-900 mb-2.5 cursor-pointer"
        >
          <span>Rating Ulasan</span>
          {openSections.rating ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {openSections.rating && (
          <div className="space-y-1 text-xs">
            {[4.8, 4.5, 4.0].map((starVal) => (
              <button
                key={starVal}
                type="button"
                onClick={() => onSelectMinRating(minRating === starVal ? 0 : starVal)}
                className={`w-full flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl transition-colors cursor-pointer ${
                  minRating === starVal
                    ? 'bg-neutral-900 text-amber-400 font-bold'
                    : 'text-neutral-700 hover:bg-neutral-100 font-medium'
                }`}
              >
                <div className="flex items-center text-amber-500">
                  <Star size={13} className="fill-current" />
                </div>
                <span>{starVal} bintang ke atas</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 5. Lokasi Pengiriman */}
      {locations.length > 0 && (
        <div className="pt-3 border-t border-neutral-100">
          <button
            type="button"
            onClick={() => toggleSection('location')}
            className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-neutral-900 mb-2.5 cursor-pointer"
          >
            <span>Lokasi Gudang</span>
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
                    className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs truncate transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-neutral-900 text-amber-400 font-bold'
                        : 'text-neutral-700 hover:bg-neutral-100 font-medium'
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
            className="fixed inset-0 bg-black/60 backdrop-blur-2xs"
          />

          {/* Drawer Content */}
          <div className="relative ml-auto w-4/5 max-w-sm h-full bg-white shadow-2xl p-4 overflow-y-auto z-10 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-neutral-200">
                <h3 className="font-black text-neutral-900 text-xs uppercase tracking-wider">Filter Olahraga</h3>
                <button
                  onClick={onCloseMobile}
                  className="p-1.5 rounded-xl text-neutral-500 hover:bg-neutral-100 cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>
              {content}
            </div>

            <div className="pt-4 mt-4 border-t border-neutral-200">
              <button
                type="button"
                onClick={onCloseMobile}
                className="w-full py-2.5 bg-neutral-900 text-white hover:bg-amber-500 hover:text-neutral-950 font-black uppercase tracking-wider text-xs rounded-xl shadow-md cursor-pointer transition-colors"
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
