import React from 'react';
import { SlidersHorizontal, X, RotateCcw, Check } from 'lucide-react';
import SearchBar from '../molecules/SearchBar';
import ServerSideSelect from '../molecules/ServerSideSelect';
import TextInput from '../molecules/TextInput';

/**
 * Organism: VoucherFilterDrawer
 * Sidebar filter kanan untuk modul Voucher & Promo Admin (T15.3).
 * Mencakup 100% kolom tabel (kode, judul, tipe, nilai, min belanja, kuota, masa berlaku, status).
 */
export default function VoucherFilterDrawer({
  isOpen = false,
  onClose = () => {},
  activeFilterCount = 0,
  codeSearchQuery = '',
  onCodeSearchQueryChange = () => {},
  titleSearchQuery = '',
  onTitleSearchQueryChange = () => {},
  discountTypeFilter = 'all',
  onDiscountTypeFilterChange = () => {},
  statusFilter = 'all',
  onStatusFilterChange = () => {},
  discountValueMin = '',
  onDiscountValueMinChange = () => {},
  discountValueMax = '',
  onDiscountValueMaxChange = () => {},
  minPurchaseMin = '',
  onMinPurchaseMinChange = () => {},
  minPurchaseMax = '',
  onMinPurchaseMaxChange = () => {},
  quotaMin = '',
  onQuotaMinChange = () => {},
  quotaMax = '',
  onQuotaMaxChange = () => {},
  expiresFrom = '',
  onExpiresFromChange = () => {},
  expiresTo = '',
  onExpiresToChange = () => {},
  onResetFilters = () => {},
}) {
  const discountTypeOptions = [
    { value: 'all', label: 'Semua Tipe Diskon' },
    { value: 'fixed', label: 'Nominal Tetap (Rp)' },
    { value: 'percent', label: 'Persentase (%)' },
  ];

  const statusOptions = [
    { value: 'all', label: 'Semua Status Publikasi' },
    { value: 'active', label: 'Aktif (Dapat Dipakai)' },
    { value: 'inactive', label: 'Nonaktif (Ditangguhkan)' },
  ];

  const fieldLabel = 'block text-xs font-sport font-black uppercase tracking-wider text-neutral-900';

  return (
    <div
      className={`fixed inset-0 z-50 transition-all duration-300 ${
        isOpen ? 'visible opacity-100 pointer-events-auto' : 'invisible opacity-0 pointer-events-none'
      }`}
      aria-hidden={!isOpen}
    >
      <div
        className="fixed inset-0 bg-neutral-950/60 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
      />

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
                    Filter Voucher &amp; Promo
                  </h2>
                  {activeFilterCount > 0 && (
                    <span className="px-2 py-0.5 bg-amber-400 text-neutral-950 font-mono font-black text-[10px] rounded-none">
                      {activeFilterCount} AKTIF
                    </span>
                  )}
                </div>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Saring kupon berdasarkan kode, judul, nilai, kuota, dan masa berlaku
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

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
            <div className="space-y-2">
              <label className={fieldLabel}>Kode Voucher</label>
              <SearchBar
                value={codeSearchQuery}
                onChange={onCodeSearchQueryChange}
                placeholder="Cari kode voucher (mis. TUSKOVIBES150)..."
              />
            </div>

            <div className="space-y-2">
              <label className={fieldLabel}>Judul / Nama Promo</label>
              <SearchBar
                value={titleSearchQuery}
                onChange={onTitleSearchQueryChange}
                placeholder="Cari judul promo atau deskripsi..."
              />
            </div>

            <div className="space-y-2">
              <label className={fieldLabel}>Tipe Diskon</label>
              <ServerSideSelect
                options={discountTypeOptions}
                value={discountTypeFilter}
                onChange={onDiscountTypeFilterChange}
                placeholder="Pilih tipe diskon..."
              />
            </div>

            <div className="space-y-2">
              <label className={fieldLabel}>Status Publikasi</label>
              <ServerSideSelect
                options={statusOptions}
                value={statusFilter}
                onChange={onStatusFilterChange}
                placeholder="Pilih status publikasi..."
              />
            </div>

            <div className="space-y-2">
              <label className={fieldLabel}>Nilai Diskon (Min – Maks)</label>
              <div className="grid grid-cols-2 gap-2">
                <TextInput
                  type="number"
                  min={0}
                  weight="mono"
                  prefix="Rp"
                  value={discountValueMin}
                  onChange={onDiscountValueMinChange}
                  placeholder="Min"
                />
                <TextInput
                  type="number"
                  min={0}
                  weight="mono"
                  prefix="Rp"
                  value={discountValueMax}
                  onChange={onDiscountValueMaxChange}
                  placeholder="Maks"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className={fieldLabel}>Minimal Belanja (Min – Maks)</label>
              <div className="grid grid-cols-2 gap-2">
                <TextInput
                  type="number"
                  min={0}
                  weight="mono"
                  prefix="Rp"
                  value={minPurchaseMin}
                  onChange={onMinPurchaseMinChange}
                  placeholder="Min"
                />
                <TextInput
                  type="number"
                  min={0}
                  weight="mono"
                  prefix="Rp"
                  value={minPurchaseMax}
                  onChange={onMinPurchaseMaxChange}
                  placeholder="Maks"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className={fieldLabel}>Kuota (Min – Maks)</label>
              <div className="grid grid-cols-2 gap-2">
                <TextInput
                  type="number"
                  min={0}
                  weight="mono"
                  value={quotaMin}
                  onChange={onQuotaMinChange}
                  placeholder="Min"
                />
                <TextInput
                  type="number"
                  min={0}
                  weight="mono"
                  value={quotaMax}
                  onChange={onQuotaMaxChange}
                  placeholder="Maks"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className={fieldLabel}>Masa Berlaku (Dari – Sampai)</label>
              <div className="grid grid-cols-2 gap-2">
                <TextInput
                  type="date"
                  value={expiresFrom}
                  onChange={onExpiresFromChange}
                  title="Berlaku dari tanggal"
                />
                <TextInput
                  type="date"
                  value={expiresTo}
                  onChange={onExpiresToChange}
                  title="Berlaku sampai tanggal"
                />
              </div>
            </div>
          </div>

          {/* Drawer Footer */}
          <div className="p-5 sm:p-6 bg-neutral-50 border-t border-neutral-200 flex items-center justify-between gap-3 shrink-0">
            <button
              type="button"
              onClick={onResetFilters}
              className="px-4 py-2.5 bg-white hover:bg-neutral-100 text-neutral-700 border border-neutral-300 text-xs font-sport font-black uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-2 rounded-none"
            >
              <RotateCcw size={14} />
              <span>Reset Filter</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-amber-400 hover:bg-amber-300 text-neutral-950 border border-amber-500 text-xs font-sport font-black uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-2 rounded-none shadow-xs"
            >
              <Check size={15} />
              <span>Terapkan Filter</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
