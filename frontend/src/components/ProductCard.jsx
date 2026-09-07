import React from 'react';
import { Star, MapPin, BadgeCheck, Plus, ShoppingCart } from 'lucide-react';
import { formatRupiah } from '../utils/formatters';

export default function ProductCard({ 
  product, 
  onAddToCart = () => {},
  onSelectProduct = () => {}
}) {
  const isLowStock = product.stock <= product.stock_minimum && product.stock > 0;
  const isOutOfStock = product.stock <= 0;

  return (
    <div 
      onClick={() => onSelectProduct(product)}
      className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg hover:border-emerald-500 transition-all duration-200 flex flex-col cursor-pointer"
    >
      {/* Product Image Container */}
      <div className="relative aspect-square w-full bg-gray-100 overflow-hidden">
        <img
          src={product.image_url}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
        />

        {/* Badges Overlay */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
          {product.is_official && (
            <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-sm shadow-xs flex items-center gap-0.5">
              Official Store
            </span>
          )}
          {product.free_shipping && (
            <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-sm shadow-xs">
              Bebas Ongkir
            </span>
          )}
        </div>

        {/* Out of Stock Overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-2xs flex items-center justify-center">
            <span className="bg-rose-600 text-white font-bold text-xs px-3 py-1 rounded-md">
              Stok Habis
            </span>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-3.5 flex-1 flex flex-col justify-between">
        <div>
          {/* Title */}
          <h4 className="text-xs sm:text-sm font-medium text-gray-800 line-clamp-2 leading-snug group-hover:text-emerald-700 transition-colors">
            {product.name}
          </h4>

          {/* Price */}
          <div className="mt-2">
            <span className="text-sm sm:text-base font-extrabold text-gray-900">
              {formatRupiah(product.price)}
            </span>
            
            {product.discount_percentage > 0 && (
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1 py-0.2 rounded">
                  {product.discount_percentage}%
                </span>
                <span className="text-[11px] text-gray-400 line-through">
                  {formatRupiah(product.original_price)}
                </span>
              </div>
            )}
          </div>

          {/* Location & Seller */}
          <div className="flex items-center gap-1 text-[11px] text-gray-500 mt-2">
            <MapPin size={12} className="text-gray-400 shrink-0" />
            <span className="truncate">{product.location}</span>
          </div>

          {/* Rating & Sold Count */}
          <div className="flex items-center gap-1.5 text-[11px] text-gray-600 mt-1">
            <div className="flex items-center text-amber-500">
              <Star size={12} className="fill-current" />
              <span className="font-semibold ml-0.5 text-gray-800">{product.rating}</span>
            </div>
            <span className="text-gray-300">•</span>
            <span>{product.sold_count}+ terjual</span>
          </div>
        </div>

        {/* Stock status & Action */}
        <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between">
          <div>
            {isLowStock && (
              <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                Sisa {product.stock}
              </span>
            )}
            {!isLowStock && !isOutOfStock && (
              <span className="text-[10px] text-gray-400">
                Stok: {product.stock}
              </span>
            )}
          </div>

          <button
            type="button"
            disabled={isOutOfStock}
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart(product);
            }}
            className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white rounded-lg text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            title="Tambah ke Keranjang"
          >
            <Plus size={14} />
            <span>Keranjang</span>
          </button>
        </div>
      </div>
    </div>
  );
}
