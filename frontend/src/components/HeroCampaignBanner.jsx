import React from 'react';
import { ArrowRight } from 'lucide-react';

export default function HeroCampaignBanner({
  onBuyNowClick = () => {},
  onExploreClick = () => {}
}) {
  return (
    <section className="bg-black text-white overflow-hidden border-b border-neutral-800">
      <div className="max-w-7xl mx-auto flex flex-col md:grid md:grid-cols-2 items-center">
        
        {/* Hero Visual (Dynamic action photo) */}
        <div className="w-full h-56 sm:h-80 md:h-full min-h-[220px] md:min-h-[460px] relative order-1 md:order-2">
          <img 
            src="https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1200&q=80" 
            alt="Tusko Pro Matchday Sprinter & Athlete" 
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute bottom-3 right-3 bg-black/85 backdrop-blur-sm border border-neutral-700 px-3 py-1.5 text-white">
            <div className="text-[8px] sm:text-[9px] font-bold text-amber-400 uppercase tracking-widest">
              Official Matchday Edition
            </div>
            <div className="font-sport font-black text-[11px] sm:text-xs uppercase">
              Mulai Rp 389.000
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-10 lg:p-14 order-2 md:order-1 w-full">
          <span className="inline-block bg-white text-black text-[9px] sm:text-xs font-black uppercase tracking-widest px-2.5 py-1 mb-3 sm:mb-4">
            AEROTECH™ PRO MATCHDAY SERIES
          </span>
          <h1 className="font-sport font-black text-2xl sm:text-4xl lg:text-5xl uppercase italic tracking-tight leading-tight mb-3">
            BENTUK KECEPATAN TANPA BATAS
          </h1>
          <p className="text-neutral-300 text-xs sm:text-sm leading-relaxed mb-5 max-w-lg">
            Rasakan performa tanding profesional dengan jersey ultra-ringan 140 gram berteknologi ventilasi laser-cut mikro untuk suhu tubuh optimal sepanjang pertandingan.
          </p>
          <div className="flex gap-3">
            <button 
              type="button"
              onClick={onBuyNowClick}
              className="flex-1 sm:flex-none bg-white text-black hover:bg-neutral-200 font-sport font-black text-xs uppercase tracking-wider py-3 px-5 text-center flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <span>BELI SEKARANG</span>
              <ArrowRight size={14} />
            </button>
            <button 
              type="button"
              onClick={onExploreClick}
              className="flex-1 sm:flex-none border border-white text-white hover:bg-white/10 font-sport font-black text-xs uppercase tracking-wider py-3 px-5 text-center transition-colors cursor-pointer"
            >
              JELAJAHI
            </button>
          </div>
        </div>

      </div>
    </section>
  );
}
