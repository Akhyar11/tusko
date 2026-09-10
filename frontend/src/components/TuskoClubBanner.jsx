import React from 'react';
import { ArrowRight } from 'lucide-react';

export default function TuskoClubBanner({ onJoinClick = () => {} }) {
  return (
    <section className="w-full px-4 sm:px-8 lg:px-12 py-8 sm:py-14">
      <div className="bg-black text-white p-6 sm:p-10 border border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-5 rounded-none">
        <div className="flex items-center gap-3.5">
          <div className="w-10 sm:w-14 h-10 sm:h-14 bg-amber-500 text-black flex items-center justify-center font-sport font-black text-xl sm:text-2xl flex-shrink-0 -skew-x-6 rounded-none">
            ★
          </div>
          <div>
            <span className="text-[9px] sm:text-[10px] font-bold text-amber-400 uppercase tracking-widest block">
              PROGRAM LOYALITAS RESMI
            </span>
            <h3 className="font-sport font-black text-base sm:text-xl uppercase tracking-tight text-white leading-tight mt-0.5">
              GABUNG TUSKO CLUB. DISKON 15% &amp; POIN SEUMUR HIDUP.
            </h3>
            <p className="text-[11px] sm:text-xs text-neutral-400 mt-1">
              Dapatkan akses rilis sepatu edisi terbatas &amp; gratis ongkir tanpa syarat.
            </p>
          </div>
        </div>
        <button 
          type="button"
          onClick={onJoinClick}
          className="w-full sm:w-auto bg-white text-black hover:bg-neutral-200 font-sport font-bold text-xs uppercase tracking-wider px-6 py-3.5 transition-colors flex-shrink-0 flex items-center justify-center gap-1.5 cursor-pointer rounded-none"
        >
          <span>DAFTAR MEMBER GRATIS</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </section>
  );
}
