import React from 'react';

/**
 * T43.5 — Kartu olahraga dinamis (storefront content). Fallback default bila kosong.
 */
const DEFAULT_SPORTS = [
  { id: 'football', tag: 'Matchday', title: 'SEPAK BOLA', action: 'Beli Gear', image_url: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=600&q=80', category_id: 6, query: 'Sepakbola' },
  { id: 'running', tag: 'Road & Track', title: 'SEPATU LARI', action: 'Jelajahi', image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80', category_id: 5, query: 'Running' },
  { id: 'training', tag: 'Workout', title: 'TRAINING & GYM', action: 'Koleksi', image_url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=600&q=80', category_id: 7, query: 'Training' },
  { id: 'accessories', tag: 'Equipment', title: 'AKSESORIS', action: 'Beli Gear', image_url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80', category_id: 4, query: 'Aksesoris' },
];

export default function SportCategoriesSection({
  content = {},
  onSelectSport = () => {},
  onViewAll = () => {}
}) {
  if (content.sports_enabled === false) return null;

  const heading = content.sports_heading || 'PILIH BERDASARKAN OLAHRAGA';
  const subheading = content.sports_subheading || 'Perlengkapan teknis dirancang khusus untuk cabang olahraga favoritmu';
  const sports = Array.isArray(content.sports_cards) && content.sports_cards.length > 0
    ? content.sports_cards
    : DEFAULT_SPORTS;

  return (
    <section id="sport-categories" className="py-8 sm:py-14 px-4 sm:px-8 lg:px-12 w-full">
      <div className="flex items-end justify-between mb-4 sm:mb-6">
        <div>
          <h2 className="font-sport font-black text-xl sm:text-3xl uppercase italic tracking-tight">
            {heading}
          </h2>
          <p className="text-xs sm:text-sm text-neutral-500 font-medium mt-0.5">
            {subheading}
          </p>
        </div>
        <button
          type="button"
          onClick={onViewAll}
          className="text-xs font-bold uppercase tracking-wider text-black underline hover:text-neutral-600 flex-shrink-0 hidden sm:inline cursor-pointer"
        >
          Lihat Semua &rarr;
        </button>
      </div>

      <div className="flex sm:grid sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 overflow-x-auto no-scrollbar snap-x pb-2">
        {sports.map((sport, idx) => (
          <div
            key={sport.id || idx}
            onClick={() => onSelectSport(sport)}
            className="min-w-[155px] w-[42vw] sm:w-auto snap-start flex-shrink-0 sm:flex-shrink group relative aspect-[3/4] overflow-hidden bg-neutral-900 border border-neutral-200 cursor-pointer select-none"
          >
            <img
              src={sport.image_url || sport.image}
              alt={sport.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex flex-col justify-end p-3 sm:p-4">
              <span className="text-[9px] font-bold uppercase text-amber-400">
                {sport.tag}
              </span>
              <h3 className="font-sport font-black text-sm sm:text-base uppercase text-white leading-tight mt-0.5">
                {sport.title}
              </h3>
              <span className="text-[10px] font-bold text-neutral-300 underline uppercase mt-1 group-hover:text-white flex items-center gap-1">
                <span>{sport.action}</span>
                <span>&rarr;</span>
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
