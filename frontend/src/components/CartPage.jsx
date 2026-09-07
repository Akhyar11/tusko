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
  ChevronRight
} from 'lucide-react';
import { formatRupiah } from '../utils/formatters';

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
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoError, setPromoError] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);

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

  // Apply promo code
  const handleApplyPromo = (e) => {
    e.preventDefault();
    if (!promoCode.trim()) return;

    if (promoCode.toUpperCase() === 'DISKON50' || promoCode.toUpperCase() === 'HEMAT') {
      setPromoDiscount(50000);
      setPromoApplied(true);
      setPromoError('');
    } else {
      setPromoError('Kode promo tidak valid atau telah kedaluwarsa');
      setPromoDiscount(0);
      setPromoApplied(false);
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

  // Group cart items by seller
  const groupedCart = useMemo(() => {
    const groups = {};
    cart.forEach(item => {
      const sellerKey = item.seller_name || 'Toko Rekanan';
      if (!groups[sellerKey]) {
        groups[sellerKey] = {
          sellerName: sellerKey,
          location: item.location || 'Jakarta',
          isOfficial: item.is_official || false,
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
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-2xs">
          <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingBag size={40} />
          </div>
          <h2 className="text-xl font-bold text-gray-900">
            Wah, keranjang belanjamu kosong!
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-2 max-w-sm mx-auto leading-relaxed">
            Yuk, jelajahi katalog produk berkualitas dan temukan barang impianmu sekarang juga.
          </p>
          <button
            type="button"
            onClick={onBackToShopping}
            className="mt-6 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
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
          className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-emerald-700 hover:text-emerald-800 bg-white hover:bg-emerald-50 px-3 py-1.5 rounded-lg border border-gray-200 transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>Lanjut Belanja</span>
        </button>

        <h1 className="text-lg sm:text-xl font-extrabold text-gray-900">
          Keranjang Belanja ({cart.length})
        </h1>
      </div>

      {/* Main Grid: Cart Items (8 cols) | Order Summary (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Cart Items List */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Select All & Bulk Action Bar */}
          <div className="bg-white rounded-xl border border-gray-200 p-3.5 flex items-center justify-between shadow-2xs">
            <label className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-gray-800 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={handleToggleSelectAll}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-gray-300 cursor-pointer"
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
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
              >
                <Trash2 size={14} />
                <span>Hapus Pilihan ({selectedItemIds.length})</span>
              </button>
            )}
          </div>

          {/* Grouped Stores */}
          {groupedCart.map((group, groupIdx) => (
            <div key={groupIdx} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xs">
              
              {/* Store Header */}
              <div className="p-3.5 bg-gray-50/70 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Store size={16} className="text-emerald-600 shrink-0" />
                  <span className="font-bold text-xs sm:text-sm text-gray-900">
                    {group.sellerName}
                  </span>
                  {group.isOfficial && (
                    <span className="bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                      <BadgeCheck size={10} />
                      Official
                    </span>
                  )}
                  <span className="text-[11px] text-gray-400">• {group.location}</span>
                </div>

                {group.freeShipping && (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 flex items-center gap-1">
                    <Truck size={12} />
                    Bebas Ongkir
                  </span>
                )}
              </div>

              {/* Items in this Store */}
              <div className="divide-y divide-gray-100">
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
                          className="w-4 h-4 mt-1 rounded text-emerald-600 focus:ring-emerald-500 border-gray-300 disabled:opacity-40 cursor-pointer"
                        />

                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover border border-gray-200 shrink-0"
                        />

                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs sm:text-sm font-semibold text-gray-900 line-clamp-2">
                            {item.name}
                          </h4>

                          {/* Price & Discount */}
                          <div className="mt-1 flex items-baseline gap-2">
                            <span className="font-extrabold text-xs sm:text-sm text-gray-900">
                              {formatRupiah(item.price)}
                            </span>
                            {item.discount_percentage > 0 && (
                              <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1 py-0.5 rounded">
                                {item.discount_percentage}%
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
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-500 mt-1">
                              <Flame size={12} className="fill-rose-500" />
                              Sisa {item.stock} buah!
                            </span>
                          ) : null}
                        </div>
                      </div>

                      {/* Quantity Controller & Delete */}
                      <div className="flex flex-col sm:items-end gap-1.5 w-full sm:w-auto pl-7 sm:pl-0">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden bg-gray-50 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500">
                            <button
                              type="button"
                              onClick={() => {
                                if (item.quantity <= 1) {
                                  setDeleteTarget({ type: 'single', item });
                                } else {
                                  onUpdateQuantity(item.id, item.quantity - 1);
                                }
                              }}
                              className="p-1.5 text-gray-600 hover:bg-gray-200 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
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
                              className="w-12 text-center text-xs font-bold text-gray-800 bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <button
                              type="button"
                              disabled={item.quantity >= item.stock}
                              onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                              className="p-1.5 text-gray-600 hover:bg-gray-200 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                              title="Tambah 1"
                            >
                              <Plus size={14} />
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => setDeleteTarget({ type: 'single', item })}
                            className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Hapus dari keranjang"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        {/* Quantity notes / max stock warning */}
                        {item.quantity >= item.stock && item.stock > 0 && (
                          <span className="text-[10px] text-amber-600 font-medium">
                            Maks. {item.stock} unit (stok terbatas)
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
          <div className="sticky top-20 bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 shadow-2xs space-y-4">
            <h3 className="font-extrabold text-gray-900 text-sm sm:text-base">
              Ringkasan Belanja
            </h3>

            {/* Promo Voucher Form */}
            <form onSubmit={handleApplyPromo} className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                <Tag size={13} className="text-emerald-600" />
                Makin hemat pakai promo (Coba: "DISKON50")
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  placeholder="Kode Promo / Kupon..."
                  className="flex-1 text-xs px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500 uppercase font-medium"
                />
                <button
                  type="submit"
                  className="px-3.5 py-2 bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Terapkan
                </button>
              </div>
              {promoApplied && (
                <p className="text-[11px] text-emerald-600 font-semibold">
                  ✓ Promo berhasil diterapkan (-{formatRupiah(promoDiscount)})
                </p>
              )}
              {promoError && (
                <p className="text-[11px] text-rose-600 font-medium">
                  {promoError}
                </p>
              )}
            </form>

            {/* Breakdown */}
            <div className="space-y-2.5 pt-3 border-t border-gray-100 text-xs sm:text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Total Harga ({selectedItems.reduce((s, i) => s + i.quantity, 0)} barang)</span>
                <span className="font-semibold text-gray-800">{formatRupiah(subtotal)}</span>
              </div>

              {totalProductDiscount > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Total Diskon Produk</span>
                  <span>-{formatRupiah(totalProductDiscount)}</span>
                </div>
              )}

              {promoDiscount > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Potongan Kupon Promo</span>
                  <span>-{formatRupiah(promoDiscount)}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span className="flex items-center gap-1">
                  <span>Biaya Pengiriman (Ongkir)</span>
                  <Truck size={12} className="text-gray-400" />
                </span>
                <span className="font-semibold text-gray-800">
                  {estimatedShipping === 0 ? (
                    <span className="text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded text-[11px]">
                      Gratis Ongkir
                    </span>
                  ) : (
                    formatRupiah(estimatedShipping)
                  )}
                </span>
              </div>

              <div className="flex justify-between text-gray-500 text-xs">
                <span>Biaya Layanan Aplikasi</span>
                <span className="font-medium text-gray-700">
                  {selectedItems.length > 0 ? formatRupiah(1000) : formatRupiah(0)}
                </span>
              </div>
            </div>

            {/* Total Savings Highlight Badge */}
            {(totalProductDiscount > 0 || promoDiscount > 0) && (
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-2.5 flex items-center justify-between text-xs text-emerald-800 font-semibold">
                <span>Total Penghematan:</span>
                <span className="text-emerald-700 font-extrabold">
                  {formatRupiah(totalProductDiscount + promoDiscount)}
                </span>
              </div>
            )}

            {/* Grand Total */}
            <div className="pt-3 border-t border-gray-200 flex items-baseline justify-between">
              <div>
                <span className="text-xs text-gray-500 font-medium block">Total Tagihan Pembayaran:</span>
                <span className="text-xl sm:text-2xl font-black text-emerald-700 tracking-tight">
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
                grandTotal: selectedItems.length > 0 ? grandTotal + 1000 : 0 
              })}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>Lanjut ke Pembayaran ({selectedItems.length})</span>
              <ChevronRight size={16} />
            </button>

            {/* Guarantees */}
            <div className="pt-2 flex items-center justify-center gap-2 text-[11px] text-gray-500 text-center">
              <ShieldCheck size={14} className="text-emerald-600" />
              <span>Jaminan transaksi aman & perlindungan pembeli 100%</span>
            </div>

          </div>
        </div>

      </div>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 sm:p-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 size={20} />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-gray-900">
                  {deleteTarget.type === 'single' ? 'Hapus Barang?' : 'Hapus Pilihan Barang?'}
                </h3>
                <p className="text-xs text-gray-500">
                  Tindakan ini akan menghapus barang dari keranjang belanja.
                </p>
              </div>
            </div>

            {/* Preview of item being deleted */}
            {deleteTarget.type === 'single' && (
              <div className="my-3 p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center gap-3">
                <img
                  src={deleteTarget.item.image_url}
                  alt=""
                  className="w-12 h-12 rounded-lg object-cover border border-gray-200 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-gray-800 truncate">{deleteTarget.item.name}</p>
                  <p className="text-xs text-emerald-600 font-bold mt-0.5">{formatRupiah(deleteTarget.item.price)}</p>
                </div>
              </div>
            )}

            {deleteTarget.type === 'bulk' && (
              <div className="my-3 p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs text-gray-700">
                <span>Kamu akan menghapus <strong>{deleteTarget.count}</strong> barang sekaligus.</span>
              </div>
            )}

            {/* Modal Buttons */}
            <div className="mt-5 flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Kembali
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
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
