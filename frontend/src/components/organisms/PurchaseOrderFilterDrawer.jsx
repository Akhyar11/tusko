import React from 'react';
import { SlidersHorizontal, X, RotateCcw, Check } from 'lucide-react';
import SearchBar from '../molecules/SearchBar';
import ServerSideSelect from '../molecules/ServerSideSelect';
import TextInput from '../molecules/TextInput';

/**
 * Organism: PurchaseOrderFilterDrawer
 * Right-to-left centralized drawer for filtering Purchase Orders (100% table column coverage)
 */
export default function PurchaseOrderFilterDrawer({
  isOpen = false,
  onClose = () => {},
  activeFilterCount = 0,
  // Search state
  searchQuery = '',
  onSearchQueryChange = () => {},
  vendorSearchQuery = '',
  onVendorSearchQueryChange = () => {},
  // Dropdown filter states
  statusFilter = 'all',
  onStatusFilterChange = () => {},
  warehouseFilter = 'all',
  onWarehouseFilterChange = () => {},
  warehouseOptions = [],
  // Date range
  orderDateStart = '',
  onOrderDateStartChange = () => {},
  orderDateEnd = '',
  onOrderDateEndChange = () => {},
  deliveryDateStart = '',
  onDeliveryDateStartChange = () => {},
  deliveryDateEnd = '',
  onDeliveryDateEndChange = () => {},
  // Amount range
  minAmount = '',
  onMinAmountChange = () => {},
  maxAmount = '',
  onMaxAmountChange = () => {},
  onResetFilters = () => {}
}) {
  const statusOptions = [
    { value: 'all', label: 'Semua Status Otorisasi' },
    { value: 'draft', label: '⚪ Draft (Konsep Pemesanan)' },
    { value: 'approved', label: '🔵 Approved (Disetujui Manajer)' },
    { value: 'sent', label: '🟣 Sent (Terkirim ke Vendor)' },
    { value: 'received', label: '🟢 Received (Barang Diterima)' },
    { value: 'cancelled', label: '🔴 Cancelled (Dibatalkan)' }
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
                    Filter Purchase Order
                  </h2>
                  {activeFilterCount > 0 && (
                    <span className="px-2 py-0.5 bg-amber-400 text-neutral-950 font-mono font-black text-[10px] rounded-none">
                      {activeFilterCount} AKTIF
                    </span>
                  )}
                </div>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Filter PO berdasarkan nomor, vendor, tanggal, status & nominal
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-900 border border-transparent hover:border-neutral-800 rounded-none transition-colors cursor-pointer"
              title="Tutup Filter"
            >
              <X size={20} />
            </button>
          </div>

          {/* Drawer Body Form Controls */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
            {/* 1. Pencarian Nomor PO */}
            <div className="space-y-2">
              <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900">
                Nomor Dokumen PO
              </label>
              <SearchBar
                value={searchQuery}
                onChange={onSearchQueryChange}
                placeholder="Cari nomor PO (mis. PO-2026...)"
                autoFocus={isOpen}
              />
            </div>

            {/* 2. Pencarian Nama Vendor */}
            <div className="space-y-2">
              <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900">
                Nama Vendor / Pabrik Mitra
              </label>
              <SearchBar
                value={vendorSearchQuery}
                onChange={onVendorSearchQueryChange}
                placeholder="Cari nama pabrik atau rekanan vendor..."
              />
            </div>

            {/* 3. Status Otorisasi PO */}
            <div className="space-y-2">
              <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900">
                Status Otorisasi Dokumen
              </label>
              <ServerSideSelect
                options={statusOptions}
                value={statusFilter}
                onChange={onStatusFilterChange}
                placeholder="Pilih status otorisasi PO..."
              />
            </div>

            {/* 4. Gudang Tujuan (Warehouse) */}
            {warehouseOptions.length > 0 && (
              <div className="space-y-2">
                <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900">
                  Gudang Logistik Penerima
                </label>
                <ServerSideSelect
                  options={warehouseOptions}
                  value={warehouseFilter}
                  onChange={onWarehouseFilterChange}
                  placeholder="Pilih gudang logistik..."
                />
              </div>
            )}

            {/* 5. Rentang Tanggal Terbit PO */}
            <div className="space-y-2">
              <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900">
                Rentang Tanggal Terbit PO
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="block text-[10px] text-neutral-500 font-bold uppercase mb-1">Dari</span>
                  <TextInput
                    type="date"
                    value={orderDateStart}
                    onChange={onOrderDateStartChange}
                  />
                </div>
                <div>
                  <span className="block text-[10px] text-neutral-500 font-bold uppercase mb-1">Sampai</span>
                  <TextInput
                    type="date"
                    value={orderDateEnd}
                    onChange={onOrderDateEndChange}
                  />
                </div>
              </div>
            </div>

            {/* 6. Rentang Estimasi Tiba (Delivery Date) */}
            <div className="space-y-2">
              <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900">
                Rentang Estimasi Kedatangan
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="block text-[10px] text-neutral-500 font-bold uppercase mb-1">Dari</span>
                  <TextInput
                    type="date"
                    value={deliveryDateStart}
                    onChange={onDeliveryDateStartChange}
                  />
                </div>
                <div>
                  <span className="block text-[10px] text-neutral-500 font-bold uppercase mb-1">Sampai</span>
                  <TextInput
                    type="date"
                    value={deliveryDateEnd}
                    onChange={onDeliveryDateEndChange}
                  />
                </div>
              </div>
            </div>

            {/* 7. Rentang Nilai Pemesanan (Total Amount) */}
            <div className="space-y-2">
              <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900">
                Rentang Nilai Pemesanan (Rp)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="block text-[10px] text-neutral-500 font-bold uppercase mb-1">Min (Rp)</span>
                  <TextInput
                    type="number"
                    value={minAmount}
                    onChange={onMinAmountChange}
                    placeholder="0"
                    weight="mono"
                  />
                </div>
                <div>
                  <span className="block text-[10px] text-neutral-500 font-bold uppercase mb-1">Maks (Rp)</span>
                  <TextInput
                    type="number"
                    value={maxAmount}
                    onChange={onMaxAmountChange}
                    placeholder="Maksimal..."
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
              <span>Terapkan Filter</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
