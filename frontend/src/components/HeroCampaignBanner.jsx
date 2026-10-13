import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatRupiah } from '../utils/formatters';

/**
 * HeroCampaignBanner — Carousel Slide Hero Berbasis Produk Storefront (Benchmark: adidas Editorial).
 * 
 * Menampilkan multi-slide carousel dari tabel hero banners yang dikonfigurasi admin.
 * Setiap slide mengombinasikan visual foto produk dengan tautan langsung ke pembelian / detail.
 */
export default function HeroCampaignBanner({
  content = {},
  products = [],
  onBuyNowClick = () => {},
  onExploreClick = () => {}
}) {
  if (content.hero_enabled === false) return null;

  // Bangun daftar slide aktif dari konten pengaturan
  const slides = useMemo(() => {
    const rawBanners = content.hero_banners;
    let list = [];

    if (Array.isArray(rawBanners) && rawBanners.length > 0) {
      list = rawBanners.filter((b) => b && b.active !== false);
    } else if (typeof rawBanners === 'string' && rawBanners.trim() !== '') {
      try {
        const parsed = JSON.parse(rawBanners);
        if (Array.isArray(parsed)) {
          list = parsed.filter((b) => b && b.active !== false);
        }
      } catch {
        list = [];
      }
    }

    // Fallback: jika belum ada slide banner baru di database, gunakan banner default
    if (list.length === 0) {
      return [{
        id: 'default-hero-slide',
        badge: content.hero_badge || 'AEROTECH™ PRO MATCHDAY SERIES',
        title: content.hero_title || 'BENTUK KECEPATAN TANPA BATAS',
        description: content.hero_subtitle || 'Rasakan performa tanding profesional dengan jersey ultra-ringan berteknologi ventilasi laser-cut mikro untuk suhu tubuh optimal sepanjang pertandingan.',
        price_badge: content.hero_price_badge || 'Mulai Rp 389.000',
        cta_primary: content.hero_cta_primary || 'BELI SEKARANG',
        cta_secondary: content.hero_cta_secondary || 'JELAJAHI',
        template_style: 'featured_gallery',
        image_urls: [
          content.hero_image_url || 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1600&q=80'
        ],
        product: null,
        product_id: null
      }];
    }

    // Enrich dengan data produk dari prop products jika belum ada relasi product di banner
    return list.map((b) => {
      let prod = b.product;
      if (!prod && b.product_id && Array.isArray(products)) {
        prod = products.find((p) => String(p.id) === String(b.product_id)) || null;
      }
      return {
        ...b,
        product: prod
      };
    });
  }, [content, products]);

  const [currentIdx, setCurrentIdx] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const totalSlides = slides.length;

  // Pastikan currentIdx selalu dalam rentang yang valid bila slides berubah
  useEffect(() => {
    if (currentIdx >= totalSlides) {
      setCurrentIdx(0);
    }
  }, [totalSlides, currentIdx]);

  // Otomatis berganti slide setiap 6 detik bila lebih dari 1 slide dan tidak di-hover
  useEffect(() => {
    if (totalSlides <= 1 || isHovered) return undefined;
    const interval = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % totalSlides);
    }, 6000);
    return () => clearInterval(interval);
  }, [totalSlides, isHovered]);

  const currentSlide = slides[currentIdx] || slides[0];

  const handlePrev = () => {
    setCurrentIdx((prev) => (prev === 0 ? totalSlides - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIdx((prev) => (prev + 1) % totalSlides);
  };

  if (!currentSlide) return null;

  // Persiapkan gambar-gambar produk untuk template kombinasi
  const rawImages = currentSlide.image_urls || [];
  const slideImages = Array.isArray(rawImages) && rawImages.length > 0
    ? rawImages
    : (currentSlide.product?.image_url 
        ? [currentSlide.product.image_url] 
        : ['https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1600&q=80']);

  const primaryImage = slideImages[0];
  const galleryImages = slideImages.slice(1, 4);

  const badgeText = currentSlide.badge || 'EDISI RESMI TUSKO';
  const titleText = currentSlide.title || 'PERFORMA TANPA BATAS';
  const descText = currentSlide.description || '';
  const priceBadgeText = currentSlide.price_badge || (currentSlide.product?.price ? `Mulai ${formatRupiah(currentSlide.product.price)}` : 'Mulai Rp 389.000');
  const ctaPrimary = currentSlide.cta_primary || 'BELI SEKARANG';
  const ctaSecondary = currentSlide.cta_secondary || 'JELAJAHI';
  const templateStyle = currentSlide.template_style || 'featured_gallery';

  return (
    <section 
      className="bg-black text-white overflow-hidden border-b border-neutral-800 w-full relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-label="Hero Carousel Banner"
    >
      <div className="w-full flex flex-col md:grid md:grid-cols-2 items-stretch min-h-[460px] lg:min-h-[580px]">

        {/* 1. Sisi Kiri: Editorial Text */}
        <div className="p-6 sm:p-10 lg:p-16 xl:p-20 2xl:p-24 order-2 md:order-1 w-full flex flex-col justify-center relative z-10">
          
          <div className="animate-in fade-in duration-300">
            <span className="inline-block bg-white text-black text-[10px] sm:text-xs font-black uppercase tracking-widest px-3 py-1 mb-3 sm:mb-5 w-fit rounded-none font-sport">
              {badgeText}
            </span>

            <h1 className="font-sport font-black text-2xl sm:text-4xl lg:text-5xl xl:text-6xl uppercase italic tracking-tight leading-none mb-4">
              {titleText}
            </h1>

            {descText && (
              <p className="text-neutral-300 text-xs sm:text-sm lg:text-base leading-relaxed mb-6 max-w-xl">
                {descText}
              </p>
            )}

            <div className="flex flex-wrap gap-3 pt-1">
              <button
                type="button"
                onClick={() => onBuyNowClick(currentSlide.product || currentSlide.product_id)}
                className="flex-1 sm:flex-none bg-white text-black hover:bg-neutral-200 font-sport font-black text-xs sm:text-sm uppercase tracking-wider py-3.5 px-7 text-center flex items-center justify-center gap-2 transition-colors cursor-pointer rounded-none shadow-xs"
              >
                <span>{ctaPrimary}</span>
                <ArrowRight size={16} />
              </button>

              <button
                type="button"
                onClick={() => onExploreClick(currentSlide.product || currentSlide.product_id)}
                className="flex-1 sm:flex-none border border-white text-white hover:bg-white/10 font-sport font-black text-xs sm:text-sm uppercase tracking-wider py-3.5 px-7 text-center transition-colors cursor-pointer rounded-none"
              >
                {ctaSecondary}
              </button>
            </div>
          </div>

        </div>

        {/* 2. Sisi Kanan: Visual Template Kombinasi Gambar Produk */}
        <div className="w-full h-72 sm:h-96 md:h-full min-h-[280px] md:min-h-[460px] relative order-1 md:order-2 overflow-hidden bg-neutral-950">
          
          {templateStyle === 'featured_gallery' ? (
            /* Gaya 1: Foto Utama Besar + Aksentuasi Mini Galeri */
            <div className="w-full h-full relative">
              <img
                src={primaryImage}
                alt={titleText}
                className="w-full h-full object-cover object-center animate-in fade-in duration-500"
              />
              {galleryImages.length > 0 && (
                <div className="absolute bottom-4 left-4 hidden sm:flex items-center gap-2 bg-black/75 backdrop-blur-xs p-2 border border-neutral-700 rounded-none z-10">
                  {galleryImages.map((imgUrl, i) => (
                    <div key={i} className="w-12 h-12 lg:w-14 lg:h-14 overflow-hidden border border-neutral-600 rounded-none">
                      <img src={imgUrl} alt={`Angle ${i + 1}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : templateStyle === 'grid_showcase' ? (
            /* Gaya 2: Grid Multi-Angle Bersanding */
            <div className="w-full h-full grid grid-cols-2 gap-1 p-1 bg-black">
              <div className="relative h-full overflow-hidden">
                <img src={primaryImage} alt={titleText} className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-col gap-1 h-full overflow-hidden">
                <div className="flex-1 overflow-hidden">
                  <img src={slideImages[1] || primaryImage} alt="Detail Produk" className="w-full h-full object-cover" />
                </div>
                {slideImages[2] && (
                  <div className="flex-1 overflow-hidden">
                    <img src={slideImages[2]} alt="Sudut Lain" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Gaya 3: Full Cover Editorial */
            <div className="w-full h-full relative">
              <img
                src={primaryImage}
                alt={titleText}
                className="w-full h-full object-cover object-center animate-in fade-in duration-500"
              />
            </div>
          )}

          {/* Badge Harga / Official Edition */}
          <div className="absolute bottom-4 right-4 bg-black/85 backdrop-blur-sm border border-neutral-700 px-3.5 py-2 text-white rounded-none z-10">
            <div className="text-[9px] sm:text-[10px] font-bold text-amber-400 uppercase tracking-widest">
              {currentSlide.product?.name ? 'Official Product Edition' : 'Official Matchday Edition'}
            </div>
            <div className="font-sport font-black text-xs sm:text-sm uppercase">
              {priceBadgeText}
            </div>
          </div>

        </div>

      </div>

      {/* 3. Kontrol Navigasi Carousel (Hanya Muncul Bila Slide > 1) */}
      {totalSlides > 1 && (
        <>
          {/* Tombol Panah Prev */}
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Slide Sebelumnya"
            className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/60 hover:bg-black border border-neutral-700 text-white flex items-center justify-center transition-colors cursor-pointer rounded-none z-20 opacity-0 group-hover:opacity-100 focus:opacity-100"
          >
            <ChevronLeft size={20} />
          </button>

          {/* Tombol Panah Next */}
          <button
            type="button"
            onClick={handleNext}
            aria-label="Slide Selanjutnya"
            className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/60 hover:bg-black border border-neutral-700 text-white flex items-center justify-center transition-colors cursor-pointer rounded-none z-20 opacity-0 group-hover:opacity-100 focus:opacity-100"
          >
            <ChevronRight size={20} />
          </button>

          {/* Indikator Bar & Nomor Slide di Bawah Tengah */}
          <div className="absolute bottom-3 left-1/2 -translate-y-0 -translate-x-1/2 flex items-center gap-2 bg-black/80 backdrop-blur-xs px-3.5 py-1.5 border border-neutral-800 rounded-none z-20">
            <span className="text-[10px] font-mono font-bold text-neutral-400">
              0{currentIdx + 1} / 0{totalSlides}
            </span>
            <div className="flex items-center gap-1.5 ml-1">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentIdx(idx)}
                  className={`h-1.5 transition-all rounded-none cursor-pointer ${
                    idx === currentIdx
                      ? 'w-6 bg-amber-400'
                      : 'w-2 bg-neutral-600 hover:bg-neutral-400'
                  }`}
                  aria-label={`Buka slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        </>
      )}

    </section>
  );
}
