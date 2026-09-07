import React, { useState } from 'react';
import ProductCard from './ProductCard';
import { 
  SlidersHorizontal, 
  PackageSearch, 
  X, 
  RotateCcw, 
  LayoutGrid, 
  List, 
  Star, 
  MapPin, 
  Plus, 
  Flame, 
  Check 
} from 'lucide-react';
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

  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

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

        {/* View Mode & Sort Options */}
        <div className="flex items-center gap-2.5">
          {/* View Mode Switcher */}
          <div className="flex items-center bg-neutral-100 p-0.5 rounded-xl border border-neutral-200">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'grid' 
                  ? 'bg-white text-neutral-950 shadow-2xs font-bold' 
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
              title="Tampilan Grid (Kotak)"
            >
              <LayoutGrid size={15} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'list' 
                  ? 'bg-white text-neutral-950 shadow-2xs font-bold' 
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
              title="Tampilan Daftar (Baris Rinci)"
            >
              <List size={15} />
            </button>
          </div>

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
      ) : viewMode === 'list' ? (
        /* List View (Horizontal Card) */
        <div className="space-y-3">
          {products.map((product) => {
            const stock = Number(product.stock ?? 0);
            const isOutOfStock = stock <= 0;
            const isLowStock = !isOutOfStock && stock <= (product.stock_minimum || 5);

            return (
              <div
                key={product.id}
                onClick={() => onSelectProduct(product)}
                className="bg-white rounded-2xl border border-neutral-200/90 hover:border-neutral-900 hover:shadow-lg transition-all duration-200 p-3 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-4 cursor-pointer group"
              >
                {/* Thumbnail */}
                <div className="relative w-full sm:w-32 h-36 sm:h-32 rounded-xl bg-neutral-100 overflow-hidden shrink-0">
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${
                      isOutOfStock ? 'grayscale opacity-75' : ''
                    }`}
                  />
                  {product.is_official && (
                    <span className="absolute top-2 left-2 bg-neutral-950 text-amber-400 text-[9px] font-black px-1.5 py-0.5 rounded shadow-xs uppercase">
                      PRO
                    </span>
                  )}
                  {isOutOfStock && (
                    <div className="absolute inset-0 bg-neutral-950/60 flex items-center justify-center text-white text-[10px] font-black uppercase">
                      Stok Habis
                    </div>
                  )}
                </div>

                {/* Center Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-[11px] text-neutral-400 font-semibold uppercase tracking-wider mb-1">
                    <span>{product.seller_name || 'Tusko Official'}</span>
                    <span>•</span>
                    <span className="flex items-center gap-0.5 text-neutral-500">
                      <MapPin size={11} />
                      {product.location}
                    </span>
                    {product.free_shipping && (
                      <>
                        <span>•</span>
                        <span className="text-emerald-600 font-bold">Bebas Ongkir</span>
                      </>
                    )}
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-neutral-950 group-hover:text-amber-600 transition-colors line-clamp-1">
                    {product.name}
                  </h3>

                  <p className="text-xs text-neutral-500 line-clamp-2 mt-1 leading-relaxed">
                    {product.description}
                  </p>

                  <div className="flex items-center gap-3 mt-2 text-xs">
                    <div className="flex items-center text-amber-500 font-bold">
                      <Star size={13} className="fill-current" />
                      <span className="ml-1 text-neutral-900">{product.rating}</span>
                      <span className="text-neutral-400 font-normal ml-1">({product.rating_count || 0})</span>
                    </div>
                    <span className="text-neutral-300">•</span>
                    <span className="text-neutral-500 font-medium text-[11px]">
                      {product.sold_count || 0} terjual
                    </span>
                    {product.variants?.length > 0 && (
                      <>
                        <span className="text-neutral-300">•</span>
                        <span className="bg-sky-50 text-sky-700 font-bold text-[10px] px-1.5 py-0.5 rounded">
                          {product.variants.length} Varian
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Right Actions & Price */}
                <div className="sm:border-l sm:border-neutral-100 sm:pl-4 sm:w-52 shrink-0 flex flex-col justify-between items-start sm:items-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-neutral-100">
                  <div className="text-left sm:text-right w-full">
                    <div className="text-base sm:text-lg font-black text-neutral-950">
                      {formatRupiah(product.price)}
                    </div>
                    {product.discount_percentage > 0 && (
                      <div className="flex items-center sm:justify-end gap-1.5 mt-0.5">
                        <span className="text-[10px] font-extrabold text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded">
                          -{product.discount_percentage}%
                        </span>
                        <span className="text-[11px] text-neutral-400 line-through font-medium">
                          {formatRupiah(product.original_price)}
                        </span>
                      </div>
                    )}

                    {/* Stock Status */}
                    <div className="mt-1.5 text-[10px]">
                      {isOutOfStock ? (
                        <span className="text-rose-600 font-bold">Stok Habis</span>
                      ) : isLowStock ? (
                        <span className="text-rose-600 font-extrabold flex items-center sm:justify-end gap-1">
                          <Flame size={11} className="fill-rose-500" />
                          Sisa {stock} unit
                        </span>
                      ) : (
                        <span className="text-emerald-600 font-bold">Stok: {stock} unit</span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isOutOfStock}
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddToCart(product);
                    }}
                    className="w-full sm:w-auto px-4 py-2 bg-neutral-900 text-white hover:bg-amber-500 hover:text-neutral-950 rounded-xl text-xs font-black uppercase tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Plus size={13} className="stroke-[3]" />
                    <span>{isOutOfStock ? 'Habis' : '+ Keranjang'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Grid View */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4.5">
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
