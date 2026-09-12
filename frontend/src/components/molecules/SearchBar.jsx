import React from 'react';
import { Search } from 'lucide-react';

/**
 * Molecule: SearchBar with atomic design and sharp styling
 */
export default function SearchBar({
  value = '',
  onChange = () => {},
  onReset = () => {},
  placeholder = 'Cari produk olahraga, SKU, atau spesifikasi...'
}) {
  return (
    <div className="relative flex-1">
      <Search className="absolute left-3.5 top-3 text-neutral-400" size={16} />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-12 py-2 text-xs sm:text-sm bg-neutral-50 hover:bg-neutral-100/80 focus:bg-white border border-neutral-300 rounded-none focus:outline-none focus:border-black transition-all text-neutral-900"
      />
      {value && (
        <button
          type="button"
          onClick={onReset}
          className="absolute right-3 top-2.5 text-xs font-sport font-bold uppercase text-neutral-400 hover:text-black cursor-pointer"
          title="Reset Pencarian"
        >
          ✕
        </button>
      )}
    </div>
  );
}
