import React from 'react';
import { SlidersHorizontal, X, RotateCcw, Check } from 'lucide-react';
import SearchBar from '../molecules/SearchBar';
import ServerSideSelect from '../molecules/ServerSideSelect';
import TextInput from '../molecules/TextInput';

/**
 * Organism: OrderFilterDrawer
 * Right-to-left centralized drawer for Order management filtering & search
 */
export default function OrderFilterDrawer({
  isOpen = false,
  onClose = () => {},
  activeFilterCount = 0,
  totalFiltered = 0,
  totalOrders = 0,
  searchKeyword = '',
  onSearchChange = () => {},
  searchProduct = '',
  onSearchProductChange = () => {},
  statusFilter = 'all',
  onStatusFilterChange = () => {},
  minTotal = '',
  onMinTotalChange = () => {},
  maxTotal = '',
  onMaxTotalChange = () => {},
  dateFilter = 'all',
  onDateFilterChange = () => {},
  startDate = '',
  onStartDateChange = () => {},
  endDate = '',
  onEndDateChange = () => {},
  expeditionFilter = 'all',
  onExpeditionFilterChange = () => {},
  expeditions = [],
  onResetFilters = () => {}
}) {
  const statusOptions = [
    { value: 'all', label: 'Semua Status Pesanan' },
    { value: 'pending', label: 'Menunggu Pembayaran' },
    { value: 'processing', label: 'Diproses Gudang' },
    { value: 'shipped', label: 'Sedang Dikirim (Kurir)' },
    { value: 'completed', label: 'Pesanan Selesai' },
    { value: 'cancelled', label: 'Dibatalkan / Gagal' }
  ];

  const dateOptions = [
    { value: 'all', label: 'Semua Rentang Waktu' },
    { value: '7days', label: '7 Hari Terakhir' },
    { value: '30days', label: '30 Hari Terakhir' },
    { value: '90days', label: '90 Hari Terakhir' }
  ];

  const expeditionOptions = [
    { value: 'all', label: 'Semua Layanan Ekspedisi' },
    ...expeditions.map((exp) => ({
      value: exp.name || exp,
      label: exp.service ? `${exp.name} - ${exp.service}` : (exp.name || exp)
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
                    Filter Antrean Pesanan
                  </h2>
                  {activeFilterCount > 0 && (
                    <span className="px-1.5 py-0.2 bg-amber-400 text-black font-mono font-bold text-[10px] rounded-none">
                      {activeFilterCount}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Menampilkan {totalFiltered} dari {totalOrders} total pesanan
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
            
            {/* 1. Pencarian Pesanan */}
            <div className="space-y-2">
              <label className="block text-xs font-black uppercase font-sport tracking-wider text-neutral-900">
                Cari Nomor Invoice & Penerima
              </label>
              <SearchBar
                value={searchKeyword}
                onChange={onSearchChange}
                placeholder="Pencarian invoice, nama pembeli, atau resi..."
                autoFocus={isOpen}
              />
            </div>

            {/* 2. Pencarian Nama Produk Item */}
            <div className="space-y-2">
              <label className="block text-xs font-black uppercase font-sport tracking-wider text-neutral-900">
                Pencarian Item Produk
              </label>
              <SearchBar
                value={searchProduct}
                onChange={onSearchProductChange}
                placeholder="Cari nama produk di dalam pesanan..."
              />
            </div>

            {/* 3. Status Pesanan */}
            <div className="space-y-2">
              <label className="block text-xs font-black uppercase font-sport tracking-wider text-neutral-900">
                Status Fulfillment Pesanan
              </label>
              <ServerSideSelect
                options={statusOptions}
                value={statusFilter}
                onChange={onStatusFilterChange}
                placeholder="Pilih status pesanan..."
              />
            </div>

            {/* 4. Ekspedisi Kurir */}
            {expeditionOptions.length > 1 && (
              <div className="space-y-2">
                <label className="block text-xs font-black uppercase font-sport tracking-wider text-neutral-900">
                  Pilihan Jasa Ekspedisi
                </label>
                <ServerSideSelect
                  options={expeditionOptions}
                  value={expeditionFilter}
                  onChange={onExpeditionFilterChange}
                  placeholder="Pilih kurir ekspedisi..."
                />
              </div>
            )}

            {/* 5. Rentang Total Tagihan */}
            <div className="space-y-2">
              <label className="block text-xs font-black uppercase font-sport tracking-wider text-neutral-900">
                Rentang Total Tagihan (Rp)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="block text-[10px] font-mono text-neutral-500 uppercase mb-1">Total Min</span>
                  <TextInput
                    type="number"
                    min="0"
                    placeholder="Rp Min"
                    value={minTotal}
                    onChange={onMinTotalChange}
                    weight="mono"
                  />
                </div>
                <div>
                  <span className="block text-[10px] font-mono text-neutral-500 uppercase mb-1">Total Maks</span>
                  <TextInput
                    type="number"
                    min="0"
                    placeholder="Rp Maks"
                    value={maxTotal}
                    onChange={onMaxTotalChange}
                    weight="mono"
                  />
                </div>
              </div>
            </div>

            {/* 6. Rentang Waktu Preset */}
            <div className="space-y-2">
              <label className="block text-xs font-black uppercase font-sport tracking-wider text-neutral-900">
                Preset Rentang Waktu
              </label>
              <ServerSideSelect
                options={dateOptions}
                value={dateFilter}
                onChange={onDateFilterChange}
                placeholder="Pilih rentang waktu..."
              />
            </div>

            {/* 7. Rentang Tanggal Spesifik */}
            <div className="space-y-2">
              <label className="block text-xs font-black uppercase font-sport tracking-wider text-neutral-900">
                Rentang Tanggal Spesifik
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="block text-[10px] font-mono text-neutral-500 uppercase mb-1">Dari Tanggal</span>
                  <TextInput
                    type="date"
                    value={startDate}
                    onChange={onStartDateChange}
                  />
                </div>
                <div>
                  <span className="block text-[10px] font-mono text-neutral-500 uppercase mb-1">Sampai Tanggal</span>
                  <TextInput
                    type="date"
                    value={endDate}
                    onChange={onEndDateChange}
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
