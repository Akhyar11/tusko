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
  Edit3,
  Clock,
  FileCheck,
  Building2,
  Lock,
  Unlock,
  PackageCheck,
  ClipboardCheck
} from 'lucide-react';
import { formatRupiah } from '../utils/formatters';
import { 
  initialInventory, 
  initialStockLogs, 
  initialWarehouses, 
  initialStockReservations, 
  initialStockOpnames,
  stockStatusOptions 
} from '../data/mockStockData';
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
  const [warehouses] = useState(initialWarehouses);
  const [reservations, setReservations] = useState(initialStockReservations);
  const [opnames, setOpnames] = useState(initialStockOpnames);

  // Tab: 'inventory' | 'opname' | 'reservations' | 'logs'
  const [activeTab, setActiveTab] = useState('inventory');
  const [selectedWarehouseCode, setSelectedWarehouseCode] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Toast / notification state
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Add & Reduce Stock Modal States
  const [isAddStockModalOpen, setIsAddStockModalOpen] = useState(false);
  const [preselectedRestockProductId, setPreselectedRestockProductId] = useState(null);
  const [isReduceStockModalOpen, setIsReduceStockModalOpen] = useState(false);

  // Quick Adjustment Modal State
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedProductForAdjust, setSelectedProductForAdjust] = useState(null);
  const [adjustType, setAdjustType] = useState('in'); // 'in' | 'out' | 'set'
  const [adjustQuantity, setAdjustQuantity] = useState('');
  const [adjustReference, setAdjustReference] = useState('');
  const [adjustNotes, setAdjustNotes] = useState('');
  const [adjustOperator, setAdjustOperator] = useState('Admin Gudang');

  // New Stock Opname Audit Modal State
  const [isNewOpnameModalOpen, setIsNewOpnameModalOpen] = useState(false);
  const [newOpnameTitle, setNewOpnameTitle] = useState('');
  const [newOpnameWarehouse, setNewOpnameWarehouse] = useState('WH-CGK-01');
  const [newOpnameAuditor, setNewOpnameAuditor] = useState('Tim Gudang & QC');
  const [newOpnameNotes, setNewOpnameNotes] = useState('');

  // Hitung KPI 3-Tier Stok
  const stats = useMemo(() => {
    let totalOnHand = 0;
    let totalReserved = 0;
    let totalAvailable = 0;
    let totalAssetCost = 0;
    let totalRetailValue = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let safeStockCount = 0;

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
      totalRetailValue += onHand * (item.selling_price || 0);

      if (onHand === 0) {
        outOfStockCount++;
      } else if (onHand <= item.stock_minimum) {
        lowStockCount++;
      } else {
        safeStockCount++;
      }
    });

    return {
      skuCount: source.length,
      totalOnHand,
      totalReserved,
      totalAvailable,
      totalAssetCost,
      totalRetailValue,
      lowStockCount,
      outOfStockCount,
      safeStockCount
    };
  }, [inventory, selectedWarehouseCode]);

  // Unique categories for filter
  const categories = useMemo(() => {
    const list = Array.from(new Set(inventory.map((i) => i.category_name))).filter(Boolean);
    return list;
  }, [inventory]);

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

      // 4. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = item.name.toLowerCase().includes(q);
        const matchSku = item.sku.toLowerCase().includes(q);
        const matchBin = item.warehouse_bin?.toLowerCase().includes(q);
        const matchWh = item.warehouse_name?.toLowerCase().includes(q);
        return matchName || matchSku || matchBin || matchWh;
      }

      return true;
    });
  }, [inventory, selectedWarehouseCode, stockFilter, categoryFilter, searchQuery]);

  // Filtered stock logs
  const filteredLogs = useMemo(() => {
    let list = stockLogs;
    if (selectedWarehouseCode !== 'all') {
      list = list.filter(l => l.warehouse_code === selectedWarehouseCode);
    }
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter((log) => 
      log.product_name.toLowerCase().includes(q) ||
      log.sku.toLowerCase().includes(q) ||
      log.reference?.toLowerCase().includes(q) ||
      log.notes?.toLowerCase().includes(q) ||
      log.operator?.toLowerCase().includes(q)
    );
  }, [stockLogs, selectedWarehouseCode, searchQuery]);

  // Filtered reservations
  const filteredReservations = useMemo(() => {
    let list = reservations;
    if (selectedWarehouseCode !== 'all') {
      list = list.filter(r => r.warehouse_code === selectedWarehouseCode);
    }
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(r =>
      r.order_number.toLowerCase().includes(q) ||
      r.customer_name.toLowerCase().includes(q) ||
      r.sku.toLowerCase().includes(q) ||
      r.product_name.toLowerCase().includes(q)
    );
  }, [reservations, selectedWarehouseCode, searchQuery]);

  // Open adjustment modal for a specific product
  const handleOpenAdjustModal = (product) => {
    setSelectedProductForAdjust(product);
    setAdjustType('in');
    setAdjustQuantity('');
    setAdjustReference(`ADJ-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`);
    setAdjustNotes('');
    setIsAdjustModalOpen(true);
  };

  // Submit Stock Adjustment
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

    // Update inventory
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

    // Create stock log
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
      operator: adjustOperator || 'Admin Gudang',
      warehouse_code: selectedProductForAdjust.warehouse_code || 'WH-CGK-01'
    };

    setStockLogs((prev) => [newLog, ...prev]);
    showToast(`Stok ${selectedProductForAdjust.sku} diperbarui: ${currentStock} -> ${newStock} unit`);
    setIsAdjustModalOpen(false);
  };

  // Release reservation handler
  const handleReleaseReservation = (reservationId) => {
    const target = reservations.find(r => r.id === reservationId);
    if (!target) return;

    // Reduce reserved_stock on inventory
    setInventory(prev => prev.map(item => {
      if (item.sku === target.sku) {
        return {
          ...item,
          reserved_stock: Math.max(0, (item.reserved_stock || 0) - target.quantity)
        };
      }
      return item;
    }));

    // Remove or mark expired
    setReservations(prev => prev.filter(r => r.id !== reservationId));

    // Log release
    const newLog = {
      id: Date.now(),
      product_id: 999,
      sku: target.sku,
      product_name: target.product_name,
      type: 'adjustment',
      quantity: 0,
      previous_stock: 0,
      current_stock: 0,
      reference: `RELEASE-${target.order_number}`,
      notes: `Reservasi dibatalkan/expired (${target.quantity} unit dilepas kembali ke stok tersedia)`,
      created_at: new Date().toISOString(),
      operator: 'Sistem Reservasi',
      warehouse_code: target.warehouse_code
    };
    setStockLogs(prev => [newLog, ...prev]);
    showToast(`Kunci reservasi ${target.order_number} berhasil dilepas.`);
  };

  // Create new stock opname session
  const handleCreateOpname = (e) => {
    e.preventDefault();
    if (!newOpnameTitle.trim()) return;

    const targetWh = warehouses.find(w => w.code === newOpnameWarehouse);
    const targetItems = inventory.filter(i => i.warehouse_code === newOpnameWarehouse);

    const newSession = {
      id: `OPN-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(10 + Math.random() * 90)}`,
      opname_number: `OPN/${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}/${newOpnameWarehouse}/00${opnames.length + 1}`,
      title: newOpnameTitle,
      warehouse_code: newOpnameWarehouse,
      warehouse_name: targetWh?.name || newOpnameWarehouse,
      audited_by: newOpnameAuditor,
      status: 'in_progress',
      started_at: new Date().toISOString(),
      completed_at: null,
      total_items_audited: targetItems.length,
      discrepancy_count: 0,
      total_discrepancy_value: 0,
      notes: newOpnameNotes || 'Sesi audit fisik gudang sedang berlangsung.',
      items: targetItems.map(item => ({
        product_id: item.id,
        sku: item.sku,
        name: item.name,
        system_stock: item.stock,
        physical_stock: item.stock,
        difference: 0,
        notes: 'Belum dihitung fisik'
      }))
    };

    setOpnames(prev => [newSession, ...prev]);
    setIsNewOpnameModalOpen(false);
    setNewOpnameTitle('');
    setNewOpnameNotes('');
    showToast(`Sesi Stok Opname ${newSession.opname_number} berhasil dibuka!`);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Banner */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-neutral-900 text-white px-5 py-3 border border-neutral-700 shadow-xl flex items-center gap-3 text-xs font-bold animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 size={16} className="text-amber-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header & Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 border border-gray-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider bg-neutral-900 text-amber-400">
              ERP Inventory & Multi-Warehouse
            </span>
            <span className="text-gray-400">•</span>
            <span className="text-xs text-gray-500 font-mono">
              {warehouses.length} Gudang Terhubung
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-neutral-950 tracking-tight mt-1">
            Manajemen Stok & Gudang Terpadu
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Kontrol stok fisik (*on-hand*), stok terpesan (*reserved*), dan stok siap jual (*available*) multi-lokasi.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={onViewTransactions}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-300 transition-colors cursor-pointer"
          >
            <Wallet size={14} className="text-gray-500" />
            <span>Buku Kas Toko</span>
          </button>

          <button
            type="button"
            onClick={() => setIsReduceStockModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
          >
            <Minus size={14} />
            <span>Kurangi Stok (- Fisik)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setPreselectedRestockProductId(null);
              setIsAddStockModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-extrabold text-neutral-950 bg-amber-400 hover:bg-amber-300 border border-amber-500 shadow-xs transition-all cursor-pointer"
          >
            <Plus size={14} />
            <span>Restock / Tambah Stok (+ Masuk)</span>
          </button>
        </div>
      </div>

      {/* Warehouse Selector & 3-Tier Metric Cards */}
      <div className="bg-white p-5 border border-gray-200 space-y-4">
        {/* Warehouse Selector Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Building2 size={18} className="text-neutral-900" />
            <span className="text-xs font-black text-neutral-900 uppercase tracking-wide">Pilih Lokasi Gudang:</span>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <button
              type="button"
              onClick={() => setSelectedWarehouseCode('all')}
              className={`px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer border ${
                selectedWarehouseCode === 'all'
                  ? 'bg-neutral-900 text-amber-400 border-neutral-900'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
              }`}
            >
              Semua Gudang Konsolidasi
            </button>
            {warehouses.map((wh) => (
              <button
                key={wh.id}
                type="button"
                onClick={() => setSelectedWarehouseCode(wh.code)}
                className={`px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer border flex items-center gap-1.5 ${
                  selectedWarehouseCode === wh.code
                    ? 'bg-neutral-900 text-amber-400 border-neutral-900'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                }`}
              >
                <span>{wh.name}</span>
                <span className="text-[10px] opacity-70 font-mono">({wh.code})</span>
              </button>
            ))}
          </div>
        </div>

        {/* 4 3-Tier Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* 1. On-Hand Physical Stock */}
          <div className="bg-neutral-50 p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-gray-500 uppercase">1. Stok Fisik (On-Hand)</span>
              <Warehouse size={16} className="text-blue-600" />
            </div>
            <div className="text-2xl font-black text-neutral-950 mt-2 font-mono">
              {stats.totalOnHand.toLocaleString('id-ID')}{' '}
              <span className="text-xs font-medium text-gray-500">unit</span>
            </div>
            <p className="text-[10px] text-gray-500 mt-1">Total unit aktual berada di rak gudang</p>
          </div>

          {/* 2. Reserved Stock */}
          <div className="bg-amber-50/50 p-4 border border-amber-200">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-900 uppercase">2. Stok Terpesan (Reserved)</span>
              <Lock size={16} className="text-amber-700" />
            </div>
            <div className="text-2xl font-black text-amber-950 mt-2 font-mono">
              {stats.totalReserved.toLocaleString('id-ID')}{' '}
              <span className="text-xs font-medium text-amber-700">unit</span>
            </div>
            <p className="text-[10px] text-amber-800/80 mt-1">Terkunci di checkout/menunggu packing</p>
          </div>

          {/* 3. Available to Sell */}
          <div className="bg-emerald-50/50 p-4 border border-emerald-200">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-900 uppercase">3. Stok Siap Jual (Available)</span>
              <PackageCheck size={16} className="text-emerald-700" />
            </div>
            <div className="text-2xl font-black text-emerald-950 mt-2 font-mono">
              {stats.totalAvailable.toLocaleString('id-ID')}{' '}
              <span className="text-xs font-medium text-emerald-700">unit</span>
            </div>
            <p className="text-[10px] text-emerald-800/80 mt-1">Stok On-Hand dikurangi Reservasi</p>
          </div>

          {/* 4. Asset Valuation */}
          <div className="bg-neutral-900 text-white p-4 border border-neutral-800">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-neutral-400 uppercase">Nilai Aset Modal (HPP)</span>
              <TrendingUp size={16} className="text-amber-400" />
            </div>
            <div className="text-lg sm:text-xl font-black text-amber-400 mt-2 font-mono truncate">
              {formatRupiah(stats.totalAssetCost)}
            </div>
            <p className="text-[10px] text-neutral-400 mt-1 truncate">
              Estimasi Ritel: {formatRupiah(stats.totalRetailValue)}
            </p>
          </div>
        </div>
      </div>

      {/* Critical Stock Alert Widget */}
      <LowStockAlertWidget
        inventory={inventory}
        onRestockProduct={(product) => {
          setPreselectedRestockProductId(product.id);
          setIsAddStockModalOpen(true);
        }}
        onViewAllStock={() => {
          setActiveTab('inventory');
          setStockFilter('low');
        }}
      />

      {/* Navigation Tabs */}
      <div className="bg-white border border-gray-200 overflow-hidden">
        <div className="flex items-center border-b border-gray-200 overflow-x-auto bg-gray-50">
          <button
            type="button"
            onClick={() => setActiveTab('inventory')}
            className={`px-5 py-3.5 text-xs font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer border-b-2 transition-all shrink-0 ${
              activeTab === 'inventory'
                ? 'bg-white text-neutral-950 border-neutral-950 shadow-xs'
                : 'text-gray-500 border-transparent hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Boxes size={16} />
            <span>Katalog Stok SKU ({filteredInventory.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('opname')}
            className={`px-5 py-3.5 text-xs font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer border-b-2 transition-all shrink-0 ${
              activeTab === 'opname'
                ? 'bg-white text-neutral-950 border-neutral-950 shadow-xs'
                : 'text-gray-500 border-transparent hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <ClipboardCheck size={16} />
            <span>Stok Opname & Audit Fisik ({opnames.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('reservations')}
            className={`px-5 py-3.5 text-xs font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer border-b-2 transition-all shrink-0 ${
              activeTab === 'reservations'
                ? 'bg-white text-neutral-950 border-neutral-950 shadow-xs'
                : 'text-gray-500 border-transparent hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Lock size={16} />
            <span>Antrean Reservasi ({filteredReservations.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('logs')}
            className={`px-5 py-3.5 text-xs font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer border-b-2 transition-all shrink-0 ${
              activeTab === 'logs'
                ? 'bg-white text-neutral-950 border-neutral-950 shadow-xs'
                : 'text-gray-500 border-transparent hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <History size={16} />
            <span>Log Mutasi & Kartu Stok ({filteredLogs.length})</span>
          </button>
        </div>

        {/* Tab 1: Inventory Table */}
        {activeTab === 'inventory' && (
          <div>
            {/* Filter & Search Bar */}
            <div className="p-4 sm:p-5 border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white">
              <div className="relative flex-1 max-w-md">
                <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari SKU, nama produk, rak bin, atau gudang..."
                  className="w-full pl-9 pr-8 py-2 text-xs bg-white border border-gray-300 focus:outline-none focus:border-amber-500 text-gray-900"
                />
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

              <div className="flex items-center gap-2 flex-wrap">
                {/* Status Filter */}
                <select
                  value={stockFilter}
                  onChange={(e) => setStockFilter(e.target.value)}
                  className="px-3 py-2 text-xs font-semibold bg-white border border-gray-300 focus:outline-none focus:border-amber-500 text-gray-700 cursor-pointer"
                >
                  <option value="all">Semua Status Stok</option>
                  <option value="safe">Stok Aman</option>
                  <option value="low">Stok Menipis (Di Bawah Min)</option>
                  <option value="out_of_stock">Stok Habis (0)</option>
                </select>

                {/* Category Filter */}
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-3 py-2 text-xs font-semibold bg-white border border-gray-300 focus:outline-none focus:border-amber-500 text-gray-700 cursor-pointer"
                >
                  <option value="all">Semua Kategori</option>
                  {categories.map((cat, idx) => (
                    <option key={idx} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>

                {(stockFilter !== 'all' || categoryFilter !== 'all' || searchQuery) && (
                  <button
                    type="button"
                    onClick={() => {
                      setStockFilter('all');
                      setCategoryFilter('all');
                      setSearchQuery('');
                    }}
                    className="px-2.5 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer border border-rose-200"
                  >
                    Reset Filter
                  </button>
                )}
              </div>
            </div>

            {/* Inventory Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-600">
                <thead className="bg-neutral-900 text-white uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Produk & SKU</th>
                    <th className="py-3 px-4">Lokasi & Bin</th>
                    <th className="py-3 px-4 text-right">Stok Fisik</th>
                    <th className="py-3 px-4 text-right">Terpesan</th>
                    <th className="py-3 px-4 text-right">Siap Jual</th>
                    <th className="py-3 px-4 text-right">HPP Modal</th>
                    <th className="py-3 px-4 text-right">Harga Jual</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Aksi Cepat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredInventory.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-gray-500">
                        Tidak ada data stok yang cocok dengan kriteria pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredInventory.map((item) => {
                      const onHand = Number(item.stock) || 0;
                      const reserved = Number(item.reserved_stock) || 0;
                      const available = Math.max(0, onHand - reserved);
                      const isOutOfStock = onHand === 0;
                      const isLowStock = !isOutOfStock && onHand <= item.stock_minimum;

                      return (
                        <tr key={item.id} className="hover:bg-neutral-50 transition-colors">
                          {/* Produk & SKU */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={item.image_url}
                                alt={item.name}
                                className="w-10 h-10 object-cover border border-gray-200 bg-gray-50 shrink-0"
                              />
                              <div className="min-w-0">
                                <div className="font-mono text-[11px] font-bold text-gray-900">
                                  {item.sku}
                                </div>
                                <div className="font-semibold text-gray-800 line-clamp-1 max-w-xs">
                                  {item.name}
                                </div>
                                <span className="text-[10px] text-gray-400 uppercase">{item.category_name}</span>
                              </div>
                            </div>
                          </td>

                          {/* Lokasi & Bin */}
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-gray-900">{item.warehouse_name || 'Gudang Utama'}</div>
                            <div className="font-mono text-[11px] text-gray-500">{item.warehouse_bin || '-'}</div>
                          </td>

                          {/* Stok Fisik */}
                          <td className="py-3.5 px-4 text-right font-mono font-black text-sm text-gray-950">
                            {onHand}
                          </td>

                          {/* Terpesan */}
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-amber-700">
                            {reserved > 0 ? reserved : '-'}
                          </td>

                          {/* Siap Jual */}
                          <td className="py-3.5 px-4 text-right font-mono font-black text-sm text-emerald-700">
                            {available}
                          </td>

                          {/* HPP Modal */}
                          <td className="py-3.5 px-4 text-right font-mono text-gray-600">
                            {formatRupiah(item.cost_price || 0)}
                          </td>

                          {/* Harga Jual */}
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-gray-900">
                            {formatRupiah(item.selling_price || 0)}
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4 text-center">
                            {isOutOfStock ? (
                              <span className="px-2 py-0.5 text-[10px] font-black uppercase bg-rose-100 text-rose-800 border border-rose-300">
                                Habis (0)
                              </span>
                            ) : isLowStock ? (
                              <span className="px-2 py-0.5 text-[10px] font-black uppercase bg-amber-100 text-amber-900 border border-amber-300">
                                Menipis (&lt;{item.stock_minimum})
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-emerald-100 text-emerald-900 border border-emerald-300">
                                Aman
                              </span>
                            )}
                          </td>

                          {/* Aksi Cepat */}
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setPreselectedRestockProductId(item.id);
                                  setIsAddStockModalOpen(true);
                                }}
                                title="Tambah Stok (+)"
                                className="p-1.5 bg-neutral-900 text-amber-400 hover:bg-neutral-800 transition-colors cursor-pointer"
                              >
                                <Plus size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenAdjustModal(item)}
                                title="Koreksi / Set Saldo Manual"
                                className="p-1.5 bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300 transition-colors cursor-pointer"
                              >
                                <Edit3 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Stok Opname & Audit Fisik */}
        {activeTab === 'opname' && (
          <div className="p-5 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-neutral-50 p-4 border border-gray-200">
              <div>
                <h3 className="text-sm font-black text-neutral-950 uppercase tracking-wide">
                  Sesi Audit Stok Opname Fisik
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Verifikasi berkala antara saldo stok di sistem vs hitungan riil di rak gudang untuk mendeteksi kehilangan/rusak.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsNewOpnameModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-neutral-900 text-amber-400 hover:bg-neutral-800 font-extrabold text-xs transition-colors cursor-pointer shrink-0"
              >
                <Plus size={14} />
                <span>Buka Sesi Audit Baru</span>
              </button>
            </div>

            {/* List of Opnames */}
            <div className="space-y-4">
              {opnames.map((opn) => (
                <div key={opn.id} className="bg-white border border-gray-300 p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-200">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-gray-900">{opn.opname_number}</span>
                        <span className="text-gray-300">•</span>
                        <span className="text-xs font-semibold text-gray-700">{opn.warehouse_name}</span>
                      </div>
                      <h4 className="text-sm font-bold text-neutral-950 mt-1">{opn.title}</h4>
                    </div>

                    <div className="flex items-center gap-2">
                      {opn.status === 'completed' ? (
                        <span className="px-2.5 py-1 text-[10px] font-black uppercase bg-emerald-100 text-emerald-900 border border-emerald-300">
                          Selesai & Disinkronkan
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 text-[10px] font-black uppercase bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                          Audit Sedang Berjalan
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-neutral-50 p-3 border border-gray-200">
                    <div>
                      <span className="text-[10px] text-gray-500 uppercase font-semibold">Auditor:</span>
                      <div className="font-bold text-gray-900">{opn.audited_by}</div>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500 uppercase font-semibold">Item Diverifikasi:</span>
                      <div className="font-bold text-gray-900">{opn.total_items_audited} SKU</div>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500 uppercase font-semibold">Selisih Unit:</span>
                      <div className={`font-black ${opn.discrepancy_count !== 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                        {opn.discrepancy_count} Unit
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500 uppercase font-semibold">Nilai Varian Rp:</span>
                      <div className={`font-black ${opn.total_discrepancy_value < 0 ? 'text-rose-700' : 'text-gray-900'}`}>
                        {formatRupiah(opn.total_discrepancy_value)}
                      </div>
                    </div>
                  </div>

                  {/* Audited Items Table Preview */}
                  {opn.items && opn.items.length > 0 && (
                    <div className="border border-gray-200 overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-gray-100 text-gray-700 text-[10px] uppercase">
                          <tr>
                            <th className="py-2 px-3">SKU & Nama Produk</th>
                            <th className="py-2 px-3 text-right">Stok Sistem</th>
                            <th className="py-2 px-3 text-right">Stok Fisik Aktual</th>
                            <th className="py-2 px-3 text-right">Selisih (Varian)</th>
                            <th className="py-2 px-3">Keterangan Auditor</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {opn.items.map((it, idx) => (
                            <tr key={idx} className="hover:bg-gray-50">
                              <td className="py-2 px-3">
                                <span className="font-mono font-bold text-gray-900">{it.sku}</span> - {it.name}
                              </td>
                              <td className="py-2 px-3 text-right font-mono">{it.system_stock}</td>
                              <td className="py-2 px-3 text-right font-mono font-bold">{it.physical_stock}</td>
                              <td className={`py-2 px-3 text-right font-mono font-black ${it.difference < 0 ? 'text-rose-700' : it.difference > 0 ? 'text-blue-700' : 'text-emerald-700'}`}>
                                {it.difference > 0 ? `+${it.difference}` : it.difference}
                              </td>
                              <td className="py-2 px-3 text-gray-500 italic">{it.notes}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-150">
                    <p className="italic">Catatan: {opn.notes}</p>
                    {opn.status === 'in_progress' && (
                      <button
                        type="button"
                        onClick={() => {
                          setOpnames(prev => prev.map(o => o.id === opn.id ? { ...o, status: 'completed', completed_at: new Date().toISOString() } : o));
                          showToast(`Sesi ${opn.opname_number} berhasil diselesaikan & disinkronkan ke saldo stok!`);
                        }}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold cursor-pointer"
                      >
                        Selesaikan & Sesuaikan Saldo Sistem
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Active Stock Reservations */}
        {activeTab === 'reservations' && (
          <div className="p-5 space-y-5">
            <div className="bg-neutral-50 p-4 border border-gray-200">
              <h3 className="text-sm font-black text-neutral-950 uppercase tracking-wide">
                Antrean Reservasi Stok (Checkout & Waiting Payment)
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Stok yang sedang dikunci otomatis oleh sistem agar tidak terjadi *overselling* saat beberapa pelanggan memesan produk secara bersamaan.
              </p>
            </div>

            <div className="border border-gray-200 overflow-x-auto">
              <table className="w-full text-xs text-left text-gray-600">
                <thead className="bg-neutral-900 text-white uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">No. Pesanan & Pelanggan</th>
                    <th className="py-3 px-4">Produk & Varian</th>
                    <th className="py-3 px-4">Gudang Penyedia</th>
                    <th className="py-3 px-4 text-right">Qty Terkunci</th>
                    <th className="py-3 px-4">Status Reservasi</th>
                    <th className="py-3 px-4">Waktu Kadaluarsa</th>
                    <th className="py-3 px-4 text-center">Aksi Gudang</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredReservations.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-gray-500">
                        Tidak ada antrean stok terkunci saat ini.
                      </td>
                    </tr>
                  ) : (
                    filteredReservations.map((res) => (
                      <tr key={res.id} className="hover:bg-neutral-50">
                        <td className="py-3.5 px-4">
                          <div className="font-mono font-bold text-gray-900">{res.order_number}</div>
                          <div className="text-[11px] text-gray-500">{res.customer_name}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-gray-900">{res.product_name}</div>
                          <div className="font-mono text-[10px] text-gray-500">{res.sku} • {res.variant}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-gray-900">{res.warehouse_name}</div>
                          <div className="font-mono text-[10px] text-gray-500">{res.warehouse_code}</div>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-black text-sm text-amber-900">
                          {res.quantity} unit
                        </td>
                        <td className="py-3.5 px-4">
                          {res.status === 'locked_checkout' ? (
                            <span className="px-2 py-0.5 text-[10px] font-black uppercase bg-amber-100 text-amber-900 border border-amber-300">
                              Terkunci Checkout
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 text-[10px] font-black uppercase bg-blue-100 text-blue-900 border border-blue-300">
                              Siap Dipacking
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[11px] text-gray-500">
                          {new Date(res.expires_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleReleaseReservation(res.id)}
                            className="px-2.5 py-1 text-[11px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-300 transition-colors cursor-pointer"
                          >
                            Lepas Kunci (Release)
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: Stock Movement Logs */}
        {activeTab === 'logs' && (
          <div>
            <div className="p-4 border-b border-gray-200 bg-white">
              <div className="relative max-w-md">
                <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari log referensi, SKU, nama produk, catatan..."
                  className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-gray-300 focus:outline-none focus:border-amber-500 text-gray-900"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-gray-600">
                <thead className="bg-neutral-900 text-white uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Waktu</th>
                    <th className="py-3 px-4">Produk & SKU</th>
                    <th className="py-3 px-4">Tipe Mutasi</th>
                    <th className="py-3 px-4 text-right">Perubahan Qty</th>
                    <th className="py-3 px-4 text-right">Saldo Akhir</th>
                    <th className="py-3 px-4">No. Dokumen / Referensi</th>
                    <th className="py-3 px-4">Gudang & Operator</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredLogs.map((log) => {
                    const isPositive = log.quantity > 0;
                    return (
                      <tr key={log.id} className="hover:bg-neutral-50">
                        <td className="py-3.5 px-4 font-mono text-[11px] text-gray-500 whitespace-nowrap">
                          {new Date(log.created_at).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-mono font-bold text-gray-900">{log.sku}</div>
                          <div className="text-gray-700 line-clamp-1">{log.product_name}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          {log.type === 'in' ? (
                            <span className="px-2 py-0.5 text-[10px] font-black uppercase bg-emerald-100 text-emerald-900 border border-emerald-300">
                              Masuk (+ IN)
                            </span>
                          ) : log.type === 'out' ? (
                            <span className="px-2 py-0.5 text-[10px] font-black uppercase bg-rose-100 text-rose-900 border border-rose-300">
                              Keluar (- OUT)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 text-[10px] font-black uppercase bg-blue-100 text-blue-900 border border-blue-300">
                              Koreksi / Opname
                            </span>
                          )}
                        </td>
                        <td className={`py-3.5 px-4 text-right font-mono font-black text-sm ${isPositive ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {isPositive ? `+${log.quantity}` : log.quantity}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-gray-900">
                          {log.current_stock}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-mono font-bold text-gray-900">{log.reference}</div>
                          <div className="text-[11px] text-gray-500 italic">{log.notes}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-gray-900">{log.warehouse_code || 'WH-CGK-01'}</div>
                          <div className="text-[11px] text-gray-500">{log.operator}</div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Quick Adjustment Modal */}
      {isAdjustModalOpen && selectedProductForAdjust && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md border border-gray-300 shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <h3 className="font-black text-sm uppercase tracking-wide text-neutral-950">
                Koreksi Stok Cepat
              </h3>
              <button
                type="button"
                onClick={() => setIsAdjustModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="bg-neutral-50 p-3 border border-gray-200 text-xs">
              <div className="font-mono font-bold text-gray-900">{selectedProductForAdjust.sku}</div>
              <div className="font-semibold text-gray-700 mt-0.5">{selectedProductForAdjust.name}</div>
              <div className="text-gray-500 mt-1">
                Stok Fisik Saat Ini: <span className="font-black text-neutral-950">{selectedProductForAdjust.stock} unit</span>
              </div>
            </div>

            <form onSubmit={handleSaveAdjustment} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Metode Koreksi</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustType('in')}
                    className={`py-2 text-center font-bold border transition-colors cursor-pointer ${
                      adjustType === 'in' ? 'bg-neutral-900 text-amber-400 border-neutral-900' : 'bg-white border-gray-300 text-gray-700'
                    }`}
                  >
                    + Tambah
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType('out')}
                    className={`py-2 text-center font-bold border transition-colors cursor-pointer ${
                      adjustType === 'out' ? 'bg-neutral-900 text-amber-400 border-neutral-900' : 'bg-white border-gray-300 text-gray-700'
                    }`}
                  >
                    - Kurang
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType('set')}
                    className={`py-2 text-center font-bold border transition-colors cursor-pointer ${
                      adjustType === 'set' ? 'bg-neutral-900 text-amber-400 border-neutral-900' : 'bg-white border-gray-300 text-gray-700'
                    }`}
                  >
                    = Set Saldo
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  {adjustType === 'set' ? 'Saldo Stok Fisik Baru (Unit)' : 'Jumlah Unit'}
                </label>
                <input
                  type="number"
                  min="0"
                  value={adjustQuantity}
                  onChange={(e) => setAdjustQuantity(e.target.value)}
                  placeholder="Contoh: 10"
                  required
                  className="w-full p-2.5 bg-white border border-gray-300 focus:outline-none focus:border-amber-500 font-bold text-gray-900"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">No. Referensi / Berita Acara</label>
                <input
                  type="text"
                  value={adjustReference}
                  onChange={(e) => setAdjustReference(e.target.value)}
                  className="w-full p-2.5 bg-white border border-gray-300 focus:outline-none focus:border-amber-500 text-gray-900 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Catatan / Alasan</label>
                <input
                  type="text"
                  value={adjustNotes}
                  onChange={(e) => setAdjustNotes(e.target.value)}
                  placeholder="Contoh: Temuan audit fisik rak"
                  className="w-full p-2.5 bg-white border border-gray-300 focus:outline-none focus:border-amber-500 text-gray-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="px-4 py-2 font-bold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-extrabold bg-neutral-900 text-amber-400 hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Stock Opname Audit Modal */}
      {isNewOpnameModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg border border-gray-300 shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <h3 className="font-black text-sm uppercase tracking-wide text-neutral-950">
                Buka Sesi Stok Opname Baru
              </h3>
              <button
                type="button"
                onClick={() => setIsNewOpnameModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateOpname} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Judul / Tema Audit Fisik</label>
                <input
                  type="text"
                  value={newOpnameTitle}
                  onChange={(e) => setNewOpnameTitle(e.target.value)}
                  placeholder="Contoh: Audit Fisik Bulanan Rak Sepatu & Apparel"
                  required
                  className="w-full p-2.5 bg-white border border-gray-300 focus:outline-none focus:border-amber-500 text-gray-900 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Pilih Gudang Target Audit</label>
                <select
                  value={newOpnameWarehouse}
                  onChange={(e) => setNewOpnameWarehouse(e.target.value)}
                  className="w-full p-2.5 bg-white border border-gray-300 focus:outline-none focus:border-amber-500 text-gray-900 font-semibold"
                >
                  {warehouses.map(w => (
                    <option key={w.id} value={w.code}>{w.name} ({w.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Auditor / Tim Pemeriksa</label>
                <input
                  type="text"
                  value={newOpnameAuditor}
                  onChange={(e) => setNewOpnameAuditor(e.target.value)}
                  placeholder="Contoh: QC Siska & Budi Gudang"
                  required
                  className="w-full p-2.5 bg-white border border-gray-300 focus:outline-none focus:border-amber-500 text-gray-900"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Catatan Lingkup Audit</label>
                <textarea
                  rows={3}
                  value={newOpnameNotes}
                  onChange={(e) => setNewOpnameNotes(e.target.value)}
                  placeholder="Catatan mengenai zona rak yang diperiksa, kondisi segel, dll..."
                  className="w-full p-2.5 bg-white border border-gray-300 focus:outline-none focus:border-amber-500 text-gray-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsNewOpnameModalOpen(false)}
                  className="px-4 py-2 font-bold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-extrabold bg-neutral-900 text-amber-400 hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  Mulai Sesi Audit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Stock Modal */}
      <AddStockModal
        isOpen={isAddStockModalOpen}
        onClose={() => {
          setIsAddStockModalOpen(false);
          setPreselectedRestockProductId(null);
        }}
        inventory={inventory}
        preselectedProductId={preselectedRestockProductId}
        onSaveRestock={(restockData) => {
          // Update inventory stock
          setInventory((prev) =>
            prev.map((item) =>
              item.id === restockData.product_id
                ? {
                    ...item,
                    stock: item.stock + restockData.quantity,
                    cost_price: restockData.cost_price || item.cost_price,
                    warehouse_bin: restockData.warehouse_bin || item.warehouse_bin,
                    last_restock_at: restockData.arrival_date || new Date().toISOString()
                  }
                : item
            )
          );

          // Add to stock logs
          const newLog = {
            id: Date.now(),
            product_id: restockData.product_id,
            sku: restockData.sku,
            product_name: restockData.product_name,
            type: 'in',
            quantity: restockData.quantity,
            previous_stock: restockData.previous_stock,
            current_stock: restockData.current_stock,
            reference: restockData.po_number || 'PO-RESTOCK',
            notes: `Restock dari ${restockData.supplier}. ${restockData.notes || ''}`.trim(),
            created_at: new Date().toISOString(),
            operator: restockData.operator || 'Admin Gudang',
            warehouse_code: 'WH-CGK-01'
          };
          setStockLogs((prev) => [newLog, ...prev]);

          // Optional: Add to financial transactions
          if (restockData.sync_to_cashflow && restockData.total_cost > 0) {
            onAddExpenseTransaction({
              amount: restockData.total_cost,
              category: 'restock',
              category_label: 'Pengadaan Stok Produk',
              description: `Pengadaan ${restockData.quantity} unit ${restockData.sku} (${restockData.supplier})`,
              payment_method: 'Kas Toko / Transfer'
            });
          }

          showToast(`Berhasil restock +${restockData.quantity} unit ${restockData.sku}!`);
        }}
      />

      {/* Reduce Stock Modal */}
      <ReduceStockModal
        isOpen={isReduceStockModalOpen}
        onClose={() => setIsReduceStockModalOpen(false)}
        inventory={inventory}
        onSaveReduction={(reductionData) => {
          // Update inventory
          setInventory((prev) =>
            prev.map((item) =>
              item.id === reductionData.product_id
                ? {
                    ...item,
                    stock: Math.max(0, item.stock - reductionData.quantity)
                  }
                : item
            )
          );

          // Add to stock logs
          const newLog = {
            id: Date.now(),
            product_id: reductionData.product_id,
            sku: reductionData.sku,
            product_name: reductionData.product_name,
            type: 'out',
            quantity: -reductionData.quantity,
            previous_stock: reductionData.previous_stock,
            current_stock: reductionData.current_stock,
            reference: reductionData.reference || 'BA-DEDUCTION',
            notes: `[${reductionData.reason_label}] ${reductionData.notes || ''}`.trim(),
            created_at: new Date().toISOString(),
            operator: reductionData.operator || 'Admin Gudang',
            warehouse_code: 'WH-CGK-01'
          };
          setStockLogs((prev) => [newLog, ...prev]);

          showToast(`Stok ${reductionData.sku} dikurangi -${reductionData.quantity} unit (${reductionData.reason_label}).`);
        }}
      />
    </div>
  );
}
