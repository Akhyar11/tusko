import React from 'react';
import ProductCard from './ProductCard';
import { SlidersHorizontal, PackageSearch, X, RotateCcw } from 'lucide-react';
import { formatRupiah } from '../utils/formatters';

export default function ProductGrid({
  products = [],
  sortBy = 'relevant',
  onSortChange = () => {},
  onAddToCart = () => {},
  onSelectProduct = () => {},
  categoryTitle = null,
  searchQuery = '',
  onClearSearch = () => {},
  activeFilters = {},
  onClearFilter = () => {},
  onResetFilters = () => {}
}) {
  const {
    minPrice,
    maxPrice,
    onlyOfficial,
    onlyFreeShipping,
    onlyDiscount,
    minRating,
    selectedLocation
  } = activeFilters;

  const hasAnyFilter = 
    Boolean(categoryTitle) ||
    Boolean(searchQuery) ||
    Boolean(minPrice) ||
    Boolean(maxPrice) ||
    onlyOfficial ||
    onlyFreeShipping ||
    onlyDiscount ||
    (minRating > 0) ||
    Boolean(selectedLocation);

  return (
    <section className="my-6">
      {/* Grid Header & Sort */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-3 border-b border-neutral-200">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg sm:text-xl font-black text-neutral-900 tracking-tight uppercase">
              {searchQuery 
                ? `Hasil Pencarian "${searchQuery}"`
                : categoryTitle 
                  ? `Kategori: ${categoryTitle}` 
                  : 'Koleksi Perlengkapan Olahraga'}
            </h2>
          </div>
          
          <p className="text-xs text-neutral-500 mt-0.5 font-medium">
            {searchQuery
              ? `Ditemukan ${products.length} perlengkapan olahraga yang sesuai`
              : `Menampilkan ${products.length} produk pilihan terbaik`}
          </p>
        </div>

        {/* Sort Options */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-500 hidden sm:inline flex items-center gap-1 font-semibold">
            <SlidersHorizontal size={14} />
            Urutkan:
          </span>
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="text-xs font-semibold bg-white border border-neutral-300 rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 cursor-pointer text-neutral-800 shadow-2xs"
          >
            <option value="relevant">Paling Sesuai</option>
            <option value="price_low">Harga Terendah</option>
            <option value="price_high">Harga Tertinggi</option>
            <option value="rating">Rating Tertinggi</option>
            <option value="latest">Terbaru</option>
          </select>
        </div>
      </div>

      {/* Active Filter Chips Bar */}
      {hasAnyFilter && (
        <div className="flex items-center flex-wrap gap-2 mb-4 p-2.5 bg-neutral-100 rounded-xl">
          <span className="text-[11px] font-black uppercase tracking-wider text-neutral-500 mr-1">
            Filter Aktif:
          </span>

          {searchQuery && (
            <span className="inline-flex items-center gap-1 text-[11px] bg-white border border-neutral-300 text-neutral-800 px-2.5 py-1 rounded-lg font-bold shadow-2xs">
              <span>Cari: "{searchQuery}"</span>
              <button 
                type="button" 
                onClick={onClearSearch}
                className="hover:text-rose-600 cursor-pointer ml-0.5"
                title="Hapus pencarian"
              >
                <X size={12} />
              </button>
            </span>
          )}

          {categoryTitle && (
            <span className="inline-flex items-center gap-1 text-[11px] bg-white border border-neutral-300 text-neutral-800 px-2.5 py-1 rounded-lg font-bold shadow-2xs">
              <span>Kategori: {categoryTitle}</span>
              <button 
                type="button" 
                onClick={() => onClearFilter('category')}
                className="hover:text-rose-600 cursor-pointer ml-0.5"
                title="Hapus filter kategori"
              >
                <X size={12} />
              </button>
            </span>
          )}

          {onlyOfficial && (
            <span className="inline-flex items-center gap-1 text-[11px] bg-white border border-neutral-300 text-neutral-800 px-2.5 py-1 rounded-lg font-bold shadow-2xs">
              <span>Tusko Pro Official</span>
              <button 
                type="button" 
                onClick={() => onClearFilter('onlyOfficial')}
                className="hover:text-rose-600 cursor-pointer ml-0.5"
              >
                <X size={12} />
              </button>
            </span>
          )}

          {onlyFreeShipping && (
            <span className="inline-flex items-center gap-1 text-[11px] bg-white border border-neutral-300 text-neutral-800 px-2.5 py-1 rounded-lg font-bold shadow-2xs">
              <span>Bebas Ongkir</span>
              <button 
                type="button" 
                onClick={() => onClearFilter('onlyFreeShipping')}
                className="hover:text-rose-600 cursor-pointer ml-0.5"
              >
                <X size={12} />
              </button>
            </span>
          )}

          {onlyDiscount && (
            <span className="inline-flex items-center gap-1 text-[11px] bg-white border border-neutral-300 text-neutral-800 px-2.5 py-1 rounded-lg font-bold shadow-2xs">
              <span>Diskon</span>
              <button 
                type="button" 
                onClick={() => onClearFilter('onlyDiscount')}
                className="hover:text-rose-600 cursor-pointer ml-0.5"
              >
                <X size={12} />
              </button>
            </span>
          )}

          {(minPrice || maxPrice) && (
            <span className="inline-flex items-center gap-1 text-[11px] bg-white border border-neutral-300 text-neutral-800 px-2.5 py-1 rounded-lg font-bold shadow-2xs">
              <span>
                Harga: {minPrice ? formatRupiah(Number(minPrice)) : 'Rp 0'} - {maxPrice ? formatRupiah(Number(maxPrice)) : 'Tak Terbatas'}
              </span>
              <button 
                type="button" 
                onClick={() => onClearFilter('price')}
                className="hover:text-rose-600 cursor-pointer ml-0.5"
              >
                <X size={12} />
              </button>
            </span>
          )}

          {minRating > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] bg-white border border-neutral-300 text-neutral-800 px-2.5 py-1 rounded-lg font-bold shadow-2xs">
              <span>★ {minRating}+ ke atas</span>
              <button 
                type="button" 
                onClick={() => onClearFilter('minRating')}
                className="hover:text-rose-600 cursor-pointer ml-0.5"
              >
                <X size={12} />
              </button>
            </span>
          )}

          {selectedLocation && (
            <span className="inline-flex items-center gap-1 text-[11px] bg-white border border-neutral-300 text-neutral-800 px-2.5 py-1 rounded-lg font-bold shadow-2xs">
              <span>Lokasi: {selectedLocation}</span>
              <button 
                type="button" 
                onClick={() => onClearFilter('location')}
                className="hover:text-rose-600 cursor-pointer ml-0.5"
              >
                <X size={12} />
              </button>
            </span>
          )}

          <button
            type="button"
            onClick={onResetFilters}
            className="text-[11px] font-black uppercase tracking-wider text-rose-600 hover:text-rose-700 hover:underline cursor-pointer ml-auto flex items-center gap-1"
          >
            <RotateCcw size={11} />
            <span>Reset Semua</span>
          </button>
        </div>
      )}

      {/* Grid Content */}
      {products.length === 0 ? (
        <div className="bg-white rounded-2xl border border-neutral-200 p-10 sm:p-12 text-center my-6 shadow-2xs">
          <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto text-neutral-400 mb-4">
            <PackageSearch size={32} />
          </div>
          <h3 className="text-base font-extrabold text-neutral-900 uppercase">
            {searchQuery ? `Tidak ada produk untuk "${searchQuery}"` : 'Produk tidak ditemukan'}
          </h3>
          <p className="text-xs text-neutral-500 mt-1.5 max-w-md mx-auto leading-relaxed">
            Coba periksa kata kunci Anda, gunakan kata umum seperti "jersey", "sepatu", atau reset filter untuk melihat semua koleksi Tusko.
          </p>
          {hasAnyFilter && (
            <button
              type="button"
              onClick={onResetFilters}
              className="mt-4 px-4 py-2 bg-neutral-900 hover:bg-amber-500 hover:text-neutral-950 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Reset Semua Filter
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-3 sm:gap-4">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={onAddToCart}
              onSelectProduct={onSelectProduct}
            />
          ))}
        </div>
      )}
    </section>
  );
}
