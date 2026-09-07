import React from 'react';
import ProductCard from './ProductCard';
import { SlidersHorizontal, PackageSearch, X, Sparkles } from 'lucide-react';

export default function ProductGrid({
  products = [],
  sortBy = 'relevant',
  onSortChange = () => {},
  onAddToCart = () => {},
  onSelectProduct = () => {},
  categoryTitle = null,
  searchQuery = '',
  onClearSearch = () => {}
}) {
  return (
    <section className="my-6">
      {/* Grid Header & Sort */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-4 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg sm:text-xl font-extrabold text-gray-900">
              {searchQuery 
                ? `Hasil Pencarian "${searchQuery}"`
                : categoryTitle 
                  ? `Kategori: ${categoryTitle}` 
                  : 'Rekomendasi Untukmu'}
            </h2>

            {/* Clear search chip if searching */}
            {searchQuery && (
              <button
                type="button"
                onClick={onClearSearch}
                className="inline-flex items-center gap-1 text-xs bg-amber-50 text-amber-800 hover:bg-amber-100 px-2.5 py-0.5 rounded-full font-bold transition-colors cursor-pointer"
              >
                <span>Hapus filter pencarian</span>
                <X size={12} />
              </button>
            )}
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
          {searchQuery && (
            <button
              type="button"
              onClick={onClearSearch}
              className="mt-4 px-4 py-2 bg-neutral-900 hover:bg-amber-500 hover:text-neutral-950 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Lihat Semua Produk
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
