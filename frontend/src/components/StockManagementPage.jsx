import React, { useState, useMemo } from 'react';
import {
  Boxes,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  Download,
  Plus,
  Minus,
  RefreshCw,
  ChevronRight,
  TrendingUp,
  History,
  Archive,
  ArrowUpRight,
  ArrowDownLeft,
  Warehouse,
  ShoppingBag,
  Wallet,
  Tag,
  X,
  Layers,
  Edit3
} from 'lucide-react';
import { formatRupiah } from '../utils/formatters';
import { initialInventory, initialStockLogs, stockStatusOptions } from '../data/mockStockData';
import AddStockModal from './AddStockModal';
import ReduceStockModal from './ReduceStockModal';
import LowStockAlertWidget from './LowStockAlertWidget';

export default function StockManagementPage({
  inventory: propInventory = initialInventory,
  stockLogs: propStockLogs = initialStockLogs,
  onBackToShopping = () => {},
  onViewOrders = () => {},
  onViewTransactions = () => {},
  onAddExpenseTransaction = () => {}
}) {
  const [inventory, setInventory] = useState(propInventory);
  const [stockLogs, setStockLogs] = useState(propStockLogs);
  const [activeTab, setActiveTab] = useState('inventory'); // 'inventory' | 'logs'
  const [stockFilter, setStockFilter] = useState('all'); // 'all' | 'safe' | 'low' | 'out_of_stock'
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Add & Reduce Stock Modal States
  const [isAddStockModalOpen, setIsAddStockModalOpen] = useState(false);
  const [preselectedRestockProductId, setPreselectedRestockProductId] = useState(null);
  const [isReduceStockModalOpen, setIsReduceStockModalOpen] = useState(false);

  // Modal Adjustment State
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedProductForAdjust, setSelectedProductForAdjust] = useState(null);
  const [adjustType, setAdjustType] = useState('in'); // 'in' (restock) | 'out' (damage/sample) | 'set' (opname)
  const [adjustQuantity, setAdjustQuantity] = useState('');
  const [adjustReference, setAdjustReference] = useState('');
  const [adjustNotes, setAdjustNotes] = useState('');
  const [adjustOperator, setAdjustOperator] = useState('Admin Gudang');
  const [adjustSuccessMsg, setAdjustSuccessMsg] = useState('');

  // Hitung KPI Stok
  const stats = useMemo(() => {
    let totalItems = 0;
    let totalAssetCost = 0;
    let totalRetailValue = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let safeStockCount = 0;

    inventory.forEach((item) => {
      totalItems += item.stock;
      totalAssetCost += item.stock * (item.cost_price || 0);
      totalRetailValue += item.stock * item.selling_price;

      if (item.stock === 0) {
        outOfStockCount++;
      } else if (item.stock <= item.stock_minimum) {
        lowStockCount++;
      } else {
        safeStockCount++;
      }
    });

    return {
      skuCount: inventory.length,
      totalItems,
      totalAssetCost,
      totalRetailValue,
      lowStockCount,
      outOfStockCount,
      safeStockCount
    };
  }, [inventory]);

  // Unique categories for filter
  const categories = useMemo(() => {
    const list = Array.from(new Set(inventory.map((i) => i.category_name))).filter(Boolean);
    return list;
  }, [inventory]);

  // Filtered inventory
  const filteredInventory = useMemo(() => {
    return inventory.filter((item) => {
      // 1. Status Stok Filter
      if (stockFilter === 'safe' && (item.stock <= item.stock_minimum || item.stock === 0)) return false;
      if (stockFilter === 'low' && (item.stock > item.stock_minimum || item.stock === 0)) return false;
      if (stockFilter === 'out_of_stock' && item.stock !== 0) return false;

      // 2. Kategori Filter
      if (categoryFilter !== 'all' && item.category_name !== categoryFilter) return false;

      // 3. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = item.name.toLowerCase().includes(q);
        const matchSku = item.sku.toLowerCase().includes(q);
        const matchBin = item.warehouse_bin?.toLowerCase().includes(q);
        return matchName || matchSku || matchBin;
      }

      return true;
    });
  }, [inventory, stockFilter, categoryFilter, searchQuery]);

  // Filtered stock logs
  const filteredLogs = useMemo(() => {
    if (!searchQuery.trim()) return stockLogs;
    const q = searchQuery.toLowerCase();
    return stockLogs.filter((log) => 
      log.product_name.toLowerCase().includes(q) ||
      log.sku.toLowerCase().includes(q) ||
      log.reference?.toLowerCase().includes(q) ||
      log.notes?.toLowerCase().includes(q)
    );
  }, [stockLogs, searchQuery]);

  // Open adjustment modal for a specific product
  const handleOpenAdjustModal = (product) => {
    setSelectedProductForAdjust(product);
    setAdjustType('in');
    setAdjustQuantity('');
    setAdjustReference(`PO-RESTOCK-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`);
    setAdjustNotes('');
    setAdjustSuccessMsg('');
    setIsAdjustModalOpen(true);
  };

  // Submit Stock Adjustment
  const handleSaveAdjustment = (e) => {
    e.preventDefault();
    if (!selectedProductForAdjust || !adjustQuantity || Number(adjustQuantity) <= 0) return;

    const qty = Number(adjustQuantity);
    const prevStock = selectedProductForAdjust.stock;
    let newStock = prevStock;
    let logType = adjustType;

    if (adjustType === 'in') {
      newStock = prevStock + qty;
    } else if (adjustType === 'out') {
      newStock = Math.max(0, prevStock - qty);
    } else if (adjustType === 'set') {
      newStock = qty;
      logType = 'adjustment';
    }

    // Update product inventory
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

    // Add entry to stock logs
    const newLog = {
      id: Date.now(),
      product_id: selectedProductForAdjust.id,
      sku: selectedProductForAdjust.sku,
      product_name: selectedProductForAdjust.name,
      type: logType,
      quantity: adjustType === 'out' ? -qty : adjustType === 'in' ? qty : (newStock - prevStock),
      previous_stock: prevStock,
      current_stock: newStock,
      reference: adjustReference.trim() || 'MANUAL-ADJ',
      notes: adjustNotes.trim() || (adjustType === 'in' ? 'Restock barang masuk' : 'Penyesuaian stok manual'),
      created_at: new Date().toISOString(),
      operator: adjustOperator.trim() || 'Admin Gudang'
    };

    setStockLogs((prev) => [newLog, ...prev]);
    setAdjustSuccessMsg(`Stok ${selectedProductForAdjust.sku} berhasil diperbarui dari ${prevStock} menjadi ${newStock} unit!`);
    
    setTimeout(() => {
      setAdjustSuccessMsg('');
      setIsAdjustModalOpen(false);
    }, 1200);
  };

  // Handle save restock from AddStockModal
  const handleSaveRestock = (restockData) => {
    const { product, quantity, costPrice, totalCost, supplier, poNumber, warehouseBin, operator, notes, syncToCashflow } = restockData;
    const prevStock = product.stock;
    const newStock = prevStock + quantity;

    // 1. Update product inventory
    setInventory((prev) =>
      prev.map((item) =>
        item.id === product.id
          ? {
              ...item,
              stock: newStock,
              cost_price: costPrice,
              warehouse_bin: warehouseBin || item.warehouse_bin,
              last_restock_at: new Date().toISOString()
            }
          : item
      )
    );

    // 2. Add entry to stock logs
    const newLog = {
      id: Date.now(),
      product_id: product.id,
      sku: product.sku,
      product_name: product.name,
      type: 'in',
      quantity,
      previous_stock: prevStock,
      current_stock: newStock,
      reference: poNumber,
      notes: `${notes} (${supplier})`,
      created_at: new Date().toISOString(),
      operator
    };
    setStockLogs((prev) => [newLog, ...prev]);

    // 3. Sync to cashflow expense if enabled
    if (syncToCashflow && totalCost > 0) {
      onAddExpenseTransaction({
        type: 'expense',
        category: 'restock',
        category_label: 'Pengadaan Stok Produk',
        amount: totalCost,
        description: `Pengadaan restock ${quantity} unit ${product.sku} (${poNumber}) dari ${supplier}`,
        payment_method: 'BCA Bisnis Transfer',
        status: 'settled',
        notes: `PO: ${poNumber} | Operator: ${operator}`
      });
    }
  };

  // Handle save reduction from ReduceStockModal
  const handleSaveReduction = (reductionData) => {
    const { product, quantity, reasonLabel, reference, operator, notes } = reductionData;
    const prevStock = product.stock;
    const newStock = Math.max(0, prevStock - quantity);

    // 1. Update product inventory
    setInventory((prev) =>
      prev.map((item) =>
        item.id === product.id ? { ...item, stock: newStock } : item
      )
    );

    // 2. Add entry to stock logs
    const newLog = {
      id: Date.now(),
      product_id: product.id,
      sku: product.sku,
      product_name: product.name,
      type: 'out',
      quantity: -quantity,
      previous_stock: prevStock,
      current_stock: newStock,
      reference,
      notes: `${reasonLabel}: ${notes}`,
      created_at: new Date().toISOString(),
      operator
    };
    setStockLogs((prev) => [newLog, ...prev]);
  };

  // Quick increment / decrement inline
  const handleQuickAdjust = (product, delta) => {
    const prevStock = product.stock;
    const newStock = Math.max(0, prevStock + delta);
    if (newStock === prevStock) return;

    setInventory((prev) =>
      prev.map((item) =>
        item.id === product.id ? { ...item, stock: newStock } : item
      )
    );

    const newLog = {
      id: Date.now(),
      product_id: product.id,
      sku: product.sku,
      product_name: product.name,
      type: delta > 0 ? 'in' : 'out',
      quantity: delta,
      previous_stock: prevStock,
      current_stock: newStock,
      reference: 'QUICK-ADJUST',
      notes: delta > 0 ? 'Quick Restock (+1)' : 'Quick Pengurangan (-1)',
      created_at: new Date().toISOString(),
      operator: 'Admin / Quick Action'
    };

    setStockLogs((prev) => [newLog, ...prev]);
  };

  // Export CSV
  const handleExportCSV = () => {
    if (activeTab === 'inventory') {
      const headers = ['SKU', 'Nama Produk', 'Kategori', 'Stok Saat Ini', 'Stok Minimum', 'Status', 'Harga Modal', 'Harga Jual', 'Lokasi Rak'];
      const rows = filteredInventory.map((i) => [
        i.sku,
        `"${i.name.replace(/"/g, '""')}"`,
        i.category_name,
        i.stock,
        i.stock_minimum,
        i.stock === 0 ? 'Habis' : i.stock <= i.stock_minimum ? 'Menipis' : 'Aman',
        i.cost_price,
        i.selling_price,
        `"${i.warehouse_bin || ''}"`
      ]);
      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `Daftar_Stok_Inventaris_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const headers = ['Waktu', 'SKU', 'Nama Produk', 'Jenis Mutasi', 'Qty', 'Stok Sebelum', 'Stok Sesudah', 'No Referensi', 'Operator', 'Catatan'];
      const rows = filteredLogs.map((l) => [
        new Date(l.created_at).toLocaleString('id-ID'),
        l.sku,
        `"${l.product_name.replace(/"/g, '""')}"`,
        l.type,
        l.quantity,
        l.previous_stock,
        l.current_stock,
        l.reference || '-',
        l.operator || '-',
        `"${(l.notes || '').replace(/"/g, '""')}"`
      ]);
      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `Mutasi_Pergerakan_Stok_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Header & Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 mb-1">
            <button onClick={onBackToShopping} className="hover:text-amber-600 transition-colors cursor-pointer">
              Beranda
            </button>
            <ChevronRight size={13} />
            <span className="text-gray-900 font-bold">Manajemen Stok</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-950 flex items-center gap-2.5 tracking-tight">
            <Boxes className="text-amber-500" size={26} />
            Katalog & Manajemen Stok Gudang
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
            Pencatatan real-time stok fisik, safety stock, peringatan stok menipis, dan mutasi barang.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={onViewOrders}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
          >
            <ShoppingBag size={15} />
            <span>Pesanan</span>
          </button>
          <button
            type="button"
            onClick={onViewTransactions}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
          >
            <Wallet size={15} />
            <span>Keuangan</span>
          </button>
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer shadow-2xs"
          >
            <Download size={15} />
            <span className="hidden sm:inline">Ekspor CSV</span>
          </button>
          <button
            type="button"
            onClick={() => setIsReduceStockModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors cursor-pointer shadow-2xs"
            title="Catat Barang Rusak / Penarikan Stok Fisik"
          >
            <Minus size={15} className="text-rose-600" />
            <span>Kurangi Stok</span>
          </button>
          <button
            type="button"
            onClick={() => setIsAddStockModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-extrabold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <Plus size={16} />
            <span>Tambah Stok Masuk</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Unit Tersedia */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider uppercase text-gray-500">Total Stok Fisik</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <Boxes size={16} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black tracking-tight text-gray-950">
              {stats.totalItems.toLocaleString('id-ID')} <span className="text-sm font-semibold text-gray-500">unit</span>
            </div>
            <p className="mt-1 text-[11px] text-gray-500">
              Dari {stats.skuCount} SKU produk terdaftar
            </p>
          </div>
        </div>

        {/* Card 2: Valuasi Aset Stok */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider uppercase text-gray-500">Valuasi Modal Stok</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black tracking-tight text-emerald-700">
              {formatRupiah(stats.totalAssetCost)}
            </div>
            <p className="mt-1 text-[11px] text-gray-500">
              Potensi omset: {formatRupiah(stats.totalRetailValue)}
            </p>
          </div>
        </div>

        {/* Card 3: Stok Menipis Warning */}
        <div className="bg-white p-5 rounded-2xl border border-amber-200 bg-amber-50/20 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider uppercase text-amber-700">Stok Menipis (&lt; Min)</span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700">
              <AlertTriangle size={16} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black tracking-tight text-amber-700">
              {stats.lowStockCount} <span className="text-sm font-semibold">SKU</span>
            </div>
            <p className="mt-1 text-[11px] text-amber-600 font-medium">
              Di bawah batas safety stock gudang
            </p>
          </div>
        </div>

        {/* Card 4: Stok Habis Alert */}
        <div className="bg-white p-5 rounded-2xl border border-rose-200 bg-rose-50/20 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider uppercase text-rose-700">Stok Habis (0)</span>
            <div className="w-8 h-8 rounded-xl bg-rose-100 border border-rose-300 flex items-center justify-center text-rose-700">
              <XCircle size={16} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black tracking-tight text-rose-700">
              {stats.outOfStockCount} <span className="text-sm font-semibold">SKU</span>
            </div>
            <p className="mt-1 text-[11px] text-rose-600 font-medium">
              Perlu pengadaan restock segera
            </p>
          </div>
        </div>
      </div>

      {/* Widget Peringatan Stok Menipis & Rekomendasi Reorder */}
      <LowStockAlertWidget
        inventory={inventory}
        onRestockProduct={(item) => {
          setPreselectedRestockProductId(item.id);
          setIsAddStockModalOpen(true);
        }}
        onViewAllStock={() => {
          setActiveTab('inventory');
          setStockFilter('all');
        }}
      />

      {/* Main Container */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
        {/* Navigation Tabs (Inventaris vs Mutasi Log) */}
        <div className="flex items-center justify-between border-b border-gray-200 px-4 sm:px-6 bg-gray-50/50">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('inventory')}
              className={`py-3.5 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'inventory'
                  ? 'border-amber-500 text-amber-600 bg-white'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              <Boxes size={16} />
              <span>Daftar Stok Inventaris ({inventory.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('logs')}
              className={`py-3.5 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'logs'
                  ? 'border-amber-500 text-amber-600 bg-white'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              <History size={16} />
              <span>Riwayat Mutasi Stok ({stockLogs.length})</span>
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="p-4 sm:p-5 border-b border-gray-150 bg-white flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={activeTab === 'inventory' ? 'Cari nama produk, SKU, atau rak...' : 'Cari mutasi pergerakan stok...'}
              className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-gray-900"
            />
            <Search className="absolute left-3 top-2.5 text-gray-400" size={15} />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filters for Inventory Tab */}
          {activeTab === 'inventory' && (
            <div className="flex items-center gap-2 flex-wrap">
              {/* Stock Status Filter */}
              <select
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value)}
                className="px-3 py-2 text-xs font-semibold bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-amber-500 text-gray-700 cursor-pointer"
              >
                {stockStatusOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>

              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 text-xs font-semibold bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-amber-500 text-gray-700 cursor-pointer"
              >
                <option value="all">Semua Kategori</option>
                {categories.map((c, idx) => (
                  <option key={idx} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              {(searchQuery || stockFilter !== 'all' || categoryFilter !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setStockFilter('all');
                    setCategoryFilter('all');
                  }}
                  className="px-2.5 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                >
                  Reset
                </button>
              )}
            </div>
          )}
        </div>

        {/* TAB 1: INVENTORY TABLE */}
        {activeTab === 'inventory' ? (
          filteredInventory.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-gray-400 mb-3">
                <Boxes size={28} />
              </div>
              <h3 className="text-base font-bold text-gray-800">Tidak ada produk ditemukan</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
                Silakan sesuaikan pencarian atau reset filter status stok Anda.
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50/80 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                      <th className="py-3 px-4">Produk & SKU</th>
                      <th className="py-3 px-4">Kategori & Lokasi Rak</th>
                      <th className="py-3 px-4 text-center">Status Stok</th>
                      <th className="py-3 px-4 text-center">Stok Fisik / Min</th>
                      <th className="py-3 px-4 text-right">Harga Modal / Jual</th>
                      <th className="py-3 px-4 text-center">Quick Adjust</th>
                      <th className="py-3 px-4 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-150 text-xs">
                    {filteredInventory.map((item) => {
                      const isOutOfStock = item.stock === 0;
                      const isLowStock = item.stock <= item.stock_minimum && !isOutOfStock;

                      return (
                        <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                          {/* Produk & SKU */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={item.image_url}
                                alt={item.name}
                                className="w-11 h-11 object-cover rounded-xl border border-gray-200 bg-gray-50 shrink-0"
                              />
                              <div>
                                <span className="font-bold text-gray-950 line-clamp-1 hover:text-amber-600 transition-colors">
                                  {item.name}
                                </span>
                                <div className="text-[11px] font-mono text-gray-500 font-bold mt-0.5">
                                  SKU: {item.sku}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Kategori & Lokasi Rak */}
                          <td className="py-3.5 px-4">
                            <div className="text-gray-800 font-semibold">{item.category_name}</div>
                            <div className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                              <Warehouse size={12} className="text-gray-400" />
                              <span>{item.warehouse_bin || 'Gudang Utama'}</span>
                            </div>
                          </td>

                          {/* Status Stok Badge */}
                          <td className="py-3.5 px-4 text-center">
                            {isOutOfStock ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-50 text-rose-700 border border-rose-200">
                                <XCircle size={11} />
                                Stok Habis
                              </span>
                            ) : isLowStock ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-50 text-amber-800 border border-amber-300">
                                <AlertTriangle size={11} />
                                Menipis
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 size={11} />
                                Aman
                              </span>
                            )}
                          </td>

                          {/* Stok Fisik & Minimum Bar */}
                          <td className="py-3.5 px-4 text-center">
                            <div className="font-mono text-sm font-black text-gray-900">
                              {item.stock}{' '}
                              <span className="text-[11px] font-normal text-gray-500">
                                / min {item.stock_minimum}
                              </span>
                            </div>
                            {/* Safety Stock Bar */}
                            <div className="w-24 bg-gray-200 h-1.5 rounded-full mx-auto mt-1 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  isOutOfStock
                                    ? 'w-0'
                                    : isLowStock
                                    ? 'bg-amber-500'
                                    : 'bg-emerald-500'
                                }`}
                                style={{
                                  width: `${Math.min(100, Math.round((item.stock / (item.stock_minimum * 2)) * 100))}%`
                                }}
                              ></div>
                            </div>
                          </td>

                          {/* Harga Modal / Jual */}
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <div className="font-bold text-gray-900">
                              {formatRupiah(item.selling_price)}
                            </div>
                            <div className="text-[10px] text-gray-500 font-medium">
                              Modal: {formatRupiah(item.cost_price || 0)}
                            </div>
                          </td>

                          {/* Quick Adjust Buttons */}
                          <td className="py-3.5 px-4 text-center">
                            <div className="inline-flex items-center border border-gray-300 rounded-xl overflow-hidden bg-white shadow-2xs">
                              <button
                                type="button"
                                disabled={item.stock <= 0}
                                onClick={() => handleQuickAdjust(item, -1)}
                                className="p-1.5 text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                                title="Kurangi 1 unit"
                              >
                                <Minus size={13} />
                              </button>
                              <span className="px-2 font-mono font-bold text-xs text-gray-900">
                                {item.stock}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleQuickAdjust(item, 1)}
                                className="p-1.5 text-gray-600 hover:bg-gray-100 cursor-pointer transition-colors"
                                title="Tambah 1 unit"
                              >
                                <Plus size={13} />
                              </button>
                            </div>
                          </td>

                          {/* Action Button */}
                          <td className="py-3.5 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => handleOpenAdjustModal(item)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-neutral-900 text-amber-400 hover:bg-neutral-800 rounded-xl font-bold text-[11px] transition-colors cursor-pointer shadow-2xs"
                            >
                              <Edit3 size={12} />
                              <span>Opname</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card Listing (< md) */}
              <div className="md:hidden divide-y divide-gray-150">
                {filteredInventory.map((item) => {
                  const isOutOfStock = item.stock === 0;
                  const isLowStock = item.stock <= item.stock_minimum && !isOutOfStock;

                  return (
                    <div key={item.id} className="p-4 space-y-3">
                      <div className="flex items-start gap-3">
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-14 h-14 object-cover rounded-xl border border-gray-200 bg-gray-50 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <span className="font-bold text-xs text-gray-950 line-clamp-2">
                            {item.name}
                          </span>
                          <div className="text-[11px] font-mono text-gray-500 font-bold mt-0.5">
                            SKU: {item.sku}
                          </div>
                          <div className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-1">
                            <Warehouse size={11} />
                            <span>{item.warehouse_bin || 'Gudang'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-gray-100 text-xs">
                        <div>
                          {isOutOfStock ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-50 text-rose-700 border border-rose-200">
                              <XCircle size={10} />
                              Habis
                            </span>
                          ) : isLowStock ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-50 text-amber-800 border border-amber-300">
                              <AlertTriangle size={10} />
                              Menipis
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 size={10} />
                              Aman
                            </span>
                          )}
                          <span className="ml-2 font-mono font-bold text-gray-900">
                            {item.stock} unit <span className="text-[10px] text-gray-500 font-normal">(min {item.stock_minimum})</span>
                          </span>
                        </div>

                        <div className="text-right">
                          <div className="font-bold text-gray-900">
                            {formatRupiah(item.selling_price)}
                          </div>
                        </div>
                      </div>

                      {/* Bottom Mobile Actions */}
                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100">
                        <div className="inline-flex items-center border border-gray-300 rounded-xl overflow-hidden bg-white">
                          <button
                            type="button"
                            disabled={item.stock <= 0}
                            onClick={() => handleQuickAdjust(item, -1)}
                            className="p-1.5 text-gray-600 hover:bg-gray-100 disabled:opacity-30"
                          >
                            <Minus size={13} />
                          </button>
                          <span className="px-2 font-mono font-bold text-xs text-gray-900">
                            {item.stock}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleQuickAdjust(item, 1)}
                            className="p-1.5 text-gray-600 hover:bg-gray-100"
                          >
                            <Plus size={13} />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleOpenAdjustModal(item)}
                          className="px-3 py-1.5 bg-neutral-900 text-amber-400 rounded-xl font-bold text-xs flex items-center gap-1.5"
                        >
                          <Edit3 size={12} />
                          <span>Opname / Restock</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )
        ) : (
          /* TAB 2: STOCK MOVEMENT LOGS */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/80 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Waktu Mutasi</th>
                  <th className="py-3 px-4">Produk & SKU</th>
                  <th className="py-3 px-4 text-center">Jenis Mutasi</th>
                  <th className="py-3 px-4 text-center">Qty</th>
                  <th className="py-3 px-4 text-center">Sebelum → Sesudah</th>
                  <th className="py-3 px-4">Referensi & Catatan</th>
                  <th className="py-3 px-4">Penanggung Jawab</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-150 text-xs">
                {filteredLogs.map((log) => {
                  const isIn = log.type === 'in';
                  const isOut = log.type === 'out';

                  return (
                    <tr key={log.id} className="hover:bg-gray-50/80 transition-colors">
                      {/* Waktu */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-gray-500 font-mono text-[11px]">
                        {new Date(log.created_at).toLocaleString('id-ID')}
                      </td>

                      {/* Produk */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-bold text-gray-900 line-clamp-1">{log.product_name}</div>
                        <div className="font-mono text-[11px] text-gray-500">{log.sku}</div>
                      </td>

                      {/* Jenis Mutasi */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {isIn ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <ArrowDownLeft size={11} />
                            Barang Masuk
                          </span>
                        ) : isOut ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <ArrowUpRight size={11} />
                            Barang Keluar
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            <RefreshCw size={11} />
                            Stock Opname
                          </span>
                        )}
                      </td>

                      {/* Qty */}
                      <td className="py-3.5 px-4 text-center font-black font-mono">
                        <span className={isIn ? 'text-emerald-600' : isOut ? 'text-rose-600' : 'text-blue-600'}>
                          {log.quantity > 0 ? `+${log.quantity}` : log.quantity}
                        </span>
                      </td>

                      {/* Sebelum -> Sesudah */}
                      <td className="py-3.5 px-4 text-center font-mono text-gray-700">
                        {log.previous_stock} → <span className="font-bold text-gray-950">{log.current_stock}</span>
                      </td>

                      {/* Referensi & Catatan */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono text-[11px] font-bold text-amber-800">
                          {log.reference || '-'}
                        </div>
                        <p className="text-gray-500 text-[11px] mt-0.5 line-clamp-1">
                          {log.notes}
                        </p>
                      </td>

                      {/* Penanggung Jawab */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-gray-700 font-medium">
                        {log.operator || '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Table Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-600">
          <div>
            Menampilkan <span className="font-bold text-gray-900">{activeTab === 'inventory' ? filteredInventory.length : filteredLogs.length}</span> data.
          </div>
          <div className="text-gray-500 text-[11px]">
            Sistem terintegrasi otomatis dengan pesanan baru dan pelunasan checkout.
          </div>
        </div>
      </div>

      {/* MODAL: Form Stock Adjustment / Opname */}
      {isAdjustModalOpen && selectedProductForAdjust && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 bg-neutral-900 text-white">
              <div className="flex items-center gap-2">
                <Boxes className="text-amber-400" size={18} />
                <h3 className="font-bold text-sm sm:text-base">Penyesuaian & Opname Stok</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAdjustModalOpen(false)}
                className="text-neutral-400 hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveAdjustment} className="p-4 sm:p-5 space-y-4 text-xs sm:text-sm">
              {adjustSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                  <span>{adjustSuccessMsg}</span>
                </div>
              )}

              {/* Selected Product Card */}
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center gap-3">
                <img
                  src={selectedProductForAdjust.image_url}
                  alt={selectedProductForAdjust.name}
                  className="w-12 h-12 rounded-lg object-cover border border-gray-200 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-gray-900 text-xs line-clamp-1">
                    {selectedProductForAdjust.name}
                  </h4>
                  <div className="flex items-center gap-2 text-[11px] text-gray-500 font-mono mt-0.5">
                    <span>SKU: {selectedProductForAdjust.sku}</span>
                    <span>•</span>
                    <span className="font-bold text-gray-900">
                      Stok Saat Ini: {selectedProductForAdjust.stock} unit
                    </span>
                  </div>
                </div>
              </div>

              {/* Adjust Type Selection */}
              <div>
                <label className="block font-bold text-gray-700 mb-1.5">Tipe Penyesuaian</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustType('in')}
                    className={`py-2 px-2 text-center rounded-xl font-bold text-xs border transition-all cursor-pointer ${
                      adjustType === 'in'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300 ring-2 ring-emerald-500/20'
                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    + Restock Masuk
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType('out')}
                    className={`py-2 px-2 text-center rounded-xl font-bold text-xs border transition-all cursor-pointer ${
                      adjustType === 'out'
                        ? 'bg-rose-50 text-rose-700 border-rose-300 ring-2 ring-rose-500/20'
                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    - Rusak / Sampel
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType('set')}
                    className={`py-2 px-2 text-center rounded-xl font-bold text-xs border transition-all cursor-pointer ${
                      adjustType === 'set'
                        ? 'bg-blue-50 text-blue-700 border-blue-300 ring-2 ring-blue-500/20'
                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    = Set Stok Fisik
                  </button>
                </div>
              </div>

              {/* Quantity */}
              <div>
                <label className="block font-bold text-gray-700 mb-1.5">
                  {adjustType === 'set' ? 'Jumlah Stok Fisik Riil Hasil Opname' : 'Jumlah Unit'}
                </label>
                <input
                  type="number"
                  min="1"
                  value={adjustQuantity}
                  onChange={(e) => setAdjustQuantity(e.target.value)}
                  placeholder={adjustType === 'set' ? 'Contoh: 45' : 'Contoh: 10'}
                  required
                  className="w-full p-2.5 bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-amber-500 font-bold text-gray-900"
                />
              </div>

              {/* Reference Number */}
              <div>
                <label className="block font-bold text-gray-700 mb-1.5">No. Referensi / Bukti Acara</label>
                <input
                  type="text"
                  value={adjustReference}
                  onChange={(e) => setAdjustReference(e.target.value)}
                  placeholder="PO-RESTOCK-xxx atau OPNAME-xxx"
                  className="w-full p-2.5 bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-amber-500 text-gray-900 font-mono"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block font-bold text-gray-700 mb-1.5">Keterangan / Alasan</label>
                <textarea
                  rows="2"
                  value={adjustNotes}
                  onChange={(e) => setAdjustNotes(e.target.value)}
                  placeholder="Catatan penyebab penyesuaian stok..."
                  className="w-full p-2.5 bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-amber-500 text-gray-900"
                ></textarea>
              </div>

              {/* Operator */}
              <div>
                <label className="block font-bold text-gray-700 mb-1.5">Nama Operator / Petugas</label>
                <input
                  type="text"
                  value={adjustOperator}
                  onChange={(e) => setAdjustOperator(e.target.value)}
                  placeholder="Nama petugas gudang"
                  className="w-full p-2.5 bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-amber-500 text-gray-900"
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-extrabold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Simpan Perubahan Stok
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Tambah Stok Masuk (Restock Supplier) */}
      <AddStockModal
        isOpen={isAddStockModalOpen}
        onClose={() => {
          setIsAddStockModalOpen(false);
          setPreselectedRestockProductId(null);
        }}
        inventory={inventory}
        preselectedProductId={preselectedRestockProductId}
        onSaveRestock={handleSaveRestock}
      />

      {/* MODAL: Kurangi / Penarikan Stok Fisik */}
      <ReduceStockModal
        isOpen={isReduceStockModalOpen}
        onClose={() => setIsReduceStockModalOpen(false)}
        inventory={inventory}
        onSaveReduction={handleSaveReduction}
      />
    </div>
  );
}
