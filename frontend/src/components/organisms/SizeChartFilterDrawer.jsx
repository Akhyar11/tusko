import React from 'react';
import { SlidersHorizontal, X, RotateCcw, Check } from 'lucide-react';
import SearchBar from '../molecules/SearchBar';
import ServerSideSelect from '../molecules/ServerSideSelect';

/**
 * Organism: SizeChartFilterDrawer
 * Drawer filter terpusat (kanan) untuk Master Panduan Ukuran.
 */
export default function SizeChartFilterDrawer({
  isOpen = false,
  onClose = () => {},
  activeFilterCount = 0,
  totalFiltered = 0,
  search = '',
  onSearchChange = () => {},
  categoryId = 'all',
  onCategoryChange = () => {},
  status = 'all',
  onStatusChange = () => {},
  sortOption = 'sort_order_asc',
  onSortOptionChange = () => {},
  categories = [],
  onResetFilters = () => {},
}) {
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
                  <h2 className="text-base font-black font-sport uppercase tracking-wider text-white">Filter Panduan Ukuran</h2>
                  {activeFilterCount > 0 && (
                    <span className="px-2 py-0.5 bg-amber-400 text-neutral-950 font-mono font-black text-[10px] rounded-none">
                      {activeFilterCount} AKTIF
                    </span>
                  )}
                </div>
                <p className="text-xs text-neutral-400 mt-0.5">Saring tabel ukuran berdasarkan kategori & status</p>
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

          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
            <div className="space-y-2">
              <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900">Nama Tabel Ukuran</label>
              <SearchBar value={search} onChange={onSearchChange} onReset={() => onSearchChange('')} placeholder="Cari nama tabel ukuran..." />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900">Kategori Terkait</label>
              <ServerSideSelect
                value={categoryId === 'all' ? '' : String(categoryId)}
                onChange={(val) => onCategoryChange(val || 'all')}
                options={[{ value: 'all', label: 'Semua Kategori' }, ...categories.map((c) => ({ value: String(c.id), label: c.name }))]}
                placeholder="Pilih kategori olahraga..."
                isClearable={categoryId !== 'all'}
                scrollPadding={30}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900">Status</label>
              <ServerSideSelect
                value={status === 'all' ? '' : status}
                onChange={(val) => onStatusChange(val || 'all')}
                options={[
                  { value: 'all', label: 'Semua Status' },
                  { value: 'active', label: 'Aktif' },
                  { value: 'inactive', label: 'Nonaktif' },
                ]}
                placeholder="Pilih status publikasi..."
                isClearable={status !== 'all'}
                scrollPadding={30}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900">Urutan</label>
              <ServerSideSelect
                value={sortOption === 'sort_order_asc' ? '' : sortOption}
                onChange={(val) => onSortOptionChange(val || 'sort_order_asc')}
                options={[
                  { value: 'sort_order_asc', label: 'Urutan (Awal - Akhir)' },
                  { value: 'name_asc', label: 'Nama (A - Z)' },
                  { value: 'name_desc', label: 'Nama (Z - A)' },
                ]}
                placeholder="Pilih urutan katalog..."
                isClearable={sortOption !== 'sort_order_asc'}
                scrollPadding={30}
              />
            </div>
          </div>

          <div className="p-5 sm:p-6 bg-neutral-50 border-t border-neutral-200 flex items-center justify-between gap-3 shrink-0">
            <button
              type="button"
              onClick={onResetFilters}
              disabled={activeFilterCount === 0}
              className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-neutral-100 text-neutral-800 border border-neutral-300 font-sport font-black uppercase text-xs rounded-none transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RotateCcw size={14} />
              <span>Reset Filter</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 bg-black hover:bg-neutral-800 text-white font-sport font-black uppercase text-xs rounded-none transition-colors cursor-pointer shadow-xs"
            >
              <Check size={15} className="text-amber-400" />
              <span>Terapkan Filter ({totalFiltered})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
