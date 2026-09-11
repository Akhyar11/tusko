import React, { useState, useMemo } from 'react';
import { ShoppingBag, Heart, Check } from 'lucide-react';
import { formatRupiah } from '../utils/formatters';

export default function ProductCard({ 
  product, 
  currentUser = null,
  onAddToCart = () => {},
  onSelectProduct = () => {}
}) {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isAdded, setIsAdded] = useState(false);

  // Variant analysis
  const variants = product.variants || [];
  const hasVariants = Boolean(
    (product.variant_levels && product.variant_levels.length > 0) || 
    (variants && variants.length > 0)
  );

  const inStockVariants = useMemo(() => {
    if (!hasVariants) return [];
    return variants.filter((v) => Number(v.stock ?? 0) > 0);
  }, [hasVariants, variants]);

  const totalStock = useMemo(() => {
    if (hasVariants) {
      return variants.reduce((sum, v) => sum + Number(v.stock ?? 0), 0);
    }
    return Number(product.stock ?? 0);
  }, [hasVariants, variants, product.stock]);

  // Out of stock if no items available
  const isOutOfStock = hasVariants ? inStockVariants.length === 0 : totalStock <= 0;

  // Aturan logika variasi:
  // 1. Jika ada variasinya dan lebih dari 1 variasi yang stoknya masih ada -> masuk ke halaman detail product untuk memilih variasi
  // 2. Jika ada variasinya tapi semua variasi kosong dan HANYA ADA 1 variasi yang stok masih ada -> langsung masukkan variasi tersebut ke keranjang
  // 3. Jika tidak ada variasi -> langsung masukkan ke keranjang
  const hasMultipleVariantsInStock = hasVariants && inStockVariants.length > 1;
  const hasSingleVariantInStock = hasVariants && inStockVariants.length === 1;

  // Determine badge text and styling matching prototype
  const badgeInfo = useMemo(() => {
    if (product.badge) {
      if (product.badge === 'PELAT KARBON') return { text: 'PELAT KARBON', bg: 'bg-blue-600 text-white' };
      if (product.badge === 'POPULER') return { text: 'POPULER', bg: 'bg-emerald-700 text-white' };
      return { text: product.badge, bg: 'bg-black text-white' };
    }
    if (product.id === 1) return { text: 'BARU', bg: 'bg-black text-white' };
    if (product.id === 2) return { text: 'BEST SELLER', bg: 'bg-black text-white' };
    if (product.id === 3) return { text: 'PELAT KARBON', bg: 'bg-blue-600 text-white' };
    if (product.id === 4) return { text: 'POPULER', bg: 'bg-emerald-700 text-white' };
    if (product.is_official) return { text: 'OFFICIAL', bg: 'bg-black text-white' };
    return null;
  }, [product]);

  // Determine category subtitle line
  const categorySubtitle = useMemo(() => {
    if (product.category_subtitle) return product.category_subtitle;
    if (product.id === 1) return 'Sepak Bola • Matchday';
    if (product.id === 2) return 'Running • Pria/Wanita';
    if (product.id === 3) return 'Marathon • Pro';
    if (product.id === 4) return 'Training • Celana';
    if (product.id === 10) return 'Equipment • Gym & Travel';
    return `${product.location || 'Official'} • Performance`;
  }, [product]);

  // Determine variant summary line
  const variantSummary = useMemo(() => {
    if (hasVariants) {
      if (inStockVariants.length === 1) {
        const single = inStockVariants[0];
        const vText = [single.color, single.size ? `Ukuran ${single.size}` : ''].filter(Boolean).join(' - ') || single.size || '1 Opsi';
        return `Sisa 1 Varian: ${vText}`;
      }
      const sizeLevel = product.variant_levels?.find(l => l.code === 'size');
      if (sizeLevel && sizeLevel.options?.length > 0) {
        const opts = sizeLevel.options;
        return `${opts.length} Pilihan Ukuran (${opts[0]} - ${opts[opts.length - 1]})`;
      }
      return `${variants.length} Pilihan Variasi`;
    }
    return 'Stok Siap Kirim';
  }, [hasVariants, inStockVariants, product.variant_levels, variants]);

  const handleCartButtonClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;

    // Jika belum login, tombol keranjang wajib meminta login terlebih dahulu
    if (!currentUser) {
      onAddToCart(product, 1);
      return;
    }

    // Kasus 1: Produk memiliki variasi dan LEBIH DARI 1 variasi masih tersedia stok
    // Harus masuk ke halaman detail product dulu agar pembeli dapat memilih variasi
    if (hasMultipleVariantsInStock) {
      onSelectProduct(product);
      return;
    }

    // Kasus 2: Produk memiliki variasi, tetapi semua variasi kosong & HANYA 1 variasi yang masih ada stok
    // Langsung masukkan produk dengan variasi tunggal yang tersisa ke keranjang
    if (hasSingleVariantInStock) {
      const singleVariant = inStockVariants[0];
      const sizeName = singleVariant.size || singleVariant.name;
      const colorName = singleVariant.color;
      const variantParts = [colorName, sizeName ? `Ukuran ${sizeName}` : ''].filter(Boolean);
      const variantLabel = variantParts.join(' - ') || sizeName || 'Standar';

      const productToAdd = {
        ...product,
        price: Number(singleVariant.price) || product.price,
        selected_variant: singleVariant,
        variant_name: variantLabel,
        variant_sku: singleVariant.sku || product.sku
      };

      onAddToCart(productToAdd, 1);
      setIsAdded(true);
      setTimeout(() => setIsAdded(false), 2000);
      return;
    }

    // Kasus 3: Produk tidak memiliki variasi sama sekali (produk tunggal standar)
    // Langsung masukkan produk ke keranjang
    onAddToCart(product, 1);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  return (
    <div className="bg-white border border-neutral-200 hover:border-black transition-colors p-2.5 sm:p-4 flex flex-col justify-between group select-none">
      <div>
        {/* Aspect-square Image Container - Mengklik foto membuka Detail Produk */}
        <div 
          onClick={() => onSelectProduct(product)}
          className="aspect-square bg-neutral-100 relative overflow-hidden mb-2.5 cursor-pointer"
          title="Klik untuk melihat detail produk"
        >
          <img 
            src={product.image_url} 
            alt={product.name} 
            loading="lazy"
            className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${
              isOutOfStock ? 'grayscale opacity-75' : ''
            }`}
          />
          
          {/* Top-Left Badge */}
          {badgeInfo && (
            <span className={`absolute top-2 left-2 text-[8px] sm:text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 ${badgeInfo.bg}`}>
              {badgeInfo.text}
            </span>
          )}

          {/* Top-Right Wishlist Heart Button */}
          <button 
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsWishlisted(!isWishlisted);
            }}
            className="absolute top-2 right-2 w-6 h-6 sm:w-7 sm:h-7 bg-white/90 rounded-none flex items-center justify-center text-neutral-700 hover:text-red-500 shadow-2xs transition-colors cursor-pointer"
            title="Tambah ke Wishlist"
          >
            <Heart 
              size={13} 
              className={isWishlisted ? 'fill-red-500 text-red-500' : 'text-neutral-700'} 
            />
          </button>
        </div>

        {/* Category Line */}
        <span className="text-[9px] sm:text-[10px] font-bold text-neutral-400 uppercase tracking-wider block truncate">
          {categorySubtitle}
        </span>

        {/* Product Title - Mengklik judul membuka Detail Produk */}
        <h3 
          onClick={() => onSelectProduct(product)}
          className="font-sport font-black text-xs sm:text-sm uppercase tracking-tight line-clamp-2 mt-0.5 sm:mt-1 leading-snug hover:underline h-8 sm:h-10 cursor-pointer text-black"
          title="Klik untuk melihat detail produk"
        >
          {product.name}
        </h3>
        
        {/* Price Row */}
        <div className="mt-1.5 flex items-baseline gap-1.5 flex-wrap">
          <span className="font-sport font-black text-xs sm:text-base text-black">
            {formatRupiah(product.price)}
          </span>
          {product.discount_percentage ? (
            <span className="text-[9px] font-bold text-red-600 bg-red-50 px-1">
              -{product.discount_percentage}%
            </span>
          ) : null}
          {product.original_price && product.original_price > product.price && !product.discount_percentage ? (
            <span className="text-[9px] text-neutral-400 line-through">
              {formatRupiah(product.original_price)}
            </span>
          ) : null}
        </div>

        {/* Options Info */}
        <div className="mt-1 text-[9px] sm:text-[10px] font-medium text-neutral-500">
          {variantSummary}
        </div>
      </div>

      {/* Add to Cart Button */}
      <button
        type="button"
        disabled={isOutOfStock}
        onClick={handleCartButtonClick}
        className={`mt-3 w-full font-sport font-bold text-[10px] sm:text-[11px] uppercase tracking-wider py-2 sm:py-2.5 px-2 flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
          isOutOfStock 
            ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
            : isAdded
              ? 'bg-emerald-600 text-white'
              : 'bg-black hover:bg-neutral-800 text-white active:scale-98'
        }`}
        title={
          isOutOfStock 
            ? 'Stok produk habis' 
            : hasMultipleVariantsInStock 
              ? 'Pilih variasi produk di halaman detail' 
              : 'Langsung masukkan ke keranjang'
        }
      >
        {isAdded ? (
          <>
            <Check size={13} className="stroke-[3]" />
            <span>MASUK KERANJANG</span>
          </>
        ) : (
          <>
            <ShoppingBag size={13} />
            <span>{isOutOfStock ? 'STOK HABIS' : '+ KERANJANG'}</span>
          </>
        )}
      </button>
    </div>
  );
}
