import React from 'react';
import { TrendingUp } from 'lucide-react';

/**
 * T43.5 — Chips populer dinamis (storefront content). Fallback default bila kosong.
 */
const DEFAULT_CHIPS = [
  { label: 'Jersey Timnas AeroTech', query: 'Jersey Matchday' },
  { label: 'Sepatu Ultimashow FX3632', query: 'Ultimashow' },
  { label: 'Sepatu Pelat Karbon', query: 'Carbon' },
  { label: 'Celana Kompresi 2-in-1', query: 'Celana' },
  { label: 'Tas Duffle 45L', query: 'Duffle' },
];

export default function PopularChipsBar({ content = {}, onSelectChip = () => {} }) {
  if (content.popular_enabled === false) return null;

  const heading = content.popular_heading || 'POPULER:';
  const chips = Array.isArray(content.popular_chips) && content.popular_chips.length > 0
    ? content.popular_chips
    : DEFAULT_CHIPS;

  return (
    <section className="bg-neutral-100 border-b border-neutral-200 py-3 px-4 sm:px-8 lg:px-12 w-full">
      <div className="w-full flex items-center gap-2.5 overflow-x-auto no-scrollbar">
        <span className="text-[10px] sm:text-xs font-black uppercase text-neutral-500 whitespace-nowrap flex-shrink-0 flex items-center gap-1">
          <TrendingUp size={14} className="text-amber-500 shrink-0" />
          <span>{heading}</span>
        </span>
        {chips.map((item, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onSelectChip(item.query)}
            className="whitespace-nowrap bg-white hover:bg-black hover:text-white border border-neutral-300 text-[11px] font-bold uppercase px-3.5 py-1.5 transition-colors shadow-2xs flex-shrink-0 cursor-pointer rounded-none"
          >
            {item.label}
          </button>
        ))}
      </div>
    </section>
  );
}
