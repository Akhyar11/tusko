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
                className="inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-2 py-0.5 rounded-full font-medium transition-colors cursor-pointer"
              >
                <span>Hapus filter pencarian</span>
                <X size={12} />
              </button>
            )}
          </div>
          
          <p className="text-xs text-gray-500 mt-0.5">
            {searchQuery
              ? `Ditemukan ${products.length} produk yang cocok dengan kata kunci Anda`
              : `Menampilkan ${products.length} produk pilihan berkualitas`}
          </p>
        </div>

        {/* Sort Options */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 hidden sm:inline flex items-center gap-1">
            <SlidersHorizontal size={14} />
            Urutkan:
          </span>
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="text-xs font-medium bg-white border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 cursor-pointer text-gray-700"
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
        <div className="bg-white rounded-2xl border border-gray-200 p-10 sm:p-12 text-center my-6 shadow-2xs">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-gray-400 mb-4">
            <PackageSearch size={32} />
          </div>
          <h3 className="text-base font-bold text-gray-800">
            {searchQuery ? `Tidak ada produk untuk "${searchQuery}"` : 'Produk tidak ditemukan'}
          </h3>
          <p className="text-xs text-gray-500 mt-1.5 max-w-md mx-auto leading-relaxed">
            Coba periksa ejaan kata kunci, gunakan sinonim atau kata yang lebih umum, atau hapus filter untuk melihat semua produk.
          </p>
          {searchQuery && (
            <button
              type="button"
              onClick={onClearSearch}
              className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
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
