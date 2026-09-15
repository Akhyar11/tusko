import React from 'react';
import { SlidersHorizontal, X, RotateCcw, Check, Wallet } from 'lucide-react';
import SearchBar from '../molecules/SearchBar';
import ServerSideSelect from '../molecules/ServerSideSelect';
import TextInput from '../molecules/TextInput';

/**
 * Organism: FinancialFilterDrawer
 * Right-to-left centralized drawer for Cashbook & Financial Transactions filtering
 */
export default function FinancialFilterDrawer({
  isOpen = false,
  onClose = () => {},
  activeFilterCount = 0,
  totalFiltered = 0,
  totalTransactions = 0,
  searchQuery = '',
  onSearchChange = () => {},
  cashbookFilter = 'all',
  onCashbookFilterChange = () => {},
  selectedCategory = 'all',
  onCategoryChange = () => {},
  categories = [],
  paymentMethod = 'all',
  onPaymentMethodChange = () => {},
  status = 'all',
  onStatusChange = () => {},
  minAmount = '',
  onMinAmountChange = () => {},
  maxAmount = '',
  onMaxAmountChange = () => {},
  dateRange = 'all',
  onDateRangeChange = () => {},
  startDate = '',
  onStartDateChange = () => {},
  endDate = '',
  onEndDateChange = () => {},
  onResetFilters = () => {}
}) {
  const cashbookTypeOptions = [
    { value: 'all', label: 'Semua Tipe Transaksi' },
    { value: 'income', label: 'Kas Masuk (Income)' },
    { value: 'expense', label: 'Kas Keluar (Expense)' },
    { value: 'pending', label: 'Menunggu Pembayaran (Pending)' }
  ];

  const categoryOptions = [
    { value: 'all', label: 'Semua Kategori Transaksi' },
    ...categories.map((c) => ({
      value: c.id,
      label: c.label
    }))
  ];

  const paymentMethodOptions = [
    { value: 'all', label: 'Semua Metode / Rekening' },
    { value: 'BCA Bisnis (088-299-112)', label: 'BCA Bisnis (088-299-112)' },
    { value: 'Mandiri Operasional (144-00-8812)', label: 'Mandiri Operasional (144-00-8812)' },
    { value: 'Kas Tunai Kasir Toko', label: 'Kas Tunai Kasir Toko' },
    { value: 'QRIS Tusko Storefront', label: 'QRIS Tusko Storefront' }
  ];

  const statusOptions = [
    { value: 'all', label: 'Semua Status' },
    { value: 'settled', label: 'Berhasil / Settled' },
    { value: 'pending', label: 'Pending / Menunggu' }
  ];

  const dateOptions = [
    { value: 'all', label: 'Semua Periode Tanggal' },
    { value: 'this_month', label: 'Bulan Berjalan Ini' },
    { value: '30days', label: '30 Hari Terakhir' },
    { value: '7days', label: '7 Hari Terakhir' }
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
                    Filter Buku Kas & Jurnal
                  </h2>
                  {activeFilterCount > 0 && (
                    <span className="px-1.5 py-0.2 bg-amber-400 text-black font-mono font-bold text-[10px] rounded-none">
                      {activeFilterCount}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Menampilkan {totalFiltered} dari {totalTransactions} mutasi kas
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
            
            {/* 1. Pencarian Transaksi */}
            <div className="space-y-2">
              <label className="block text-xs font-black uppercase font-sport tracking-wider text-neutral-900">
                Pencarian No. Transaksi & Keterangan
              </label>
              <SearchBar
                value={searchQuery}
                onChange={onSearchChange}
                placeholder="Cari TRX, invoice, memo, atau pelanggan..."
                autoFocus={isOpen}
              />
            </div>

            {/* 2. Tipe Kas */}
            <div className="space-y-2">
              <label className="block text-xs font-black uppercase font-sport tracking-wider text-neutral-900">
                Arah Aliran Kas (Type)
              </label>
              <ServerSideSelect
                options={cashbookTypeOptions}
                value={cashbookFilter}
                onChange={onCashbookFilterChange}
                placeholder="Pilih arah aliran kas..."
              />
            </div>

            {/* 3. Kategori Transaksi */}
            <div className="space-y-2">
              <label className="block text-xs font-black uppercase font-sport tracking-wider text-neutral-900">
                Klasifikasi Kategori Arus Kas
              </label>
              <ServerSideSelect
                options={categoryOptions}
                value={selectedCategory}
                onChange={onCategoryChange}
                placeholder="Pilih kategori transaksi..."
              />
            </div>

            {/* 4. Metode Bayar / Rekening */}
            <div className="space-y-2">
              <label className="block text-xs font-black uppercase font-sport tracking-wider text-neutral-900">
                Metode Bayar / Rekening Kas
              </label>
              <ServerSideSelect
                options={paymentMethodOptions}
                value={paymentMethod}
                onChange={onPaymentMethodChange}
                placeholder="Pilih metode atau rekening..."
              />
            </div>

            {/* 5. Status Transaksi */}
            <div className="space-y-2">
              <label className="block text-xs font-black uppercase font-sport tracking-wider text-neutral-900">
                Status Pembukuan
              </label>
              <ServerSideSelect
                options={statusOptions}
                value={status}
                onChange={onStatusChange}
                placeholder="Pilih status transaksi..."
              />
            </div>

            {/* 6. Rentang Nominal Rp */}
            <div className="space-y-2">
              <label className="block text-xs font-black uppercase font-sport tracking-wider text-neutral-900">
                Rentang Nominal Transaksi (Rp)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="block text-[10px] font-mono text-neutral-500 uppercase mb-1">Nominal Min</span>
                  <TextInput
                    type="number"
                    min="0"
                    placeholder="Rp Min"
                    value={minAmount}
                    onChange={onMinAmountChange}
                    weight="mono"
                  />
                </div>
                <div>
                  <span className="block text-[10px] font-mono text-neutral-500 uppercase mb-1">Nominal Maks</span>
                  <TextInput
                    type="number"
                    min="0"
                    placeholder="Rp Maks"
                    value={maxAmount}
                    onChange={onMaxAmountChange}
                    weight="mono"
                  />
                </div>
              </div>
            </div>

            {/* 7. Periode Tanggal Preset */}
            <div className="space-y-2">
              <label className="block text-xs font-black uppercase font-sport tracking-wider text-neutral-900">
                Preset Periode Pembukuan
              </label>
              <ServerSideSelect
                options={dateOptions}
                value={dateRange}
                onChange={onDateRangeChange}
                placeholder="Pilih rentang tanggal..."
              />
            </div>

            {/* 8. Rentang Tanggal Spesifik */}
            <div className="space-y-2">
              <label className="block text-xs font-black uppercase font-sport tracking-wider text-neutral-900">
                Rentang Tanggal Transaksi
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
