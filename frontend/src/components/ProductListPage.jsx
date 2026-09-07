import React, { useState, useMemo } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  ArrowUpDown, 
  Edit3, 
  Trash2, 
  Eye, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Layers, 
  ArrowLeft,
  DollarSign,
  TrendingUp,
  Tag,
  Boxes,
  ExternalLink,
  ChevronRight,
  MoreVertical,
  Check,
  RefreshCw
} from 'lucide-react';
import { formatRupiah } from '../utils/formatters';
import DeleteProductModal from './DeleteProductModal';

export default function ProductListPage({
  products = [],
  categories = [],
  onAddNewProduct = () => {},
  onEditProduct = () => {},
  onDeleteProduct = () => {},
  onToggleStatus = () => {},
  onViewProductDetail = () => {},
  onBackToShopping = () => {}
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all'); // 'all' | 'active' | 'inactive'
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'name' | 'price_low' | 'price_high' | 'stock_low' | 'stock_high' | 'sold'
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'
  const [productToDelete, setProductToDelete] = useState(null);

  // Metric summaries
  const metrics = useMemo(() => {
    const total = products.length;
    const activeCount = products.filter(p => p.status === 'active' || p.active).length;
    const lowStockCount = products.filter(p => p.stock <= (p.stock_minimum || 5)).length;
    const totalAssetValue = products.reduce((sum, p) => sum + ((p.price || 0) * (p.stock || 0)), 0);
    const totalSoldCount = products.reduce((sum, p) => sum + (p.sold_count || 0), 0);

    return {
      total,
      activeCount,
      inactiveCount: total - activeCount,
      lowStockCount,
      totalAssetValue,
      totalSoldCount
    };
  }, [products]);

  // Filtered and sorted products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = p.name?.toLowerCase().includes(q);
        const matchSku = p.sku?.toLowerCase().includes(q);
        const matchDesc = p.description?.toLowerCase().includes(q);
        if (!matchName && !matchSku && !matchDesc) return false;
      }

      // Category filter
      if (selectedCategory !== 'all' && p.category_id !== Number(selectedCategory)) {
        return false;
      }

      // Status filter
      if (selectedStatus === 'active' && !(p.status === 'active' || p.active)) return false;
      if (selectedStatus === 'inactive' && (p.status === 'active' || p.active)) return false;

      return true;
    }).sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
      if (sortBy === 'price_low') return (a.price || 0) - (b.price || 0);
      if (sortBy === 'price_high') return (b.price || 0) - (a.price || 0);
      if (sortBy === 'stock_low') return (a.stock || 0) - (b.stock || 0);
      if (sortBy === 'stock_high') return (b.stock || 0) - (a.stock || 0);
      if (sortBy === 'sold') return (b.sold_count || 0) - (a.sold_count || 0);
      return 0;
    });
  }, [products, searchQuery, selectedCategory, selectedStatus, sortBy]);

  // Helper category name lookup
  const getCategoryName = (catId) => {
    const cat = categories.find(c => c.id === catId);
    return cat ? cat.name : 'Olahraga';
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Top Breadcrumb & Header Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-gray-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 mb-1">
            <button 
              onClick={onBackToShopping}
              className="hover:text-amber-600 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>Etalase Toko</span>
            </button>
            <ChevronRight size={12} />
            <span className="text-gray-900 font-bold">Admin Panel</span>
            <ChevronRight size={12} />
            <span className="text-amber-600 font-bold">Manajemen Produk</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-black">
              <Package size={22} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-gray-950 tracking-tight">
                Daftar Produk & Katalog Toko
              </h1>
              <p className="text-xs text-gray-500">
                Kelola data produk, harga jual, modal, varian warna/ukuran, serta pantau stok inventaris Tusko.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onBackToShopping}
            className="px-3.5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <ExternalLink size={14} />
            <span>Lihat Etalase</span>
          </button>
          <button
            type="button"
            onClick={onAddNewProduct}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Plus size={16} />
            <span>Tambah Produk</span>
          </button>
        </div>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Total Products */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs">
          <div className="flex items-center justify-between text-gray-500 mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider">Total Produk</span>
            <Package size={16} className="text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-gray-950">{metrics.total}</span>
            <span className="text-[11px] font-semibold text-gray-400">SKU</span>
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-emerald-600 font-bold">
            <CheckCircle2 size={12} />
            <span>{metrics.activeCount} Aktif Ditampilkan</span>
          </div>
        </div>

        {/* Low Stock Warning */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs">
          <div className="flex items-center justify-between text-gray-500 mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider">Perlu Restok</span>
            <AlertTriangle size={16} className="text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-black ${metrics.lowStockCount > 0 ? 'text-amber-600' : 'text-gray-950'}`}>
              {metrics.lowStockCount}
            </span>
            <span className="text-[11px] font-semibold text-gray-400">Item</span>
          </div>
          <div className="mt-2 text-[11px] text-gray-500 font-medium truncate">
            {metrics.lowStockCount > 0 ? 'Stok di bawah batas minimum' : 'Semua stok dalam batas aman'}
          </div>
        </div>

        {/* Total Stock Asset Value */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs">
          <div className="flex items-center justify-between text-gray-500 mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider">Nilai Aset Stok</span>
            <DollarSign size={16} className="text-emerald-500" />
          </div>
          <div className="text-lg sm:text-xl font-black text-gray-950 truncate">
            {formatRupiah(metrics.totalAssetValue)}
          </div>
          <div className="mt-2 text-[11px] text-gray-500 font-medium">
            Kalkulasi nilai ritel total produk
          </div>
        </div>

        {/* Total Sold Count */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs">
          <div className="flex items-center justify-between text-gray-500 mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider">Total Terjual</span>
            <TrendingUp size={16} className="text-sky-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-gray-950">
              {metrics.totalSoldCount.toLocaleString('id-ID')}
            </span>
            <span className="text-[11px] font-semibold text-gray-400">Pcs</span>
          </div>
          <div className="mt-2 text-[11px] text-gray-500 font-medium">
            Akumulasi penjualan keseluruhan
          </div>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs space-y-3.5">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 text-gray-400" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama produk, SKU, atau spesifikasi..."
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-gray-50 hover:bg-gray-100/80 focus:bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all text-gray-900"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-xs text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>

          {/* Filters: Category, Status, Sort */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
            {/* Category Select */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 text-xs font-semibold bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="all">Semua Kategori ({categories.length})</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            {/* Status Select */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 text-xs font-semibold bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="all">Semua Status</option>
              <option value="active">🟢 Aktif (Live)</option>
              <option value="inactive">⚪ Nonaktif (Draft)</option>
            </select>

            {/* Sort Select */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 text-xs font-semibold bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="newest">Terbaru Ditambahkan</option>
              <option value="sold">Paling Banyak Terjual</option>
              <option value="price_high">Harga: Tertinggi</option>
              <option value="price_low">Harga: Terendah</option>
              <option value="stock_low">Stok: Menipis</option>
              <option value="stock_high">Stok: Terbanyak</option>
              <option value="name">Abjad (A - Z)</option>
            </select>
          </div>
        </div>

        {/* Filter Summary & Result Count */}
        <div className="flex items-center justify-between text-xs text-gray-500 pt-1 border-t border-gray-100">
          <div>
            Menampilkan <span className="font-bold text-gray-900">{filteredProducts.length}</span> dari {products.length} produk
            {searchQuery && (
              <span className="ml-1">
                untuk kata kunci &ldquo;<span className="font-semibold text-amber-600">{searchQuery}</span>&rdquo;
              </span>
            )}
          </div>
          {(searchQuery || selectedCategory !== 'all' || selectedStatus !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setSelectedStatus('all');
              }}
              className="text-amber-600 font-bold hover:underline cursor-pointer"
            >
              Bersihkan Filter
            </button>
          )}
        </div>
      </div>

      {/* Product Table List */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
        {filteredProducts.length === 0 ? (
          /* Empty State */
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-3">
              <Package size={32} />
            </div>
            <h3 className="text-base font-bold text-gray-900">Tidak ada produk yang cocok</h3>
            <p className="text-xs text-gray-500 max-w-md mx-auto mt-1">
              Coba sesuaikan kata kunci pencarian, ubah filter kategori atau status produk Anda.
            </p>
            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setSelectedStatus('all');
                }}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Reset Filter
              </button>
              <button
                type="button"
                onClick={onAddNewProduct}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-black rounded-xl transition-colors cursor-pointer"
              >
                + Tambah Produk Baru
              </button>
            </div>
          </div>
        ) : (
          /* Table */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-700 border-collapse">
              <thead className="bg-gray-50/80 text-gray-500 font-extrabold uppercase text-[10px] tracking-wider border-b border-gray-200">
                <tr>
                  <th className="py-3.5 px-4">Info Produk</th>
                  <th className="py-3.5 px-3">Kategori</th>
                  <th className="py-3.5 px-3">Harga Jual & Modal</th>
                  <th className="py-3.5 px-3">Stok & Varian</th>
                  <th className="py-3.5 px-3 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProducts.map((product) => {
                  const isActive = product.status === 'active' || product.active;
                  const isLowStock = product.stock <= (product.stock_minimum || 5);
                  const isOutOfStock = product.stock <= 0;
                  const margin = product.price - (product.cost_price || Math.round(product.price * 0.6));
                  const marginPercent = product.price ? Math.round((margin / product.price) * 100) : 0;
                  const variantCount = product.variants?.length || 0;

                  return (
                    <tr 
                      key={product.id}
                      className="hover:bg-amber-50/20 transition-colors group"
                    >
                      {/* Product Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-12 h-12 rounded-xl object-cover border border-gray-200 shrink-0 bg-gray-100"
                          />
                          <div className="min-w-0 max-w-xs sm:max-w-sm">
                            <button
                              type="button"
                              onClick={() => onViewProductDetail(product)}
                              className="text-left font-bold text-gray-900 hover:text-amber-600 transition-colors line-clamp-1 cursor-pointer"
                              title={product.name}
                            >
                              {product.name}
                            </button>
                            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-gray-400">
                              <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 font-semibold text-[10px]">
                                {product.sku || `TSK-PRD-${product.id}`}
                              </span>
                              <span>•</span>
                              <span>{product.sold_count || 0} terjual</span>
                              {product.free_shipping && (
                                <>
                                  <span>•</span>
                                  <span className="text-emerald-600 font-bold">Bebas Ongkir</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700">
                          {getCategoryName(product.category_id)}
                        </span>
                      </td>

                      {/* Price & Cost */}
                      <td className="py-3.5 px-3">
                        <div className="font-extrabold text-gray-950">
                          {formatRupiah(product.price)}
                        </div>
                        {product.cost_price && (
                          <div className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                            <span>Modal: {formatRupiah(product.cost_price)}</span>
                            <span className="text-emerald-600 font-bold">({marginPercent}%)</span>
                          </div>
                        )}
                      </td>

                      {/* Stock & Variants */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <span className={`font-black text-sm ${
                            isOutOfStock 
                              ? 'text-rose-600' 
                              : isLowStock 
                              ? 'text-amber-600' 
                              : 'text-gray-900'
                          }`}>
                            {product.stock}
                          </span>
                          <span className="text-gray-400 text-[10px]">unit</span>
                        </div>
                        <div className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1">
                          {variantCount > 0 ? (
                            <span className="bg-sky-50 text-sky-700 font-bold px-1.5 py-0.2 rounded">
                              {variantCount} varian
                            </span>
                          ) : (
                            <span>Tanpa varian</span>
                          )}
                          {isLowStock && !isOutOfStock && (
                            <span className="text-amber-600 font-bold text-[9px] uppercase">Menipis</span>
                          )}
                          {isOutOfStock && (
                            <span className="text-rose-600 font-bold text-[9px] uppercase">Habis</span>
                          )}
                        </div>
                      </td>

                      {/* Status Toggle Switch */}
                      <td className="py-3.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => onToggleStatus(product)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer transition-all ${
                            isActive
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                          title={isActive ? 'Klik untuk nonaktifkan' : 'Klik untuk aktifkan'}
                        >
                          <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-gray-400'}`}></span>
                          <span>{isActive ? 'Aktif' : 'Nonaktif'}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Detail Preview */}
                          <button
                            type="button"
                            onClick={() => onViewProductDetail(product)}
                            className="p-1.5 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                            title="Lihat Detail Produk"
                          >
                            <Eye size={15} />
                          </button>

                          {/* Edit Product */}
                          <button
                            type="button"
                            onClick={() => onEditProduct(product)}
                            className="p-1.5 text-gray-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors cursor-pointer"
                            title="Ubah Produk"
                          >
                            <Edit3 size={15} />
                          </button>

                          {/* Delete Product */}
                          <button
                            type="button"
                            onClick={() => setProductToDelete(product)}
                            className="p-1.5 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Hapus Produk"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteProductModal
        isOpen={Boolean(productToDelete)}
        product={productToDelete}
        onClose={() => setProductToDelete(null)}
        onConfirmDelete={(p) => {
          onDeleteProduct(p);
          setProductToDelete(null);
        }}
        onDeactivateInstead={(p) => {
          onToggleStatus(p);
          setProductToDelete(null);
        }}
      />
    </div>
  );
}
