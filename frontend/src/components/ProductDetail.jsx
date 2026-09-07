import React, { useState } from 'react';
import { 
  Star, 
  MapPin, 
  BadgeCheck, 
  Truck, 
  ShieldCheck, 
  ArrowLeft, 
  Minus, 
  Plus, 
  Heart, 
  Share2, 
  MessageCircle, 
  Store,
  Flame,
  AlertCircle
} from 'lucide-react';
import { formatRupiah } from '../utils/formatters';

export default function ProductDetail({ 
  product, 
  onBack = () => {},
  onAddToCart = () => {},
  onBuyNow = () => {}
}) {
  const galleryImages = product?.gallery && product.gallery.length > 0 
    ? product.gallery 
    : [product?.image_url].filter(Boolean);

  const [activeImage, setActiveImage] = useState(galleryImages[0] || '');
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [isWishlist, setIsWishlist] = useState(false);
  const [activeTab, setActiveTab] = useState('detail');

  if (!product) return null;

  const stock = Number(product.stock ?? 0);
  const minStock = Number(product.stock_minimum ?? 5);
  const isOutOfStock = stock <= 0;
  const isLowStock = !isOutOfStock && stock <= minStock;

  const handleDecrease = () => {
    if (quantity > 1) {
      setQuantity((prev) => prev - 1);
    }
  };

  const handleIncrease = () => {
    if (quantity < stock) {
      setQuantity((prev) => prev + 1);
    }
  };

  const handleAddWithQuantity = () => {
    if (isOutOfStock) return;
    onAddToCart(product, quantity, notes);
  };

  const handleBuyNowAction = () => {
    if (isOutOfStock) return;
    onBuyNow(product, quantity, notes);
  };

  const subtotal = product.price * quantity;

  return (
    <div className="py-4">
      {/* Breadcrumb & Back Button */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-emerald-700 hover:text-emerald-800 bg-white hover:bg-emerald-50 px-3 py-1.5 rounded-lg border border-gray-200 transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>Kembali ke Katalog</span>
        </button>

        <nav className="hidden md:flex items-center gap-2 text-xs text-gray-500">
          <span className="hover:text-emerald-600 cursor-pointer" onClick={onBack}>Beranda</span>
          <span>/</span>
          <span className="text-gray-400">Katalog Produk</span>
          <span>/</span>
          <span className="text-gray-800 font-medium truncate max-w-xs">{product.name}</span>
        </nav>
      </div>

      {/* Main Grid: Gallery | Details | Action Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Gallery (4 cols) */}
        <div className="lg:col-span-4">
          <div className="sticky top-20 space-y-3">
            {/* Main Image */}
            <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-white border border-gray-200 shadow-xs">
              <img
                src={activeImage}
                alt={product.name}
                className="w-full h-full object-cover object-center transition-all duration-300"
              />

              {/* Badges */}
              <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
                {product.is_official && (
                  <span className="bg-emerald-600 text-white text-xs font-bold px-2.5 py-1 rounded-md shadow-xs flex items-center gap-1">
                    <BadgeCheck size={14} />
                    Official Store
                  </span>
                )}
                {product.free_shipping && (
                  <span className="bg-amber-500 text-white text-xs font-bold px-2.5 py-1 rounded-md shadow-xs flex items-center gap-1">
                    <Truck size={14} />
                    Bebas Ongkir
                  </span>
                )}
              </div>
            </div>

            {/* Thumbnail Strip */}
            {galleryImages.length > 1 && (
              <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
                {galleryImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(img)}
                    className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                      activeImage === img
                        ? 'border-emerald-600 ring-2 ring-emerald-100'
                        : 'border-gray-200 hover:border-gray-300 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Wishlist & Share */}
            <div className="flex items-center justify-center gap-4 pt-2">
              <button
                onClick={() => setIsWishlist(!isWishlist)}
                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                  isWishlist 
                    ? 'border-rose-200 bg-rose-50 text-rose-600' 
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Heart size={16} className={isWishlist ? 'fill-rose-500 text-rose-500' : ''} />
                <span>{isWishlist ? 'Favorit' : 'Tambah Favorit'}</span>
              </button>

              <button
                onClick={() => navigator.clipboard?.writeText(window.location.href)}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <Share2 size={16} />
                <span>Bagikan</span>
              </button>
            </div>
          </div>
        </div>

        {/* Center Column: Product Specs & Description (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Title and Rating */}
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">
              {product.name}
            </h1>

            <div className="flex items-center gap-3 mt-2.5 text-xs text-gray-600 flex-wrap">
              <div className="flex items-center text-amber-500 font-bold">
                <Star size={15} className="fill-current" />
                <span className="ml-1 text-gray-900">{product.rating}</span>
                <span className="text-gray-400 font-normal ml-1">({product.rating_count} ulasan)</span>
              </div>
              <span className="text-gray-300">•</span>
              <span>Terjual <strong className="text-gray-900">{product.sold_count}+</strong></span>
              <span className="text-gray-300">•</span>
              <span className="flex items-center gap-1 text-gray-500">
                <MapPin size={13} className="text-gray-400" />
                Dikirim dari {product.location}
              </span>
            </div>
          </div>

          {/* Pricing Box */}
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-2xs">
            <div className="flex items-baseline gap-2.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600">
                {formatRupiah(product.price)}
              </span>
              {product.discount_percentage > 0 && (
                <>
                  <span className="text-xs font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                    {product.discount_percentage}% OFF
                  </span>
                  <span className="text-sm text-gray-400 line-through">
                    {formatRupiah(product.original_price)}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Seller / Store Banner */}
          <div className="bg-white rounded-xl p-3.5 border border-gray-200 shadow-2xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-base shrink-0">
                <Store size={22} />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="font-bold text-gray-900 text-sm">{product.seller_name}</h4>
                  {product.is_official && (
                    <BadgeCheck size={16} className="text-emerald-600" />
                  )}
                </div>
                <p className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                  Online • Kota {product.location}
                </p>
              </div>
            </div>

            <button className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-emerald-600 text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer">
              Ikuti Toko
            </button>
          </div>

          {/* Shipping & Protection Banner */}
          <div className="bg-emerald-50/50 rounded-xl p-3.5 border border-emerald-100 text-xs space-y-2">
            <div className="flex items-center gap-2 text-emerald-800 font-semibold">
              <Truck size={16} className="text-emerald-600" />
              <span>Ongkos Kirim Gratis ke Seluruh Indonesia</span>
            </div>
            <p className="text-gray-600 text-[11px] pl-6">
              Mendukung kurir JNE, TIKI, SiCepat, Pos Indonesia dengan asuransi pengiriman terjamin.
            </p>
          </div>

          {/* Tabs: Detail & Spesifikasi */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveTab('detail')}
                className={`flex-1 py-3 text-xs sm:text-sm font-bold border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'detail'
                    ? 'border-emerald-600 text-emerald-600 bg-emerald-50/20'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Detail Produk
              </button>
              <button
                onClick={() => setActiveTab('spec')}
                className={`flex-1 py-3 text-xs sm:text-sm font-bold border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'spec'
                    ? 'border-emerald-600 text-emerald-600 bg-emerald-50/20'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Spesifikasi
              </button>
            </div>

            <div className="p-4">
              {activeTab === 'detail' ? (
                <div className="prose prose-sm text-gray-700 leading-relaxed text-xs sm:text-sm space-y-3">
                  <p>{product.description}</p>
                  <p className="text-gray-500 text-xs">
                    Catatan Toko: Mohon lakukan video unboxing saat paket diterima untuk mempermudah klaim asuransi bila ada kendala saat pengiriman.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 text-xs sm:text-sm">
                  {product.specifications ? (
                    Object.entries(product.specifications).map(([key, val], idx) => (
                      <div key={idx} className="py-2.5 flex">
                        <span className="w-1/3 text-gray-400 font-medium">{key}</span>
                        <span className="w-2/3 text-gray-800 font-semibold">{val}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 py-2">Spesifikasi standar pabrik.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Sticky Purchase Action Card (3 cols) */}
        <div className="lg:col-span-3">
          <div className="sticky top-20 bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-900 text-sm">
              Atur Jumlah dan Catatan
            </h3>

            {/* Snapshot item */}
            <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
              <img
                src={product.image_url}
                alt=""
                className="w-12 h-12 rounded-lg object-cover border border-gray-200 shrink-0"
              />
              <div className="truncate">
                <p className="text-xs font-medium text-gray-800 truncate">{product.name}</p>
                <p className="text-xs font-bold text-emerald-600 mt-0.5">{formatRupiah(product.price)}</p>
              </div>
            </div>

            {/* Quantity Controller */}
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600 font-medium">Jumlah:</span>
                <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden bg-gray-50">
                  <button
                    type="button"
                    disabled={quantity <= 1 || isOutOfStock}
                    onClick={handleDecrease}
                    className="p-1.5 text-gray-600 hover:bg-gray-200 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="px-3 text-xs font-bold text-gray-800 min-w-8 text-center">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    disabled={quantity >= stock || isOutOfStock}
                    onClick={handleIncrease}
                    className="p-1.5 text-gray-600 hover:bg-gray-200 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              {/* Stock info */}
              <div className="mt-2 text-right">
                {isOutOfStock ? (
                  <span className="text-[11px] font-bold text-rose-600 flex items-center justify-end gap-1">
                    <AlertCircle size={12} />
                    Stok Habis
                  </span>
                ) : isLowStock ? (
                  <span className="text-[11px] font-bold text-rose-500 flex items-center justify-end gap-1">
                    <Flame size={12} className="fill-rose-500" />
                    Sisa {stock} buah!
                  </span>
                ) : (
                  <span className="text-[11px] text-gray-500">
                    Total Stok: <strong className="text-gray-700">{stock}</strong>
                  </span>
                )}
              </div>
            </div>

            {/* Optional note */}
            <div>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Tambah catatan (warna, ukuran, dll)..."
                className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* Subtotal */}
            <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs text-gray-500">Subtotal:</span>
              <span className="text-base sm:text-lg font-extrabold text-gray-900">
                {formatRupiah(subtotal)}
              </span>
            </div>

            {/* Purchase Buttons */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                disabled={isOutOfStock}
                onClick={handleAddWithQuantity}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                + Keranjang
              </button>

              <button
                type="button"
                disabled={isOutOfStock}
                onClick={handleBuyNowAction}
                className="w-full py-2.5 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs sm:text-sm rounded-xl border border-emerald-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                Beli Langsung
              </button>
            </div>

            {/* Secondary features */}
            <div className="pt-2 flex items-center justify-around text-xs text-gray-500 border-t border-gray-100">
              <button className="flex items-center gap-1 hover:text-emerald-600 cursor-pointer">
                <MessageCircle size={14} />
                <span>Chat Penjual</span>
              </button>
              <button className="flex items-center gap-1 hover:text-emerald-600 cursor-pointer">
                <ShieldCheck size={14} />
                <span>Garansi Resmi</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
