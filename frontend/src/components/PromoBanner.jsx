import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Zap, Trophy, ShieldCheck } from 'lucide-react';

export default function PromoBanner() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const banners = [
    {
      id: 1,
      tag: 'NEW RELEASE 2026',
      title: 'TUSKO PRO MATCHDAY JERSEY',
      subtitle: 'Dirancang dengan teknologi sirkulasi AeroTech™ & ultra-lightweight jacquard untuk performa maksimal atlet di lapangan.',
      bgGradient: 'from-zinc-900 via-neutral-900 to-amber-950',
      badgeColor: 'bg-amber-400 text-neutral-950 font-black',
      icon: Zap,
      actionText: 'Lihat Koleksi Jersey',
    },
    {
      id: 2,
      tag: 'MARATHON READY',
      title: 'HYPERPACE CARBON RACER',
      subtitle: 'Energy return 88% dengan busa PEBA NitroFoam™ & Full-length Curved Carbon Plate untuk memecahkan rekor personal Anda.',
      bgGradient: 'from-blue-950 via-slate-900 to-neutral-900',
      badgeColor: 'bg-sky-400 text-neutral-950 font-black',
      icon: Trophy,
      actionText: 'Jelajahi Sepatu Lari',
    },
    {
      id: 3,
      tag: 'TUSKO GUARANTEE',
      title: '100% ORIGINAL & BEBAS ONGKIR',
      subtitle: 'Semua produk bergaransi resmi. Pengiriman cepat ke seluruh pelosok Indonesia dengan proteksi asuransi pengiriman.',
      bgGradient: 'from-emerald-950 via-neutral-900 to-zinc-900',
      badgeColor: 'bg-emerald-400 text-neutral-950 font-black',
      icon: ShieldCheck,
      actionText: 'Cek Penawaran Spesial',
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  return (
    <div className="relative w-full overflow-hidden rounded-2xl shadow-md my-4 bg-neutral-950 border border-neutral-800">
      <div 
        className="flex transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {banners.map((banner) => {
          const IconTag = banner.icon;
          return (
            <div
              key={banner.id}
              className={`min-w-full h-52 sm:h-64 md:h-72 bg-gradient-to-r ${banner.bgGradient} p-6 sm:p-10 flex flex-col justify-center text-white relative`}
            >
              <div className="max-w-xl z-10">
                <span className={`inline-flex items-center gap-1.5 text-[11px] font-black px-3 py-1 rounded-full uppercase tracking-wider mb-2.5 ${banner.badgeColor}`}>
                  <IconTag size={13} className="fill-current" />
                  {banner.tag}
                </span>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight leading-none uppercase italic">
                  {banner.title}
                </h2>
                <p className="text-xs sm:text-sm text-neutral-300 mt-3 line-clamp-2 max-w-lg leading-relaxed font-medium">
                  {banner.subtitle}
                </p>
                <button className="mt-5 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs sm:text-sm font-extrabold uppercase tracking-wide rounded-xl shadow-md w-fit transition-all active:scale-95 cursor-pointer">
                  {banner.actionText}
                </button>
              </div>

              {/* Athletic decorative stripes */}
              <div className="absolute right-6 top-1/2 -translate-y-1/2 hidden md:flex items-center gap-3 opacity-15 pointer-events-none transform -skew-x-12">
                <div className="w-10 h-72 bg-white"></div>
                <div className="w-10 h-72 bg-white"></div>
                <div className="w-10 h-72 bg-white"></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Nav buttons */}
      <button
        onClick={() => setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length)}
        className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-neutral-900/80 hover:bg-neutral-900 text-white flex items-center justify-center shadow-lg backdrop-blur-xs border border-neutral-700 transition-opacity cursor-pointer z-20"
        aria-label="Previous slide"
      >
        <ChevronLeft size={20} />
      </button>
      <button
        onClick={() => setCurrentSlide((prev) => (prev + 1) % banners.length)}
        className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-neutral-900/80 hover:bg-neutral-900 text-white flex items-center justify-center shadow-lg backdrop-blur-xs border border-neutral-700 transition-opacity cursor-pointer z-20"
        aria-label="Next slide"
      >
        <ChevronRight size={20} />
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-3.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20">
        {banners.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentSlide(idx)}
            className={`h-2 rounded-full transition-all cursor-pointer ${
              currentSlide === idx ? 'w-7 bg-amber-400' : 'w-2 bg-neutral-600 hover:bg-neutral-400'
            }`}
            aria-label={`Slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
