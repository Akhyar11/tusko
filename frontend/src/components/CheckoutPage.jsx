import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, 
  MapPin, 
  Truck, 
  ShieldCheck, 
  CreditCard, 
  Building2, 
  QrCode, 
  CheckCircle2, 
  ChevronRight, 
  Store, 
  BadgeCheck, 
  AlertCircle,
  Copy,
  Clock,
  Plus,
  Tag,
  Sparkles,
  Loader2,
  Shield
} from 'lucide-react';
import { formatRupiah } from '../utils/formatters';
import { mockAddresses, mockExpeditions, mockPaymentMethods, mockPaymentCategories } from '../data/mockCheckoutData';
import AddressModal from './AddressModal';
import ExpeditionModal from './ExpeditionModal';
import PaymentInstructionModal from './PaymentInstructionModal';

export default function CheckoutPage({
  checkoutItems = [],
  onBackToCart = () => {},
  onFinishOrder = () => {}
}) {
  const [addresses, setAddresses] = useState(mockAddresses);
  const [selectedAddressId, setSelectedAddressId] = useState(1);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [addressModalInitialTab, setAddressModalInitialTab] = useState('list');

  const handleOpenAddressModal = (mode = 'list') => {
    setAddressModalInitialTab(mode);
    setIsAddressModalOpen(true);
  };

  const handleSaveAddress = (newOrUpdated) => {
    setAddresses(prev => {
      const exists = prev.some(a => a.id === newOrUpdated.id);
      let updated;
      if (exists) {
        updated = prev.map(a => a.id === newOrUpdated.id ? newOrUpdated : a);
      } else {
        updated = [...prev, newOrUpdated];
      }

      if (newOrUpdated.is_default) {
        updated = updated.map(a => ({
          ...a,
          is_default: a.id === newOrUpdated.id
        }));
      }
      return updated;
    });

    setSelectedAddressId(newOrUpdated.id);
  };

  const handleDeleteAddress = (id) => {
    setAddresses(prev => prev.filter(a => a.id !== id));
    if (selectedAddressId === id) {
      const remaining = addresses.filter(a => a.id !== id);
      if (remaining.length > 0) {
        setSelectedAddressId(remaining[0].id);
      }
    }
  };

  // Selected courier per store
  const [selectedExpedition, setSelectedExpedition] = useState(mockExpeditions[0]);
  const [isExpeditionModalOpen, setIsExpeditionModalOpen] = useState(false);

  const totalWeight = useMemo(() => {
    const count = checkoutItems.reduce((acc, item) => acc + item.quantity, 0);
    return Number((count * 0.4).toFixed(1)) || 0.4;
  }, [checkoutItems]);
  
  // Selected payment method
  const [selectedPayment, setSelectedPayment] = useState(mockPaymentMethods[0].methods[0]);
  const [selectedPaymentCategory, setSelectedPaymentCategory] = useState('Semua');

  // Coupon state
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState({
    code: 'DISKON20',
    name: 'Kupon Diskon Checkout TokoOnline',
    discount: 20000
  });
  const [couponError, setCouponError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Shipping protection
  const [withInsurance, setWithInsurance] = useState(true);

  // Order success state
  const [orderSuccessData, setOrderSuccessData] = useState(null);
  const [copiedVa, setCopiedVa] = useState(false);

  const currentAddress = useMemo(() => {
    return addresses.find(a => a.id === selectedAddressId) || addresses[0];
  }, [addresses, selectedAddressId]);

  // Calculations
  const totalItemPrice = useMemo(() => {
    return checkoutItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  }, [checkoutItems]);

  const discountAmount = appliedCoupon ? appliedCoupon.discount : 0;
  const shippingCost = selectedExpedition.is_free ? 0 : selectedExpedition.cost;
  const shippingSavings = selectedExpedition.is_free ? selectedExpedition.baseCost : 0;
  const insuranceCost = withInsurance ? 2500 : 0;
  const serviceFee = 1000;
  const paymentFee = selectedPayment.fee || 0;

  const totalSavings = shippingSavings + discountAmount;
  const grandTotal = Math.max(0, totalItemPrice - discountAmount + shippingCost + insuranceCost + serviceFee + paymentFee);

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    if (code === 'DISKON20' || code === 'HEMAT20') {
      setAppliedCoupon({ code, discount: 20000, name: 'Kupon Diskon Belanja Rp 20.000' });
      setCouponError('');
      setCouponInput('');
    } else if (code === 'TOKOPEDIA50' || code === 'PROMO50') {
      setAppliedCoupon({ code, discount: 50000, name: 'Kupon Diskon Spesial Rp 50.000' });
      setCouponError('');
      setCouponInput('');
    } else {
      setCouponError('Kode promo tidak valid atau telah kedaluwarsa');
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponError('');
  };

  // Group items by store
  const groupedItems = useMemo(() => {
    const groups = {};
    checkoutItems.forEach(item => {
      const sellerKey = item.seller_name || 'Toko Rekanan';
      if (!groups[sellerKey]) {
        groups[sellerKey] = {
          sellerName: sellerKey,
          location: item.location || 'Jakarta',
          isOfficial: item.is_official || false,
          items: []
        };
      }
      groups[sellerKey].items.push(item);
    });
    return Object.values(groups);
  }, [checkoutItems]);

  // Handle Pay Now
  const handlePayNow = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      const invoiceNumber = `INV/${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}/TK/${Math.floor(100000 + Math.random() * 900000)}`;
      const vaNumber = `8808${Math.floor(1000000000 + Math.random() * 9000000000)}`;

      const orderData = {
        invoiceNumber,
        vaNumber,
        totalAmount: grandTotal,
        totalSavings,
        appliedCoupon,
        paymentMethod: selectedPayment,
        address: currentAddress,
        expedition: selectedExpedition,
        items: checkoutItems,
        createdAt: new Date().toISOString()
      };

      setOrderSuccessData(orderData);
      onFinishOrder(orderData);
    }, 600);
  };

  const handleCopyVa = (text) => {
    navigator.clipboard?.writeText(text);
    setCopiedVa(true);
    setTimeout(() => setCopiedVa(false), 2500);
  };

  if (checkoutItems.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-2xs">
          <p className="text-gray-600 text-sm">Tidak ada barang yang dipilih untuk checkout.</p>
          <button
            onClick={onBackToCart}
            className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold"
          >
            Kembali ke Keranjang
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-4">
      {/* Header Bar */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onBackToCart}
          className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-emerald-700 hover:text-emerald-800 bg-white hover:bg-emerald-50 px-3 py-1.5 rounded-lg border border-gray-200 transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>Kembali ke Keranjang</span>
        </button>

        <div className="flex items-center gap-2">
          <ShieldCheck size={18} className="text-emerald-600" />
          <span className="text-xs font-semibold text-gray-700">Checkout Aman & Terenkripsi</span>
        </div>
      </div>

      {/* Main Layout: Checkout Details (8 cols) | Summary (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Form: Address, Items, Courier, Payment */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* 1. Alamat Pengiriman */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <MapPin size={16} className="text-emerald-600" />
                <span>Alamat Pengiriman</span>
              </h3>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => handleOpenAddressModal('add')}
                  className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 cursor-pointer flex items-center gap-1 hover:underline"
                >
                  <Plus size={13} strokeWidth={2.5} />
                  <span>Tambah Alamat</span>
                </button>
                <span className="text-gray-300">|</span>
                <button
                  type="button"
                  onClick={() => handleOpenAddressModal('list')}
                  className="text-xs font-semibold text-gray-600 hover:text-emerald-700 cursor-pointer hover:underline"
                >
                  Pilih Alamat Lain
                </button>
              </div>
            </div>

            <div className="mt-3 text-xs text-gray-700">
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-900 text-sm">{currentAddress.recipient_name}</span>
                <span className="text-gray-400">|</span>
                <span className="text-gray-600">{currentAddress.phone}</span>
                <span className="bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded text-[10px] border border-emerald-100">
                  {currentAddress.label}
                </span>
              </div>
              <p className="mt-1.5 text-gray-600 leading-relaxed">
                {currentAddress.full_address}, {currentAddress.city}, {currentAddress.province}, {currentAddress.postal_code}
              </p>
            </div>
          </div>

          {/* 2. Daftar Barang per Toko & Pilihan Kurir */}
          {groupedItems.map((group, idx) => (
            <div key={idx} className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 shadow-2xs space-y-4">
              {/* Store title */}
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                <Store size={16} className="text-emerald-600" />
                <span className="font-bold text-xs sm:text-sm text-gray-900">{group.sellerName}</span>
                {group.isOfficial && (
                  <span className="bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.2 rounded">
                    Official
                  </span>
                )}
                <span className="text-[11px] text-gray-400">• Kota {group.location}</span>
              </div>

              {/* Items in store */}
              <div className="divide-y divide-gray-100">
                {group.items.map(item => (
                  <div key={item.id} className="py-2.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={item.image_url}
                        alt=""
                        className="w-12 h-12 rounded-lg object-cover border border-gray-200 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-gray-800 line-clamp-1">{item.name}</p>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          {item.quantity} barang x {formatRupiah(item.price)}
                        </p>
                        {item.notes && (
                          <p className="text-[10px] text-emerald-700 italic mt-0.5">
                            Catatan: "{item.notes}"
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="text-xs font-extrabold text-gray-900 shrink-0">
                      {formatRupiah(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Courier Selection */}
              <div className="pt-3 border-t border-gray-100 bg-gray-50/70 p-3.5 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                    <Truck size={15} className="text-emerald-600" />
                    <span>Opsi Pengiriman (Ekspedisi)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsExpeditionModalOpen(true)}
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700 cursor-pointer flex items-center gap-0.5 hover:underline"
                  >
                    <span>Lihat Semua Ekspedisi</span>
                    <ChevronRight size={13} />
                  </button>
                </div>

                {/* Selected Expedition Card */}
                <div 
                  onClick={() => setIsExpeditionModalOpen(true)}
                  className="p-3 bg-white border border-emerald-500 ring-1 ring-emerald-400/30 rounded-xl cursor-pointer hover:border-emerald-600 transition-all flex items-center justify-between shadow-2xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 font-extrabold flex items-center justify-center text-xs border border-emerald-200 shrink-0">
                      {selectedExpedition.name.slice(0, 3).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-gray-900">{selectedExpedition.name} - {selectedExpedition.service}</span>
                        {selectedExpedition.badge && (
                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                            selectedExpedition.is_free ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {selectedExpedition.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        Estimasi tiba: <strong>{selectedExpedition.etd}</strong> • {selectedExpedition.category}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    {selectedExpedition.is_free ? (
                      <div>
                        <span className="text-xs sm:text-sm font-extrabold text-emerald-600 block">Gratis</span>
                        <span className="text-[10px] text-gray-400 line-through">{formatRupiah(selectedExpedition.baseCost)}</span>
                      </div>
                    ) : (
                      <span className="text-xs sm:text-sm font-extrabold text-gray-900">{formatRupiah(selectedExpedition.cost)}</span>
                    )}
                    <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">Ubah</span>
                  </div>
                </div>

                {/* Quick Selection Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-xs no-scrollbar">
                  <span className="text-[10px] text-gray-400 shrink-0 mr-0.5">Pilihan Populer:</span>
                  {mockExpeditions.slice(0, 4).map(exp => (
                    <button
                      key={exp.id}
                      type="button"
                      onClick={() => setSelectedExpedition(exp)}
                      className={`px-2.5 py-1 rounded-lg border text-[11px] shrink-0 cursor-pointer transition-colors ${
                        selectedExpedition.id === exp.id
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-700 font-bold shadow-2xs'
                          : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {exp.name} {exp.is_free ? '(Gratis)' : `(${formatRupiah(exp.cost)})`}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}

          {/* 3. Metode Pembayaran */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <CreditCard size={16} className="text-emerald-600" />
                <span>Pilih Metode Pembayaran</span>
              </h3>
              <span className="text-[11px] text-gray-400">Didukung Midtrans & Bank Terpercaya</span>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {mockPaymentCategories.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedPaymentCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                    selectedPaymentCategory === cat
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Payment Methods List */}
            {mockPaymentMethods
              .filter(cat => selectedPaymentCategory === 'Semua' || cat.subCategory === selectedPaymentCategory)
              .map((cat, catIdx) => (
                <div key={catIdx} className="space-y-2 pt-1">
                  <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wider block">
                    {cat.category}
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {cat.methods.map((method) => {
                      const isSelected = selectedPayment.id === method.id;
                      return (
                        <div
                          key={method.id}
                          onClick={() => setSelectedPayment(method)}
                          className={`p-3 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between gap-2.5 ${
                            isSelected
                              ? 'border-emerald-600 bg-emerald-50/40 ring-1 ring-emerald-500 shadow-2xs'
                              : 'border-gray-200 bg-white hover:border-emerald-300'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                              <div className={`p-2 rounded-xl shrink-0 ${isSelected ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                                {method.icon === 'QrCode' ? <QrCode size={16} /> : method.icon === 'Building2' ? <Building2 size={16} /> : <CreditCard size={16} />}
                              </div>
                              <div>
                                <p className="text-xs font-bold text-gray-900 leading-snug">{method.name}</p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  {method.badge && (
                                    <span className="text-[9px] font-bold px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded">
                                      {method.badge}
                                    </span>
                                  )}
                                  <span className="text-[10px] text-gray-400">
                                    {method.fee > 0 ? `Biaya: ${formatRupiah(method.fee)}` : 'Bebas Biaya'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Radio check indicator */}
                            <div className={`w-4.5 h-4.5 rounded-full flex items-center justify-center shrink-0 border ${
                              isSelected ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-gray-300 bg-white'
                            }`}>
                              {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </div>
                          </div>

                          {method.description && (
                            <p className="text-[10px] text-gray-500 leading-relaxed border-t border-gray-100/80 pt-1.5">
                              {method.description}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
            ))}
          </div>

        </div>

        {/* Right Sidebar: Ringkasan Pembayaran (Sticky) */}
        <div className="lg:col-span-4">
          <div className="sticky top-20 bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 shadow-2xs space-y-4">
            <h3 className="font-extrabold text-gray-900 text-sm sm:text-base pb-2 border-b border-gray-100 flex items-center justify-between">
              <span>Ringkasan Pembayaran</span>
              <span className="text-[11px] text-gray-400 font-normal">{checkoutItems.reduce((acc, i) => acc + i.quantity, 0)} barang</span>
            </h3>

            {/* Promo / Coupon Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 flex items-center gap-1">
                <Tag size={13} className="text-emerald-600" />
                <span>Makin Hemat Pakai Promo</span>
              </label>

              {appliedCoupon ? (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Sparkles size={14} className="text-emerald-600 shrink-0" />
                    <div>
                      <span className="font-bold text-emerald-800 block">{appliedCoupon.code}</span>
                      <span className="text-[10px] text-emerald-600">Hemat {formatRupiah(appliedCoupon.discount)}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="text-xs font-bold text-rose-600 hover:text-rose-700 cursor-pointer"
                  >
                    Hapus
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="flex gap-1.5">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    placeholder="Masukkan kode: DISKON20"
                    className="flex-1 px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 uppercase font-medium"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0"
                  >
                    Terapkan
                  </button>
                </form>
              )}

              {couponError && (
                <span className="text-[10px] text-rose-600 block">{couponError}</span>
              )}
            </div>

            {/* Detailed Itemized Costs */}
            <div className="space-y-2.5 text-xs text-gray-600 pt-2 border-t border-gray-100">
              <div className="flex justify-between">
                <span>Total Harga Barang</span>
                <span className="font-semibold text-gray-800">{formatRupiah(totalItemPrice)}</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Diskon Promo Kupon</span>
                  <span className="font-bold">- {formatRupiah(discountAmount)}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Total Ongkos Kirim</span>
                <span className="font-semibold text-gray-800">
                  {selectedExpedition.is_free ? (
                    <span className="line-through text-gray-400 font-normal mr-1.5">
                      {formatRupiah(selectedExpedition.baseCost)}
                    </span>
                  ) : null}
                  <span>{selectedExpedition.is_free ? 'Gratis' : formatRupiah(selectedExpedition.cost)}</span>
                </span>
              </div>

              {shippingSavings > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Potongan Bebas Ongkir</span>
                  <span className="font-bold">- {formatRupiah(shippingSavings)}</span>
                </div>
              )}

              {/* Insurance Checkbox */}
              <div className="flex items-center justify-between pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer select-none text-gray-700">
                  <input
                    type="checkbox"
                    checked={withInsurance}
                    onChange={(e) => setWithInsurance(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-emerald-600 focus:ring-emerald-500 border-gray-300"
                  />
                  <span>Asuransi Pengiriman</span>
                </label>
                <span className="font-semibold text-gray-800">
                  {withInsurance ? formatRupiah(2500) : 'Rp 0'}
                </span>
              </div>

              <div className="flex justify-between text-gray-500">
                <span>Biaya Jasa Aplikasi</span>
                <span className="font-medium text-gray-700">{formatRupiah(serviceFee)}</span>
              </div>

              {paymentFee > 0 && (
                <div className="flex justify-between text-gray-500">
                  <span>Biaya Transaksi Pembayaran</span>
                  <span className="font-medium text-gray-700">{formatRupiah(paymentFee)}</span>
                </div>
              )}
            </div>

            {/* Total Savings Highlight Banner */}
            {totalSavings > 0 && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200/80 rounded-xl flex items-center gap-2 text-xs text-emerald-800">
                <Sparkles size={16} className="text-emerald-600 shrink-0 animate-pulse" />
                <span className="leading-snug">
                  Kamu berhemat <strong>{formatRupiah(totalSavings)}</strong> untuk transaksi belanja ini!
                </span>
              </div>
            )}

            {/* Grand Total */}
            <div className="pt-3 border-t border-gray-200 flex items-baseline justify-between">
              <div>
                <span className="text-xs text-gray-500 font-medium block">Total Tagihan:</span>
                <span className="text-xl sm:text-2xl font-black text-emerald-700">
                  {formatRupiah(grandTotal)}
                </span>
              </div>
              <span className="text-[11px] text-gray-400">Termasuk PPN</span>
            </div>

            {/* Pay Button Card */}
            <div className="space-y-1.5">
              <div className="text-[11px] text-gray-500 flex items-center justify-between">
                <span>Metode:</span>
                <strong className="text-gray-800 truncate max-w-[180px]">{selectedPayment.name}</strong>
              </div>

              <button
                type="button"
                disabled={isProcessing}
                onClick={handlePayNow}
                className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-extrabold text-sm rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Memproses Pesanan...</span>
                  </>
                ) : (
                  <>
                    <span>Bayar Sekarang</span>
                    <ChevronRight size={16} />
                  </>
                )}
              </button>
            </div>

            <div className="pt-1 flex items-center justify-center gap-1.5 text-[10px] text-gray-400 text-center">
              <ShieldCheck size={13} className="text-emerald-600 shrink-0" />
              <span>Transaksi aman terenkripsi 256-bit & Bergaransi Resmi</span>
            </div>
          </div>
        </div>

      </div>

      {/* Mobile Sticky Checkout Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 p-3 shadow-lg flex items-center justify-between gap-3">
        <div>
          <span className="text-[10px] text-gray-500 block">Total Tagihan:</span>
          <span className="text-base font-black text-emerald-700 leading-tight">
            {formatRupiah(grandTotal)}
          </span>
          {totalSavings > 0 && (
            <span className="text-[9px] text-emerald-600 font-bold block">
              Hemat {formatRupiah(totalSavings)}
            </span>
          )}
        </div>
        <button
          type="button"
          disabled={isProcessing}
          onClick={handlePayNow}
          className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
        >
          {isProcessing ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              <span>Memproses...</span>
            </>
          ) : (
            <>
              <span>Bayar Sekarang</span>
              <ChevronRight size={14} />
            </>
          )}
        </button>
      </div>

      {/* Address Selection Modal */}
      <AddressModal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        addresses={addresses}
        selectedAddressId={selectedAddressId}
        initialMode={addressModalInitialTab}
        onSelectAddress={(id) => setSelectedAddressId(id)}
        onSaveAddress={handleSaveAddress}
        onDeleteAddress={handleDeleteAddress}
      />

      {/* Expedition Selection Modal */}
      <ExpeditionModal
        isOpen={isExpeditionModalOpen}
        onClose={() => setIsExpeditionModalOpen(false)}
        selectedExpedition={selectedExpedition}
        onSelectExpedition={(exp) => setSelectedExpedition(exp)}
        totalWeight={totalWeight}
      />

      {/* Order Success / Payment Instructions Modal */}
      <PaymentInstructionModal
        isOpen={Boolean(orderSuccessData)}
        onClose={() => {
          setOrderSuccessData(null);
          onBackToCart();
        }}
        orderData={orderSuccessData}
        onPaymentConfirmed={(order) => {
          setOrderSuccessData(null);
          onBackToCart();
        }}
      />
    </div>
  );
}
