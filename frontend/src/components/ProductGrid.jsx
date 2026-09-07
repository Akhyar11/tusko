import React from 'react';
import ProductCard from './ProductCard';
import { SlidersHorizontal, PackageSearch } from 'lucide-react';

export default function ProductGrid({
  products = [],
  sortBy = 'relevant',
  onSortChange = () => {},
  onAddToCart = () => {},
  onSelectProduct = () => {},
  categoryTitle = null,
  searchQuery = ''
}) {
  return (
    <section className="my-6">
      {/* Grid Header & Sort */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-4 border-b border-gray-200">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-gray-900">
            {searchQuery 
              ? `Hasil Pencarian "${searchQuery}"`
              : categoryTitle 
                ? `Kategori: ${categoryTitle}` 
                : 'Rekomendasi Untukmu'}
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Menampilkan {products.length} produk pilihan berkualitas
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
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center my-6">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-gray-400 mb-3">
            <PackageSearch size={32} />
          </div>
          <h3 className="text-base font-bold text-gray-800">
            Produk tidak ditemukan
          </h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            Coba gunakan kata kunci lain atau hapus filter kategori untuk melihat semua produk yang tersedia.
          </p>
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
