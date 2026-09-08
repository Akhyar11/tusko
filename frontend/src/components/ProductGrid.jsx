import React from 'react';
import ProductCard from './ProductCard';
import { X, RotateCcw, PackageSearch } from 'lucide-react';

export default function ProductGrid({
  products = [],
  currentUser = null,
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
    <section id="product-catalog" className="py-8 sm:py-14 bg-neutral-50 border-t border-neutral-200 px-3 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Catalog Header (Benchmark: prototype/beranda.html) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 pb-3 border-b border-neutral-200 gap-3">
          <div>
            <span className="text-[9px] sm:text-[10px] font-bold text-amber-600 uppercase tracking-widest block">
              {hasAnyFilter ? 'HASIL KATALOG RESMI' : 'PRODUK UNGGULAN RESMI'}
            </span>
            <h2 className="font-sport font-black text-xl sm:text-3xl uppercase italic tracking-tight text-black">
              {searchQuery 
                ? `PENCARIAN: "${searchQuery}"`
                : categoryTitle 
                  ? categoryTitle.toUpperCase()
                  : 'RILIS TERBARU TUSKO'}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-neutral-500 font-bold uppercase">Urutkan:</span>
            <select 
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              className="bg-white border border-neutral-300 font-bold text-xs py-1.5 px-2.5 focus:outline-none focus:border-black cursor-pointer"
            >
              <option value="relevant">Paling Sesuai</option>
              <option value="price-asc">Harga: Rendah ke Tinggi</option>
              <option value="price-desc">Harga: Tinggi ke Rendah</option>
              <option value="newest">Produk Terbaru</option>
              <option value="rating">Rating Tertinggi</option>
            </select>
          </div>
        </div>

        {/* Active Filter Chips (if any filter is applied) */}
        {hasAnyFilter && (
          <div className="flex items-center gap-2 flex-wrap mb-5 pb-3 border-b border-neutral-200/60">
            <span className="text-[11px] text-neutral-500 font-bold uppercase">Filter Aktif:</span>
            {searchQuery && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-black text-white text-[11px] font-bold uppercase">
                Kata Kunci: "{searchQuery}"
                <button type="button" onClick={onClearSearch} className="hover:text-amber-400 cursor-pointer">
                  <X size={12} />
                </button>
              </span>
            )}
            {categoryTitle && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-black text-white text-[11px] font-bold uppercase">
                Kategori: {categoryTitle}
                <button type="button" onClick={() => onClearFilter('category')} className="hover:text-amber-400 cursor-pointer">
                  <X size={12} />
                </button>
              </span>
            )}
            {minPrice && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-neutral-200 text-black text-[11px] font-bold uppercase">
                Min: Rp {Number(minPrice).toLocaleString('id-ID')}
                <button type="button" onClick={() => onClearFilter('minPrice')} className="hover:text-red-600 cursor-pointer">
                  <X size={12} />
                </button>
              </span>
            )}
            {maxPrice && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-neutral-200 text-black text-[11px] font-bold uppercase">
                Maks: Rp {Number(maxPrice).toLocaleString('id-ID')}
                <button type="button" onClick={() => onClearFilter('maxPrice')} className="hover:text-red-600 cursor-pointer">
                  <X size={12} />
                </button>
              </span>
            )}
            {onlyOfficial && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-500 text-black text-[11px] font-black uppercase">
                Official
                <button type="button" onClick={() => onClearFilter('onlyOfficial')} className="hover:text-white cursor-pointer">
                  <X size={12} />
                </button>
              </span>
            )}
            {onlyFreeShipping && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-600 text-white text-[11px] font-bold uppercase">
                Bebas Ongkir
                <button type="button" onClick={() => onClearFilter('onlyFreeShipping')} className="hover:text-amber-300 cursor-pointer">
                  <X size={12} />
                </button>
              </span>
            )}
            {onlyDiscount && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-rose-600 text-white text-[11px] font-bold uppercase">
                Diskon
                <button type="button" onClick={() => onClearFilter('onlyDiscount')} className="hover:text-amber-300 cursor-pointer">
                  <X size={12} />
                </button>
              </span>
            )}
            {minRating > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-neutral-200 text-black text-[11px] font-bold uppercase">
                Rating {minRating}+
                <button type="button" onClick={() => onClearFilter('minRating')} className="hover:text-red-600 cursor-pointer">
                  <X size={12} />
                </button>
              </span>
            )}
            {selectedLocation && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-neutral-200 text-black text-[11px] font-bold uppercase">
                Lokasi: {selectedLocation}
                <button type="button" onClick={() => onClearFilter('selectedLocation')} className="hover:text-red-600 cursor-pointer">
                  <X size={12} />
                </button>
              </span>
            )}
            <button
              type="button"
              onClick={onResetFilters}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-neutral-600 hover:text-black uppercase underline ml-2 cursor-pointer"
            >
              <RotateCcw size={11} />
              <span>Reset Semua</span>
            </button>
          </div>
        )}

        {/* Responsive Product Grid: 2 Kolom di Mobile, 4 Kolom di Desktop */}
        {products.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-6">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                currentUser={currentUser}
                onAddToCart={onAddToCart}
                onSelectProduct={onSelectProduct}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white border border-neutral-200 p-12 text-center my-6">
            <PackageSearch size={48} className="mx-auto text-neutral-400 mb-3" />
            <h3 className="font-sport font-black text-lg sm:text-xl uppercase tracking-tight text-black mb-1">
              Tidak Ada Produk yang Cocok
            </h3>
            <p className="text-xs sm:text-sm text-neutral-500 max-w-md mx-auto mb-4">
              Coba gunakan kata kunci pencarian lain atau bersihkan filter yang sedang aktif.
            </p>
            <button
              type="button"
              onClick={onResetFilters}
              className="bg-black hover:bg-neutral-800 text-white font-sport font-bold text-xs uppercase tracking-wider px-5 py-2.5 transition-colors cursor-pointer"
            >
              Kembali ke Semua Produk
            </button>
          </div>
        )}

      </div>
    </section>
  );
}
