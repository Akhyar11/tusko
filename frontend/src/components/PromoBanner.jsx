import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * T43.5 — Carousel promo dinamis (storefront content).
 * Hanya tampil bila admin mengaktifkan `storefront.promo_enabled` dan mengisi banner.
 */
const DEFAULT_BANNERS = [
  {
    tag: 'PROMO',
    title: 'PENAWARAN SPESIAL',
    subtitle: 'Atur banner promo dari Pengaturan Sistem → Storefront.',
    action: 'Lihat Koleksi',
    image_url: '',
  },
];

export default function PromoBanner({ content = {}, onActionClick = () => {} }) {
  const enabled = content.promo_enabled === true;
  const banners = (Array.isArray(content.promo_banners) && content.promo_banners.length > 0)
    ? content.promo_banners
    : DEFAULT_BANNERS;
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (!enabled || banners.length <= 1) return undefined;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [enabled, banners.length]);

  if (!enabled) return null;

  return (
    <div className="relative w-full overflow-hidden rounded-none shadow-md my-4 bg-neutral-950 border border-neutral-800">
      <div
        className="flex transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {banners.map((banner, idx) => (
          <div
            key={idx}
            className="min-w-full h-52 sm:h-64 md:h-72 bg-gradient-to-r from-zinc-900 via-neutral-900 to-amber-950 p-6 sm:p-10 flex flex-col justify-center text-white relative"
          >
            {banner.image_url && (
              <img src={banner.image_url} alt={banner.title || 'Promo'} className="absolute inset-0 w-full h-full object-cover opacity-30" />
            )}
            <div className="max-w-xl z-10">
              {banner.tag && (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-black px-3 py-1 rounded-none uppercase tracking-wider mb-2.5 bg-amber-400 text-neutral-950">
                  {banner.tag}
                </span>
              )}
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight leading-none uppercase italic">
                {banner.title}
              </h2>
              {banner.subtitle && (
                <p className="text-xs sm:text-sm text-neutral-300 mt-3 line-clamp-2 max-w-lg leading-relaxed font-medium">
                  {banner.subtitle}
                </p>
              )}
              {banner.action && (
                <button
                  type="button"
                  onClick={() => onActionClick(banner)}
                  className="mt-5 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs sm:text-sm font-extrabold uppercase tracking-wide rounded-none shadow-md w-fit transition-all active:scale-95 cursor-pointer"
                >
                  {banner.action}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {banners.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length)}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-none bg-neutral-900/80 hover:bg-neutral-900 text-white flex items-center justify-center shadow-lg border border-neutral-700 cursor-pointer z-20"
            aria-label="Previous slide"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            type="button"
            onClick={() => setCurrentSlide((prev) => (prev + 1) % banners.length)}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-none bg-neutral-900/80 hover:bg-neutral-900 text-white flex items-center justify-center shadow-lg border border-neutral-700 cursor-pointer z-20"
            aria-label="Next slide"
          >
            <ChevronRight size={20} />
          </button>
          <div className="absolute bottom-3.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20">
            {banners.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentSlide(idx)}
                className={`h-2 rounded-none transition-all cursor-pointer ${currentSlide === idx ? 'w-7 bg-amber-400' : 'w-2 bg-neutral-600 hover:bg-neutral-400'}`}
                aria-label={`Slide ${idx + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
