import React, { useState, useMemo } from 'react';
import { 
  Trash2, 
  Minus, 
  Plus, 
  Heart, 
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
      const sellerKey = item.seller_name || 'Tusko Official Store';
      if (!groups[sellerKey]) {
        groups[sellerKey] = {
          sellerName: sellerKey,
          location: item.location || 'Jakarta Pusat',
          isOfficial: item.is_official !== false,
          freeShipping: item.free_shipping || false,
          items: []
        };
      }
      groups[sellerKey].items.push(item);
    });
    return Object.values(groups);
  }, [cart]);

  if (cart.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4">
        <div className="bg-white rounded-none border border-neutral-200 p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-neutral-100 text-neutral-800 rounded-none flex items-center justify-center mx-auto mb-4 border border-neutral-300">
            <ShoppingBag size={32} />
          </div>
          <h2 className="text-xl font-black text-neutral-900 uppercase tracking-wider">
            Keranjang Belanja Kosong
          </h2>
          <p className="text-xs sm:text-sm text-neutral-500 mt-2 max-w-sm mx-auto leading-relaxed">
            Belum ada produk pilihan di keranjang Anda. Temukan perlengkapan atletik & performa terbaik sekarang.
          </p>
          <button
            type="button"
            onClick={onBackToShopping}
            className="mt-6 px-6 py-3 bg-neutral-950 hover:bg-neutral-800 text-white text-xs sm:text-sm font-black uppercase tracking-wider rounded-none shadow-sm transition-colors cursor-pointer"
          >
            Mulai Belanja Sekarang
          </button>
        </div>
      </div>
    );
  }

  const isAllSelected = selectedItemIds.length === cart.length && cart.length > 0;

  return (
    <div className="py-4">
      {/* Header & Back Button */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onBackToShopping}
          className="flex items-center gap-1.5 text-xs sm:text-sm font-bold uppercase tracking-wider text-neutral-800 hover:text-neutral-950 bg-white hover:bg-neutral-50 px-3 py-2 rounded-none border border-neutral-300 transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>Lanjut Belanja</span>
        </button>

        <h1 className="text-lg sm:text-xl font-black uppercase tracking-tight text-neutral-950">
          Keranjang Belanja ({cart.length})
        </h1>
      </div>

      {/* Main Grid: Cart Items (8 cols) | Order Summary (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Cart Items List */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Select All & Bulk Action Bar */}
          <div className="bg-white rounded-none border border-neutral-200 p-3.5 flex items-center justify-between shadow-sm">
            <label className="flex items-center gap-2.5 text-xs sm:text-sm font-bold uppercase tracking-wider text-neutral-900 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={handleToggleSelectAll}
                className="w-4 h-4 rounded-none text-neutral-950 focus:ring-neutral-950 border-neutral-300 cursor-pointer"
              />
              <span>Pilih Semua ({cart.length})</span>
            </label>

            {selectedItemIds.length > 0 && (
              <button
                type="button"
                onClick={() => setDeleteTarget({
                  type: 'bulk',
                  ids: selectedItemIds,
                  count: selectedItemIds.length
                })}
                className="text-xs font-bold uppercase tracking-wider text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
              >
                <Trash2 size={14} />
                <span>Hapus Pilihan ({selectedItemIds.length})</span>
              </button>
            )}
          </div>

          {/* Grouped Stores */}
          {groupedCart.map((group, groupIdx) => (
            <div key={groupIdx} className="bg-white rounded-none border border-neutral-200 overflow-hidden shadow-sm">
              
              {/* Store Header */}
              <div className="p-3.5 bg-neutral-50 border-b border-neutral-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Store size={16} className="text-neutral-900 shrink-0" />
                  <span className="font-extrabold text-xs sm:text-sm text-neutral-950 uppercase tracking-wide">
                    {group.sellerName}
                  </span>
                  {group.isOfficial && (
                    <span className="bg-neutral-950 text-white text-[9px] font-black uppercase px-1.5 py-0.5 rounded-none flex items-center gap-0.5 tracking-wider">
                      <BadgeCheck size={10} />
                      Official
                    </span>
                  )}
                  <span className="text-[11px] text-neutral-500 font-medium">• {group.location}</span>
                </div>

                {group.freeShipping && (
                  <span className="text-[10px] font-black uppercase text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-none border border-emerald-200 flex items-center gap-1 tracking-wider">
                    <Truck size={12} />
                    Bebas Ongkir
                  </span>
                )}
              </div>

              {/* Items in this Store */}
              <div className="divide-y divide-neutral-100">
                {group.items.map(item => {
                  const isSelected = selectedItemIds.includes(item.id);
                  const isLowStock = item.stock <= (item.stock_minimum || 5) && item.stock > 0;
                  const isOutOfStock = item.stock <= 0;

                  return (
                    <div key={item.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      
                      {/* Checkbox & Product Info */}
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <input
                          type="checkbox"
                          disabled={isOutOfStock}
                          checked={isSelected && !isOutOfStock}
                          onChange={() => handleToggleItem(item.id)}
                          className="w-4 h-4 mt-1 rounded-none text-neutral-950 focus:ring-neutral-950 border-neutral-300 disabled:opacity-40 cursor-pointer"
                        />

                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-16 h-16 sm:w-20 sm:h-20 rounded-none object-cover border border-neutral-200 shrink-0"
                        />

                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs sm:text-sm font-bold text-neutral-900 line-clamp-2">
                            {item.name}
                          </h4>

                          {/* Variant Badge if selected */}
                          {item.variant_name && (
                            <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10px] font-black uppercase text-neutral-800 bg-neutral-100 border border-neutral-300 px-2 py-0.5 rounded-none tracking-wider">
                                Varian: {item.variant_name}
                              </span>
                              {item.variant_sku && (
                                <span className="text-[9px] font-mono text-neutral-500">
                                  ({item.variant_sku})
                                </span>
                              )}
                            </div>
                          )}

                          {/* Price & Discount */}
                          <div className="mt-1 flex items-baseline gap-2">
                            <span className="font-black text-xs sm:text-sm text-neutral-950">
                              {formatRupiah(item.price)}
                            </span>
                            {item.discount_percentage > 0 && (
                              <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-none border border-rose-200">
                                -{item.discount_percentage}%
                              </span>
                            )}
                          </div>

                          {/* Stock status indicator */}
                          {isOutOfStock ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 mt-1">
                              <AlertCircle size={12} />
                              Stok habis, hapus dari keranjang
                            </span>
                          ) : isLowStock ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 mt-1">
                              <Flame size={12} className="fill-amber-500" />
                              Sisa {item.stock} unit!
                            </span>
                          ) : null}
                        </div>
                      </div>

                      {/* Quantity Controller & Delete */}
                      <div className="flex flex-col sm:items-end gap-1.5 w-full sm:w-auto pl-7 sm:pl-0">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center border border-neutral-300 rounded-none overflow-hidden bg-neutral-50 focus-within:border-neutral-950">
                            <button
                              type="button"
                              onClick={() => {
                                if (item.quantity <= 1) {
                                  setDeleteTarget({ type: 'single', item });
                                } else {
                                  onUpdateQuantity(item.id, item.quantity - 1);
                                }
                              }}
                              className="p-1.5 text-neutral-700 hover:bg-neutral-200 disabled:opacity-30 cursor-pointer"
                              title={item.quantity <= 1 ? "Hapus barang" : "Kurangi 1"}
                            >
                              <Minus size={14} />
                            </button>
                            <input
                              type="number"
                              min={1}
                              max={item.stock}
                              value={item.quantity}
                              onChange={(e) => {
                                const val = parseInt(e.target.value, 10);
                                if (!isNaN(val)) {
                                  const clamped = Math.max(1, Math.min(item.stock, val));
                                  onUpdateQuantity(item.id, clamped);
                                }
                              }}
                              className="w-12 text-center text-xs font-black text-neutral-900 bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <button
                              type="button"
                              disabled={item.quantity >= item.stock}
                              onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                              className="p-1.5 text-neutral-700 hover:bg-neutral-200 disabled:opacity-30 cursor-pointer"
                              title="Tambah 1"
                            >
                              <Plus size={14} />
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => setDeleteTarget({ type: 'single', item })}
                            className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-none transition-colors cursor-pointer"
                            title="Hapus dari keranjang"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        {/* Quantity notes / max stock warning */}
                        {item.quantity >= item.stock && item.stock > 0 && (
                          <span className="text-[10px] text-amber-600 font-medium">
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
          <div className="sticky top-20 bg-white rounded-none border border-neutral-200 p-4 sm:p-5 shadow-sm space-y-4">
            <h3 className="font-black text-neutral-950 text-sm sm:text-base uppercase tracking-wider">
              Ringkasan Belanja
            </h3>

            {/* Promo Voucher Form */}
            <form onSubmit={handleApplyPromo} className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-700 flex items-center gap-1.5">
                <Tag size={13} className="text-neutral-900" />
                Voucher Promo (Contoh: "TUSKOVIBES150")
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  placeholder="Ketik Kode Voucher..."
                  className="flex-1 text-xs px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-none focus:outline-none focus:border-neutral-950 uppercase font-bold"
                />
                <button
                  type="submit"
                  disabled={isApplyingPromo}
                  className="px-3.5 py-2 bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-black uppercase tracking-wider rounded-none transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isApplyingPromo ? '...' : 'Gunakan'}
                </button>
              </div>
              {promoSuccess && (
                <p className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                  <Sparkles size={12} />
                  {promoSuccess} (-{formatRupiah(promoDiscount)})
                </p>
              )}
              {promoError && (
                <p className="text-[11px] text-rose-600 font-semibold">
                  {promoError}
                </p>
              )}
            </form>

            {/* Breakdown */}
            <div className="space-y-2.5 pt-3 border-t border-neutral-200 text-xs sm:text-sm text-neutral-600 font-medium">
              <div className="flex justify-between">
                <span>Total Harga ({selectedItems.reduce((s, i) => s + i.quantity, 0)} barang)</span>
                <span className="font-bold text-neutral-900">{formatRupiah(subtotal)}</span>
              </div>

              {totalProductDiscount > 0 && (
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Total Hemat Produk</span>
                  <span>-{formatRupiah(totalProductDiscount)}</span>
                </div>
              )}

              {promoDiscount > 0 && (
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Potongan Voucher Promo</span>
                  <span>-{formatRupiah(promoDiscount)}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span className="flex items-center gap-1">
                  <span>Estimasi Ongkos Kirim</span>
                  <Truck size={12} className="text-neutral-400" />
                </span>
                <span className="font-bold text-neutral-900">
                  {estimatedShipping === 0 ? (
                    <span className="text-emerald-700 font-black bg-emerald-50 px-1.5 py-0.5 rounded-none text-[11px] border border-emerald-200">
                      Bebas Ongkir
                    </span>
                  ) : (
                    formatRupiah(estimatedShipping)
                  )}
                </span>
              </div>

              <div className="flex justify-between text-neutral-500 text-xs">
                <span>Biaya Layanan Sistem</span>
                <span className="font-semibold text-neutral-800">
                  {selectedItems.length > 0 ? formatRupiah(1000) : formatRupiah(0)}
                </span>
              </div>
            </div>

            {/* Total Savings Highlight Badge */}
            {(totalProductDiscount > 0 || promoDiscount > 0) && (
              <div className="bg-neutral-100 border border-neutral-300 rounded-none p-2.5 flex items-center justify-between text-xs text-neutral-900 font-bold">
                <span>Total Penghematan:</span>
                <span className="text-emerald-700 font-black text-sm">
                  {formatRupiah(totalProductDiscount + promoDiscount)}
                </span>
              </div>
            )}

            {/* Grand Total */}
            <div className="pt-3 border-t border-neutral-300 flex items-baseline justify-between">
              <div>
                <span className="text-xs text-neutral-500 font-bold uppercase tracking-wider block">Total Tagihan:</span>
                <span className="text-xl sm:text-2xl font-black text-neutral-950 tracking-tight">
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
              className="w-full py-3.5 px-4 bg-neutral-950 hover:bg-neutral-800 text-white font-black uppercase text-xs sm:text-sm tracking-wider rounded-none shadow-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>Lanjut ke Pembayaran ({selectedItems.length})</span>
              <ChevronRight size={16} />
            </button>

            {/* Guarantees */}
            <div className="pt-2 flex items-center justify-center gap-2 text-[11px] text-neutral-500 text-center font-medium">
              <ShieldCheck size={14} className="text-neutral-900" />
              <span>Jaminan keamanan transaksi resmi Tusko Storefront</span>
            </div>

          </div>
        </div>

      </div>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-none max-w-sm w-full p-5 sm:p-6 shadow-2xl border border-neutral-300 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-none bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200">
                <Trash2 size={20} />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black uppercase tracking-wider text-neutral-950">
                  {deleteTarget.type === 'single' ? 'Hapus Barang?' : 'Hapus Pilihan Barang?'}
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Tindakan ini akan menghapus produk dari keranjang belanja.
                </p>
              </div>
            </div>

            {/* Preview of item being deleted */}
            {deleteTarget.type === 'single' && (
              <div className="my-3 p-3 bg-neutral-50 rounded-none border border-neutral-200 flex items-center gap-3">
                <img
                  src={deleteTarget.item.image_url}
                  alt=""
                  className="w-12 h-12 rounded-none object-cover border border-neutral-300 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-neutral-900 truncate">{deleteTarget.item.name}</p>
                  <p className="text-xs text-neutral-950 font-black mt-0.5">{formatRupiah(deleteTarget.item.price)}</p>
                </div>
              </div>
            )}

            {deleteTarget.type === 'bulk' && (
              <div className="my-3 p-3 bg-neutral-50 rounded-none border border-neutral-200 text-xs text-neutral-800 font-medium">
                <span>Kamu akan menghapus <strong>{deleteTarget.count}</strong> barang sekaligus.</span>
              </div>
            )}

            {/* Modal Buttons */}
            <div className="mt-5 flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 px-4 bg-neutral-200 hover:bg-neutral-300 text-neutral-800 text-xs font-black uppercase tracking-wider rounded-none transition-colors cursor-pointer"
              >
                Kembali
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black uppercase tracking-wider rounded-none shadow-sm transition-colors cursor-pointer"
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
