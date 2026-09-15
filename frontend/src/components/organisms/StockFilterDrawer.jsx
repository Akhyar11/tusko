import React from 'react';
import { SlidersHorizontal, X, RotateCcw, Check, Boxes } from 'lucide-react';
import SearchBar from '../molecules/SearchBar';
import ServerSideSelect from '../molecules/ServerSideSelect';
import TextInput from '../molecules/TextInput';

/**
 * Organism: StockFilterDrawer
 * Right-to-left centralized drawer for Warehouse & Stock Inventory filtering & search
 */
export default function StockFilterDrawer({
  isOpen = false,
  onClose = () => {},
  activeFilterCount = 0,
  totalFiltered = 0,
  totalStockItems = 0,
  searchName = '',
  onSearchNameChange = () => {},
  searchSku = '',
  onSearchSkuChange = () => {},
  selectedWarehouseCode = 'all',
  onWarehouseChange = () => {},
  warehouses = [],
  stockFilter = 'all',
  onStockFilterChange = () => {},
  categoryFilter = 'all',
  onCategoryFilterChange = () => {},
  categories = [],
  minStock = '',
  onMinStockChange = () => {},
  maxStock = '',
  onMaxStockChange = () => {},
  minAvailable = '',
  onMinAvailableChange = () => {},
  maxAvailable = '',
  onMaxAvailableChange = () => {},
  minReserved = '',
  onMinReservedChange = () => {},
  maxReserved = '',
  onMaxReservedChange = () => {},
  onResetFilters = () => {}
}) {
  const warehouseOptions = [
    { value: 'all', label: 'Semua Gudang Konsolidasi' },
    ...warehouses.map((w) => ({
      value: w.code,
      label: `${w.name} (${w.code})`
    }))
  ];

  const stockConditionOptions = [
    { value: 'all', label: 'Semua Kondisi Stok' },
    { value: 'safe', label: 'Stok Aman (> Minimum)' },
    { value: 'low', label: 'Perlu Restok (<= Minimum)' },
    { value: 'out_of_stock', label: 'Stok Habis (0 Unit)' }
  ];

  const categoryOptions = [
    { value: 'all', label: 'Semua Kategori Produk' },
    ...categories.map((c) => ({
      value: c,
      label: c
    }))
  ];

  return (
    <div 
      className={`fixed inset-0 z-50 transition-all duration-300 ${
        isOpen ? 'visible opacity-100 pointer-events-auto' : 'invisible opacity-0 pointer-events-none'
      }`}
      aria-hidden={!isOpen}
    >
      {/* Backdrop overlay */}
      <div 
        className="fixed inset-0 bg-neutral-950/60 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
      />

      {/* Drawer panel sliding in from right */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div 
          className={`w-screen max-w-md bg-white border-l border-neutral-300 shadow-2xl flex flex-col transform transition-transform duration-300 ease-out rounded-none ${
            isOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          {/* Drawer Header */}
          <div className="p-5 sm:p-6 bg-neutral-950 text-white flex items-center justify-between border-b border-neutral-800 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-neutral-900 border border-neutral-700 text-amber-400 flex items-center justify-center rounded-none font-black">
                <SlidersHorizontal size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-black font-sport uppercase tracking-wider text-white">
                    Filter Inventaris Gudang
                  </h2>
                  {activeFilterCount > 0 && (
                    <span className="px-1.5 py-0.2 bg-amber-400 text-black font-mono font-bold text-[10px] rounded-none">
                      {activeFilterCount}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Menampilkan {totalFiltered} dari {totalStockItems} unit SKU
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-900 rounded-none transition-colors cursor-pointer"
              title="Tutup Filter Drawer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Drawer Body Form Controls */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
            
            {/* 1. Pencarian Nama Produk */}
            <div className="space-y-2">
              <label className="block text-xs font-black uppercase font-sport tracking-wider text-neutral-900">
                Pencarian Nama Produk
              </label>
              <SearchBar
                value={searchName}
                onChange={onSearchNameChange}
                placeholder="Pencarian nama produk perlengkapan..."
                autoFocus={isOpen}
              />
            </div>

            {/* 2. Pencarian SKU Produk */}
            <div className="space-y-2">
              <label className="block text-xs font-black uppercase font-sport tracking-wider text-neutral-900">
                Pencarian Kode SKU / Bin Rak
              </label>
              <SearchBar
                value={searchSku}
                onChange={onSearchSkuChange}
                placeholder="Pencarian kode SKU (contoh: TSK-AERO-01)..."
              />
            </div>

            {/* 3. Pilihan Lokasi Gudang */}
            <div className="space-y-2">
              <label className="block text-xs font-black uppercase font-sport tracking-wider text-neutral-900">
                Lokasi Gudang Penyimpanan
              </label>
              <ServerSideSelect
                options={warehouseOptions}
                value={selectedWarehouseCode}
                onChange={onWarehouseChange}
                placeholder="Pilih lokasi gudang..."
              />
            </div>

            {/* 4. Kondisi Stok */}
            <div className="space-y-2">
              <label className="block text-xs font-black uppercase font-sport tracking-wider text-neutral-900">
                Kondisi Ketersediaan Stok
              </label>
              <ServerSideSelect
                options={stockConditionOptions}
                value={stockFilter}
                onChange={onStockFilterChange}
                placeholder="Pilih kondisi stok..."
              />
            </div>

            {/* 5. Kategori Produk */}
            {categories.length > 0 && (
              <div className="space-y-2">
                <label className="block text-xs font-black uppercase font-sport tracking-wider text-neutral-900">
                  Kategori Olahraga
                </label>
                <ServerSideSelect
                  options={categoryOptions}
                  value={categoryFilter}
                  onChange={onCategoryFilterChange}
                  placeholder="Pilih kategori olahraga..."
                />
              </div>
            )}

            {/* 6. Rentang Total Stok Fisik */}
            <div className="space-y-2">
              <label className="block text-xs font-black uppercase font-sport tracking-wider text-neutral-900">
                Rentang Total Stok Fisik (Unit)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="block text-[10px] font-mono text-neutral-500 uppercase mb-1">Stok Min</span>
                  <TextInput
                    type="number"
                    min="0"
                    placeholder="Min Qty"
                    value={minStock}
                    onChange={onMinStockChange}
                    weight="mono"
                  />
                </div>
                <div>
                  <span className="block text-[10px] font-mono text-neutral-500 uppercase mb-1">Stok Maks</span>
                  <TextInput
                    type="number"
                    min="0"
                    placeholder="Maks Qty"
                    value={maxStock}
                    onChange={onMaxStockChange}
                    weight="mono"
                  />
                </div>
              </div>
            </div>

            {/* 7. Rentang Stok Siap Jual (Available) */}
            <div className="space-y-2">
              <label className="block text-xs font-black uppercase font-sport tracking-wider text-neutral-900">
                Rentang Stok Siap Jual (Available)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="block text-[10px] font-mono text-neutral-500 uppercase mb-1">Siap Jual Min</span>
                  <TextInput
                    type="number"
                    min="0"
                    placeholder="Min Qty"
                    value={minAvailable}
                    onChange={onMinAvailableChange}
                    weight="mono"
                  />
                </div>
                <div>
                  <span className="block text-[10px] font-mono text-neutral-500 uppercase mb-1">Siap Jual Maks</span>
                  <TextInput
                    type="number"
                    min="0"
                    placeholder="Maks Qty"
                    value={maxAvailable}
                    onChange={onMaxAvailableChange}
                    weight="mono"
                  />
                </div>
              </div>
            </div>

            {/* 6. Rentang Stok Terpesan (Reserved) */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900">
                  Rentang Stok Terpesan (Unit)
                </label>
                {(minReserved || maxReserved) && (
                  <button
                    type="button"
                    onClick={() => { onMinReservedChange(''); onMaxReservedChange(''); }}
                    className="text-[11px] font-sport font-bold uppercase text-amber-700 hover:underline cursor-pointer"
                  >
                    Reset Reserved
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <span className="block text-[10px] font-mono text-neutral-500 uppercase mb-1">Terpesan Min</span>
                  <TextInput
                    type="number"
                    min="0"
                    placeholder="Min Qty"
                    value={minReserved}
                    onChange={onMinReservedChange}
                    weight="mono"
                  />
                </div>
                <div>
                  <span className="block text-[10px] font-mono text-neutral-500 uppercase mb-1">Terpesan Maks</span>
                  <TextInput
                    type="number"
                    min="0"
                    placeholder="Maks Qty"
                    value={maxReserved}
                    onChange={onMaxReservedChange}
                    weight="mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Drawer Footer Actions */}
          <div className="p-5 sm:p-6 bg-neutral-50 border-t border-neutral-200 flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onResetFilters}
              disabled={activeFilterCount === 0}
              className={`flex-1 py-2.5 px-4 font-sport font-black uppercase text-xs rounded-none border transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                activeFilterCount > 0
                  ? 'bg-white hover:bg-neutral-100 text-neutral-900 border-neutral-300 shadow-2xs'
                  : 'bg-neutral-100 text-neutral-400 border-neutral-200 cursor-not-allowed'
              }`}
            >
              <RotateCcw size={14} />
              <span>Reset Filter</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 bg-neutral-950 hover:bg-neutral-900 text-white font-sport font-black uppercase text-xs rounded-none transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <Check size={14} className="text-amber-400" />
              <span>Terapkan ({totalFiltered})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
