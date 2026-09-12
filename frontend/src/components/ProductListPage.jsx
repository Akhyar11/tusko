import React, { useState, useMemo, useEffect } from 'react';
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
  RefreshCw,
  LayoutGrid,
  List
} from 'lucide-react';
import { formatRupiah } from '../utils/formatters';
import DeleteProductModal from './DeleteProductModal';
import ServerSideTable from './ServerSideTable';

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
  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all'); // 'all' | 'active' | 'inactive'
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'
  const [productToDelete, setProductToDelete] = useState(null);

  // Server-side Table Pagination & Sorting states
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Reset pagination on filter/search change with simulated short transition
  useEffect(() => {
    setPage(1);
  }, [searchQuery, selectedCategory, selectedStatus]);

  // Metric summaries
  const metrics = useMemo(() => {
    const total = products.length;
    const activeCount = products.filter(p => p.status === 'active' || p.active).length;
    const lowStockCount = products.filter(p => Number(p.stock) <= Number(p.stock_minimum || 5)).length;
    const totalAssetValue = products.reduce((sum, p) => sum + (Number(p.price || 0) * Number(p.stock || 0)), 0);
    const totalSoldCount = products.reduce((sum, p) => sum + Number(p.sold_count || 0), 0);

    return {
      total,
      activeCount,
      inactiveCount: total - activeCount,
      lowStockCount,
      totalAssetValue,
      totalSoldCount
    };
  }, [products]);

  // Filtered and sorted products (Server-side simulation engine)
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
      let valA = a[sortBy];
      let valB = b[sortBy];

      if (sortBy === 'created_at') {
        valA = new Date(a.created_at || 0).getTime();
        valB = new Date(b.created_at || 0).getTime();
      } else if (sortBy === 'price' || sortBy === 'stock' || sortBy === 'sold_count') {
        valA = Number(valA || 0);
        valB = Number(valB || 0);
      } else if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = (valB || '').toLowerCase();
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [products, searchQuery, selectedCategory, selectedStatus, sortBy, sortDirection]);

  // Total filtered records
  const totalFiltered = filteredProducts.length;

  // Paginated records for current view
  const paginatedProducts = useMemo(() => {
    const startIdx = (page - 1) * limit;
    return filteredProducts.slice(startIdx, startIdx + limit);
  }, [filteredProducts, page, limit]);

  // Helper category name lookup
  const getCategoryName = (catId) => {
    const cat = categories.find(c => c.id === catId);
    return cat ? cat.name : 'Olahraga';
  };

  // Selection handlers
  const handleSelectRow = (id) => {
    setSelectedProductIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    const currentPageIds = paginatedProducts.map(p => p.id);
    const allSelected = currentPageIds.every(id => selectedProductIds.includes(id));

    if (allSelected) {
      setSelectedProductIds(prev => prev.filter(id => !currentPageIds.includes(id)));
    } else {
      const merged = new Set([...selectedProductIds, ...currentPageIds]);
      setSelectedProductIds(Array.from(merged));
    }
  };

  // Bulk actions handlers
  const handleBulkActivate = () => {
    selectedProductIds.forEach(id => {
      const prod = products.find(p => p.id === id);
      if (prod && !(prod.status === 'active' || prod.active)) {
        onToggleStatus(prod);
      }
    });
    setSelectedProductIds([]);
  };

  const handleBulkDeactivate = () => {
    selectedProductIds.forEach(id => {
      const prod = products.find(p => p.id === id);
      if (prod && (prod.status === 'active' || prod.active)) {
        onToggleStatus(prod);
      }
    });
    setSelectedProductIds([]);
  };

  const handleBulkDelete = () => {
    if (window.confirm(`Yakin ingin menghapus ${selectedProductIds.length} produk terpilih?`)) {
      selectedProductIds.forEach(id => {
        const prod = products.find(p => p.id === id);
        if (prod) onDeleteProduct(prod);
      });
      setSelectedProductIds([]);
    }
  };

  // Server-Side Table Columns Definition
  const tableColumns = [
    {
      key: 'name',
      label: 'Info Produk & SKU',
      sortable: true,
      width: 'min-w-[280px]',
      render: (_, product) => {
        return (
          <div className="flex items-center gap-3">
            <img
              src={product.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300'}
              alt={product.name}
              className="w-12 h-12 rounded-none object-cover border border-neutral-300 shrink-0 bg-neutral-100"
            />
            <div className="min-w-0 max-w-xs sm:max-w-sm">
              <button
                type="button"
                onClick={() => onViewProductDetail(product)}
                className="text-left font-bold text-neutral-950 hover:text-amber-600 transition-colors line-clamp-1 cursor-pointer font-sport text-sm"
                title={product.name}
              >
                {product.name}
              </button>
              <div className="flex items-center gap-2 mt-0.5 text-[11px] text-neutral-500">
                <span className="font-mono bg-neutral-100 px-1.5 py-0.2 rounded-none text-neutral-700 font-bold text-[10px] border border-neutral-200">
                  {product.sku || `TSK-PRD-${product.id}`}
                </span>
                <span>&bull;</span>
                <span className="font-mono">{product.sold_count || 0} terjual</span>
                {product.free_shipping && (
                  <>
                    <span>&bull;</span>
                    <span className="text-emerald-700 font-sport font-bold uppercase text-[10px]">Bebas Ongkir</span>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      }
    },
    {
      key: 'category_id',
      label: 'Kategori',
      sortable: true,
      width: 'w-36',
      render: (catId) => (
        <span className="inline-flex items-center px-2.5 py-1 rounded-none text-[10px] font-sport font-bold uppercase tracking-wider bg-neutral-100 text-neutral-800 border border-neutral-300">
          {getCategoryName(catId)}
        </span>
      )
    },
    {
      key: 'price',
      label: 'Harga & Modal',
      sortable: true,
      width: 'w-44',
      render: (price, product) => {
        const cost = product.cost_price || Math.round(price * 0.6);
        const margin = price - cost;
        const marginPercent = price ? Math.round((margin / price) * 100) : 0;

        return (
          <div>
            <div className="font-mono font-black text-neutral-950 text-sm">
              {formatRupiah(price)}
            </div>
            {product.cost_price && (
              <div className="text-[10px] text-neutral-500 font-mono flex items-center gap-1 mt-0.5">
                <span>HPP: {formatRupiah(product.cost_price)}</span>
                <span className="text-emerald-700 font-bold">({marginPercent}%)</span>
              </div>
            )}
          </div>
        );
      }
    },
    {
      key: 'stock',
      label: 'Stok & Varian',
      sortable: true,
      align: 'center',
      width: 'w-36',
      render: (stock, product) => {
        const isLowStock = Number(stock) <= Number(product.stock_minimum || 5);
        const isOutOfStock = Number(stock) <= 0;
        const variantCount = product.variants?.length || 0;

        return (
          <div className="flex flex-col items-center justify-center">
            <div className="flex items-center gap-1.5">
              <span className={`font-mono font-black text-sm ${
                isOutOfStock 
                  ? 'text-red-700' 
                  : isLowStock 
                  ? 'text-amber-700' 
                  : 'text-neutral-950'
              }`}>
                {stock}
              </span>
              <span className="text-neutral-500 text-[10px] font-mono">unit</span>
            </div>
            <div className="text-[10px] text-neutral-500 mt-0.5 flex items-center gap-1">
              {variantCount > 0 ? (
                <span className="bg-neutral-100 text-neutral-800 font-mono font-bold px-1.5 py-0.2 rounded-none border border-neutral-300">
                  {variantCount} varian
                </span>
              ) : (
                <span className="text-neutral-400 font-mono">Single SKU</span>
              )}
              {isLowStock && !isOutOfStock && (
                <span className="text-amber-800 font-sport font-black text-[9px] uppercase">Menipis</span>
              )}
              {isOutOfStock && (
                <span className="text-red-700 font-sport font-black text-[9px] uppercase">Habis</span>
              )}
            </div>
          </div>
        );
      }
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      align: 'center',
      width: 'w-32',
      render: (_, product) => {
        const isActive = product.status === 'active' || product.active;

        return (
          <button
            type="button"
            onClick={() => onToggleStatus(product)}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-none text-[11px] font-sport font-bold uppercase tracking-wider cursor-pointer transition-all border ${
              isActive
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                : 'bg-neutral-100 text-neutral-600 border-neutral-300 hover:bg-neutral-200'
            }`}
            title={isActive ? 'Klik untuk nonaktifkan produk' : 'Klik untuk aktifkan produk'}
          >
            <span className={`w-2 h-2 rounded-none ${isActive ? 'bg-emerald-600' : 'bg-neutral-400'}`}></span>
            <span>{isActive ? 'Aktif' : 'Draft'}</span>
          </button>
        );
      }
    },
    {
      key: 'actions',
      label: 'Aksi',
      sortable: false,
      align: 'right',
      width: 'w-32',
      render: (_, product) => {
        return (
          <div className="flex items-center justify-end gap-1.5">
            {/* View Detail Preview */}
            <button
              type="button"
              onClick={() => onViewProductDetail(product)}
              className="p-1.5 text-neutral-600 hover:text-black hover:bg-neutral-100 border border-transparent hover:border-neutral-300 rounded-none transition-colors cursor-pointer"
              title="Lihat Detail Produk"
              aria-label="Lihat Detail Produk"
            >
              <Eye size={15} />
            </button>

            {/* Edit Product */}
            <button
              type="button"
              onClick={() => onEditProduct(product)}
              className="p-1.5 text-neutral-600 hover:text-black hover:bg-neutral-100 border border-transparent hover:border-neutral-300 rounded-none transition-colors cursor-pointer"
              title="Ubah Produk"
              aria-label="Ubah Produk"
            >
              <Edit3 size={15} />
            </button>

            {/* Delete Product */}
            <button
              type="button"
              onClick={() => setProductToDelete(product)}
              className="p-1.5 text-neutral-600 hover:text-red-700 hover:bg-red-50 border border-transparent hover:border-red-200 rounded-none transition-colors cursor-pointer"
              title="Hapus Produk"
              aria-label="Hapus Produk"
            >
              <Trash2 size={15} />
            </button>
          </div>
        );
      }
    }
  ];

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      
      {/* Top Breadcrumb & Header Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-none border border-neutral-300 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-neutral-500 uppercase tracking-widest mb-1">
            <button 
              onClick={onBackToShopping}
              className="hover:text-amber-600 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <ArrowLeft size={13} />
              <span>Etalase Storefront</span>
            </button>
            <span>&bull;</span>
            <span className="text-neutral-900 font-bold">Admin ERP</span>
            <span>&bull;</span>
            <span className="text-amber-700 font-bold">Katalog Produk</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-none bg-neutral-950 text-amber-400 flex items-center justify-center font-black">
              <Package size={22} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-neutral-950 font-sport tracking-tight uppercase">
                Daftar Produk & Katalog Toko
              </h1>
              <p className="text-xs text-neutral-600">
                Kelola master produk, varian bertingkat (matrix SKU), penetapan harga jual, HPP, serta inventaris toko.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* View mode toggle */}
          <div className="flex items-center border border-neutral-300 bg-neutral-100 p-1 rounded-none">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-none transition-colors cursor-pointer ${
                viewMode === 'table' ? 'bg-black text-white' : 'text-neutral-600 hover:text-black'
              }`}
              title="Tampilan Tabel Server-Side"
            >
              <List size={16} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-none transition-colors cursor-pointer ${
                viewMode === 'grid' ? 'bg-black text-white' : 'text-neutral-600 hover:text-black'
              }`}
              title="Tampilan Grid Kartu"
            >
              <LayoutGrid size={16} />
            </button>
          </div>

          <button
            type="button"
            onClick={onBackToShopping}
            className="px-3.5 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-900 font-sport font-black text-xs uppercase tracking-wider rounded-none border border-neutral-300 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <ExternalLink size={14} />
            <span>Lihat Etalase</span>
          </button>
          <button
            type="button"
            onClick={onAddNewProduct}
            className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-black font-sport font-black text-xs uppercase tracking-wider rounded-none transition-all shadow-xs flex items-center gap-1.5 cursor-pointer border border-amber-500"
          >
            <Plus size={16} />
            <span>Tambah Produk</span>
          </button>
        </div>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Total Products */}
        <div className="bg-white p-4 rounded-none border border-neutral-300 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-1.5">
            <span className="text-xs font-sport font-black uppercase tracking-wider">Total Produk</span>
            <Package size={16} className="text-amber-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-neutral-950 font-sport">{metrics.total}</span>
            <span className="text-[11px] font-mono font-bold text-neutral-400">SKU</span>
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-emerald-700 font-bold border-t border-neutral-100 pt-1.5">
            <CheckCircle2 size={12} />
            <span>{metrics.activeCount} Aktif di Katalog</span>
          </div>
        </div>

        {/* Low Stock Warning */}
        <div className="bg-white p-4 rounded-none border border-neutral-300 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-1.5">
            <span className="text-xs font-sport font-black uppercase tracking-wider">Perlu Restok</span>
            <AlertTriangle size={16} className="text-amber-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-black font-sport ${metrics.lowStockCount > 0 ? 'text-amber-700' : 'text-neutral-950'}`}>
              {metrics.lowStockCount}
            </span>
            <span className="text-[11px] font-mono font-bold text-neutral-400">Item</span>
          </div>
          <div className="mt-2 text-[11px] text-neutral-500 border-t border-neutral-100 pt-1.5 font-medium truncate">
            {metrics.lowStockCount > 0 ? 'Di bawah batas minimum' : 'Semua stok aman'}
          </div>
        </div>

        {/* Total Stock Asset Value */}
        <div className="bg-white p-4 rounded-none border border-neutral-300 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-1.5">
            <span className="text-xs font-sport font-black uppercase tracking-wider">Nilai Aset Stok</span>
            <DollarSign size={16} className="text-emerald-600" />
          </div>
          <div className="text-lg sm:text-xl font-mono font-black text-neutral-950 truncate">
            {formatRupiah(metrics.totalAssetValue)}
          </div>
          <div className="mt-2 text-[11px] text-neutral-500 border-t border-neutral-100 pt-1.5 font-medium">
            Kalkulasi nilai persediaan on-hand
          </div>
        </div>

        {/* Total Sold Count */}
        <div className="bg-white p-4 rounded-none border border-neutral-300 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-1.5">
            <span className="text-xs font-sport font-black uppercase tracking-wider">Total Terjual</span>
            <TrendingUp size={16} className="text-neutral-900" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-neutral-950 font-sport font-mono">
              {metrics.totalSoldCount.toLocaleString('id-ID')}
            </span>
            <span className="text-[11px] font-mono font-bold text-neutral-400">Pcs</span>
          </div>
          <div className="mt-2 text-[11px] text-neutral-500 border-t border-neutral-100 pt-1.5 font-medium">
            Akumulasi penjualan keseluruhan
          </div>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="bg-white p-4 rounded-none border border-neutral-300 shadow-2xs space-y-3.5">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 text-neutral-400" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama produk olahraga, kode SKU, atau spesifikasi..."
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-neutral-50 hover:bg-neutral-100/80 focus:bg-white border border-neutral-300 rounded-none focus:outline-none focus:border-black transition-all text-neutral-900"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-xs font-sport font-bold uppercase text-neutral-400 hover:text-black cursor-pointer"
              >
                ✕ Reset
              </button>
            )}
          </div>

          {/* Filters: Category, Status */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
            {/* Category Select */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 text-xs font-sport font-bold uppercase bg-neutral-50 border border-neutral-300 rounded-none text-neutral-800 focus:outline-none focus:border-black cursor-pointer"
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
              className="px-3 py-2 text-xs font-sport font-bold uppercase bg-neutral-50 border border-neutral-300 rounded-none text-neutral-800 focus:outline-none focus:border-black cursor-pointer"
            >
              <option value="all">Semua Status</option>
              <option value="active">🟢 Aktif (Live)</option>
              <option value="inactive">⚪ Draft (Nonaktif)</option>
            </select>
          </div>
        </div>

        {/* Filter Summary & Result Count */}
        <div className="flex items-center justify-between text-xs text-neutral-500 pt-2 border-t border-neutral-200">
          <div>
            Ditemukan <strong className="font-mono text-neutral-950 font-bold">{totalFiltered}</strong> dari <strong className="font-mono text-neutral-950">{products.length}</strong> produk
            {searchQuery && (
              <span className="ml-1">
                untuk &ldquo;<span className="font-semibold text-amber-700">{searchQuery}</span>&rdquo;
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
              className="text-amber-700 font-sport font-bold uppercase text-xs hover:underline cursor-pointer"
            >
              Bersihkan Filter
            </button>
          )}
        </div>
      </div>

      {/* Main Table or Grid View */}
      {viewMode === 'table' ? (
        <ServerSideTable
          columns={tableColumns}
          data={paginatedProducts}
          total={totalFiltered}
          page={page}
          limit={limit}
          limitOptions={[10, 25, 50, 100]}
          onPageChange={setPage}
          onLimitChange={(newLimit) => {
            setLimit(newLimit);
            setPage(1);
          }}
          sortBy={sortBy}
          sortDirection={sortDirection}
          onSortChange={({ sortBy: newSortBy, sortDirection: newDir }) => {
            setSortBy(newSortBy);
            setSortDirection(newDir);
          }}
          isLoading={isLoading}
          selectable={true}
          selectedIds={selectedProductIds}
          onSelectRow={handleSelectRow}
          onSelectAll={handleSelectAll}
          idKey="id"
          emptyMessage="Tidak Ada Produk Ditemukan"
          emptyDescription="Sesuaikan kata kunci pencarian atau ubah filter kategori etalase."
          bulkActions={
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleBulkActivate}
                className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-600 text-white font-sport font-bold text-[11px] uppercase rounded-none transition-colors cursor-pointer"
              >
                Aktifkan
              </button>
              <button
                type="button"
                onClick={handleBulkDeactivate}
                className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-white font-sport font-bold text-[11px] uppercase rounded-none transition-colors cursor-pointer border border-neutral-700"
              >
                Nonaktifkan
              </button>
              <button
                type="button"
                onClick={handleBulkDelete}
                className="px-2.5 py-1 bg-red-700 hover:bg-red-600 text-white font-sport font-bold text-[11px] uppercase rounded-none transition-colors cursor-pointer"
              >
                Hapus
              </button>
            </div>
          }
        />
      ) : (
        /* Alternative Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {paginatedProducts.map((product) => {
            const isActive = product.status === 'active' || product.active;
            const isLowStock = Number(product.stock) <= Number(product.stock_minimum || 5);

            return (
              <div 
                key={product.id}
                className="bg-white border border-neutral-300 p-4 rounded-none shadow-2xs space-y-3 hover:border-black transition-colors"
              >
                <div className="relative aspect-square bg-neutral-100 overflow-hidden border border-neutral-200">
                  <img
                    src={product.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300'}
                    alt={product.name}
                    className="w-full h-full object-cover rounded-none"
                  />
                  <span className={`absolute top-2 left-2 px-2 py-0.5 text-[10px] font-sport font-bold uppercase rounded-none border ${
                    isActive 
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                      : 'bg-neutral-100 text-neutral-600 border-neutral-300'
                  }`}>
                    {isActive ? 'Aktif' : 'Draft'}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="text-[10px] font-mono text-neutral-500 uppercase">
                    {getCategoryName(product.category_id)}
                  </div>
                  <h3 className="font-sport font-bold text-sm text-neutral-950 line-clamp-1">
                    {product.name}
                  </h3>
                  <div className="font-mono font-black text-sm text-neutral-950">
                    {formatRupiah(product.price)}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-neutral-500 pt-1 border-t border-neutral-100 font-mono">
                    <span>Stok: <strong className={isLowStock ? 'text-amber-700' : 'text-neutral-900'}>{product.stock}</strong></span>
                    <span>Terjual: <strong>{product.sold_count || 0}</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 pt-2 border-t border-neutral-200">
                  <button
                    type="button"
                    onClick={() => onViewProductDetail(product)}
                    className="flex-1 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-900 font-sport font-bold text-xs uppercase rounded-none border border-neutral-300 transition-colors"
                  >
                    Detail
                  </button>
                  <button
                    type="button"
                    onClick={() => onEditProduct(product)}
                    className="flex-1 py-1.5 bg-neutral-950 hover:bg-neutral-800 text-white font-sport font-bold text-xs uppercase rounded-none transition-colors"
                  >
                    Ubah
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

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
