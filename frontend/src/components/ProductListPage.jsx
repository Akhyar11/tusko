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
  DollarSign,
  TrendingUp,
  Tag,
  Boxes,
  ChevronRight,
  MoreVertical,
  Check,
  SlidersHorizontal,
  X,
  RotateCcw
} from 'lucide-react';
import { formatRupiah } from '../utils/formatters';
import DeleteProductModal from './DeleteProductModal';
import ServerSideTable from './ServerSideTable';
import ProductHeaderActions from './organisms/ProductHeaderActions';
import ProductFilterDrawer from './organisms/ProductFilterDrawer';
import CategoryMasterModal from './organisms/CategoryMasterModal';

export default function ProductListPage({
  products = [],
  categories = [],
  onAddNewProduct = () => {},
  onEditProduct = () => {},
  onDeleteProduct = () => {},
  onToggleStatus = () => {},
  onViewProductDetail = () => {},
  onBackToShopping = () => {},
  onCategoriesChange = () => {},
  onNavigateToCategories,
  onOpenCategoryMaster
}) {
  const [isCategoryMasterOpen, setIsCategoryMasterOpen] = useState(false);
  const handleOpenCategoryMaster = onNavigateToCategories || onOpenCategoryMaster || (() => setIsCategoryMasterOpen(true));
  // Filter & Search states
  const [searchName, setSearchName] = useState('');
  const [searchSku, setSearchSku] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all'); // 'all' | 'active' | 'inactive'
  const [stockCondition, setStockCondition] = useState('all'); // 'all' | 'low' | 'empty' | 'ready'
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);

  // Server-side Table Pagination & Sorting states
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeActionMenuId, setActiveActionMenuId] = useState(null);

  // Close action popup when clicking outside
  useEffect(() => {
    const handleGlobalClick = () => setActiveActionMenuId(null);
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  // Close filter sidebar on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsFilterSidebarOpen(false);
      }
    };
    if (isFilterSidebarOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFilterSidebarOpen]);

  // Reset pagination on filter/search change with simulated short transition
  useEffect(() => {
    setPage(1);
    setActiveActionMenuId(null);
  }, [searchName, searchSku, selectedCategory, selectedStatus, stockCondition, minPrice, maxPrice]);

  // Active filters & search count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchName.trim() !== '') count++;
    if (searchSku.trim() !== '') count++;
    if (selectedCategory !== 'all') count++;
    if (selectedStatus !== 'all') count++;
    if (stockCondition !== 'all') count++;
    if (minPrice.trim() !== '') count++;
    if (maxPrice.trim() !== '') count++;
    return count;
  }, [searchName, searchSku, selectedCategory, selectedStatus, stockCondition, minPrice, maxPrice]);

  // Reset all filters & search helper
  const handleResetFilters = () => {
    setSearchName('');
    setSearchSku('');
    setSelectedCategory('all');
    setSelectedStatus('all');
    setStockCondition('all');
    setMinPrice('');
    setMaxPrice('');
  };

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
      // Search by Product Name
      if (searchName.trim()) {
        const qName = searchName.toLowerCase();
        if (!p.name?.toLowerCase().includes(qName)) return false;
      }

      // Search by Product SKU
      if (searchSku.trim()) {
        const qSku = searchSku.toLowerCase();
        const matchSku = p.sku?.toLowerCase().includes(qSku);
        const matchVariantSku = p.variants?.some(v => v.sku?.toLowerCase().includes(qSku));
        if (!matchSku && !matchVariantSku) return false;
      }

      // Category filter
      if (selectedCategory !== 'all' && p.category_id !== Number(selectedCategory)) {
        return false;
      }

      // Status filter
      if (selectedStatus === 'active' && !(p.status === 'active' || p.active)) return false;
      if (selectedStatus === 'inactive' && (p.status === 'active' || p.active)) return false;

      // Stock condition filter
      if (stockCondition === 'low') {
        const minStock = Number(p.stock_minimum || 5);
        if (!(Number(p.stock) <= minStock && Number(p.stock) > 0)) return false;
      } else if (stockCondition === 'empty') {
        if (Number(p.stock) !== 0) return false;
      } else if (stockCondition === 'ready') {
        const minStock = Number(p.stock_minimum || 5);
        if (Number(p.stock) <= minStock) return false;
      }

      // Price range filter
      if (minPrice.trim() !== '' && Number(p.price) < Number(minPrice)) return false;
      if (maxPrice.trim() !== '' && Number(p.price) > Number(maxPrice)) return false;

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
  }, [products, searchName, searchSku, selectedCategory, selectedStatus, stockCondition, minPrice, maxPrice, sortBy, sortDirection]);

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
      width: 'w-24',
      render: (_, product, rowIdx) => {
        const isOpen = activeActionMenuId === product.id;
        const isActive = product.status === 'active' || product.active;
        const isNearBottom = rowIdx >= paginatedProducts.length - 2 && paginatedProducts.length > 3;

        return (
          <div className="relative inline-block text-left" onClick={(e) => e.stopPropagation()}>
            {/* Tombol Titik 3 */}
            <button
              type="button"
              onClick={() => setActiveActionMenuId(isOpen ? null : product.id)}
              className={`p-1.5 rounded-none border transition-colors cursor-pointer ${
                isOpen 
                  ? 'bg-neutral-950 text-white border-neutral-950 shadow-xs' 
                  : 'text-neutral-700 hover:text-black hover:bg-neutral-100 border-neutral-300 bg-white shadow-2xs'
              }`}
              title="Menu Aksi Produk"
              aria-label="Menu Aksi Baris Produk"
            >
              <MoreVertical size={16} />
            </button>

            {/* Popup Menu Dropdown */}
            {isOpen && (
              <div 
                className={`absolute right-0 ${
                  isNearBottom ? 'bottom-full mb-1' : 'top-full mt-1'
                } w-48 bg-white border border-neutral-300 rounded-none shadow-xl z-50 py-1 text-left animate-in fade-in zoom-in-95 duration-100 font-sans`}
              >
                {/* 1. Lihat Detail */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveActionMenuId(null);
                    onViewProductDetail(product);
                  }}
                  className="w-full px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-50 hover:text-blue-800 flex items-center gap-2.5 transition-colors cursor-pointer text-left"
                >
                  <Eye size={15} className="text-blue-600" />
                  <span>Lihat Detail</span>
                </button>

                {/* 2. Ubah Produk */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveActionMenuId(null);
                    onEditProduct(product);
                  }}
                  className="w-full px-3 py-2 text-xs font-bold text-sky-700 hover:bg-sky-50 hover:text-sky-800 flex items-center gap-2.5 transition-colors cursor-pointer text-left"
                >
                  <Edit3 size={15} className="text-sky-600" />
                  <span>Ubah Produk</span>
                </button>

                {/* 3. Toggle Status Aktif/Draft */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveActionMenuId(null);
                    onToggleStatus(product);
                  }}
                  className={`w-full px-3 py-2 text-xs font-bold flex items-center gap-2.5 transition-colors cursor-pointer text-left ${
                    isActive 
                      ? 'text-amber-700 hover:bg-amber-50 hover:text-amber-800' 
                      : 'text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800'
                  }`}
                >
                  {isActive ? (
                    <>
                      <XCircle size={15} className="text-amber-600" />
                      <span>Jadikan Draft</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={15} className="text-emerald-600" />
                      <span>Aktifkan Produk</span>
                    </>
                  )}
                </button>

                <div className="border-t border-neutral-200 my-1" />

                {/* 4. Hapus Produk */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveActionMenuId(null);
                    setProductToDelete(product);
                  }}
                  className="w-full px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50 hover:text-rose-800 flex items-center gap-2.5 transition-colors cursor-pointer text-left"
                >
                  <Trash2 size={15} className="text-rose-600" />
                  <span>Hapus Produk</span>
                </button>
              </div>
            )}
          </div>
        );
      }
    }
  ];

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      
      {/* Top Header Action */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-none border border-neutral-300 shadow-2xs">
        <div className="min-w-0">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-none bg-neutral-950 text-amber-400 flex items-center justify-center font-black shrink-0">
              <Package size={22} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-neutral-950 font-sport tracking-tight uppercase leading-tight">
                Daftar Produk & Katalog Toko
              </h1>
              <p className="text-xs text-neutral-600 mt-0.5">
                Kelola master produk, varian bertingkat (matrix SKU), penetapan harga jual, HPP, serta inventaris toko.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons: Atomic Organism */}
        <ProductHeaderActions
          onAddNewProduct={onAddNewProduct}
          onOpenFilter={() => setIsFilterSidebarOpen(true)}
          onOpenCategoryMaster={handleOpenCategoryMaster}
          activeFilterCount={activeFilterCount}
        />
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



      {/* Main Table View */}
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

      {/* Centralized Filter Sidebar Drawer Organism */}
      <ProductFilterDrawer
        isOpen={isFilterSidebarOpen}
        onClose={() => setIsFilterSidebarOpen(false)}
        activeFilterCount={activeFilterCount}
        totalFiltered={totalFiltered}
        totalProducts={products.length}
        searchName={searchName}
        onSearchNameChange={setSearchName}
        searchSku={searchSku}
        onSearchSkuChange={setSearchSku}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        categories={categories}
        products={products}
        stockCondition={stockCondition}
        onStockConditionChange={setStockCondition}
        minPrice={minPrice}
        onMinPriceChange={setMinPrice}
        maxPrice={maxPrice}
        onMaxPriceChange={setMaxPrice}
        sortBy={sortBy}
        sortDirection={sortDirection}
        onSortChange={(newSort, newDir) => {
          setSortBy(newSort);
          setSortDirection(newDir);
        }}
        onResetFilters={handleResetFilters}
      />

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

      {/* Category Master Modal */}
      <CategoryMasterModal
        isOpen={isCategoryMasterOpen}
        onClose={() => setIsCategoryMasterOpen(false)}
        onCategoriesChange={onCategoriesChange}
      />
    </div>
  );
}
