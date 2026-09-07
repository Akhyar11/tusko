import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Sparkles, Zap, ShieldCheck } from 'lucide-react';

export default function PromoBanner() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const banners = [
    {
      id: 1,
      tag: 'SUPER SALE 9.9',
      title: 'Diskon Spesial Gadget & Aksesoris',
      subtitle: 'Hemat hingga 50% + Cashback Kilat s.d Rp 500rb',
      bgGradient: 'from-emerald-600 to-teal-800',
      badgeColor: 'bg-amber-400 text-amber-950',
      actionText: 'Serbu Sekarang',
    },
    {
      id: 2,
      tag: 'BEBAS ONGKIR',
      title: 'Kirim Belanjaan ke Seluruh Nusantara',
      subtitle: 'Belanja apa saja tanpa khawatir ongkir bersama partner ekspedisi terpercaya',
      bgGradient: 'from-blue-600 to-indigo-800',
      badgeColor: 'bg-emerald-400 text-emerald-950',
      actionText: 'Cek Syarat & Ketentuan',
    },
    {
      id: 3,
      tag: 'OFFICIAL STORE',
      title: 'Produk 100% Original & Bergaransi',
      subtitle: 'Jaminan uang kembali jika barang terbukti tidak asli',
      bgGradient: 'from-purple-600 to-slate-900',
      badgeColor: 'bg-rose-400 text-rose-950',
      actionText: 'Lihat Brand Resmi',
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  return (
    <div className="relative w-full overflow-hidden rounded-2xl shadow-sm my-4 bg-gray-900">
      <div 
        className="flex transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {banners.map((banner) => (
          <div
            key={banner.id}
            className={`min-w-full h-44 sm:h-56 md:h-64 bg-linear-to-r ${banner.bgGradient} p-6 sm:p-10 flex flex-col justify-center text-white relative`}
          >
            <div className="max-w-xl z-10">
              <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider mb-2.5 ${banner.badgeColor}`}>
                <Zap size={12} className="fill-current" />
                {banner.tag}
              </span>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight leading-tight">
                {banner.title}
              </h2>
              <p className="text-xs sm:text-sm text-gray-100 mt-2 line-clamp-2">
                {banner.subtitle}
              </p>
              <button className="mt-4 px-4 py-2 bg-white text-gray-900 hover:bg-gray-100 text-xs sm:text-sm font-semibold rounded-lg shadow-sm w-fit transition-transform active:scale-95 cursor-pointer">
                {banner.actionText}
              </button>
            </div>

            {/* Decorative circles */}
            <div className="absolute right-6 top-1/2 -translate-y-1/2 hidden md:flex items-center justify-center opacity-20 pointer-events-none">
              <div className="w-56 h-56 rounded-full border-8 border-white"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Nav buttons */}
      <button
        onClick={() => setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length)}
        className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 hover:bg-white text-gray-800 flex items-center justify-center shadow-md backdrop-blur-xs transition-opacity cursor-pointer"
        aria-label="Previous slide"
      >
        <ChevronLeft size={18} />
      </button>
      <button
        onClick={() => setCurrentSlide((prev) => (prev + 1) % banners.length)}
        className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 hover:bg-white text-gray-800 flex items-center justify-center shadow-md backdrop-blur-xs transition-opacity cursor-pointer"
        aria-label="Next slide"
      >
        <ChevronRight size={18} />
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
        {banners.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentSlide(idx)}
            className={`h-1.5 rounded-full transition-all cursor-pointer ${
              currentSlide === idx ? 'w-6 bg-white' : 'w-1.5 bg-white/50'
            }`}
            aria-label={`Slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
