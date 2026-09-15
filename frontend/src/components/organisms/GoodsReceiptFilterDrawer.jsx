import React from 'react';
import { SlidersHorizontal, X, RotateCcw, Check } from 'lucide-react';
import SearchBar from '../molecules/SearchBar';
import ServerSideSelect from '../molecules/ServerSideSelect';
import TextInput from '../molecules/TextInput';

/**
 * Organism: GoodsReceiptFilterDrawer
 * Right-to-left centralized drawer for filtering Goods Receipt Notes / Surat Jalan (100% table column coverage)
 */
export default function GoodsReceiptFilterDrawer({
  isOpen = false,
  onClose = () => {},
  activeFilterCount = 0,
  // Search states
  searchQuery = '',
  onSearchQueryChange = () => {},
  poSearchQuery = '',
  onPoSearchQueryChange = () => {},
  deliveryOrderQuery = '',
  onDeliveryOrderQueryChange = () => {},
  receiverQuery = '',
  onReceiverQueryChange = () => {},
  vendorFilter = 'all',
  onVendorFilterChange = () => {},
  vendorOptions = [],
  // Date range
  receivedDateStart = '',
  onReceivedDateStartChange = () => {},
  receivedDateEnd = '',
  onReceivedDateEndChange = () => {},
  // Units range
  minUnits = '',
  onMinUnitsChange = () => {},
  maxUnits = '',
  onMaxUnitsChange = () => {},
  // Status filter
  statusFilter = 'all',
  onStatusFilterChange = () => {},
  onResetFilters = () => {}
}) {
  const qcStatusOptions = [
    { value: 'all', label: 'Semua Status QC & Penerimaan' },
    { value: 'verified', label: '🟢 Terverifikasi QC (Lolos Gudang)' },
    { value: 'partial', label: '🟡 Sebagian Diterima (Selisih)' },
    { value: 'pending', label: '⚪ Menunggu Pemeriksaan QC' }
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
                    Filter Penerimaan (GRN)
                  </h2>
                  {activeFilterCount > 0 && (
                    <span className="px-2 py-0.5 bg-amber-400 text-neutral-950 font-mono font-black text-[10px] rounded-none">
                      {activeFilterCount} AKTIF
                    </span>
                  )}
                </div>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Saring bukti fisik barang masuk, nomor DO, vendor & penerima
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
            {/* 1. Pencarian Nomor GRN */}
            <div className="space-y-2">
              <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900">
                Nomor Bukti GRN
              </label>
              <SearchBar
                value={searchQuery}
                onChange={onSearchQueryChange}
                placeholder="Cari nomor dokumen GRN (mis. GRN-2026...)"
                autoFocus={isOpen}
              />
            </div>

            {/* 2. Pencarian Nomor Referensi PO */}
            <div className="space-y-2">
              <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900">
                Nomor Referensi PO
              </label>
              <SearchBar
                value={poSearchQuery}
                onChange={onPoSearchQueryChange}
                placeholder="Cari ref PO asal (mis. PO-2026...)"
              />
            </div>

            {/* 3. Pencarian Nomor Surat Jalan (DO) */}
            <div className="space-y-2">
              <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900">
                Nomor Surat Jalan (DO) Vendor
              </label>
              <SearchBar
                value={deliveryOrderQuery}
                onChange={onDeliveryOrderQueryChange}
                placeholder="Cari no. resi / surat jalan ekspedisi/vendor..."
              />
            </div>

            {/* 4. Rekanan Vendor Pengirim */}
            {vendorOptions.length > 0 && (
              <div className="space-y-2">
                <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900">
                  Vendor Mitra Pengirim
                </label>
                <ServerSideSelect
                  options={vendorOptions}
                  value={vendorFilter}
                  onChange={onVendorFilterChange}
                  placeholder="Pilih vendor pengirim..."
                />
              </div>
            )}

            {/* 5. Petugas Penerima Gudang */}
            <div className="space-y-2">
              <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900">
                Petugas Penerima Gudang
              </label>
              <SearchBar
                value={receiverQuery}
                onChange={onReceiverQueryChange}
                placeholder="Cari nama staf pemeriksa fisik..."
              />
            </div>

            {/* 6. Rentang Tanggal Terima Fisik */}
            <div className="space-y-2">
              <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900">
                Rentang Tanggal Terima Fisik
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="block text-[10px] text-neutral-500 font-bold uppercase mb-1">Dari</span>
                  <TextInput
                    type="date"
                    value={receivedDateStart}
                    onChange={onReceivedDateStartChange}
                  />
                </div>
                <div>
                  <span className="block text-[10px] text-neutral-500 font-bold uppercase mb-1">Sampai</span>
                  <TextInput
                    type="date"
                    value={receivedDateEnd}
                    onChange={onReceivedDateEndChange}
                  />
                </div>
              </div>
            </div>

            {/* 7. Rentang Jumlah Unit Fisik Masuk */}
            <div className="space-y-2">
              <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900">
                Rentang Unit Masuk (Pcs)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="block text-[10px] text-neutral-500 font-bold uppercase mb-1">Min (Pcs)</span>
                  <TextInput
                    type="number"
                    value={minUnits}
                    onChange={onMinUnitsChange}
                    placeholder="0"
                    weight="mono"
                  />
                </div>
                <div>
                  <span className="block text-[10px] text-neutral-500 font-bold uppercase mb-1">Maks (Pcs)</span>
                  <TextInput
                    type="number"
                    value={maxUnits}
                    onChange={onMaxUnitsChange}
                    placeholder="Maksimal..."
                    weight="mono"
                  />
                </div>
              </div>
            </div>

            {/* 8. Status Verifikasi QC */}
            <div className="space-y-2">
              <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900">
                Status Verifikasi Kualitas (QC)
              </label>
              <ServerSideSelect
                options={qcStatusOptions}
                value={statusFilter}
                onChange={onStatusFilterChange}
                placeholder="Pilih status QC penerimaan..."
              />
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
