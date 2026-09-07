import React from 'react';
import { Star, MapPin, Plus, Flame, AlertCircle } from 'lucide-react';
import { formatRupiah } from '../utils/formatters';

export default function ProductCard({ 
  product, 
  onAddToCart = () => {},
  onSelectProduct = () => {}
}) {
  const stock = Number(product.stock ?? 0);
  const minStock = Number(product.stock_minimum ?? 5);
  const isOutOfStock = stock <= 0;
  const isLowStock = !isOutOfStock && stock <= minStock;

  // Percentage for stock bar (low stock warning)
  const stockRatioPercent = Math.min(100, Math.max(10, Math.round((stock / (minStock * 2)) * 100)));

  return (
    <div 
      onClick={() => onSelectProduct(product)}
      className="group bg-white rounded-2xl border border-neutral-200/90 overflow-hidden hover:shadow-xl hover:border-neutral-900 transition-all duration-300 flex flex-col cursor-pointer relative"
    >
      {/* Product Image Container */}
      <div className="relative aspect-square w-full bg-neutral-100 overflow-hidden">
        <img
          src={product.image_url}
          alt={product.name}
          loading="lazy"
          className={`w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ${
            isOutOfStock ? 'grayscale opacity-75' : ''
          }`}
        />

        {/* Badges Overlay */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10">
          {product.is_official && (
            <span className="bg-neutral-950 text-amber-400 text-[10px] font-black px-2 py-0.5 rounded-md shadow-sm uppercase tracking-wider">
              TUSKO PRO
            </span>
          )}
          {product.free_shipping && (
            <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm uppercase tracking-wide">
              Bebas Ongkir
            </span>
          )}
        </div>

        {/* Stock Badge on Top Right */}
        <div className="absolute top-2.5 right-2.5 z-10">
          {isOutOfStock ? (
            <span className="bg-rose-600 text-white text-[10px] font-black px-2 py-0.5 rounded-md shadow-sm uppercase tracking-wider">
              Habis
            </span>
          ) : isLowStock ? (
            <span className="bg-rose-600 text-white text-[10px] font-black px-2 py-0.5 rounded-md shadow-sm flex items-center gap-1 animate-pulse uppercase tracking-wider">
              <Flame size={11} className="fill-current" />
              Sisa {stock}!
            </span>
          ) : null}
        </div>

        {/* Out of Stock Dark Overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-neutral-950/60 backdrop-blur-2xs flex items-center justify-center">
            <span className="bg-neutral-900 text-white font-black text-xs px-3.5 py-1.5 rounded-xl border border-neutral-700 shadow-lg uppercase tracking-wider">
              Stok Habis
            </span>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Seller / Brand */}
          <div className="flex items-center justify-between text-[11px] text-neutral-400 mb-1 font-semibold uppercase tracking-wider">
            <span>{product.seller_name || 'Tusko Official'}</span>
            <div className="flex items-center gap-0.5 text-neutral-500">
              <MapPin size={11} className="shrink-0" />
              <span className="truncate max-w-[100px]">{product.location}</span>
            </div>
          </div>

          {/* Title */}
          <h4 className="text-xs sm:text-sm font-bold text-neutral-900 line-clamp-2 leading-snug group-hover:text-amber-600 transition-colors">
            {product.name}
          </h4>

          {/* Price */}
          <div className="mt-2.5">
            <div className="flex items-baseline gap-1.5">
              <span className="text-base sm:text-lg font-black text-neutral-950 tracking-tight">
                {formatRupiah(product.price)}
              </span>
            </div>
            
            {product.discount_percentage > 0 && (
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] font-extrabold text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded">
                  -{product.discount_percentage}%
                </span>
                <span className="text-[11px] text-neutral-400 line-through font-medium">
                  {formatRupiah(product.original_price)}
                </span>
              </div>
            )}
          </div>

          {/* Rating & Sold Count */}
          <div className="flex items-center gap-1.5 text-[11px] text-neutral-600 mt-2">
            <div className="flex items-center text-amber-500 font-bold">
              <Star size={12} className="fill-current" />
              <span className="ml-1 text-neutral-900">{product.rating}</span>
            </div>
            <span className="text-neutral-300">•</span>
            <span className="font-medium text-neutral-500">{product.sold_count}+ terjual</span>
          </div>

          {/* Stock Indicator */}
          <div className="mt-3 pt-2 border-t border-neutral-100">
            {isOutOfStock ? (
              <div className="flex items-center gap-1 text-[11px] text-rose-600 font-bold">
                <AlertCircle size={12} />
                <span>Stok tidak tersedia</span>
              </div>
            ) : isLowStock ? (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-extrabold text-rose-600 flex items-center gap-0.5 uppercase tracking-wider">
                    <Flame size={11} className="fill-rose-500" />
                    Stok Menipis
                  </span>
                  <span className="text-neutral-500 font-bold">
                    Sisa <strong className="text-rose-600">{stock}</strong> unit
                  </span>
                </div>
                <div className="w-full bg-rose-100 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-rose-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${stockRatioPercent}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between text-[10px] text-neutral-500">
                <span className="flex items-center gap-1 text-emerald-600 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Ready Stock
                </span>
                <span className="text-neutral-400 font-medium">
                  {stock} unit
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-3.5 pt-2 border-t border-neutral-100">
          <button
            type="button"
            disabled={isOutOfStock}
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart(product);
            }}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-neutral-900 text-white hover:bg-amber-500 hover:text-neutral-950 rounded-xl text-xs font-black uppercase tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-xs active:scale-98"
            title={isOutOfStock ? "Stok Habis" : "Tambah ke Keranjang"}
          >
            <Plus size={14} className="stroke-[3]" />
            <span>{isOutOfStock ? 'Stok Habis' : '+ Keranjang'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
