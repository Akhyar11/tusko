import React from 'react';
import { ArrowRight } from 'lucide-react';

/**
 * T43.5 — Club banner dinamis (storefront content).
 */
export default function TuskoClubBanner({ content = {}, onJoinClick = () => {} }) {
  if (content.club_enabled === false) return null;

  const badge = content.club_badge || 'PROGRAM LOYALITAS RESMI';
  const title = content.club_title || 'GABUNG TUSKO CLUB. DISKON 15% & POIN SEUMUR HIDUP.';
  const subtitle = content.club_subtitle || 'Dapatkan akses rilis sepatu edisi terbatas & gratis ongkir tanpa syarat.';
  const cta = content.club_cta || 'DAFTAR MEMBER GRATIS';

  return (
    <section className="w-full px-4 sm:px-8 lg:px-12 py-8 sm:py-14">
      <div className="bg-black text-white p-6 sm:p-10 border border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-5 rounded-none">
        <div className="flex items-center gap-3.5">
          <div className="w-10 sm:w-14 h-10 sm:h-14 bg-amber-500 text-black flex items-center justify-center font-sport font-black text-xl sm:text-2xl flex-shrink-0 -skew-x-6 rounded-none">
            ★
          </div>
          <div>
            <span className="text-[9px] sm:text-[10px] font-bold text-amber-400 uppercase tracking-widest block">
              {badge}
            </span>
            <h3 className="font-sport font-black text-base sm:text-xl uppercase tracking-tight text-white leading-tight mt-0.5">
              {title}
            </h3>
            <p className="text-[11px] sm:text-xs text-neutral-400 mt-1">
              {subtitle}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onJoinClick}
          className="w-full sm:w-auto bg-white text-black hover:bg-neutral-200 font-sport font-bold text-xs uppercase tracking-wider px-6 py-3.5 transition-colors flex-shrink-0 flex items-center justify-center gap-1.5 cursor-pointer rounded-none"
        >
          <span>{cta}</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </section>
  );
}
