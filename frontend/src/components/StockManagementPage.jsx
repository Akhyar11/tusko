import React, { useState, useMemo, useEffect } from 'react';
import {
  Boxes,
  Warehouse,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Minus,
  SlidersHorizontal,
  RotateCcw,
  Edit3,
  MoreVertical,
  DollarSign,
  Package,
  X
} from 'lucide-react';
import IconButton from './atoms/IconButton';
import ServerSideTable from './ServerSideTable';
import StockFilterDrawer from './organisms/StockFilterDrawer';
import AddStockModal from './AddStockModal';
import ReduceStockModal from './ReduceStockModal';
import { formatRupiah } from '../utils/formatters';
import { 
  initialInventory, 
  initialStockLogs, 
  initialWarehouses 
} from '../data/mockStockData';

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

  // Filter drawer & active filters
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [selectedWarehouseCode, setSelectedWarehouseCode] = useState('all');
  const [stockFilter, setStockFilter] = useState('all'); // 'all' | 'safe' | 'low' | 'out_of_stock'
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchName, setSearchName] = useState('');
  const [searchSku, setSearchSku] = useState('');

  // Table pagination, sorting & selection
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortBy, setSortBy] = useState('stock');
  const [sortDirection, setSortDirection] = useState('asc');
  const [selectedStockIds, setSelectedStockIds] = useState([]);
  const [activeActionMenuId, setActiveActionMenuId] = useState(null);

  // Modals state
  const [isAddStockModalOpen, setIsAddStockModalOpen] = useState(false);
  const [preselectedRestockProductId, setPreselectedRestockProductId] = useState(null);
  const [isReduceStockModalOpen, setIsReduceStockModalOpen] = useState(false);
  const [preselectedReduceProductId, setPreselectedReduceProductId] = useState(null);

  // Quick Adjustment Modal State
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedProductForAdjust, setSelectedProductForAdjust] = useState(null);
  const [adjustType, setAdjustType] = useState('in'); // 'in' | 'out' | 'set'
  const [adjustQuantity, setAdjustQuantity] = useState('');
  const [adjustReference, setAdjustReference] = useState('');
  const [adjustNotes, setAdjustNotes] = useState('');

  // Close action popup when clicking outside
  useEffect(() => {
    const handleGlobalClick = () => setActiveActionMenuId(null);
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  // Hitung KPI 3-Tier Stok
  const stats = useMemo(() => {
    let totalOnHand = 0;
    let totalReserved = 0;
    let totalAvailable = 0;
    let totalAssetCost = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    const source = selectedWarehouseCode === 'all' 
      ? inventory 
      : inventory.filter(i => i.warehouse_code === selectedWarehouseCode);

    source.forEach((item) => {
      const onHand = Number(item.stock) || 0;
      const reserved = Number(item.reserved_stock) || 0;
      const available = Math.max(0, onHand - reserved);

      totalOnHand += onHand;
      totalReserved += reserved;
      totalAvailable += available;
      totalAssetCost += onHand * (item.cost_price || 0);

      if (onHand === 0) {
        outOfStockCount++;
      } else if (onHand <= item.stock_minimum) {
        lowStockCount++;
      }
    });

    return {
      skuCount: source.length,
      totalOnHand,
      totalReserved,
      totalAvailable,
      totalAssetCost,
      lowStockCount,
      outOfStockCount
    };
  }, [inventory, selectedWarehouseCode]);

  // Unique categories
  const categories = useMemo(() => {
    return Array.from(new Set(inventory.map((i) => i.category_name))).filter(Boolean);
  }, [inventory]);

  // Active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedWarehouseCode !== 'all') count++;
    if (stockFilter !== 'all') count++;
    if (categoryFilter !== 'all') count++;
    if (searchName.trim() !== '') count++;
    if (searchSku.trim() !== '') count++;
    return count;
  }, [selectedWarehouseCode, stockFilter, categoryFilter, searchName, searchSku]);

  const handleResetFilters = () => {
    setSelectedWarehouseCode('all');
    setStockFilter('all');
    setCategoryFilter('all');
    setSearchName('');
    setSearchSku('');
    setPage(1);
  };

  // Filtered inventory
  const filteredInventory = useMemo(() => {
    return inventory.filter((item) => {
      // 1. Gudang Filter
      if (selectedWarehouseCode !== 'all' && item.warehouse_code !== selectedWarehouseCode) return false;

      // 2. Status Stok Filter
      const onHand = Number(item.stock) || 0;
      if (stockFilter === 'safe' && (onHand <= item.stock_minimum || onHand === 0)) return false;
      if (stockFilter === 'low' && (onHand > item.stock_minimum || onHand === 0)) return false;
      if (stockFilter === 'out_of_stock' && onHand !== 0) return false;

      // 3. Kategori Filter
      if (categoryFilter !== 'all' && item.category_name !== categoryFilter) return false;

      // 4. Search Name
      if (searchName.trim()) {
        const q = searchName.toLowerCase();
        if (!item.name.toLowerCase().includes(q)) return false;
      }

      // 5. Search SKU / Bin
      if (searchSku.trim()) {
        const q = searchSku.toLowerCase();
        const matchSku = item.sku?.toLowerCase().includes(q);
        const matchBin = item.warehouse_bin?.toLowerCase().includes(q);
        if (!matchSku && !matchBin) return false;
      }

      return true;
    }).sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];

      if (sortBy === 'available_stock') {
        valA = (Number(a.stock) || 0) - (Number(a.reserved_stock) || 0);
        valB = (Number(b.stock) || 0) - (Number(b.reserved_stock) || 0);
      } else if (sortBy === 'stock' || sortBy === 'reserved_stock' || sortBy === 'cost_price') {
        valA = Number(valA || 0);
        valB = Number(valB || 0);
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [inventory, selectedWarehouseCode, stockFilter, categoryFilter, searchName, searchSku, sortBy, sortDirection]);

  // Paginated records
  const paginatedInventory = useMemo(() => {
    const start = (page - 1) * limit;
    return filteredInventory.slice(start, start + limit);
  }, [filteredInventory, page, limit]);

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

  // Open adjustment modal
  const handleOpenAdjustModal = (product) => {
    setSelectedProductForAdjust(product);
    setAdjustType('in');
    setAdjustQuantity('');
    setAdjustReference(`ADJ-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`);
    setAdjustNotes('');
    setIsAdjustModalOpen(true);
  };

  // Submit Adjustment
  const handleSaveAdjustment = (e) => {
    e.preventDefault();
    if (!selectedProductForAdjust || !adjustQuantity) return;

    const qty = parseInt(adjustQuantity, 10);
    if (isNaN(qty) || qty <= 0) return;

    const currentStock = selectedProductForAdjust.stock;
    let newStock = currentStock;
    let delta = 0;

    if (adjustType === 'in') {
      newStock = currentStock + qty;
      delta = qty;
    } else if (adjustType === 'out') {
      newStock = Math.max(0, currentStock - qty);
      delta = -qty;
    } else if (adjustType === 'set') {
      newStock = qty;
      delta = qty - currentStock;
    }

    setInventory((prev) =>
      prev.map((item) =>
        item.id === selectedProductForAdjust.id
          ? {
              ...item,
              stock: newStock,
              last_restock_at: adjustType === 'in' ? new Date().toISOString() : item.last_restock_at
            }
          : item
      )
    );

    const newLog = {
      id: Date.now(),
      product_id: selectedProductForAdjust.id,
      sku: selectedProductForAdjust.sku,
      product_name: selectedProductForAdjust.name,
      type: adjustType === 'in' ? 'in' : adjustType === 'out' ? 'out' : 'adjustment',
      quantity: delta,
      previous_stock: currentStock,
      current_stock: newStock,
      reference: adjustReference || 'ADJ-MANUAL',
      notes: adjustNotes || 'Penyesuaian stok manual',
      created_at: new Date().toISOString(),
      operator: 'Admin Gudang',
      warehouse_code: selectedProductForAdjust.warehouse_code || 'WH-CGK-01'
    };

    setStockLogs((prev) => [newLog, ...prev]);
    setIsAdjustModalOpen(false);
    onShowToast(`Stok ${selectedProductForAdjust.sku} diperbarui: ${currentStock} -> ${newStock} unit`);
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
      render: (reserved) => (
        <div className="font-mono font-bold text-xs text-amber-700">
          {reserved || 0}{' '}
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
                    setPreselectedRestockProductId(item.id);
                    setIsAddStockModalOpen(true);
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
                    setPreselectedReduceProductId(item.id);
                    setIsReduceStockModalOpen(true);
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
                    handleOpenAdjustModal(item);
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

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      
      {/* 1. Header Bar Bersih (Icon-only Controls, 1 Halaman 1 Entitas) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-none border border-neutral-300 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-none bg-neutral-950 text-amber-400 flex items-center justify-center font-black shrink-0">
            <Boxes size={22} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-neutral-950 font-sport tracking-tight uppercase">
              Manajemen Stok &amp; Gudang Terpadu
            </h1>
            <p className="text-xs text-neutral-600 mt-0.5">
              Kontrol inventaris stok fisik (*on-hand*), stok terpesan (*reserved*), dan stok siap jual multi-gudang.
            </p>
          </div>
        </div>

        {/* Action Controls: [Restok] -> [Kurangi] -> [Filter] */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <IconButton
            icon={Plus}
            onClick={() => {
              setPreselectedRestockProductId(null);
              setIsAddStockModalOpen(true);
            }}
            tooltip="Restok / Tambah Stok (+ Masuk)"
            variant="primary"
          />
          <IconButton
            icon={Minus}
            onClick={() => {
              setPreselectedReduceProductId(null);
              setIsReduceStockModalOpen(true);
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* On-Hand Physical Stock */}
        <div className="bg-white p-4 sm:p-5 rounded-none border border-neutral-300 shadow-2xs space-y-1">
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
        <div className="bg-white p-4 sm:p-5 rounded-none border border-neutral-300 shadow-2xs space-y-1">
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
        <div className="bg-white p-4 sm:p-5 rounded-none border border-neutral-300 shadow-2xs space-y-1">
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
        <div className="bg-white p-4 sm:p-5 rounded-none border border-neutral-300 shadow-2xs space-y-1">
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
        total={filteredInventory.length}
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
        totalFiltered={filteredInventory.length}
        totalStockItems={inventory.length}
        searchName={searchName}
        onSearchNameChange={setSearchName}
        searchSku={searchSku}
        onSearchSkuChange={setSearchSku}
        selectedWarehouseCode={selectedWarehouseCode}
        onWarehouseChange={setSelectedWarehouseCode}
        warehouses={warehouses}
        stockFilter={stockFilter}
        onStockFilterChange={setStockFilter}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={setCategoryFilter}
        categories={categories}
        onResetFilters={handleResetFilters}
      />

      {/* 5. Modal Restok Tambah */}
      <AddStockModal
        isOpen={isAddStockModalOpen}
        onClose={() => {
          setIsAddStockModalOpen(false);
          setPreselectedRestockProductId(null);
        }}
        inventory={inventory}
        preselectedProductId={preselectedRestockProductId}
        onAddStock={(newLog, updatedStock, costAmount) => {
          setInventory((prev) =>
            prev.map((item) =>
              item.id === newLog.product_id
                ? { ...item, stock: updatedStock, last_restock_at: newLog.created_at }
                : item
            )
          );
          setStockLogs((prev) => [newLog, ...prev]);
          if (costAmount > 0) {
            onAddExpenseTransaction({
              amount: costAmount,
              category: 'restock',
              category_label: 'Restock Stok Produk',
              description: `Pengadaan restock: ${newLog.product_name} (${newLog.quantity} unit)`
            });
          }
          setIsAddStockModalOpen(false);
          onShowToast(`Stok ${newLog.product_name} berhasil ditambah (+${newLog.quantity} unit).`);
        }}
      />

      {/* 6. Modal Kurangi Stok */}
      <ReduceStockModal
        isOpen={isReduceStockModalOpen}
        onClose={() => {
          setIsReduceStockModalOpen(false);
          setPreselectedReduceProductId(null);
        }}
        inventory={inventory}
        preselectedProductId={preselectedReduceProductId}
        onReduceStock={(newLog, updatedStock) => {
          setInventory((prev) =>
            prev.map((item) =>
              item.id === newLog.product_id ? { ...item, stock: updatedStock } : item
            )
          );
          setStockLogs((prev) => [newLog, ...prev]);
          setIsReduceStockModalOpen(false);
          onShowToast(`Stok ${newLog.product_name} dikurangi (-${newLog.quantity} unit).`);
        }}
      />

      {/* 7. Modal Penyesuaian Manual */}
      {isAdjustModalOpen && selectedProductForAdjust && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-[2px] animate-in fade-in duration-150">
          <div className="bg-white border border-neutral-300 w-full max-w-md rounded-none shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
              <h3 className="font-sport font-black text-base uppercase text-neutral-950">
                Penyesuaian Cepat Stok
              </h3>
              <button
                type="button"
                onClick={() => setIsAdjustModalOpen(false)}
                className="text-neutral-400 hover:text-black cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-none text-xs">
              <div className="font-bold text-neutral-900">{selectedProductForAdjust.name}</div>
              <div className="font-mono text-neutral-500 mt-0.5">
                SKU: {selectedProductForAdjust.sku} • Stok Saat Ini: {selectedProductForAdjust.stock} unit
              </div>
            </div>

            <form onSubmit={handleSaveAdjustment} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase font-sport tracking-wider text-neutral-700 mb-1">
                  Jenis Penyesuaian
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setAdjustType('in')}
                    className={`py-2 text-[11px] font-sport font-black uppercase rounded-none border cursor-pointer transition-colors ${
                      adjustType === 'in' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-neutral-50 text-neutral-700 border-neutral-300'
                    }`}
                  >
                    + Tambah
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType('out')}
                    className={`py-2 text-[11px] font-sport font-black uppercase rounded-none border cursor-pointer transition-colors ${
                      adjustType === 'out' ? 'bg-rose-600 text-white border-rose-600' : 'bg-neutral-50 text-neutral-700 border-neutral-300'
                    }`}
                  >
                    - Kurang
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType('set')}
                    className={`py-2 text-[11px] font-sport font-black uppercase rounded-none border cursor-pointer transition-colors ${
                      adjustType === 'set' ? 'bg-neutral-950 text-white border-neutral-950' : 'bg-neutral-50 text-neutral-700 border-neutral-300'
                    }`}
                  >
                    = Set Aktual
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase font-sport tracking-wider text-neutral-700 mb-1">
                  Jumlah Unit
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={adjustQuantity}
                  onChange={(e) => setAdjustQuantity(e.target.value)}
                  placeholder="Contoh: 10"
                  className="w-full px-3 py-2 text-xs font-mono font-bold bg-neutral-50 border border-neutral-300 rounded-none focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase font-sport tracking-wider text-neutral-700 mb-1">
                  Catatan Alasan Penyesuaian
                </label>
                <input
                  type="text"
                  value={adjustNotes}
                  onChange={(e) => setAdjustNotes(e.target.value)}
                  placeholder="Contoh: Hasil temuan audit fisik..."
                  className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-300 rounded-none focus:outline-none focus:border-black"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="px-4 py-2 text-xs font-sport font-black uppercase text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-none cursor-pointer transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-sport font-black uppercase text-white bg-neutral-950 hover:bg-neutral-900 rounded-none cursor-pointer transition-colors"
                >
                  Simpan Penyesuaian
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
