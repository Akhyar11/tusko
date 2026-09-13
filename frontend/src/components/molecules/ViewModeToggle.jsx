import React from 'react';
import { List, LayoutGrid } from 'lucide-react';

/**
 * Molecule: ViewModeToggle (Table vs Grid) with sharp athletic styling & tooltips
 */
export default function ViewModeToggle({ viewMode = 'table', onChange = () => {} }) {
  return (
    <div className="inline-flex items-center border border-neutral-300 bg-neutral-100 p-1 rounded-none h-10 shrink-0">
      {/* List / Table Mode Button */}
      <div className="relative group inline-flex">
        <button
          type="button"
          onClick={() => onChange('table')}
          aria-label="Tampilan Tabel Server-Side"
          className={`w-8 h-8 rounded-none transition-colors cursor-pointer flex items-center justify-center ${
            viewMode === 'table' ? 'bg-black text-white shadow-xs' : 'text-neutral-600 hover:text-black hover:bg-neutral-200'
          }`}
        >
          <List size={16} />
        </button>
        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-neutral-950 text-white text-[10px] font-sport font-black uppercase tracking-wider whitespace-nowrap shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50 rounded-none border border-neutral-800">
          Tampilan Tabel
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-neutral-950 rotate-45 border-t border-l border-neutral-800" />
        </div>
      </div>

      {/* Grid Mode Button */}
      <div className="relative group inline-flex">
        <button
          type="button"
          onClick={() => onChange('grid')}
          aria-label="Tampilan Grid Kartu"
          className={`w-8 h-8 rounded-none transition-colors cursor-pointer flex items-center justify-center ${
            viewMode === 'grid' ? 'bg-black text-white shadow-xs' : 'text-neutral-600 hover:text-black hover:bg-neutral-200'
          }`}
        >
          <LayoutGrid size={16} />
        </button>
        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-neutral-950 text-white text-[10px] font-sport font-black uppercase tracking-wider whitespace-nowrap shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50 rounded-none border border-neutral-800">
          Tampilan Grid
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-neutral-950 rotate-45 border-t border-l border-neutral-800" />
        </div>
      </div>
    </div>
  );
}
