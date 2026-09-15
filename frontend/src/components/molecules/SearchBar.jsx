import React from 'react';
import { Search } from 'lucide-react';

/**
 * Molecule: SearchBar with atomic design and sharp styling
 */
export default function SearchBar({
  value = '',
  onChange = () => {},
  onReset = () => {},
  placeholder = 'Cari produk olahraga, SKU, atau spesifikasi...',
  className = ''
}) {
  return (
    <div className={`relative flex-1 ${className}`}>
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" size={16} />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-[42px] pl-10 pr-12 py-2.5 text-xs sm:text-sm bg-neutral-50 focus:bg-white border border-neutral-300 rounded-none focus:outline-none focus:border-amber-500 transition-all text-neutral-950 font-medium placeholder:text-neutral-400"
      />
      {value && (
        <button
          type="button"
          onClick={onReset}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-sport font-bold uppercase text-neutral-400 hover:text-black cursor-pointer"
          title="Reset Pencarian"
        >
          ✕
        </button>
      )}
    </div>
  );
}
