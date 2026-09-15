import React, { useState, useMemo, useEffect } from 'react';
import {
  Boxes,
  Warehouse,
  Lock,
  CheckCircle2,
  Plus,
  Minus,
  SlidersHorizontal,
  Edit3,
  MoreVertical,
  DollarSign,
  Package
} from 'lucide-react';
import IconButton from './atoms/IconButton';
import ServerSideTable from './ServerSideTable';
import StockFilterDrawer from './organisms/StockFilterDrawer';
import StockMutationPage from './StockMutationPage';
import { formatRupiah } from '../utils/formatters';
import { 
  initialInventory, 
  initialStockLogs, 
  initialWarehouses 
} from '../data/mockStockData';
import { useInventoryTableStore } from '../stores/useInventoryTableStore';

export default function StockManagementPage({
  inventory: propInventory = initialInventory,
  stockLogs: propStockLogs = initialStockLogs,
  onBackToShopping = () => {},
  onViewOrders = () => {},
  onViewTransactions = () => {},
  onAddExpenseTransaction = () => {},
  onShowToast = () => {}
}) {
  const [inventory, setInventory] = useState(propInventory);
  const [stockLogs, setStockLogs] = useState(propStockLogs);
  const [warehouses] = useState(initialWarehouses);

  // Centralized Zustand Table Store (100% Server-Side Data Operations)
  const {
    page,
    limit,
    sortBy,
    sortDirection,
    filters,
    data: storeInventory,
    total: totalInventoryCount,
    isLoading,
    setPage,
    setLimit,
    setSort,
    setFilter,
    resetFilters,
    fetchData,
  } = useInventoryTableStore();

  useEffect(() => {
    fetchData();
  }, []);

  // Filter drawer & active filters
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [selectedStockIds, setSelectedStockIds] = useState([]);
  const [activeActionMenuId, setActiveActionMenuId] = useState(null);

  // Halaman mutasi stok terpisah (pengganti modal): null | { mode: 'in'|'out'|'adjust', productId }
  const [mutationRequest, setMutationRequest] = useState(null);

  // Close action popup when clicking outside
  useEffect(() => {
    const handleGlobalClick = () => setActiveActionMenuId(null);
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  // Paginated records directly from server-side store
  const paginatedInventory = storeInventory.length > 0 || totalInventoryCount === 0 ? storeInventory : inventory;
  const totalFiltered = totalInventoryCount > 0 || storeInventory.length > 0 ? totalInventoryCount : inventory.length;

  // Hitung KPI 3-Tier Stok
  const stats = useMemo(() => {
    let totalOnHand = 0;
    let totalReserved = 0;
    let totalAvailable = 0;
    let totalAssetCost = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    const warehouseCode = filters.selectedWarehouseCode || 'all';
    const source = warehouseCode === 'all' 
      ? paginatedInventory 
      : paginatedInventory.filter(i => i.warehouse_code === warehouseCode);

    source.forEach((item) => {
      const onHand = Number(item.stock) || 0;
      const reserved = Number(item.reserved_stock) || 0;
      const available = Math.max(0, onHand - reserved);

      totalOnHand += onHand;
      totalReserved += reserved;
      totalAvailable += available;
      totalAssetCost += onHand * (item.cost_price || (item.price ? item.price * 0.65 : 0));

      if (onHand === 0) {
        outOfStockCount++;
      } else if (onHand <= (item.stock_minimum || 5)) {
        lowStockCount++;
      }
    });

    return {
      skuCount: totalFiltered,
      totalOnHand,
      totalReserved,
      totalAvailable,
      totalAssetCost,
      lowStockCount,
      outOfStockCount
    };
  }, [paginatedInventory, totalFiltered, filters.selectedWarehouseCode]);

  // Unique categories
  const categories = useMemo(() => {
    return Array.from(new Set(paginatedInventory.map((i) => i.category_name || i.category?.name))).filter(Boolean);
  }, [paginatedInventory]);

  // Active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.selectedWarehouseCode && filters.selectedWarehouseCode !== 'all') count++;
    if (filters.stockFilter && filters.stockFilter !== 'all') count++;
    if (filters.categoryFilter && filters.categoryFilter !== 'all') count++;
    if (filters.searchName && filters.searchName.trim() !== '') count++;
    if (filters.searchSku && filters.searchSku.trim() !== '') count++;
    if (filters.minStock) count++;
    if (filters.maxStock) count++;
    if (filters.minAvailable) count++;
    if (filters.maxAvailable) count++;
    return count;
  }, [filters]);

  const handleResetFilters = () => {
    resetFilters();
  };

  // Selection handlers
  const handleSelectRow = (id) => {
    setSelectedStockIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    const currentPageIds = paginatedInventory.map(i => i.id);
    const allSelected = currentPageIds.every(id => selectedStockIds.includes(id));

    if (allSelected) {
      setSelectedStockIds(prev => prev.filter(id => !currentPageIds.includes(id)));
    } else {
      const merged = new Set([...selectedStockIds, ...currentPageIds]);
      setSelectedStockIds(Array.from(merged));
    }
  };

  // Terapkan hasil mutasi dari StockMutationPage (halaman terpisah)
  const handleSaveMutation = (result) => {
    if (!result || !result.log) return;
    setInventory((prev) =>
      prev.map((item) =>
        item.id === result.log.product_id
          ? { ...item, stock: result.updatedStock, last_restock_at: result.kind === 'in' ? result.log.created_at : item.last_restock_at }
          : item
      )
    );
    setStockLogs((prev) => [result.log, ...prev]);
    if (result.kind === 'in' && result.costAmount > 0) {
      onAddExpenseTransaction({
        amount: result.costAmount,
        ...(result.costMeta || {})
      });
    }
    setMutationRequest(null);
  };

  // Table Columns Definition
  const tableColumns = useMemo(() => [
    {
      key: 'name',
      label: 'Info Produk & SKU',
      sortable: true,
      width: 'min-w-[240px]',
      render: (_, item) => {
        return (
          <div>
            <div className="font-sport font-black text-neutral-950 text-xs uppercase line-clamp-1">
              {item.name}
            </div>
            <div className="flex items-center gap-2 mt-0.5 text-[10px] text-neutral-500 font-mono">
              <span className="bg-neutral-100 px-1.5 py-0.2 rounded-none font-bold text-neutral-700 border border-neutral-200">
                {item.sku}
              </span>
              <span>•</span>
              <span>{item.category_name}</span>
            </div>
          </div>
        );
      }
    },
    {
      key: 'warehouse_name',
      label: 'Gudang & Rak Bin',
      width: 'w-48',
      render: (_, item) => (
        <div>
          <div className="font-semibold text-neutral-900 text-xs">
            {item.warehouse_name}
          </div>
          <div className="text-[10px] text-neutral-500 font-mono">
            Kode: {item.warehouse_code} • Bin: {item.warehouse_bin || '-'}
          </div>
        </div>
      )
    },
    {
      key: 'stock',
      label: 'Stok Fisik (On-Hand)',
      sortable: true,
      align: 'center',
      width: 'w-36',
      render: (stock, item) => (
        <div className="font-mono font-black text-sm text-neutral-950">
          {stock}{' '}
          <span className="text-[10px] font-normal text-neutral-500">unit</span>
        </div>
      )
    },
    {
      key: 'reserved_stock',
      label: 'Stok Terpesan',
      sortable: true,
      align: 'center',
      width: 'w-36',
      render: (_, item) => (
        <div className="font-mono font-bold text-xs text-amber-700">
          {Number(item?.reserved_stock || 0)}{' '}
          <span className="text-[10px] font-normal text-neutral-500">unit</span>
        </div>
      )
    },
    {
      key: 'available_stock',
      label: 'Stok Siap Jual',
      sortable: true,
      align: 'center',
      width: 'w-36',
      render: (_, item) => {
        const avail = Math.max(0, (Number(item.stock) || 0) - (Number(item.reserved_stock) || 0));
        return (
          <div className={`font-mono font-black text-sm ${avail === 0 ? 'text-red-700' : 'text-emerald-700'}`}>
            {avail}{' '}
            <span className="text-[10px] font-normal text-neutral-500">unit</span>
          </div>
        );
      }
    },
    {
      key: 'status',
      label: 'Kondisi Stok',
      align: 'center',
      width: 'w-32',
      render: (_, item) => {
        const onHand = Number(item.stock) || 0;
        const isOut = onHand === 0;
        const isLow = onHand <= item.stock_minimum;

        return (
          <span className={`inline-block px-2.5 py-1 text-[10px] font-sport font-black uppercase rounded-none border tracking-wider ${
            isOut
              ? 'bg-red-50 text-red-900 border-red-300'
              : isLow
              ? 'bg-amber-50 text-amber-900 border-amber-300'
              : 'bg-emerald-50 text-emerald-900 border-emerald-300'
          }`}>
            {isOut ? 'Habis' : isLow ? 'Menipis' : 'Aman'}
          </span>
        );
      }
    },
    {
      key: 'actions',
      label: 'Aksi',
      sortable: false,
      align: 'right',
      width: 'w-24',
      render: (_, item, rowIdx) => {
        const isOpen = activeActionMenuId === item.id;
        const isNearBottom = rowIdx >= paginatedInventory.length - 2 && paginatedInventory.length > 3;

        return (
          <div className="relative inline-block text-left" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setActiveActionMenuId(isOpen ? null : item.id)}
              className={`p-1.5 rounded-none border transition-colors cursor-pointer ${
                isOpen 
                  ? 'bg-neutral-950 text-white border-neutral-950 shadow-xs' 
                  : 'text-neutral-700 hover:text-black hover:bg-neutral-100 border-neutral-300 bg-white shadow-2xs'
              }`}
              title="Menu Aksi Stok"
            >
              <MoreVertical size={16} />
            </button>

            {isOpen && (
              <div 
                className={`absolute right-0 ${
                  isNearBottom ? 'bottom-full mb-1' : 'top-full mt-1'
                } w-48 bg-white border border-neutral-300 rounded-none shadow-xl z-50 py-1 text-left animate-in fade-in zoom-in-95 duration-100`}
              >
                {/* 1. Restok Tambah */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveActionMenuId(null);
                    setMutationRequest({ mode: 'in', productId: item.id });
                  }}
                  className="w-full px-3.5 py-2 text-xs font-bold text-neutral-700 hover:bg-neutral-50 hover:text-neutral-950 flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <Plus size={14} className="text-neutral-500" />
                  <span>Restok / Tambah Masuk</span>
                </button>

                {/* 2. Kurangi Stok */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveActionMenuId(null);
                    setMutationRequest({ mode: 'out', productId: item.id });
                  }}
                  className="w-full px-3.5 py-2 text-xs font-bold text-neutral-700 hover:bg-neutral-50 hover:text-neutral-950 flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <Minus size={14} className="text-neutral-500" />
                  <span>Kurangi Stok Fisik</span>
                </button>

                {/* 3. Penyesuaian Manual */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveActionMenuId(null);
                    setMutationRequest({ mode: 'adjust', productId: item.id });
                  }}
                  className="w-full px-3.5 py-2 text-xs font-bold text-neutral-700 hover:bg-neutral-50 hover:text-neutral-950 flex items-center gap-2 cursor-pointer transition-colors border-t border-neutral-100"
                >
                  <Edit3 size={14} className="text-neutral-500" />
                  <span>Penyesuaian Manual</span>
                </button>
              </div>
            )}
          </div>
        );
      }
    }
  ], [paginatedInventory, activeActionMenuId]);

  // View penuh halaman mutasi stok terpisah (pengganti modal create/edit — Aturan 23)
  if (mutationRequest) {
    return (
      <StockMutationPage
        mode={mutationRequest.mode}
        inventory={inventory}
        preselectedProductId={mutationRequest.productId}
        onSaveMutation={handleSaveMutation}
        onNavigateBack={() => setMutationRequest(null)}
        onShowToast={onShowToast}
      />
    );
  }

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      
      {/* 1. Header Bar Bersih (Icon-only Controls, 1 Halaman 1 Entitas) */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-none border border-neutral-300 shadow-2xs">
        <div className="min-w-0">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-none bg-neutral-950 text-amber-400 flex items-center justify-center font-black shrink-0">
              <Boxes size={22} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-neutral-950 font-sport tracking-tight uppercase leading-tight">
                Manajemen Stok &amp; Gudang Terpadu
              </h1>
              <p className="text-xs text-neutral-600 mt-0.5">
                Kontrol inventaris stok fisik (*on-hand*), stok terpesan (*reserved*), dan stok siap jual multi-gudang.
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls: [Restok] -> [Kurangi] -> [Filter] */}
        <div className="flex items-center gap-2 self-start xl:self-auto">
          <IconButton
            icon={Plus}
            onClick={() => {
              setMutationRequest({ mode: 'in', productId: null });
            }}
            tooltip="Restok / Tambah Stok (+ Masuk)"
            variant="primary"
          />
          <IconButton
            icon={Minus}
            onClick={() => {
              setMutationRequest({ mode: 'out', productId: null });
            }}
            tooltip="Kurangi Stok (- Fisik)"
            variant="secondary"
          />
          <IconButton
            icon={SlidersHorizontal}
            onClick={() => setIsFilterDrawerOpen(true)}
            tooltip="Buka Filter Stok & Gudang"
            variant={activeFilterCount > 0 ? 'dark' : 'secondary'}
            badge={activeFilterCount > 0 ? activeFilterCount : null}
          />
        </div>
      </div>

      {/* 2. 3-Tier Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4">
        {/* On-Hand Physical Stock */}
        <div className="bg-white p-4 rounded-none border border-neutral-300 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-sport font-black uppercase tracking-wider text-neutral-500">
              1. Stok Fisik (On-Hand)
            </span>
            <Warehouse size={16} className="text-blue-600" />
          </div>
          <div className="text-2xl font-black text-neutral-950 font-mono">
            {stats.totalOnHand.toLocaleString('id-ID')}{' '}
            <span className="text-xs font-normal text-neutral-400">unit</span>
          </div>
          <p className="text-[10px] text-neutral-500 border-t border-neutral-100 pt-1">
            Total fisik di rak seluruh gudang
          </p>
        </div>

        {/* Reserved Stock */}
        <div className="bg-white p-4 rounded-none border border-neutral-300 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-sport font-black uppercase tracking-wider text-amber-700">
              2. Stok Terpesan (Reserved)
            </span>
            <Lock size={16} className="text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-700 font-mono">
            {stats.totalReserved.toLocaleString('id-ID')}{' '}
            <span className="text-xs font-normal text-amber-600/70">unit</span>
          </div>
          <p className="text-[10px] text-neutral-500 border-t border-neutral-100 pt-1">
            Terkunci di antrean checkout &amp; packing
          </p>
        </div>

        {/* Available Stock */}
        <div className="bg-white p-4 rounded-none border border-neutral-300 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-sport font-black uppercase tracking-wider text-emerald-700">
              3. Siap Jual (Available)
            </span>
            <CheckCircle2 size={16} className="text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700 font-mono">
            {stats.totalAvailable.toLocaleString('id-ID')}{' '}
            <span className="text-xs font-normal text-emerald-600/70">unit</span>
          </div>
          <p className="text-[10px] text-neutral-500 border-t border-neutral-100 pt-1">
            Stok bebas untuk pesanan baru
          </p>
        </div>

        {/* Total Stock Asset Value */}
        <div className="bg-white p-4 rounded-none border border-neutral-300 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-sport font-black uppercase tracking-wider text-neutral-500">
              Nilai Valuasi Aset
            </span>
            <DollarSign size={16} className="text-neutral-900" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-neutral-950 font-mono truncate">
            {formatRupiah(stats.totalAssetCost)}
          </div>
          <p className="text-[10px] text-neutral-500 border-t border-neutral-100 pt-1 truncate">
            Kalkulasi modal HPP stok berjalan
          </p>
        </div>
      </div>

      {/* 3. Main Data Table: Single Table View Only */}
      <ServerSideTable
        columns={tableColumns}
        data={paginatedInventory}
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
          setSort(newSortBy, newDir);
        }}
        isLoading={isLoading}
        selectable={true}
        selectedIds={selectedStockIds}
        onSelectRow={handleSelectRow}
        onSelectAll={handleSelectAll}
        idKey="id"
        emptyMessage="Tidak Ada Item Stok Ditemukan"
        emptyDescription="Sesuaikan kata kunci pencarian atau ubah filter lokasi gudang."
      />

      {/* 4. Centralized Filter Sidebar Organism */}
      <StockFilterDrawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        activeFilterCount={activeFilterCount}
        totalFiltered={totalFiltered}
        totalStockItems={totalFiltered}
        searchName={filters.searchName || ''}
        onSearchNameChange={(val) => setFilter('searchName', val)}
        searchSku={filters.searchSku || ''}
        onSearchSkuChange={(val) => setFilter('searchSku', val)}
        selectedWarehouseCode={filters.selectedWarehouseCode || 'all'}
        onWarehouseChange={(val) => setFilter('selectedWarehouseCode', val)}
        warehouses={warehouses}
        stockFilter={filters.stockFilter || 'all'}
        onStockFilterChange={(val) => setFilter('stockFilter', val)}
        categoryFilter={filters.categoryFilter || 'all'}
        onCategoryFilterChange={(val) => setFilter('categoryFilter', val)}
        categories={categories}
        minStock={filters.minStock || ''}
        onMinStockChange={(val) => setFilter('minStock', val)}
        maxStock={filters.maxStock || ''}
        onMaxStockChange={(val) => setFilter('maxStock', val)}
        minAvailable={filters.minAvailable || ''}
        onMinAvailableChange={(val) => setFilter('minAvailable', val)}
        maxAvailable={filters.maxAvailable || ''}
        onMaxAvailableChange={(val) => setFilter('maxAvailable', val)}
        onResetFilters={handleResetFilters}
      />

    </div>
  );
}
