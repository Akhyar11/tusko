import React, { useState, useMemo } from 'react';
import { 
  Star, 
  MapPin, 
  BadgeCheck, 
  Truck, 
  ArrowLeft, 
  Minus, 
  Plus, 
  Heart, 
  Share2, 
  MessageCircle, 
  Flame, 
  AlertCircle, 
  Zap, 
  RotateCcw, 
  Maximize2, 
  X, 
  Check, 
  Award, 
  Ruler,
  CheckCircle2
} from 'lucide-react';
import { formatRupiah } from '../utils/formatters';

export default function ProductDetail({ 
  product, 
  onBack = () => {},
  onAddToCart = () => {},
  onBuyNow = () => {},
  onSelectCategory = () => {}
}) {
  const galleryImages = product?.gallery && product.gallery.length > 0 
    ? product.gallery 
    : [product?.image_url].filter(Boolean);

  const [activeImage, setActiveImage] = useState(galleryImages[0] || '');
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [isWishlist, setIsWishlist] = useState(false);
  const [activeTab, setActiveTab] = useState('detail'); // 'detail' | 'spec' | 'size_chart' | 'reviews'
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Initialize selectedOptions from the first available in-stock variant if available
  const [selectedOptions, setSelectedOptions] = useState(() => {
    if (product?.variants && product.variants.length > 0) {
      const firstAvailable = product.variants.find((v) => (Number(v.stock) || 0) > 0) || product.variants[0];
      const initial = {};
      (product.variant_levels || []).forEach((lvl) => {
        if (firstAvailable[lvl.code] !== undefined) {
          initial[lvl.code] = firstAvailable[lvl.code];
        }
      });
      return initial;
    }
    return {};
  });

  // Find exact matching variant based on all selected options
  const selectedVariant = useMemo(() => {
    if (!product?.variants || product.variants.length === 0) return null;
    return product.variants.find((v) => {
      return Object.entries(selectedOptions).every(([code, val]) => v[code] === val);
    }) || null;
  }, [product, selectedOptions]);

  // Check if every defined level has a selection
  const allLevelsSelected = useMemo(() => {
    if (!product?.variant_levels || product.variant_levels.length === 0) return true;
    return product.variant_levels.every((lvl) => Boolean(selectedOptions[lvl.code]));
  }, [product, selectedOptions]);

  if (!product) return null;

  // Dynamic price, stock, and SKU
  const basePrice = Number(product.price || 0);
  const currentPrice = selectedVariant ? Number(selectedVariant.price) : basePrice;
  const priceDifference = selectedVariant ? currentPrice - basePrice : 0;
  const currentStock = selectedVariant ? Number(selectedVariant.stock ?? 0) : Number(product.stock ?? 0);
  const minStock = Number(product.stock_minimum ?? 5);
  const isOutOfStock = currentStock <= 0;
  const isLowStock = !isOutOfStock && currentStock <= minStock;

  // Variant discount and original price calculation
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

  // Calculate estimated loyalty points earned (1% from purchase)
  const loyaltyPointsEarned = Math.floor(currentPrice * 0.01);

  // Helper to calculate price difference for a specific option given other selections
  const getOptionPriceDelta = (levelCode, optionVal) => {
    if (!product?.variants || product.variants.length === 0) return null;
    const matches = product.variants.filter((v) => {
      if (v[levelCode] !== optionVal) return false;
      for (const [code, val] of Object.entries(selectedOptions)) {
        if (code !== levelCode && val && v[code] !== val) return false;
      }
      return true;
    });
    if (matches.length === 0) return null;
    const deltas = matches.map((m) => (Number(m.price) || basePrice) - basePrice);
    const minDelta = Math.min(...deltas);
    const maxDelta = Math.max(...deltas);
    if (minDelta === maxDelta && minDelta !== 0) {
      return minDelta;
    }
    return null;
  };

  // Check hierarchical availability of an option based on preceding selections
  const getOptionAvailability = (levelIndex, levelCode, optionVal) => {
    if (!product?.variants || product.variants.length === 0) {
      return { available: true, existsInMatrix: true, stock: product?.stock ?? 99, reason: null };
    }

    // Match this option value + all selections made in PRECEDING levels (0 to levelIndex - 1)
    const matchingVariants = product.variants.filter((v) => {
      if (v[levelCode] !== optionVal) return false;

      for (let i = 0; i < levelIndex; i++) {
        const prevLevel = product.variant_levels[i];
        const prevChoice = selectedOptions[prevLevel.code];
        if (prevChoice && v[prevLevel.code] !== prevChoice) {
          return false;
        }
      }
      return true;
    });

    if (matchingVariants.length === 0) {
      return { available: false, existsInMatrix: false, stock: 0, reason: 'Tidak tersedia' };
    }

    const totalStock = matchingVariants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);
    if (totalStock <= 0) {
      return { available: false, existsInMatrix: true, stock: 0, reason: 'Habis' };
    }

    return { available: true, existsInMatrix: true, stock: totalStock, reason: null };
  };

  // Smart hierarchical selection handler
  const handleSelectOption = (levelIndex, levelCode, optionValue) => {
    const status = getOptionAvailability(levelIndex, levelCode, optionValue);
    if (!status.available) return;

    const newOptions = {
      ...selectedOptions,
      [levelCode]: optionValue
    };

    // Auto-reconcile subsequent levels if their current choices became unavailable
    if (product.variant_levels && product.variant_levels.length > 0) {
      for (let i = levelIndex + 1; i < product.variant_levels.length; i++) {
        const nextLevel = product.variant_levels[i];
        const currentNextChoice = newOptions[nextLevel.code];

        const isValid = product.variants.some((v) => {
          if (v[nextLevel.code] !== currentNextChoice) return false;
          for (let j = 0; j <= levelIndex; j++) {
            const checkLevel = product.variant_levels[j];
            if (v[checkLevel.code] !== newOptions[checkLevel.code]) return false;
          }
          return (Number(v.stock) || 0) > 0;
        });

        if (!isValid) {
          const compatibleVariant = product.variants.find((v) => {
            for (let j = 0; j <= levelIndex; j++) {
              const checkLevel = product.variant_levels[j];
              if (v[checkLevel.code] !== newOptions[checkLevel.code]) return false;
            }
            return (Number(v.stock) || 0) > 0;
          });

          if (compatibleVariant && compatibleVariant[nextLevel.code]) {
            newOptions[nextLevel.code] = compatibleVariant[nextLevel.code];
          }
        }
      }
    }

    setSelectedOptions(newOptions);
  };

  const getVariantTitle = () => {
    if (!product?.variant_levels || product.variant_levels.length === 0) return null;
    return product.variant_levels
      .map((lvl) => selectedOptions[lvl.code])
      .filter(Boolean)
      .join(' / ');
  };

  const handleDecrease = () => {
    if (quantity > 1) {
      setQuantity((prev) => prev - 1);
    }
  };

  const handleIncrease = () => {
    if (quantity < currentStock) {
      setQuantity((prev) => prev + 1);
    }
  };

  const handleAddWithQuantity = () => {
    if (!allLevelsSelected || isOutOfStock) return;
    const variantTitle = getVariantTitle();
    const itemToAdd = {
      ...product,
      selected_variant: selectedVariant,
      variant_id: selectedVariant?.id,
      variant_sku: selectedVariant?.sku,
      variant_name: variantTitle,
      price: currentPrice,
      stock: currentStock
    };
    onAddToCart(itemToAdd, quantity, notes);
  };

  const handleBuyNowAction = () => {
    if (!allLevelsSelected || isOutOfStock) return;
    const variantTitle = getVariantTitle();
    const itemToAdd = {
      ...product,
      selected_variant: selectedVariant,
      variant_id: selectedVariant?.id,
      variant_sku: selectedVariant?.sku,
      variant_name: variantTitle,
      price: currentPrice,
      stock: currentStock
    };
    onBuyNow(itemToAdd, quantity, notes);
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const subtotal = currentPrice * quantity;

  // Mock reviews
  const mockReviews = [
    {
      id: 1,
      author: 'Bambang S.',
      rating: 5,
      date: '3 hari yang lalu',
      variant: 'Deep Navy / L',
      comment: 'Bahan sangat adem dan nyaman dipakai tanding 90 menit penuh. Sirkulasi udaranya jempolan, keringat langsung cepat kering!',
      helpfulCount: 24
    },
    {
      id: 2,
      author: 'Rian Pratama',
      rating: 5,
      date: '1 minggu yang lalu',
      variant: 'Triple Black / XL',
      comment: 'Kualitas fitting pas banget ala apparel pro. Jahitan rapi dan sablon logo kokoh tidak gampang rontok.',
      helpfulCount: 16
    }
  ];

  return (
    <div className="py-4 pb-24 lg:pb-12">
      {/* Breadcrumb & Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-3 border-b border-neutral-200">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-black uppercase tracking-wider text-neutral-900 hover:text-amber-600 bg-white hover:bg-neutral-100 px-3.5 py-2 rounded-xl border border-neutral-300 transition-all cursor-pointer shadow-2xs w-fit"
        >
          <ArrowLeft size={16} />
          <span>Kembali ke Katalog</span>
        </button>

        <nav className="flex items-center gap-2 text-xs text-neutral-500 overflow-x-auto whitespace-nowrap">
          <button 
            type="button"
            onClick={onBack} 
            className="hover:text-amber-600 font-bold transition-colors cursor-pointer"
          >
            Beranda
          </button>
          <span className="text-neutral-300">/</span>
          <button
            type="button"
            onClick={() => {
              if (product.category_id) {
                onSelectCategory(product.category_id);
              }
              onBack();
            }}
            className="hover:text-amber-600 font-bold transition-colors cursor-pointer text-neutral-600"
          >
            Katalog Olahraga
          </button>
          <span className="text-neutral-300">/</span>
          <span className="text-neutral-900 font-extrabold truncate max-w-xs sm:max-w-md">
            {product.name}
          </span>
        </nav>
      </div>

      {/* Main Grid: Gallery | Details | Action Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Gallery (5 cols) */}
        <div className="lg:col-span-5">
          <div className="sticky top-20 space-y-4">
            {/* Main Image Viewer */}
            <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-white border border-neutral-200 shadow-md group">
              <img
                src={activeImage}
                alt={product.name}
                className="w-full h-full object-cover object-center transition-all duration-300 group-hover:scale-105"
              />

              {/* Badges Overlay */}
              <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
                {product.is_official && (
                  <span className="bg-neutral-950 text-amber-400 text-[10px] sm:text-xs font-black px-2.5 py-1 rounded-md shadow-sm uppercase tracking-wider flex items-center gap-1">
                    <BadgeCheck size={14} className="fill-current text-neutral-950" />
                    Tusko Pro Official
                  </span>
                )}
                {product.free_shipping && (
                  <span className="bg-emerald-600 text-white text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-md shadow-sm uppercase tracking-wide flex items-center gap-1">
                    <Truck size={14} />
                    Bebas Ongkir
                  </span>
                )}
              </div>

              {/* Zoom Trigger Button */}
              <button
                type="button"
                onClick={() => setIsZoomOpen(true)}
                className="absolute bottom-3 right-3 p-2 bg-neutral-950/70 hover:bg-neutral-950 text-white rounded-xl backdrop-blur-xs transition-colors cursor-pointer shadow-md"
                title="Perbesar Foto"
              >
                <Maximize2 size={16} />
              </button>

              {/* Stock Warning Overlay if Out of Stock */}
              {isOutOfStock && (
                <div className="absolute inset-0 bg-neutral-950/60 backdrop-blur-2xs flex items-center justify-center">
                  <span className="bg-neutral-900 text-white font-black text-sm px-4 py-2 rounded-xl border border-neutral-700 shadow-lg uppercase tracking-wider">
                    Stok Habis
                  </span>
                </div>
              )}
            </div>

            {/* Thumbnail Strip */}
            {galleryImages.length > 1 && (
              <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
                {galleryImages.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImage(img)}
                    className={`w-18 h-18 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                      activeImage === img
                        ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-sm'
                        : 'border-neutral-200 hover:border-neutral-400 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Loyalty Points Reward Highlight */}
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3.5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-neutral-950 font-black shrink-0">
                <Zap size={20} className="fill-current" />
              </div>
              <div className="text-xs">
                <p className="font-extrabold text-neutral-900">
                  Dapatkan <span className="text-amber-700 font-black">+{loyaltyPointsEarned.toLocaleString('id-ID')} Poin Loyalitas</span>
                </p>
                <p className="text-neutral-600 text-[11px] mt-0.5">
                  Poin berlaku seumur hidup & dapat langsung dipakai sebagai potongan belanja berikutnya.
                </p>
              </div>
            </div>

            {/* Wishlist, Share, and Guarantee Badges */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsWishlist(!isWishlist)}
                className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl border transition-colors cursor-pointer ${
                  isWishlist 
                    ? 'border-rose-300 bg-rose-50 text-rose-600' 
                    : 'border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                <Heart size={15} className={isWishlist ? 'fill-rose-500 text-rose-500' : ''} />
                <span>{isWishlist ? 'Disukai' : 'Favorit'}</span>
              </button>

              <button
                type="button"
                onClick={handleShare}
                className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl border border-neutral-200 text-neutral-700 hover:bg-neutral-50 transition-colors cursor-pointer"
              >
                {copiedLink ? (
                  <>
                    <Check size={15} className="text-emerald-600" />
                    <span className="text-emerald-600">Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Share2 size={15} />
                    <span>Bagikan</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Center Column: Product Specs, Variants & Description (4 cols) */}
        <div className="lg:col-span-4 space-y-5">
          {/* Title and Rating */}
          <div>
            <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wider text-amber-600 mb-1.5">
              <span>{product.seller_name || 'Tusko Official'}</span>
              <span>•</span>
              <span className="text-neutral-400">Authentic Gear</span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-neutral-900 leading-tight uppercase tracking-tight">
              {product.name}
            </h1>

            <div className="flex items-center gap-3 mt-3 text-xs text-neutral-600 flex-wrap">
              <div className="flex items-center text-amber-500 font-bold">
                <Star size={15} className="fill-current" />
                <span className="ml-1 text-neutral-900">{product.rating}</span>
                <span className="text-neutral-400 font-normal ml-1">({product.rating_count} ulasan)</span>
              </div>
              <span className="text-neutral-300">•</span>
              <span>Terjual <strong className="text-neutral-900">{product.sold_count}+</strong></span>
              <span className="text-neutral-300">•</span>
              <span className="flex items-center gap-1 text-neutral-500">
                <MapPin size={13} className="text-neutral-400" />
                Gudang {product.location}
              </span>
            </div>
          </div>

          {/* Pricing Box with Real-Time Variant Price Tracking */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-neutral-200 shadow-xs space-y-2">
            <div className="flex items-baseline gap-2.5 flex-wrap">
              <span className="text-2xl sm:text-3xl font-black text-neutral-950 tracking-tight transition-all">
                {formatRupiah(currentPrice)}
              </span>
              {currentDiscountPercentage > 0 && (
                <>
                  <span className="text-xs font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">
                    -{currentDiscountPercentage}%
                  </span>
                  <span className="text-sm text-neutral-400 line-through font-medium">
                    {formatRupiah(currentOriginalPrice)}
                  </span>
                </>
              )}
            </div>

            {/* Variant Price Difference Banner */}
            {selectedVariant && priceDifference !== 0 && (
              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${
                priceDifference > 0
                  ? 'bg-amber-50 text-amber-900 border border-amber-200/80'
                  : 'bg-emerald-50 text-emerald-900 border border-emerald-200/80'
              }`}>
                <Zap size={13} className={priceDifference > 0 ? 'text-amber-600' : 'text-emerald-600'} />
                <span>
                  {priceDifference > 0
                    ? `Harga varian terpilih (+${formatRupiah(priceDifference)} dari harga dasar)`
                    : `Harga varian terpilih (-${formatRupiah(Math.abs(priceDifference))} hemat)`}
                </span>
              </div>
            )}
          </div>

          {/* Pemilih Varian Lengkap (Variant Selector) */}
          {product.variant_levels && product.variant_levels.length > 0 && (
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-neutral-200/90 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-4 bg-amber-500 rounded-full" />
                  <h3 className="font-black text-neutral-900 text-xs uppercase tracking-wider">
                    Pilih Varian Produk
                  </h3>
                </div>
                {selectedVariant && (
                  <span className="text-[10px] font-mono text-neutral-400 font-bold bg-neutral-100 px-2 py-0.5 rounded">
                    SKU: {selectedVariant.sku}
                  </span>
                )}
              </div>

              {product.variant_levels.map((level, levelIdx) => {
                const currentVal = selectedOptions[level.code];
                return (
                  <div key={level.code} className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-extrabold text-neutral-800">
                        {level.name}: <strong className="text-amber-600">{currentVal || 'Pilih...'}</strong>
                      </span>
                      {!currentVal && (
                        <span className="text-[10px] text-rose-500 font-black uppercase tracking-wider">
                          Wajib dipilih
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {level.options.map((opt) => {
                        const isChosen = currentVal === opt;
                        const availability = getOptionAvailability(levelIdx, level.code, opt);
                        const isAvailable = availability.available;
                        const priceDelta = getOptionPriceDelta(level.code, opt);

                        return (
                          <button
                            key={opt}
                            type="button"
                            disabled={!isAvailable}
                            onClick={() => handleSelectOption(levelIdx, level.code, opt)}
                            title={
                              isAvailable
                                ? `${opt} - Stok: ${availability.stock}${priceDelta ? ` (${priceDelta > 0 ? '+' : ''}${formatRupiah(priceDelta)})` : ''}`
                                : `${opt} - ${availability.reason}`
                            }
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all border flex items-center gap-1.5 ${
                              isChosen
                                ? 'bg-neutral-950 text-amber-400 border-neutral-950 shadow-sm ring-2 ring-amber-400/40 cursor-pointer'
                                : !isAvailable
                                ? 'bg-neutral-100 text-neutral-400 border-neutral-200 line-through opacity-60 cursor-not-allowed'
                                : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:border-neutral-400 hover:bg-white cursor-pointer'
                            }`}
                          >
                            <span>{opt}</span>
                            {priceDelta && isAvailable && (
                              <span className={`text-[9px] font-bold px-1 rounded ${
                                isChosen 
                                  ? 'bg-amber-400/20 text-amber-300' 
                                  : 'bg-neutral-200/70 text-neutral-600'
                              }`}>
                                {priceDelta > 0 ? `+${priceDelta / 1000}rb` : `${priceDelta / 1000}rb`}
                              </span>
                            )}
                            {!isAvailable && (
                              <span className="text-[9px] font-semibold text-rose-500 normal-case no-underline">
                                ({availability.reason || 'Habis'})
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Selected Variant Summary */}
              <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-xs">
                <span className="text-neutral-500 font-medium">
                  Varian Terpilih: <strong className="text-neutral-900">{getVariantTitle() || 'Belum Lengkap'}</strong>
                </span>
                <span className={`text-[11px] font-black uppercase tracking-wider ${currentStock > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {currentStock > 0 ? `Tersedia ${currentStock} unit` : 'Stok Kosong'}
                </span>
              </div>
            </div>
          )}

          {/* Trust & Guarantee Box */}
          <div className="grid grid-cols-2 gap-2.5 text-xs">
            <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200/80 flex items-start gap-2">
              <RotateCcw size={16} className="text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-neutral-900">Garansi Tukar Ukuran</p>
                <p className="text-[10px] text-neutral-500 mt-0.5">Ukuran tidak pas? Tukar dalam 7 hari kerja.</p>
              </div>
            </div>
            <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200/80 flex items-start gap-2">
              <Award size={16} className="text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-neutral-900">100% Produk Asli</p>
                <p className="text-[10px] text-neutral-500 mt-0.5">Jaminan orisinal langsung dari pabrik Tusko.</p>
              </div>
            </div>
          </div>

          {/* Shipping Info Card */}
          <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-200 text-xs space-y-2">
            <div className="flex items-center gap-2 text-neutral-900 font-extrabold uppercase tracking-wide">
              <Truck size={16} className="text-amber-500" />
              <span>Logistik & Pengiriman KiriminAja</span>
            </div>
            <p className="text-neutral-600 text-[11px] leading-relaxed">
              Mendukung multi-kurir (JNE, SiCepat, J&T, Anteraja) dengan pelacakan nomor resi otomatis secara real-time.
            </p>
          </div>

          {/* Interactive Tabs: Detail | Spesifikasi | Size Chart | Ulasan */}
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs overflow-hidden">
            <div className="flex border-b border-neutral-200 overflow-x-auto bg-neutral-50">
              <button
                type="button"
                onClick={() => setActiveTab('detail')}
                className={`py-3 px-4 text-xs font-extrabold uppercase tracking-wider border-b-2 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  activeTab === 'detail'
                    ? 'border-amber-500 text-neutral-950 bg-white'
                    : 'border-transparent text-neutral-500 hover:text-neutral-900'
                }`}
              >
                Detail
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('spec')}
                className={`py-3 px-4 text-xs font-extrabold uppercase tracking-wider border-b-2 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  activeTab === 'spec'
                    ? 'border-amber-500 text-neutral-950 bg-white'
                    : 'border-transparent text-neutral-500 hover:text-neutral-900'
                }`}
              >
                Spesifikasi
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('size_chart')}
                className={`py-3 px-4 text-xs font-extrabold uppercase tracking-wider border-b-2 transition-colors cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                  activeTab === 'size_chart'
                    ? 'border-amber-500 text-neutral-950 bg-white'
                    : 'border-transparent text-neutral-500 hover:text-neutral-900'
                }`}
              >
                <Ruler size={13} />
                <span>Panduan Ukuran</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('reviews')}
                className={`py-3 px-4 text-xs font-extrabold uppercase tracking-wider border-b-2 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  activeTab === 'reviews'
                    ? 'border-amber-500 text-neutral-950 bg-white'
                    : 'border-transparent text-neutral-500 hover:text-neutral-900'
                }`}
              >
                Ulasan ({product.rating_count})
              </button>
            </div>

            <div className="p-4 sm:p-5">
              {activeTab === 'detail' && (
                <div className="text-neutral-700 leading-relaxed text-xs sm:text-sm space-y-3 font-medium">
                  <p>{product.description}</p>
                  <div className="pt-2 border-t border-neutral-100 text-neutral-500 text-xs">
                    <p className="font-bold text-neutral-800">Petunjuk Pemakaian & Perawatan:</p>
                    <p className="mt-1">
                      Cuci dengan air dingin dan hindari pemutih atau setrika pada suhu tinggi agar serat kain teknis serta elastisitasnya tetap awet.
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'spec' && (
                <div className="divide-y divide-neutral-100 text-xs sm:text-sm">
                  {product.specifications ? (
                    Object.entries(product.specifications).map(([key, val], idx) => (
                      <div key={idx} className="py-2.5 flex">
                        <span className="w-1/3 text-neutral-400 font-semibold">{key}</span>
                        <span className="w-2/3 text-neutral-800 font-bold">{val}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-neutral-500 py-2">Spesifikasi standar pabrik Tusko.</p>
                  )}
                </div>
              )}

              {activeTab === 'size_chart' && (
                <div className="space-y-3 text-xs">
                  <p className="text-neutral-600 font-medium">
                    Tabel acuan ukuran standar Asian Fit untuk produk <strong>{product.name}</strong>:
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse border border-neutral-200">
                      <thead>
                        <tr className="bg-neutral-100 text-neutral-900 font-bold text-[11px]">
                          <th className="p-2 border border-neutral-200">Ukuran</th>
                          <th className="p-2 border border-neutral-200">Panjang (cm)</th>
                          <th className="p-2 border border-neutral-200">Lebar Dada (cm)</th>
                          <th className="p-2 border border-neutral-200">Tinggi Atlet (cm)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-200 text-neutral-700">
                        <tr>
                          <td className="p-2 border border-neutral-200 font-bold">S</td>
                          <td className="p-2 border border-neutral-200">68</td>
                          <td className="p-2 border border-neutral-200">48</td>
                          <td className="p-2 border border-neutral-200">160 - 168</td>
                        </tr>
                        <tr>
                          <td className="p-2 border border-neutral-200 font-bold">M</td>
                          <td className="p-2 border border-neutral-200">70</td>
                          <td className="p-2 border border-neutral-200">50</td>
                          <td className="p-2 border border-neutral-200">168 - 175</td>
                        </tr>
                        <tr>
                          <td className="p-2 border border-neutral-200 font-bold">L</td>
                          <td className="p-2 border border-neutral-200">72</td>
                          <td className="p-2 border border-neutral-200">52</td>
                          <td className="p-2 border border-neutral-200">175 - 182</td>
                        </tr>
                        <tr>
                          <td className="p-2 border border-neutral-200 font-bold">XL</td>
                          <td className="p-2 border border-neutral-200">74</td>
                          <td className="p-2 border border-neutral-200">54</td>
                          <td className="p-2 border border-neutral-200">180 - 188</td>
                        </tr>
                        <tr>
                          <td className="p-2 border border-neutral-200 font-bold">XXL</td>
                          <td className="p-2 border border-neutral-200">76</td>
                          <td className="p-2 border border-neutral-200">56</td>
                          <td className="p-2 border border-neutral-200">185 - 195</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <p className="text-[10px] text-neutral-400 italic">
                    * Toleransi selisih ukuran jahitan konveksi 1 - 2 cm.
                  </p>
                </div>
              )}

              {activeTab === 'reviews' && (
                <div className="space-y-4">
                  {mockReviews.map((rev) => (
                    <div key={rev.id} className="pb-3 border-b border-neutral-100 last:border-0 last:pb-0 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-neutral-900">{rev.author}</span>
                          <span className="text-[10px] text-neutral-400">• {rev.date}</span>
                        </div>
                        <div className="flex items-center text-amber-500 font-bold">
                          <Star size={12} className="fill-current" />
                          <span className="ml-1 text-neutral-800">{rev.rating}.0</span>
                        </div>
                      </div>
                      <p className="text-[10px] text-neutral-500 mt-0.5">Varian: {rev.variant}</p>
                      <p className="text-neutral-700 mt-2 leading-relaxed">{rev.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Sticky Purchase Action Card (3 cols) */}
        <div className="lg:col-span-3">
          <div className="lg:sticky lg:top-20 bg-white rounded-2xl border border-neutral-200/90 p-4 sm:p-5 shadow-md space-y-4">
            <h3 className="font-black text-neutral-900 text-xs uppercase tracking-wider">
              Atur Jumlah Pembelian
            </h3>

            {/* Snapshot item with variant title */}
            <div className="flex items-center gap-3 pb-3 border-b border-neutral-100">
              <img
                src={product.image_url}
                alt=""
                className="w-12 h-12 rounded-xl object-cover border border-neutral-200 shrink-0"
              />
              <div className="truncate">
                <p className="text-xs font-bold text-neutral-900 truncate">{product.name}</p>
                {getVariantTitle() && (
                  <p className="text-[10px] font-bold text-amber-600 truncate mt-0.5">
                    {getVariantTitle()}
                  </p>
                )}
                <p className="text-xs font-black text-neutral-950 mt-0.5">{formatRupiah(currentPrice)}</p>
              </div>
            </div>

            {/* Quantity Controller */}
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-600 font-bold">Jumlah:</span>
                <div className="flex items-center border border-neutral-300 rounded-xl overflow-hidden bg-neutral-50">
                  <button
                    type="button"
                    disabled={quantity <= 1 || isOutOfStock || !allLevelsSelected}
                    onClick={handleDecrease}
                    className="p-2 text-neutral-700 hover:bg-neutral-200 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer transition-colors"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="px-3 text-xs font-black text-neutral-900 min-w-8 text-center">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    disabled={quantity >= currentStock || isOutOfStock || !allLevelsSelected}
                    onClick={handleIncrease}
                    className="p-2 text-neutral-700 hover:bg-neutral-200 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer transition-colors"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              {/* Stock info */}
              <div className="mt-2.5 text-right">
                {isOutOfStock ? (
                  <span className="text-[11px] font-bold text-rose-600 flex items-center justify-end gap-1">
                    <AlertCircle size={12} />
                    Stok Varian Habis
                  </span>
                ) : isLowStock ? (
                  <span className="text-[11px] font-black text-rose-600 flex items-center justify-end gap-1 uppercase tracking-wider animate-pulse">
                    <Flame size={12} className="fill-rose-500" />
                    Sisa {currentStock} unit!
                  </span>
                ) : (
                  <span className="text-[11px] text-neutral-500 font-medium">
                    Stok Varian: <strong className="text-neutral-800">{currentStock} unit</strong>
                  </span>
                )}
              </div>
            </div>

            {/* Optional note */}
            <div>
              <label className="text-[11px] font-bold text-neutral-600 uppercase tracking-wider block mb-1">
                Catatan Pesanan
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Contoh: Titip di pos satpam, dll..."
                className="w-full text-xs px-3 py-2 border border-neutral-300 rounded-xl focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
              />
            </div>

            {/* Subtotal */}
            <div className="pt-3 border-t border-neutral-100 flex items-center justify-between">
              <span className="text-xs text-neutral-500 font-bold">Subtotal:</span>
              <span className="text-base sm:text-lg font-black text-neutral-950">
                {formatRupiah(subtotal)}
              </span>
            </div>

            {/* Purchase Buttons */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                disabled={isOutOfStock || !allLevelsSelected}
                onClick={handleAddWithQuantity}
                className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black uppercase text-xs tracking-wider rounded-xl shadow-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer active:scale-98"
              >
                {!allLevelsSelected ? 'Pilih Varian Dahulu' : isOutOfStock ? 'Stok Habis' : '+ Keranjang'}
              </button>

              <button
                type="button"
                disabled={isOutOfStock || !allLevelsSelected}
                onClick={handleBuyNowAction}
                className="w-full py-3 px-4 bg-neutral-900 hover:bg-neutral-800 text-white font-black uppercase text-xs tracking-wider rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer active:scale-98"
              >
                {!allLevelsSelected ? 'Pilih Varian Dahulu' : 'Beli Langsung'}
              </button>
            </div>

            {/* Secondary features */}
            <div className="pt-2 flex items-center justify-around text-xs text-neutral-500 border-t border-neutral-100 font-medium">
              <button 
                type="button"
                className="flex items-center gap-1 hover:text-amber-600 cursor-pointer transition-colors"
              >
                <MessageCircle size={14} />
                <span>Chat Admin</span>
              </button>
              <span className="text-neutral-300">•</span>
              <button 
                type="button"
                className="flex items-center gap-1 hover:text-amber-600 cursor-pointer transition-colors"
              >
                <CheckCircle2 size={14} className="text-emerald-600" />
                <span>Garansi Tusko</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Fixed Bottom Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-neutral-950/95 border-t border-neutral-800 p-3 backdrop-blur-md flex items-center justify-between gap-3 shadow-2xl">
        <div className="min-w-0">
          <p className="text-[10px] text-neutral-400 uppercase tracking-wider font-bold truncate">
            {getVariantTitle() || 'Total Harga'}
          </p>
          <p className="text-sm font-black text-amber-400 truncate">{formatRupiah(subtotal)}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={isOutOfStock || !allLevelsSelected}
            onClick={handleAddWithQuantity}
            className="px-4 py-2.5 bg-neutral-800 text-white font-black uppercase tracking-wider text-xs rounded-xl border border-neutral-700 disabled:opacity-40 cursor-pointer"
          >
            + Keranjang
          </button>
          <button
            type="button"
            disabled={isOutOfStock || !allLevelsSelected}
            onClick={handleBuyNowAction}
            className="px-4 py-2.5 bg-amber-500 text-neutral-950 font-black uppercase tracking-wider text-xs rounded-xl disabled:opacity-40 cursor-pointer shadow-md"
          >
            Beli Sekarang
          </button>
        </div>
      </div>

      {/* High-Resolution Zoom Lightbox Modal */}
      {isZoomOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center">
            <button
              type="button"
              onClick={() => setIsZoomOpen(false)}
              className="absolute -top-12 right-0 p-2 text-white hover:text-amber-400 cursor-pointer transition-colors"
            >
              <X size={28} />
            </button>
            <img
              src={activeImage}
              alt={product.name}
              className="max-h-[80vh] w-auto object-contain rounded-2xl shadow-2xl"
            />
            <p className="text-white text-xs mt-3 font-semibold uppercase tracking-wider">
              {product.name}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
