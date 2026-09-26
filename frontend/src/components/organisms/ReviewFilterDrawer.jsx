import React, { useState, useEffect } from 'react';
import { SlidersHorizontal, X, RotateCcw, Check } from 'lucide-react';
import SearchBar from '../molecules/SearchBar';
import ServerSideSelect from '../molecules/ServerSideSelect';
import TextInput from '../molecules/TextInput';
import IconButton from '../atoms/IconButton';
import { productService } from '../../services/productService';

/**
 * Organism: ReviewFilterDrawer — sidebar filter kanan-ke-kiri moderasi ulasan (T32.3).
 */
export default function ReviewFilterDrawer({
  isOpen = false,
  onClose = () => {},
  activeFilterCount = 0,
  searchQuery = '',
  onSearchQueryChange = () => {},
  userSearchQuery = '',
  onUserSearchQueryChange = () => {},
  createdFrom = '',
  onCreatedFromChange = () => {},
  createdTo = '',
  onCreatedToChange = () => {},
  productFilter = 'all',
  onProductFilterChange = () => {},
  ratingFilter = 'all',
  onRatingFilterChange = () => {},
  statusFilter = 'all',
  onStatusFilterChange = () => {},
  onResetFilters = () => {}
}) {
  const [productOptions, setProductOptions] = useState([{ value: 'all', label: 'Semua Produk' }]);

  useEffect(() => {
    let active = true;
    productService.fetchProducts({ per_page: 50, include_inactive: true })
      .then((res) => {
        if (!active) return;
        setProductOptions([
          { value: 'all', label: 'Semua Produk' },
          ...(res.data || []).map((p) => ({ value: String(p.id), label: p.name }))
        ]);
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  const ratingOptions = [
    { value: 'all', label: 'Semua Rating' },
    ...[5, 4, 3, 2, 1].map((r) => ({ value: String(r), label: `${r} Bintang` }))
  ];

  const statusOptions = [
    { value: 'all', label: 'Semua Status' },
    { value: 'approved', label: 'Disetujui' },
    { value: 'pending', label: 'Menunggu Moderasi' }
  ];

  return (
    <div
      className={`fixed inset-0 z-50 transition-all duration-300 ${
        isOpen ? 'visible opacity-100 pointer-events-auto' : 'invisible opacity-0 pointer-events-none'
      }`}
      aria-hidden={!isOpen}
    >
      <div className="fixed inset-0 bg-neutral-950/60 backdrop-blur-[2px] transition-opacity" onClick={onClose} />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div
          className={`w-screen max-w-md bg-white border-l border-neutral-300 shadow-2xl flex flex-col transform transition-transform duration-300 ease-out rounded-none ${
            isOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="p-5 sm:p-6 bg-neutral-950 text-white flex items-center justify-between border-b border-neutral-800 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-neutral-900 border border-neutral-700 text-amber-400 flex items-center justify-center rounded-none font-black">
                <SlidersHorizontal size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-black font-sport uppercase tracking-wider text-white">Filter Ulasan</h2>
                  {activeFilterCount > 0 && (
                    <span className="px-2 py-0.5 bg-amber-400 text-neutral-950 font-mono font-black text-[10px] rounded-none">
                      {activeFilterCount} AKTIF
                    </span>
                  )}
                </div>
                <p className="text-xs text-neutral-400 mt-0.5">Saring ulasan berdasarkan produk, rating, dan status moderasi</p>
              </div>
            </div>

            <IconButton icon={X} onClick={onClose} title="Tutup Filter" variant="dark" />
          </div>

          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
            <div className="space-y-2">
              <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900">Judul / Komentar</label>
              <SearchBar value={searchQuery} onChange={onSearchQueryChange} placeholder="Ketik judul atau isi ulasan..." />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900">Pengulas</label>
              <SearchBar value={userSearchQuery} onChange={onUserSearchQueryChange} placeholder="Cari nama atau email pengulas..." />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900">Tanggal Ulasan</label>
              <div className="grid grid-cols-2 gap-3">
                <TextInput type="date" value={createdFrom} onChange={onCreatedFromChange} weight="mono" title="Dari tanggal" />
                <TextInput type="date" value={createdTo} onChange={onCreatedToChange} weight="mono" title="Sampai tanggal" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900">Produk</label>
              <ServerSideSelect options={productOptions} value={productFilter} onChange={onProductFilterChange} placeholder="Pilih produk..." />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900">Rating</label>
              <ServerSideSelect options={ratingOptions} value={ratingFilter} onChange={onRatingFilterChange} placeholder="Pilih rating..." />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900">Status Moderasi</label>
              <ServerSideSelect options={statusOptions} value={statusFilter} onChange={onStatusFilterChange} placeholder="Pilih status..." />
            </div>
          </div>

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
