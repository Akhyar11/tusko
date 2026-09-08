import React, { useState, useMemo } from 'react';
import { 
  Star, 
  Truck, 
  RotateCcw, 
  Heart, 
  Share2, 
  Check, 
  Ruler, 
  ShoppingBag, 
  ArrowRight,
  Wind,
  Feather,
  Shield,
  Activity,
  Info,
  X,
  Maximize2,
  AlertCircle
} from 'lucide-react';
import { formatRupiah } from '../utils/formatters';

export default function ProductDetail({ 
  product, 
  onBack = () => {},
  onAddToCart = () => {},
  onBuyNow = () => {},
  onSelectCategory = () => {},
  onOpenRegister = () => {},
  onOpenCart = () => {}
}) {
  if (!product) return null;

  // Prepare full gallery of at least 4-6 images for rich Adidas PDP layout
  const displayImages = useMemo(() => {
    const original = product.gallery && product.gallery.length > 0 
      ? [...product.gallery] 
      : [product.image_url].filter(Boolean);

    // Complement with high-resolution angle shots if fewer than 6
    const fallbacks = [
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1575537302964-96cd47c06b1b?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&w=1200&q=80'
    ];

    const result = [...original];
    for (const fb of fallbacks) {
      if (result.length >= 6) break;
      if (!result.includes(fb)) {
        result.push(fb);
      }
    }
    return result;
  }, [product]);

  const photoAngleLabels = [
    '1/6 • Samping Luar (Lateral)',
    '2/6 • Samping Dalam (Medial)',
    '3/6 • Tampak Atas & Tali Mesh',
    '4/6 • Outsole & Heel Counter',
    '5/6 • Detail Midsole EVA',
    '6/6 • Penggunaan di Lintasan'
  ];

  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [isWishlist, setIsWishlist] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showSizeModal, setShowSizeModal] = useState(false);
  const [isZoomOpen, setIsZoomOpen] = useState(false);

  // Initialize selectedOptions with first in-stock variant or default
  const [selectedOptions, setSelectedOptions] = useState(() => {
    if (product.variants && product.variants.length > 0) {
      const inStock = product.variants.find((v) => (Number(v.stock) || 0) > 0) || product.variants[0];
      const initial = {};
      (product.variant_levels || []).forEach((lvl) => {
        if (inStock[lvl.code] !== undefined) {
          initial[lvl.code] = inStock[lvl.code];
        }
      });
      return initial;
    }
    return {};
  });

  // Selected variant matching all chosen options
  const selectedVariant = useMemo(() => {
    if (!product.variants || product.variants.length === 0) return null;
    return product.variants.find((v) => {
      return Object.entries(selectedOptions).every(([code, val]) => v[code] === val);
    }) || null;
  }, [product, selectedOptions]);

  // Current dynamic pricing and stock
  const basePrice = Number(product.price || 0);
  const currentPrice = selectedVariant ? Number(selectedVariant.price) : basePrice;
  const currentStock = selectedVariant ? Number(selectedVariant.stock ?? 0) : Number(product.stock ?? 0);
  const minStock = Number(product.stock_minimum ?? 5);
  const isOutOfStock = currentStock <= 0;
  const isLowStock = !isOutOfStock && currentStock <= minStock;

  const currentOriginalPrice = useMemo(() => {
    if (selectedVariant?.original_price) return Number(selectedVariant.original_price);
    if (product.original_price && product.price) {
      const diff = Number(product.original_price) - Number(product.price);
      return currentPrice + diff;
    }
    return currentPrice;
  }, [selectedVariant, currentPrice, product]);

  const currentDiscountPercentage = useMemo(() => {
    if (currentOriginalPrice > currentPrice) {
      return Math.round(((currentOriginalPrice - currentPrice) / currentOriginalPrice) * 100);
    }
    return 0;
  }, [currentOriginalPrice, currentPrice]);

  const loyaltyPointsEarned = Math.floor(currentPrice * 0.01);

  // Handle option selection
  const handleSelectOption = (code, val) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [code]: val
    }));
  };

  // Share link handler
  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  // Add to cart click
  const handleAddToCartClick = () => {
    if (isOutOfStock) return;

    const variantLabel = Object.values(selectedOptions).filter(Boolean).join(' / ');
    const itemPayload = {
      ...product,
      price: currentPrice,
      original_price: currentOriginalPrice,
      stock: currentStock,
      selected_variant: selectedVariant || null,
      variant_name: variantLabel || null,
      notes: notes.trim()
    };

    onAddToCart(itemPayload, quantity, notes.trim());
  };

  // Buy now click
  const handleBuyNowClick = () => {
    if (isOutOfStock) return;

    const variantLabel = Object.values(selectedOptions).filter(Boolean).join(' / ');
    const itemPayload = {
      ...product,
      price: currentPrice,
      original_price: currentOriginalPrice,
      stock: currentStock,
      selected_variant: selectedVariant || null,
      variant_name: variantLabel || null,
      notes: notes.trim()
    };

    onBuyNow(itemPayload, quantity, notes.trim());
  };

  // Helpers for size formatting and active table highlight
  const selectedSizeValue = selectedOptions['size'] || '';
  const selectedColorValue = selectedOptions['color'] || product.color || 'Core Black / Core Black / Cloud White';

  const formatSizeLabel = (sz) => {
    const map = {
      '39': 'UK 6 (39⅓)',
      '40': 'UK 6.5 (40)',
      '40.5': 'UK 7 (40⅔)',
      '41': 'UK 7.5 (41⅓)',
      '42': 'UK 8 (42)',
      '42.5': 'UK 8.5 (42⅔)',
      '43': 'UK 9 (43⅓)',
      '44': 'UK 9.5 (44)',
      '45': 'UK 10.5 (45⅓)'
    };
    return map[sz] || `UK ${sz}`;
  };

  // Size conversion guide table data
  const sizeConversionTable = [
    { uk: '6', eur: '39⅓', us: '6.5', cm: '24.5 cm', rawSize: '39' },
    { uk: '6.5', eur: '40', us: '7', cm: '25.0 cm', rawSize: '40' },
    { uk: '7', eur: '40⅔', us: '7.5', cm: '25.5 cm', rawSize: '40.5' },
    { uk: '7.5', eur: '41⅓', us: '8', cm: '26.0 cm', rawSize: '41' },
    { uk: '8', eur: '42', us: '8.5', cm: '26.5 cm', rawSize: '42' },
    { uk: '8.5', eur: '42⅔', us: '9', cm: '27.0 cm', rawSize: '42.5' },
    { uk: '9', eur: '43⅓', us: '9.5', cm: '27.5 cm', rawSize: '43' },
    { uk: '9.5', eur: '44', us: '10', cm: '28.0 cm', rawSize: '44' },
  ];

  // Check which variant levels we have
  const sizeLevel = (product.variant_levels || []).find((l) => l.code === 'size');
  const otherLevels = (product.variant_levels || []).filter((l) => l.code !== 'size');

  return (
    <div className="bg-white text-black antialiased selection:bg-black selection:text-white min-h-screen pb-24 sm:pb-12">
      
      {/* 3. Breadcrumb Bar */}
      <div className="bg-neutral-50 border-b border-neutral-200 px-4 sm:px-6 lg:px-8 py-2.5 text-[11px] font-bold uppercase tracking-wider text-neutral-500 w-full max-w-full overflow-hidden">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 overflow-x-auto no-scrollbar min-w-0">
          <div className="flex items-center gap-1.5 whitespace-nowrap min-w-0">
            <button 
              type="button" 
              onClick={onBack} 
              className="hover:text-black underline cursor-pointer shrink-0"
            >
              Beranda
            </button>
            <span className="shrink-0">/</span>
            <button 
              type="button" 
              onClick={() => {
                if (product.category_id) onSelectCategory(product.category_id);
                onBack();
              }} 
              className="hover:text-black cursor-pointer shrink-0"
            >
              {product.category_id === 1 ? 'Apparel' : 'Sepatu'}
            </button>
            <span className="shrink-0">/</span>
            <span className="text-black font-black truncate max-w-[130px] sm:max-w-none">{product.name}</span>
          </div>

          <button 
            type="button" 
            onClick={handleShare} 
            className="flex items-center gap-1 text-neutral-600 hover:text-black whitespace-nowrap flex-shrink-0 cursor-pointer"
          >
            {copiedLink ? <Check size={13} className="text-emerald-600" /> : <Share2 size={13} />}
            <span>{copiedLink ? 'Tersalin!' : 'Bagikan'}</span>
          </button>
        </div>
      </div>

      {/* 4. Main Product PDP Container (Responsive 12-Col Layout) */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* ================= LEFT: PRODUCT SHOWCASE GALLERY (7 Cols Desktop, Full-Width Mobile) ================= */}
          <div className="lg:col-span-7 space-y-3">
            
            {/* Mobile & Desktop Hero Showcase Image */}
            <div className="relative aspect-square sm:aspect-[4/3] bg-neutral-100 border border-neutral-200 overflow-hidden group">
              <img 
                src={displayImages[activePhotoIndex] || product.image_url} 
                alt={product.name} 
                className="w-full h-full object-cover object-center transition-all duration-300 group-hover:scale-105"
              />
              
              {/* Badges */}
              <span className="absolute top-3 left-3 bg-black text-white text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-2.5 py-1">
                OFFICIAL PRODUCT
              </span>
              <span className="absolute top-3 left-28 bg-amber-500 text-black text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-2 py-1">
                {product.badge || 'BEST SELLER'}
              </span>

              {/* Wishlist floating button */}
              <button 
                type="button"
                onClick={() => setIsWishlist(!isWishlist)}
                className="absolute top-3 right-3 w-9 h-9 bg-white/90 hover:bg-white rounded-full flex items-center justify-center text-neutral-800 hover:text-red-500 shadow-md transition-colors cursor-pointer"
                title={isWishlist ? 'Hapus dari Wishlist' : 'Tambah ke Wishlist'}
              >
                <Heart size={18} className={isWishlist ? 'fill-red-500 text-red-500' : ''} />
              </button>

              {/* Zoom Trigger Button */}
              <button
                type="button"
                onClick={() => setIsZoomOpen(true)}
                className="absolute bottom-3 right-3 p-2 bg-black/80 hover:bg-black text-white rounded-none backdrop-blur-xs transition-colors cursor-pointer"
                title="Perbesar Foto"
              >
                <Maximize2 size={15} />
              </button>

              {/* Photo angle indicator badge */}
              <div className="absolute bottom-3 left-3 bg-black/80 backdrop-blur text-white text-[10px] font-bold px-2.5 py-1 uppercase tracking-wider">
                {photoAngleLabels[activePhotoIndex] || `${activePhotoIndex + 1}/${displayImages.length} • Sudut Foto`}
              </div>
            </div>

            {/* Thumbnails Selector Row (Swipeable on Mobile, Grid on Desktop) */}
            <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar pb-1">
              {displayImages.map((img, idx) => (
                <button 
                  key={idx}
                  type="button"
                  onClick={() => setActivePhotoIndex(idx)}
                  className={`w-16 sm:w-20 aspect-square flex-shrink-0 border-2 overflow-hidden bg-neutral-100 cursor-pointer transition-all ${
                    activePhotoIndex === idx 
                      ? 'border-black' 
                      : 'border-transparent hover:border-neutral-400'
                  }`}
                >
                  <img src={img} className="w-full h-full object-cover" alt={`Thumb ${idx + 1}`} />
                </button>
              ))}
            </div>

            {/* Extra Desktop 2x2 Gallery Grid (Visible on Large Screens) */}
            {displayImages.length > 2 && (
              <div className="hidden sm:grid grid-cols-2 gap-3 pt-4">
                <div 
                  onClick={() => setActivePhotoIndex(1)}
                  className="aspect-square bg-neutral-100 border border-neutral-200 overflow-hidden cursor-pointer group"
                >
                  <img 
                    src={displayImages[1] || displayImages[0]} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                    alt="Detail 2" 
                  />
                </div>
                <div 
                  onClick={() => setActivePhotoIndex(2)}
                  className="aspect-square bg-neutral-100 border border-neutral-200 overflow-hidden cursor-pointer group"
                >
                  <img 
                    src={displayImages[2] || displayImages[0]} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                    alt="Detail 3" 
                  />
                </div>
              </div>
            )}

          </div>

          {/* ================= RIGHT: PRODUCT BUY BOX (5 Cols Desktop, Sticky) ================= */}
          <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-5">
            
            {/* Category, Rating & Title */}
            <div>
              <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-neutral-500 mb-1.5">
                <span>{product.category_id === 1 ? 'PRIA • APPAREL PRO' : 'PRIA • RUNNING PERFORMANCE'}</span>
                <div className="flex items-center gap-1 text-black font-bold">
                  <Star size={14} className="fill-amber-500 text-amber-500" />
                  <span>{product.rating || 4.8} ({product.rating_count || 128} Ulasan)</span>
                </div>
              </div>

              <h1 className="font-sport font-black text-2xl sm:text-4xl uppercase italic tracking-tight leading-none text-black">
                {product.name}
              </h1>
              
              <div className="text-xs font-bold text-neutral-600 mt-2">
                Warna: {selectedColorValue}
              </div>
              <div className="text-[11px] font-mono font-bold text-neutral-400 mt-0.5">
                KODE ARTIKEL: <span className="text-black font-extrabold">{selectedVariant?.sku || product.sku || 'FX3632'}</span>
              </div>
            </div>

            {/* Price Block */}
            <div className="py-3.5 border-y border-neutral-200 flex items-baseline justify-between">
              <div>
                <div className="flex items-baseline gap-2.5">
                  <span className="font-sport font-black text-2xl sm:text-3xl text-black">
                    {formatRupiah(currentPrice)}
                  </span>
                  {currentOriginalPrice > currentPrice && (
                    <>
                      <span className="text-xs sm:text-sm text-neutral-400 line-through font-bold">
                        {formatRupiah(currentOriginalPrice)}
                      </span>
                      <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5">
                        HEMAT {currentDiscountPercentage}%
                      </span>
                    </>
                  )}
                </div>
                <p className="text-[10px] text-neutral-500 font-medium mt-1">
                  Termasuk PPN. Bebas biaya pengiriman reguler.
                </p>
              </div>

              {isOutOfStock ? (
                <span className="text-[10px] font-bold text-red-700 bg-red-50 px-2 py-1 border border-red-200">
                  STOK HABIS
                </span>
              ) : isLowStock ? (
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-1 border border-amber-200">
                  SISA {currentStock} PCS
                </span>
              ) : (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 border border-emerald-200">
                  STOK TERSEDIA
                </span>
              )}
            </div>

            {/* Tusko Club Perks Badge */}
            <div className="bg-black text-white p-3.5 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 bg-amber-500 text-black flex items-center justify-center font-sport font-black text-sm flex-shrink-0 -skew-x-6">
                  ★
                </div>
                <div className="text-[11px] leading-tight">
                  Dapatkan <strong className="text-amber-400 font-black">{loyaltyPointsEarned.toLocaleString('id-ID')} Poin Member</strong> dari pembelian ini.
                </div>
              </div>
              <button 
                type="button"
                onClick={onOpenRegister}
                className="font-sport font-black text-[10px] uppercase text-white underline flex-shrink-0 cursor-pointer"
              >
                GABUNG &rarr;
              </button>
            </div>

            {/* Other Variant Levels (e.g. Color, Sleeve) */}
            {otherLevels.map((lvl) => (
              <div key={lvl.code}>
                <span className="font-sport font-black text-xs uppercase tracking-wider text-black block mb-2">
                  PILIH {lvl.name.toUpperCase()}:
                </span>
                <div className="flex flex-wrap gap-2 text-xs font-bold">
                  {lvl.options.map((opt) => {
                    const isSelected = selectedOptions[lvl.code] === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => handleSelectOption(lvl.code, opt)}
                        className={`py-2 px-3 border transition-colors cursor-pointer ${
                          isSelected
                            ? 'border-2 border-black bg-black text-white font-black'
                            : 'border-neutral-300 hover:border-black text-neutral-800'
                        }`}
                      >
                        {opt} {isSelected && '✓'}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Size Matrix Selector (Benchmark: Adidas PDP Grid) */}
            {sizeLevel ? (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-sport font-black text-xs uppercase tracking-wider text-black">
                    PILIH UKURAN:
                  </span>
                  <button 
                    type="button"
                    onClick={() => setShowSizeModal(true)} 
                    className="text-[11px] font-bold underline flex items-center gap-1 text-neutral-700 hover:text-black cursor-pointer"
                  >
                    <Ruler size={13} />
                    <span>Panduan Ukuran</span>
                  </button>
                </div>

                {/* Size Grid Boxes */}
                <div className="grid grid-cols-4 sm:grid-cols-3 gap-2 text-xs font-bold">
                  {sizeLevel.options.map((sz) => {
                    const isSelected = selectedOptions['size'] === sz;
                    
                    // Check stock for this specific size
                    let optionStock = 99;
                    if (product.variants && product.variants.length > 0) {
                      const match = product.variants.find((v) => {
                        return v.size === sz && Object.entries(selectedOptions).every(([c, val]) => c === 'size' || v[c] === val);
                      });
                      optionStock = match ? Number(match.stock ?? 0) : 0;
                    }

                    const optOutOfStock = optionStock <= 0;
                    const optLowStock = !optOutOfStock && optionStock <= 3;

                    if (optOutOfStock) {
                      return (
                        <button
                          key={sz}
                          type="button"
                          disabled
                          className="border border-neutral-200 bg-neutral-100 text-neutral-400 py-2.5 px-1 text-center cursor-not-allowed line-through"
                        >
                          {formatSizeLabel(sz)} (Habis)
                        </button>
                      );
                    }

                    if (isSelected) {
                      return (
                        <button
                          key={sz}
                          type="button"
                          className="border-2 border-black bg-black text-white py-2.5 px-1 text-center font-black transition-colors cursor-pointer"
                        >
                          {formatSizeLabel(sz)} ✓
                        </button>
                      );
                    }

                    return (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => handleSelectOption('size', sz)}
                        className="border border-neutral-300 hover:border-black py-2.5 px-1 text-center transition-colors cursor-pointer relative"
                      >
                        <span>{formatSizeLabel(sz)}</span>
                        {optLowStock && (
                          <span className="block text-[8px] text-red-600 font-extrabold">
                            Sisa {optionStock}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                <p className="text-[10px] text-neutral-500 font-medium mt-2 flex items-center gap-1">
                  <Info size={13} className="text-neutral-700 shrink-0" />
                  <span>Ukuran pas biasa (Regular Fit). Disarankan memilih ukuran standar Anda.</span>
                </p>
              </div>
            ) : null}

            {/* Quantity Selector */}
            <div className="flex items-center justify-between py-2 border-t border-neutral-100">
              <span className="font-sport font-black text-xs uppercase tracking-wider text-neutral-700">
                JUMLAH PESANAN:
              </span>
              <div className="flex items-center border border-neutral-300 bg-white">
                <button 
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1 || isOutOfStock}
                  className="w-8 h-8 flex items-center justify-center text-neutral-700 hover:bg-neutral-100 disabled:opacity-40 cursor-pointer font-bold"
                >
                  -
                </button>
                <span className="w-10 text-center font-sport font-black text-sm text-black">
                  {quantity}
                </span>
                <button 
                  type="button"
                  onClick={() => setQuantity(Math.min(currentStock || 99, quantity + 1))}
                  disabled={quantity >= currentStock || isOutOfStock}
                  className="w-8 h-8 flex items-center justify-center text-neutral-700 hover:bg-neutral-100 disabled:opacity-40 cursor-pointer font-bold"
                >
                  +
                </button>
              </div>
            </div>

            {/* Action CTA Buttons */}
            <div className="space-y-2.5 pt-2">
              <button 
                type="button"
                onClick={handleAddToCartClick}
                disabled={isOutOfStock}
                className="w-full bg-black hover:bg-neutral-800 disabled:bg-neutral-400 text-white font-sport font-black text-xs sm:text-sm uppercase tracking-wider py-4 px-6 flex items-center justify-between transition-colors shadow-sm cursor-pointer disabled:cursor-not-allowed"
              >
                <span>{isOutOfStock ? 'STOK SEDANG HABIS' : 'TAMBAH KE TAS BELANJA'}</span>
                <span className="text-base">&rarr;</span>
              </button>

              <button 
                type="button"
                onClick={() => setIsWishlist(!isWishlist)}
                className="w-full border border-black hover:bg-neutral-50 text-black font-sport font-bold text-xs uppercase tracking-wider py-3.5 px-6 flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Heart size={16} className={isWishlist ? 'fill-red-500 text-red-500' : ''} />
                <span>{isWishlist ? 'TERSIMPAN DI DAFTAR KEINGINAN' : 'SIMPAN KE DAFTAR KEINGINAN'}</span>
              </button>
            </div>

            {/* Delivery & Return Badges */}
            <div className="border border-neutral-200 p-4 space-y-3 text-xs">
              <div className="flex items-start gap-3">
                <Truck size={20} className="text-black flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold uppercase block">GRATIS PENGIRIMAN STANDAR</strong>
                  <span className="text-neutral-500 text-[11px]">Estimasi tiba 2 - 4 hari kerja via ekspedisi partner KiriminAja.</span>
                </div>
              </div>
              <div className="flex items-start gap-3 border-t border-neutral-100 pt-3">
                <RotateCcw size={20} className="text-black flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold uppercase block">GARANSI RETUR & TUKAR UKURAN 14 HARI</strong>
                  <span className="text-neutral-500 text-[11px]">Ukuran tidak pas? Kami ganti gratis tanpa biaya tambahan.</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      </main>

      {/* 5. Editorial Narrative & Technology Overview (Benchmark: adidas Ultimashow Spec) */}
      <section className="bg-neutral-50 border-t border-b border-neutral-200 py-10 sm:py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14 items-center">
          
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600 block mb-2">
              INSPIRASI &amp; PERFORMA TEKNIS
            </span>
            <h2 className="font-sport font-black text-2xl sm:text-4xl uppercase italic tracking-tight leading-tight text-black mb-4">
              {product.category_id === 1 
                ? 'JERSEY TANDING PRO DENGAN VENTILASI AEROTECH' 
                : 'SEPATU LARI STABIL UNTUK PERFORMA SETIAP HARI'}
            </h2>
            <p className="text-xs sm:text-sm text-neutral-700 leading-relaxed mb-4">
              {product.description || 'Ketika kecepatan memanggil, jawab tantangan dengan Sepatu Tusko Ultimashow. Tidak peduli seberapa jauh atau seberapa cepat Anda melangkah, bantalan empuk midsole memberikan kenyamanan superior dari langkah pertama hingga garis finis.'}
            </p>
            <p className="text-xs sm:text-sm text-neutral-700 leading-relaxed">
              {product.category_id === 1 
                ? 'Didesain khusus untuk tuntutan pertandingan 90 menit penuh dengan mobilitas tanpa batas dan bobot ultra-ringan.' 
                : 'Dilengkapi dengan outsole karet berdaya cengkeram tinggi serta TPU fit counter di bagian tumit yang mengunci posisi kaki secara stabil di berbagai medan lintasan jogging perkotaan.'}
            </p>
          </div>

          {/* Feature Highlight Grid (2x2) */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="bg-white border border-neutral-200 p-3.5 sm:p-5">
              <Wind size={24} className="text-black mb-2" />
              <h3 className="font-sport font-black text-xs sm:text-sm uppercase tracking-tight mb-1 text-black">
                UPPER MESH SIRKULASI
              </h3>
              <p className="text-[11px] text-neutral-500 leading-relaxed">
                Ventilasi mikro untuk sirkulasi udara maksimal.
              </p>
            </div>

            <div className="bg-white border border-neutral-200 p-3.5 sm:p-5">
              <Feather size={24} className="text-black mb-2" />
              <h3 className="font-sport font-black text-xs sm:text-sm uppercase tracking-tight mb-1 text-black">
                BANTALAN EVA RINGAN
              </h3>
              <p className="text-[11px] text-neutral-500 leading-relaxed">
                Meredam hentakan langkah kaki dengan lembut.
              </p>
            </div>

            <div className="bg-white border border-neutral-200 p-3.5 sm:p-5">
              <Shield size={24} className="text-black mb-2" />
              <h3 className="font-sport font-black text-xs sm:text-sm uppercase tracking-tight mb-1 text-black">
                TPU FIT COUNTER
              </h3>
              <p className="text-[11px] text-neutral-500 leading-relaxed">
                Pengunci stabilitas tumit agar bebas selip.
              </p>
            </div>

            <div className="bg-white border border-neutral-200 p-3.5 sm:p-5">
              <Activity size={24} className="text-black mb-2" />
              <h3 className="font-sport font-black text-xs sm:text-sm uppercase tracking-tight mb-1 text-black">
                OUTSOLE KARET TANGGUH
              </h3>
              <p className="text-[11px] text-neutral-500 leading-relaxed">
                Traksi kuat di aspal basah maupun permukaan kering.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* 6. Technical Specifications & Size Conversion Table */}
      <section className="py-10 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <h2 className="font-sport font-black text-xl sm:text-3xl uppercase italic tracking-tight mb-6">
          SPESIFIKASI TEKNIS &amp; PANDUAN UKURAN
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Specs List */}
          <div className="space-y-2 text-xs sm:text-sm text-neutral-800">
            {product.specifications && Object.keys(product.specifications).length > 0 ? (
              Object.entries(product.specifications).map(([key, val]) => (
                <div key={key} className="flex justify-between py-2 border-b border-neutral-200">
                  <span className="text-neutral-500 font-bold uppercase">{key}</span>
                  <span className="font-extrabold text-right">{val}</span>
                </div>
              ))
            ) : (
              <>
                <div className="flex justify-between py-2 border-b border-neutral-200">
                  <span className="text-neutral-500 font-bold uppercase">Fit</span>
                  <span className="font-extrabold">Regular fit (potongan standar ergonomis)</span>
                </div>
                <div className="flex justify-between py-2 border-b border-neutral-200">
                  <span className="text-neutral-500 font-bold uppercase">Penutup</span>
                  <span className="font-extrabold">Lace closure (Tali sepatu standar)</span>
                </div>
                <div className="flex justify-between py-2 border-b border-neutral-200">
                  <span className="text-neutral-500 font-bold uppercase">Material Upper</span>
                  <span className="font-extrabold">Tekstil mesh fleksibel berventilasi</span>
                </div>
                <div className="flex justify-between py-2 border-b border-neutral-200">
                  <span className="text-neutral-500 font-bold uppercase">Midsole</span>
                  <span className="font-extrabold">Busa EVA peredam benturan</span>
                </div>
                <div className="flex justify-between py-2 border-b border-neutral-200">
                  <span className="text-neutral-500 font-bold uppercase">Outsole</span>
                  <span className="font-extrabold">Karet tahan aus dengan TPU heel clip</span>
                </div>
              </>
            )}
            <div className="flex justify-between py-2 border-b border-neutral-200">
              <span className="text-neutral-500 font-bold uppercase">Kode Produk</span>
              <span className="font-mono font-black text-black">{selectedVariant?.sku || product.sku || 'FX3632'}</span>
            </div>
          </div>

          {/* Size Table */}
          <div className="bg-neutral-50 border border-neutral-200 p-4 sm:p-5">
            <h3 className="font-sport font-black text-xs sm:text-sm uppercase tracking-wider mb-3 text-black">
              TABEL KONVERSI UKURAN SEPATU RESMI
            </h3>
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-black text-white font-bold">
                    <th className="p-2 border border-neutral-800">UK</th>
                    <th className="p-2 border border-neutral-800">EUR</th>
                    <th className="p-2 border border-neutral-800">US</th>
                    <th className="p-2 border border-neutral-800">PANJANG (CM)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 font-medium text-neutral-700">
                  {sizeConversionTable.map((row) => {
                    const isRowActive = selectedSizeValue === row.rawSize || selectedSizeValue === row.eur;
                    return (
                      <tr 
                        key={row.uk} 
                        className={isRowActive ? "bg-amber-100/60 font-bold text-black" : "hover:bg-white"}
                      >
                        <td className={`p-2 ${isRowActive ? "font-black" : "font-bold"}`}>{row.uk}</td>
                        <td className="p-2">{row.eur}</td>
                        <td className="p-2">{row.us}</td>
                        <td className="p-2">{row.cm} {isRowActive && "(Aktif)"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </section>

      {/* 7. Tusko Club Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14">
        <div className="bg-black text-white p-5 sm:p-10 border border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-3.5">
            <div className="w-10 sm:w-14 h-10 sm:h-14 bg-amber-500 text-black flex items-center justify-center font-sport font-black text-xl sm:text-2xl flex-shrink-0 -skew-x-6">
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
            onClick={onOpenRegister}
            className="w-full sm:w-auto bg-white text-black hover:bg-neutral-200 font-sport font-bold text-xs uppercase tracking-wider px-5 py-3 transition-colors flex-shrink-0 cursor-pointer"
          >
            DAFTAR MEMBER GRATIS &rarr;
          </button>
        </div>
      </section>

      {/* ================= 9. STICKY MOBILE ACTION BAR (SIGNATURE ADIDAS UX) ================= */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-neutral-200 p-3 sm:hidden shadow-[0_-5px_15px_rgba(0,0,0,0.08)] flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <img 
            src={displayImages[activePhotoIndex] || product.image_url} 
            className="w-10 h-10 object-cover bg-neutral-100 border border-neutral-200" 
            alt="Thumb" 
          />
          <div>
            <div className="font-sport font-black text-sm text-black leading-none">
              {formatRupiah(currentPrice)}
            </div>
            <div className="text-[10px] text-neutral-500 font-bold mt-0.5">
              {selectedSizeValue ? `Ukuran: ${formatSizeLabel(selectedSizeValue)}` : 'Pilih Varian'}
            </div>
          </div>
        </div>
        <button 
          type="button"
          onClick={handleAddToCartClick}
          disabled={isOutOfStock}
          className="bg-black hover:bg-neutral-800 disabled:bg-neutral-400 text-white font-sport font-bold text-xs uppercase tracking-wider py-2.5 px-4 flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <ShoppingBag size={14} />
          <span>+ KERANJANG</span>
        </button>
      </div>

      {/* Size Guide Modal */}
      {showSizeModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full border border-neutral-300 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
              <h3 className="font-sport font-black text-base uppercase tracking-wider text-black flex items-center gap-2">
                <Ruler size={18} />
                <span>PANDUAN UKURAN SEPATU &amp; APPAREL TUSKO</span>
              </h3>
              <button 
                type="button"
                onClick={() => setShowSizeModal(false)}
                className="text-neutral-500 hover:text-black cursor-pointer p-1"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-3 text-xs text-neutral-700 leading-relaxed">
              <p>
                <strong>Cara Mengukur Panjang Kaki:</strong>
              </p>
              <ol className="list-decimal list-inside space-y-1 text-neutral-600 pl-1">
                <li>Letakkan selembar kertas di lantai menempel tegak lurus pada dinding.</li>
                <li>Berdirilah di atas kertas dengan tumit menyentuh dinding.</li>
                <li>Tandai ujung jari terpanjang pada kertas menggunakan pensil.</li>
                <li>Ukur jarak dari dinding ke tanda tersebut dalam satuan centimeter (CM).</li>
              </ol>

              <div className="bg-neutral-50 border border-neutral-200 p-3 mt-2">
                <span className="font-bold text-black uppercase block mb-1">Tips Pas (Fitting):</span>
                <span>Jika telapak kaki Anda cenderung lebar atau Anda menggunakan kaus kaki tebal untuk lari, disarankan memilih 0.5 nomor lebih besar dari ukuran regular.</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button 
                type="button"
                onClick={() => setShowSizeModal(false)}
                className="bg-black hover:bg-neutral-800 text-white font-sport font-bold text-xs uppercase px-5 py-2.5 transition-colors cursor-pointer"
              >
                TUTUP
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photo Lightbox / Zoom Modal */}
      {isZoomOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center">
            <button
              type="button"
              onClick={() => setIsZoomOpen(false)}
              className="absolute -top-12 right-0 text-white hover:text-amber-400 p-2 cursor-pointer flex items-center gap-1 text-xs font-bold uppercase"
            >
              <X size={22} />
              <span>Tutup</span>
            </button>
            <img 
              src={displayImages[activePhotoIndex] || product.image_url} 
              alt="Zoomed product" 
              className="max-h-[80vh] w-auto object-contain border border-neutral-800 shadow-2xl"
            />
            <div className="text-white text-xs font-bold uppercase tracking-wider mt-3">
              {photoAngleLabels[activePhotoIndex] || `Foto ${activePhotoIndex + 1}`}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
