import React, { useState, useMemo } from 'react';
import { 
  Trash2, 
  Minus, 
  Plus, 
  ArrowLeft, 
  ShoppingBag, 
  Store, 
  BadgeCheck, 
  Truck, 
  ShieldCheck,
  Tag,
  AlertCircle,
  Flame,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { formatRupiah } from '../utils/formatters';
import { apiClient } from '../services/apiClient';

export default function CartPage({
  cart = [],
  onUpdateQuantity = () => {},
  onRemoveItem = () => {},
  onClearCart = () => {},
  onBackToShopping = () => {},
  onProceedToCheckout = () => {}
}) {
  // Selection state for items (default all selected)
  const [selectedItemIds, setSelectedItemIds] = useState(() => 
    cart.map(item => item.id)
  );

  const [promoCode, setPromoCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState(null);
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoError, setPromoError] = useState('');
  const [promoSuccess, setPromoSuccess] = useState('');
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);

  // Confirmation modal state for deleting items
  const [deleteTarget, setDeleteTarget] = useState(null); // { type: 'single', item } | { type: 'bulk', ids, count }

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;

    if (deleteTarget.type === 'single') {
      onRemoveItem(deleteTarget.item.id);
      setSelectedItemIds(prev => prev.filter(id => id !== deleteTarget.item.id));
    } else if (deleteTarget.type === 'bulk') {
      deleteTarget.ids.forEach(id => onRemoveItem(id));
      setSelectedItemIds(prev => prev.filter(id => !deleteTarget.ids.includes(id)));
    }

    setDeleteTarget(null);
  };

  // Toggle single item selection
  const handleToggleItem = (id) => {
    setSelectedItemIds(prev => 
      prev.includes(id) ? prev.filter(itemId => itemId !== id) : [...prev, id]
    );
  };

  // Toggle select all items
  const handleToggleSelectAll = () => {
    if (selectedItemIds.length === cart.length) {
      setSelectedItemIds([]);
    } else {
      setSelectedItemIds(cart.map(item => item.id));
    }
  };

  // Calculations for selected items
  const selectedItems = useMemo(() => {
    return cart.filter(item => selectedItemIds.includes(item.id));
  }, [cart, selectedItemIds]);

  const subtotal = useMemo(() => {
    return selectedItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  }, [selectedItems]);

  const totalOriginalPrice = useMemo(() => {
    return selectedItems.reduce((acc, item) => acc + ((item.original_price || item.price) * item.quantity), 0);
  }, [selectedItems]);

  const totalProductDiscount = Math.max(0, totalOriginalPrice - subtotal);
  const estimatedShipping = selectedItems.length > 0 ? (selectedItems.some(i => i.free_shipping) ? 0 : 15000) : 0;
  const grandTotal = Math.max(0, subtotal - promoDiscount + estimatedShipping);

  // Apply promo code dynamically via backend API (VoucherController)
  const handleApplyPromo = async (e) => {
    e.preventDefault();
    const code = promoCode.trim().toUpperCase();
    if (!code) return;

    setIsApplyingPromo(true);
    setPromoError('');
    setPromoSuccess('');

    try {
      // Ambil daftar voucher aktif dari backend
      const res = await apiClient.get('/api/vouchers');
      const vouchers = res.data || [];
      const matched = vouchers.find(v => v.code === code && v.is_active);

      if (!matched) {
        setPromoError(`Kode voucher "${code}" tidak ditemukan atau sudah tidak aktif.`);
        setPromoDiscount(0);
        setAppliedVoucher(null);
        return;
      }

      // Validasi minimum purchase
      const minPurchase = Number(matched.min_purchase || 0);
      if (subtotal < minPurchase) {
        setPromoError(`Voucher "${matched.title}" membutuhkan minimum belanja ${formatRupiah(minPurchase)}.`);
        setPromoDiscount(0);
        setAppliedVoucher(null);
        return;
      }

      let discountVal = 0;
      if (matched.discount_type === 'percentage') {
        discountVal = (subtotal * Number(matched.discount_value)) / 100;
        if (matched.max_discount) {
          discountVal = Math.min(discountVal, Number(matched.max_discount));
        }
      } else {
        discountVal = Number(matched.discount_value || 0);
      }

      setPromoDiscount(discountVal);
      setAppliedVoucher(matched);
      setPromoSuccess(`Voucher "${matched.title}" berhasil diterapkan!`);
    } catch {
      setPromoError('Gagal memvalidasi kode voucher. Silakan periksa koneksi.');
      setPromoDiscount(0);
      setAppliedVoucher(null);
    } finally {
      setIsApplyingPromo(false);
    }
  };

  // Group cart items by seller
  const groupedCart = useMemo(() => {
    const groups = {};
    cart.forEach(item => {
      const sellerKey = item.seller_name || 'Tusko Warehouse';
      if (!groups[sellerKey]) {
        groups[sellerKey] = {
          sellerName: sellerKey,
          location: item.location || 'Gudang Pusat',
          isOfficial: item.is_official ?? true,
          freeShipping: item.free_shipping ?? true,
          items: []
        };
      }
      groups[sellerKey].items.push(item);
    });
    return Object.values(groups);
  }, [cart]);

  if (cart.length === 0) {
    return (
      <div className="w-full py-16 px-4">
        <div className="bg-white rounded-none border-2 border-black p-12 text-center shadow-none max-w-2xl mx-auto">
          <div className="w-20 h-20 bg-black text-white rounded-none flex items-center justify-center mx-auto mb-5 -skew-x-6">
            <ShoppingBag size={40} className="skew-x-6 text-neutral-300" />
          </div>
          <h2 className="text-2xl font-sport font-black uppercase text-black tracking-tight">
            Wah, keranjang belanjamu kosong!
          </h2>
          <p className="text-xs sm:text-sm text-neutral-600 mt-2 max-w-md mx-auto leading-relaxed">
            Yuk, jelajahi katalog perlengkapan atletik Tusko dan temukan produk performa terbaikmu sekarang juga.
          </p>
          <button
            type="button"
            onClick={onBackToShopping}
            className="mt-6 px-8 py-3 bg-black hover:bg-neutral-800 text-white text-xs sm:text-sm font-sport font-black uppercase tracking-wider rounded-none transition-colors cursor-pointer -skew-x-3 hover:skew-x-0"
          >
            Mulai Belanja Sekarang
          </button>
        </div>
      </div>
    );
  }

  const isAllSelected = selectedItemIds.length === cart.length && cart.length > 0;

  return (
    <div className="py-4 space-y-6">
      {/* Header & Back Button */}
      <div className="flex items-center justify-between border-b-2 border-black pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToShopping}
            className="flex items-center gap-1.5 text-xs font-sport font-black uppercase text-black hover:text-white bg-white hover:bg-black px-3.5 py-2 rounded-none border border-black transition-colors cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span>Lanjut Belanja</span>
          </button>
          <h1 className="text-xl sm:text-2xl font-sport font-black uppercase tracking-tight text-black">
            Keranjang Belanja <span className="text-neutral-400 font-bold">({cart.length})</span>
          </h1>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs font-sport font-bold uppercase text-neutral-500">
          <Truck size={16} className="text-black" />
          <span>Garansi Original &amp; Bebas Pengembalian</span>
        </div>
      </div>

      {/* Main Grid: Cart Items (8 cols) | Order Summary (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Cart Items List */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Select All & Bulk Action Bar */}
          <div className="bg-white rounded-none border-2 border-black p-4 flex items-center justify-between shadow-none">
            <label className="flex items-center gap-3 text-xs sm:text-sm font-sport font-black uppercase text-black cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={handleToggleSelectAll}
                className="w-4 h-4 rounded-none text-black focus:ring-black border-2 border-black cursor-pointer"
              />
              <span>Pilih Semua Produk ({cart.length})</span>
            </label>

            {selectedItemIds.length > 0 && (
              <button
                type="button"
                onClick={() => setDeleteTarget({
                  type: 'bulk',
                  ids: selectedItemIds,
                  count: selectedItemIds.length
                })}
                className="text-xs font-sport font-bold uppercase text-neutral-500 hover:text-red-600 flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Trash2 size={15} />
                <span>Hapus Terpilih ({selectedItemIds.length})</span>
              </button>
            )}
          </div>

          {/* Grouped Stores */}
          {groupedCart.map((group, groupIdx) => (
            <div key={groupIdx} className="bg-white rounded-none border-2 border-black overflow-hidden shadow-none">
              
              {/* Store Header */}
              <div className="p-4 bg-neutral-100 border-b-2 border-black flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 bg-black text-white rounded-none flex items-center justify-center -skew-x-6">
                    <Store size={14} className="skew-x-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-sport font-black uppercase text-xs sm:text-sm text-black">
                        {group.sellerName}
                      </span>
                      {group.isOfficial && (
                        <span className="bg-black text-white text-[9px] font-sport font-black uppercase tracking-wider px-2 py-0.5 rounded-none flex items-center gap-1">
                          <BadgeCheck size={11} className="text-white" />
                          <span>Official</span>
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-sport font-bold uppercase text-neutral-500">
                      Pengiriman dari {group.location}
                    </span>
                  </div>
                </div>

                {group.freeShipping && (
                  <span className="inline-flex items-center gap-1.5 bg-neutral-200 border border-neutral-300 text-black text-[10px] font-sport font-black uppercase px-2.5 py-1 rounded-none">
                    <Truck size={12} className="text-neutral-700" />
                    <span>Tersedia Bebas Ongkir</span>
                  </span>
                )}
              </div>

              {/* Items in this Store */}
              <div className="divide-y-2 divide-neutral-200">
                {group.items.map(item => {
                  const isChecked = selectedItemIds.includes(item.id);

                  return (
                    <div 
                      key={item.id} 
                      className={`p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors ${
                        isChecked ? 'bg-white' : 'bg-neutral-50/70'
                      }`}
                    >
                      {/* Checkbox + Image + Details */}
                      <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleItem(item.id)}
                          className="mt-1 w-4 h-4 rounded-none text-black focus:ring-black border-2 border-black cursor-pointer shrink-0"
                        />

                        {/* Product Image */}
                        <div className="relative w-20 h-20 sm:w-24 sm:h-24 bg-neutral-100 rounded-none overflow-hidden shrink-0 border border-neutral-300">
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="w-full h-full object-cover object-center"
                          />
                          {item.discount_percentage > 0 && (
                            <span className="absolute top-1 left-1 bg-red-600 text-white text-[9px] font-sport font-black uppercase px-1.5 py-0.5 rounded-none">
                              -{item.discount_percentage}%
                            </span>
                          )}
                        </div>

                        {/* Info */}
                        <div className="min-w-0 flex-1 space-y-1">
                          <h3 className="font-sport font-black text-xs sm:text-sm text-black uppercase tracking-tight line-clamp-2 leading-snug">
                            {item.name}
                          </h3>

                          {/* Notes if any */}
                          {item.notes && (
                            <p className="text-[11px] text-neutral-500 font-medium italic">
                              Catatan: "{item.notes}"
                            </p>
                          )}

                          {/* Price details */}
                          <div className="flex items-baseline gap-2 flex-wrap pt-0.5">
                            <span className="text-sm sm:text-base font-sport font-black text-black">
                              {formatRupiah(item.price)}
                            </span>
                            {item.original_price && item.original_price > item.price && (
                              <span className="text-xs text-neutral-400 line-through font-sport font-bold">
                                {formatRupiah(item.original_price)}
                              </span>
                            )}
                          </div>

                          {/* Low stock alert */}
                          {item.stock <= (item.stock_minimum || 5) && item.stock > 0 && (
                            <div className="flex items-center gap-1 text-[11px] font-sport font-bold uppercase text-red-600 pt-0.5">
                              <Flame size={12} />
                              <span>Sisa {item.stock} unit lagi!</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Quantity Controller & Delete */}
                      <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4 self-end sm:self-center pl-7 sm:pl-0">
                        {/* Subtotal Item for mobile */}
                        <div className="sm:hidden font-sport font-black text-xs text-black">
                          Subtotal: {formatRupiah(item.price * item.quantity)}
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Stepper +/- */}
                          <div className="flex items-center border-2 border-black rounded-none bg-white">
                            <button
                              type="button"
                              disabled={item.quantity <= 1}
                              onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                              className="p-1.5 text-black hover:bg-black hover:text-white disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-black cursor-pointer transition-colors rounded-none"
                              title="Kurangi 1"
                            >
                              <Minus size={14} />
                            </button>

                            <span className="w-9 text-center text-xs font-sport font-black text-black select-none">
                              {item.quantity}
                            </span>

                            <button
                              type="button"
                              disabled={item.quantity >= item.stock}
                              onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                              className="p-1.5 text-black hover:bg-black hover:text-white disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-black cursor-pointer transition-colors rounded-none"
                              title="Tambah 1"
                            >
                              <Plus size={14} />
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => setDeleteTarget({ type: 'single', item })}
                            className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-none transition-colors cursor-pointer"
                            title="Hapus dari keranjang"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        {/* Quantity notes / max stock warning */}
                        {item.quantity >= item.stock && item.stock > 0 && (
                          <span className="text-[10px] font-sport font-bold uppercase text-amber-600">
                            Maks. {item.stock} unit (stok batas)
                          </span>
                        )}
                      </div>

                    </div>
                  );
                })}
              </div>

            </div>
          ))}

        </div>

        {/* Right Column: Order Summary (Sticky) */}
        <div className="lg:col-span-4">
          <div className="sticky top-24 bg-white rounded-none border-2 border-black p-5 sm:p-6 space-y-4">
            <h3 className="font-sport font-black uppercase text-black text-base tracking-wider pb-3 border-b-2 border-black flex items-center justify-between">
              <span>Ringkasan Belanja</span>
              <span className="text-black font-sport font-black text-xs">TUSKO STORE</span>
            </h3>

            {/* Promo Voucher Form */}
            <form onSubmit={handleApplyPromo} className="space-y-2">
              <label className="text-xs font-sport font-bold uppercase text-black flex items-center gap-1.5">
                <Tag size={14} className="text-neutral-900" />
                <span>Voucher Promo Toko</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  placeholder="Kode Voucher..."
                  className="flex-1 text-xs px-3 py-2 bg-neutral-100 border border-neutral-300 rounded-none focus:outline-none focus:border-black uppercase font-mono"
                />
                <button
                  type="submit"
                  disabled={isApplyingPromo}
                  className="px-4 py-2 bg-black hover:bg-neutral-800 text-white text-xs font-sport font-black uppercase tracking-wider rounded-none transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isApplyingPromo ? '...' : 'Gunakan'}
                </button>
              </div>
              {promoSuccess && (
                <p className="text-[11px] font-sport font-bold uppercase text-black bg-neutral-100 border border-neutral-300 p-2 rounded-none flex items-center gap-1">
                  <Sparkles size={12} />
                  <span>{promoSuccess} (-{formatRupiah(promoDiscount)})</span>
                </p>
              )}
              {promoError && (
                <p className="text-[11px] font-sport font-bold uppercase text-red-600 bg-red-50 border border-red-200 p-2 rounded-none">
                  {promoError}
                </p>
              )}
            </form>

            {/* Breakdown */}
            <div className="space-y-2.5 pt-3 border-t border-neutral-200 text-xs text-neutral-700">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total Harga ({selectedItems.reduce((s, i) => s + i.quantity, 0)} barang)</span>
                <span className="font-sport font-black text-sm text-black">{formatRupiah(subtotal)}</span>
              </div>

              {totalProductDiscount > 0 && (
                <div className="flex justify-between items-center text-red-600 font-sport font-bold">
                  <span>Total Diskon Produk</span>
                  <span>-{formatRupiah(totalProductDiscount)}</span>
                </div>
              )}

              {promoDiscount > 0 && (
                <div className="flex justify-between items-center text-emerald-800 font-sport font-bold">
                  <span>Potongan Voucher Promo</span>
                  <span>-{formatRupiah(promoDiscount)}</span>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1 font-medium">
                  <span>Biaya Pengiriman</span>
                  <Truck size={13} className="text-neutral-500" />
                </span>
                <span className="font-sport font-bold text-black">
                  {estimatedShipping === 0 ? (
                    <span className="text-black font-sport font-black bg-neutral-200 px-2 py-0.5 rounded-none text-[10px] uppercase border border-neutral-300">
                      Gratis Ongkir
                    </span>
                  ) : (
                    formatRupiah(estimatedShipping)
                  )}
                </span>
              </div>

              <div className="flex justify-between items-center text-neutral-500 text-xs">
                <span>Biaya Layanan Aplikasi</span>
                <span className="font-sport font-bold text-neutral-700">
                  {selectedItems.length > 0 ? formatRupiah(1000) : formatRupiah(0)}
                </span>
              </div>
            </div>

            {/* Total Savings Highlight Badge */}
            {(totalProductDiscount > 0 || promoDiscount > 0) && (
              <div className="bg-neutral-100 border border-neutral-300 rounded-none p-3 flex items-center justify-between text-xs font-sport font-black uppercase text-black">
                <span>Total Hemat:</span>
                <span className="text-red-600 font-black">
                  {formatRupiah(totalProductDiscount + promoDiscount)}
                </span>
              </div>
            )}

            {/* Grand Total */}
            <div className="pt-3 border-t-2 border-black flex items-baseline justify-between">
              <div>
                <span className="text-[11px] font-sport font-bold uppercase text-neutral-500 block">Total Pembayaran:</span>
                <span className="text-2xl sm:text-3xl font-sport font-black text-black tracking-tight">
                  {formatRupiah(selectedItems.length > 0 ? grandTotal + 1000 : 0)}
                </span>
              </div>
            </div>

            {/* Checkout Button */}
            <button
              type="button"
              disabled={selectedItems.length === 0}
              onClick={() => onProceedToCheckout({ 
                selectedItems, 
                appliedVoucher,
                promoDiscount,
                grandTotal: selectedItems.length > 0 ? grandTotal + 1000 : 0 
              })}
              className="w-full py-3.5 px-4 bg-black hover:bg-neutral-800 text-white font-sport font-black text-xs sm:text-sm uppercase tracking-wider rounded-none transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 -skew-x-3 hover:skew-x-0"
            >
              <span>Lanjut ke Pembayaran ({selectedItems.length})</span>
              <ChevronRight size={16} />
            </button>

            {/* Guarantees */}
            <div className="pt-2 flex items-center justify-center gap-2 text-[10px] font-sport font-bold uppercase text-neutral-500 text-center">
              <ShieldCheck size={14} className="text-black" />
              <span>Jaminan transaksi aman &amp; perlindungan pembeli 100%</span>
            </div>

          </div>
        </div>

      </div>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-white rounded-none border-2 border-black max-w-sm w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-none bg-red-600 text-white flex items-center justify-center shrink-0">
                <Trash2 size={20} />
              </div>
              <div>
                <h3 className="text-base font-sport font-black uppercase text-black">
                  {deleteTarget.type === 'single' ? 'Hapus Barang?' : 'Hapus Pilihan Barang?'}
                </h3>
                <p className="text-xs text-neutral-500 font-medium">
                  Tindakan ini akan menghapus barang dari keranjang belanja.
                </p>
              </div>
            </div>

            {/* Preview of item being deleted */}
            {deleteTarget.type === 'single' && (
              <div className="my-3 p-3 bg-neutral-100 rounded-none border border-neutral-300 flex items-center gap-3">
                <img
                  src={deleteTarget.item.image_url}
                  alt=""
                  className="w-12 h-12 rounded-none object-cover border border-neutral-300 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-sport font-bold uppercase text-black truncate">{deleteTarget.item.name}</p>
                  <p className="text-xs font-sport font-black text-black mt-0.5">{formatRupiah(deleteTarget.item.price)}</p>
                </div>
              </div>
            )}

            {deleteTarget.type === 'bulk' && (
              <div className="my-3 p-3 bg-neutral-100 rounded-none border border-neutral-300 text-xs font-sport font-bold uppercase text-black">
                <span>Kamu akan menghapus <strong>{deleteTarget.count}</strong> barang sekaligus.</span>
              </div>
            )}

            {/* Modal Buttons */}
            <div className="mt-5 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 px-4 bg-neutral-100 hover:bg-neutral-200 text-black font-sport font-bold uppercase text-xs rounded-none border border-neutral-300 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white font-sport font-black uppercase text-xs rounded-none transition-colors cursor-pointer"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
