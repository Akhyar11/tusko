import React from 'react';
import { ArrowRight } from 'lucide-react';

/**
 * T43.5 — Hero dinamis dari Settings Hub (grup `storefront`).
 * Fallback default dipakai bila admin belum mengisi.
 */
export default function HeroCampaignBanner({
  content = {},
  onBuyNowClick = () => {},
  onExploreClick = () => {}
}) {
  if (content.hero_enabled === false) return null;

  const badge = content.hero_badge || 'AEROTECH™ PRO MATCHDAY SERIES';
  const title = content.hero_title || 'BENTUK KECEPATAN TANPA BATAS';
  const subtitle = content.hero_subtitle
    || 'Rasakan performa tanding profesional dengan jersey ultra-ringan berteknologi ventilasi laser-cut mikro untuk suhu tubuh optimal sepanjang pertandingan.';
  const ctaPrimary = content.hero_cta_primary || 'BELI SEKARANG';
  const ctaSecondary = content.hero_cta_secondary || 'JELAJAHI';
  const priceBadge = content.hero_price_badge || 'Mulai Rp 389.000';
  const image = content.hero_image_url
    || 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1600&q=80';

  return (
    <section className="bg-black text-white overflow-hidden border-b border-neutral-800 w-full">
      <div className="w-full flex flex-col md:grid md:grid-cols-2 items-stretch min-h-[440px] lg:min-h-[560px]">

        {/* Content (Editorial text on Left) */}
        <div className="p-6 sm:p-10 lg:p-16 xl:p-20 2xl:p-24 order-2 md:order-1 w-full flex flex-col justify-center">
          <span className="inline-block bg-white text-black text-[10px] sm:text-xs font-black uppercase tracking-widest px-3 py-1 mb-3 sm:mb-5 w-fit rounded-none">
            {badge}
          </span>
          <h1 className="font-sport font-black text-2xl sm:text-4xl lg:text-5xl xl:text-6xl uppercase italic tracking-tight leading-none mb-4">
            {title}
          </h1>
          <p className="text-neutral-300 text-xs sm:text-sm lg:text-base leading-relaxed mb-6 max-w-xl">
            {subtitle}
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onBuyNowClick}
              className="flex-1 sm:flex-none bg-white text-black hover:bg-neutral-200 font-sport font-black text-xs sm:text-sm uppercase tracking-wider py-3.5 px-7 text-center flex items-center justify-center gap-2 transition-colors cursor-pointer rounded-none"
            >
              <span>{ctaPrimary}</span>
              <ArrowRight size={16} />
            </button>
            <button
              type="button"
              onClick={onExploreClick}
              className="flex-1 sm:flex-none border border-white text-white hover:bg-white/10 font-sport font-black text-xs sm:text-sm uppercase tracking-wider py-3.5 px-7 text-center transition-colors cursor-pointer rounded-none"
            >
              {ctaSecondary}
            </button>
          </div>
        </div>

        {/* Hero Visual */}
        <div className="w-full h-64 sm:h-96 md:h-full min-h-[280px] md:min-h-[460px] relative order-1 md:order-2 overflow-hidden">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute bottom-4 right-4 bg-black/85 backdrop-blur-sm border border-neutral-700 px-3.5 py-2 text-white rounded-none">
            <div className="text-[9px] sm:text-[10px] font-bold text-amber-400 uppercase tracking-widest">
              Official Matchday Edition
            </div>
            <div className="font-sport font-black text-xs sm:text-sm uppercase">
              {priceBadge}
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
