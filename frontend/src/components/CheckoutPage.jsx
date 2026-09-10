import React, { useState, useMemo, useEffect, useCallback } from 'react';
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
  Shield, 
  HelpCircle,
  Navigation
} from 'lucide-react';
import { formatRupiah } from '../utils/formatters';
import { apiClient } from '../services/apiClient';
import { mockAddresses, mockExpeditions, mockPaymentMethods, mockPaymentCategories } from '../data/mockCheckoutData';
import AddressModal from './AddressModal';
import ExpeditionModal from './ExpeditionModal';
import PaymentInstructionModal from './PaymentInstructionModal';

export default function CheckoutPage({
  checkoutItems = [],
  onBackToCart = () => {},
  onFinishOrder = () => {},
  availableExpeditions = null,
  initialVoucher = null
}) {
  const [addresses, setAddresses] = useState(mockAddresses);
  const [selectedAddressId, setSelectedAddressId] = useState(1);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [addressModalInitialTab, setAddressModalInitialTab] = useState('list');

  // Real-time calculated shipping rates from api.co.id backend service
  const [calculatedExpeditions, setCalculatedExpeditions] = useState([]);
  const [shippingDistanceKm, setShippingDistanceKm] = useState(null);
  const [shippingProvider, setShippingProvider] = useState('api.co.id Multi-Kurir Gateway');
  const [appHandlingFee, setAppHandlingFee] = useState(1000);
  const [isLoadingShippingRates, setIsLoadingShippingRates] = useState(false);

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

  const totalWeight = useMemo(() => {
    const count = checkoutItems.reduce((acc, item) => acc + item.quantity, 0);
    return Number((count * 0.4).toFixed(1)) || 0.4;
  }, [checkoutItems]);

  const currentAddress = useMemo(() => {
    return addresses.find(a => a.id === selectedAddressId) || addresses[0];
  }, [addresses, selectedAddressId]);

  // Selected courier per store
  const [selectedExpedition, setSelectedExpedition] = useState(() => {
    const initial = mockExpeditions[0];
    return {
      ...initial,
      baseCost: initial.baseCost || 18000,
      cost: initial.cost || 0,
      is_free: Boolean(initial.is_free)
    };
  });
  const [isExpeditionModalOpen, setIsExpeditionModalOpen] = useState(false);
  
  // Selected payment method
  const [selectedPayment, setSelectedPayment] = useState(mockPaymentMethods[0].methods[0]);
  const [selectedPaymentCategory, setSelectedPaymentCategory] = useState('Semua');

  // Coupon state
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(() => {
    if (initialVoucher) {
      return {
        code: initialVoucher.code,
        name: initialVoucher.title || `Voucher ${initialVoucher.code}`,
        discount: Number(initialVoucher.discount_value || 0),
        raw: initialVoucher
      };
    }
    return null;
  });
  const [couponError, setCouponError] = useState('');
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Shipping protection
  const [withInsurance, setWithInsurance] = useState(true);

  // Order success state
  const [orderSuccessData, setOrderSuccessData] = useState(null);

  // Fetch real-time shipping calculation from api.co.id backend
  const fetchShippingRates = useCallback(async () => {
    if (!currentAddress) return;
    setIsLoadingShippingRates(true);

    try {
      const payload = {
        city: currentAddress.city,
        district: currentAddress.district || currentAddress.city,
        latitude: currentAddress.latitude || null,
        longitude: currentAddress.longitude || null,
        weight_kg: totalWeight,
      };

      const res = await apiClient.post('/api/expeditions/calculate-cost', payload);
      if (res?.data?.expeditions && Array.isArray(res.data.expeditions)) {
        const rates = res.data.expeditions;
        setCalculatedExpeditions(rates);
        setShippingDistanceKm(res.data.distance_km || null);
        if (res.data.provider) setShippingProvider(res.data.provider);
        if (res.data.handling_fee !== undefined) setAppHandlingFee(Number(res.data.handling_fee));

        // Preserve current selected expedition code/service if available in new calculation
        setSelectedExpedition(prev => {
          const match = rates.find(r => r.id === prev.id || r.code === prev.code);
          return match || rates[0] || prev;
        });
      }
    } catch {
      // Offline fallback: gunakan mockExpeditions dengan kalkulasi lokal
      setCalculatedExpeditions(mockExpeditions);
    } finally {
      setIsLoadingShippingRates(false);
    }
  }, [currentAddress, totalWeight]);

  useEffect(() => {
    fetchShippingRates();
  }, [fetchShippingRates]);

  // Calculations
  const totalItemPrice = useMemo(() => {
    return checkoutItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  }, [checkoutItems]);

  const discountAmount = appliedCoupon ? appliedCoupon.discount : 0;
  
  const shippingCost = useMemo(() => {
    if (!selectedExpedition) return 0;
    if (selectedExpedition.is_free) return 0;
    return Number(selectedExpedition.cost || selectedExpedition.baseCost || selectedExpedition.base_cost || 18000);
  }, [selectedExpedition]);

  const shippingSavings = selectedExpedition?.is_free ? (selectedExpedition.baseCost || selectedExpedition.base_cost || 18000) : 0;
  const insuranceCost = withInsurance ? 2500 : 0;
  const serviceFee = 1000;
  const paymentFee = selectedPayment.fee || 0;

  // Total biaya aplikasi mencakup Biaya Jasa Aplikasi + Biaya Penanganan Proteksi Request & Tracking Berulang
  const totalAppFees = serviceFee + appHandlingFee;

  const totalSavings = shippingSavings + discountAmount;
  const grandTotal = Math.max(0, totalItemPrice - discountAmount + shippingCost + insuranceCost + totalAppFees + paymentFee);

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    const code = couponInput.trim().toUpperCase();
    if (!code) return;

    setIsApplyingCoupon(true);
    setCouponError('');

    try {
      const res = await apiClient.get('/api/vouchers');
      const vouchers = res.data || [];
      const matched = vouchers.find(v => v.code === code && v.is_active);

      if (!matched) {
        setCouponError(`Kode promo "${code}" tidak valid atau telah kedaluwarsa.`);
        return;
      }

      const minPurchase = Number(matched.min_purchase || 0);
      if (totalItemPrice < minPurchase) {
        setCouponError(`Voucher "${matched.title}" membutuhkan minimum belanja ${formatRupiah(minPurchase)}.`);
        return;
      }

      let discountVal = 0;
      if (matched.discount_type === 'percentage') {
        discountVal = (totalItemPrice * Number(matched.discount_value)) / 100;
        if (matched.max_discount) {
          discountVal = Math.min(discountVal, Number(matched.max_discount));
        }
      } else {
        discountVal = Number(matched.discount_value || 0);
      }

      setAppliedCoupon({
        code: matched.code,
        name: matched.title || `Voucher ${matched.code}`,
        discount: discountVal,
        raw: matched
      });
      setCouponInput('');
    } catch {
      // Offline fallback: DISKON20 / HEMAT20
      if (code === 'DISKON20' || code === 'HEMAT20') {
        setAppliedCoupon({ code, discount: 20000, name: 'Kupon Diskon Belanja Rp 20.000' });
        setCouponInput('');
      } else {
        setCouponError('Gagal memvalidasi kode promo. Periksa koneksi backend.');
      }
    } finally {
      setIsApplyingCoupon(false);
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
      const sellerKey = item.seller_name || 'Tusko Official Store';
      if (!groups[sellerKey]) {
        groups[sellerKey] = {
          sellerName: sellerKey,
          location: item.location || 'Jakarta Pusat',
          isOfficial: item.is_official ?? true,
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
      const trackingResi = `TK${new Date().getFullYear()}${Math.floor(100000000 + Math.random() * 900000000)}`;

      const orderData = {
        invoiceNumber,
        vaNumber,
        trackingResi,
        totalAmount: grandTotal,
        totalSavings,
        appliedCoupon,
        paymentMethod: selectedPayment,
        address: currentAddress,
        expedition: selectedExpedition,
        shippingDistanceKm,
        shippingProvider,
        appHandlingFee,
        items: checkoutItems,
        createdAt: new Date().toISOString()
      };

      setOrderSuccessData(orderData);
      onFinishOrder(orderData);
    }, 600);
  };

  if (checkoutItems.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center">
        <div className="bg-white rounded-none border border-neutral-300 p-8 shadow-sm">
          <p className="text-neutral-600 text-sm">Tidak ada barang yang dipilih untuk checkout.</p>
          <button
            onClick={onBackToCart}
            className="mt-4 px-4 py-2 bg-neutral-950 text-white rounded-none text-xs font-black uppercase tracking-wider"
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
          className="flex items-center gap-1.5 text-xs sm:text-sm font-bold uppercase tracking-wider text-neutral-800 hover:text-neutral-950 bg-white hover:bg-neutral-50 px-3 py-2 rounded-none border border-neutral-300 transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>Kembali ke Keranjang</span>
        </button>

        <div className="flex items-center gap-2">
          <ShieldCheck size={18} className="text-neutral-900" />
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-700">Checkout Aman & Terenkripsi</span>
        </div>
      </div>

      {/* Main Layout: Checkout Details (8 cols) | Summary (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Form: Address, Items, Courier, Payment */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* 1. Alamat Pengiriman */}
          <div className="bg-white rounded-none border border-neutral-200 p-4 sm:p-5 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
              <h3 className="text-sm font-black uppercase tracking-tight text-neutral-950 flex items-center gap-2">
                <MapPin size={16} className="text-neutral-900" />
                <span>Alamat Pengiriman</span>
              </h3>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => handleOpenAddressModal('add')}
                  className="text-xs font-bold uppercase tracking-wider text-neutral-900 hover:text-black cursor-pointer flex items-center gap-1 hover:underline"
                >
                  <Plus size={13} strokeWidth={2.5} />
                  <span>Tambah Alamat</span>
                </button>
                <span className="text-neutral-300">|</span>
                <button
                  type="button"
                  onClick={() => handleOpenAddressModal('list')}
                  className="text-xs font-bold uppercase tracking-wider text-neutral-600 hover:text-neutral-950 cursor-pointer hover:underline"
                >
                  Pilih Alamat Lain
                </button>
              </div>
            </div>

            <div className="mt-3 text-xs text-neutral-700">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-neutral-950 text-sm">{currentAddress.recipient_name}</span>
                <span className="text-neutral-400">|</span>
                <span className="text-neutral-600 font-mono">{currentAddress.phone}</span>
                <span className="bg-neutral-100 text-neutral-900 font-bold uppercase text-[10px] px-2 py-0.5 rounded-none border border-neutral-300">
                  {currentAddress.label}
                </span>
                {shippingDistanceKm !== null && (
                  <span className="bg-neutral-900 text-white font-black uppercase text-[10px] px-2 py-0.5 rounded-none flex items-center gap-1">
                    <Navigation size={10} />
                    <span>Jarak: {shippingDistanceKm} km</span>
                  </span>
                )}
              </div>
              <p className="mt-1.5 text-neutral-600 leading-relaxed">
                {currentAddress.full_address}, {currentAddress.district ? `${currentAddress.district}, ` : ''}{currentAddress.city}, {currentAddress.province}, {currentAddress.postal_code}
              </p>
            </div>
          </div>

          {/* 2. Daftar Barang per Toko & Pilihan Kurir */}
          {groupedItems.map((group, idx) => (
            <div key={idx} className="bg-white rounded-none border border-neutral-200 p-4 sm:p-5 shadow-sm space-y-4">
              {/* Store title */}
              <div className="flex items-center gap-2 pb-2 border-b border-neutral-200">
                <Store size={16} className="text-neutral-900" />
                <span className="font-black uppercase tracking-tight text-xs sm:text-sm text-neutral-950">{group.sellerName}</span>
                {group.isOfficial && (
                  <span className="bg-neutral-950 text-white text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-none">
                    Official Store
                  </span>
                )}
                <span className="text-[11px] text-neutral-500">• Kota {group.location}</span>
              </div>

              {/* Items in store */}
              <div className="divide-y divide-neutral-100">
                {group.items.map(item => (
                  <div key={item.id} className="py-2.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={item.image_url}
                        alt=""
                        className="w-12 h-12 rounded-none object-cover border border-neutral-300 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-neutral-900 uppercase tracking-tight line-clamp-1">{item.name}</p>
                        <p className="text-[11px] text-neutral-500 mt-0.5">
                          {item.quantity} barang x {formatRupiah(item.price)}
                        </p>
                        {item.notes && (
                          <p className="text-[10px] text-neutral-700 italic mt-0.5">
                            Catatan: "{item.notes}"
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="text-xs font-black text-neutral-950 shrink-0">
                      {formatRupiah(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Courier Selection */}
              <div className="pt-3 border-t border-neutral-200 bg-neutral-50 p-3.5 rounded-none space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase tracking-wider text-neutral-950 flex items-center gap-1.5">
                    <Truck size={15} className="text-neutral-900" />
                    <span>Opsi Pengiriman ({shippingProvider})</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsExpeditionModalOpen(true)}
                    className="text-xs font-black uppercase tracking-wider text-neutral-900 hover:text-black cursor-pointer flex items-center gap-0.5 hover:underline"
                  >
                    <span>Lihat Semua Ekspedisi</span>
                    <ChevronRight size={13} />
                  </button>
                </div>

                {/* Selected Expedition Card */}
                <div 
                  onClick={() => setIsExpeditionModalOpen(true)}
                  className="p-3 bg-white border border-neutral-950 ring-1 ring-neutral-950 rounded-none cursor-pointer hover:bg-neutral-50 transition-all flex items-center justify-between shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-none bg-neutral-950 text-white font-black flex items-center justify-center text-xs shrink-0">
                      {selectedExpedition.name ? selectedExpedition.name.slice(0, 3).toUpperCase() : 'EXP'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-black uppercase tracking-tight text-neutral-950">
                          {selectedExpedition.name} - {selectedExpedition.service}
                        </span>
                        {selectedExpedition.badge && (
                          <span className={`text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-none ${
                            selectedExpedition.is_free ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'bg-neutral-200 text-neutral-900 border border-neutral-300'
                          }`}>
                            {selectedExpedition.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-neutral-600 mt-0.5">
                        Estimasi tiba: <strong>{selectedExpedition.etd}</strong> • {selectedExpedition.category}
                        {shippingDistanceKm !== null && ` • ${shippingDistanceKm} km`}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    {selectedExpedition.is_free ? (
                      <div>
                        <span className="text-xs sm:text-sm font-black text-emerald-700 uppercase tracking-wider block">Gratis</span>
                        <span className="text-[10px] text-neutral-400 line-through">
                          {formatRupiah(selectedExpedition.baseCost || selectedExpedition.base_cost || 18000)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs sm:text-sm font-black text-neutral-950">{formatRupiah(shippingCost)}</span>
                    )}
                    <span className="text-[10px] text-neutral-900 font-black uppercase tracking-wider block mt-0.5">Ubah</span>
                  </div>
                </div>

                {/* Quick Selection Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-xs no-scrollbar">
                  <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider shrink-0 mr-0.5">Pilihan Populer:</span>
                  {(calculatedExpeditions.length > 0 ? calculatedExpeditions : mockExpeditions).slice(0, 4).map(exp => (
                    <button
                      key={exp.id || `${exp.code}-${exp.service}`}
                      type="button"
                      onClick={() => setSelectedExpedition(exp)}
                      className={`px-2.5 py-1 rounded-none border text-[11px] font-bold uppercase tracking-wider shrink-0 cursor-pointer transition-colors ${
                        (selectedExpedition.id === exp.id || selectedExpedition.code === exp.code)
                          ? 'border-neutral-950 bg-neutral-950 text-white shadow-xs'
                          : 'border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100'
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
          <div className="bg-white rounded-none border border-neutral-200 p-4 sm:p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-200">
              <h3 className="text-sm font-black uppercase tracking-tight text-neutral-950 flex items-center gap-2">
                <CreditCard size={16} className="text-neutral-900" />
                <span>Pilih Metode Pembayaran</span>
              </h3>
              <span className="text-[11px] text-neutral-500 font-medium">Didukung Midtrans & Bank Resmi Indonesia</span>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {mockPaymentCategories.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedPaymentCategory(cat)}
                  className={`px-3 py-1.5 rounded-none text-xs font-bold uppercase tracking-wider whitespace-nowrap cursor-pointer transition-colors ${
                    selectedPaymentCategory === cat
                      ? 'bg-neutral-950 text-white shadow-xs'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 border border-neutral-200'
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
                  <span className="text-[11px] font-black text-neutral-900 uppercase tracking-wider block">
                    {cat.category}
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {cat.methods.map((method) => {
                      const isSelected = selectedPayment.id === method.id;
                      return (
                        <div
                          key={method.id}
                          onClick={() => setSelectedPayment(method)}
                          className={`p-3 rounded-none border cursor-pointer transition-all flex flex-col justify-between gap-2.5 ${
                            isSelected
                              ? 'border-neutral-950 bg-neutral-50 ring-1 ring-neutral-950 shadow-xs'
                              : 'border-neutral-200 bg-white hover:border-neutral-400'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                              <div className={`p-2 rounded-none shrink-0 ${isSelected ? 'bg-neutral-950 text-white' : 'bg-neutral-100 text-neutral-700'}`}>
                                {method.icon === 'QrCode' ? <QrCode size={16} /> : method.icon === 'Building2' ? <Building2 size={16} /> : <CreditCard size={16} />}
                              </div>
                              <div>
                                <p className="text-xs font-bold uppercase tracking-tight text-neutral-950 leading-snug">{method.name}</p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  {method.badge && (
                                    <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 bg-neutral-200 text-neutral-900 rounded-none border border-neutral-300">
                                      {method.badge}
                                    </span>
                                  )}
                                  <span className="text-[10px] text-neutral-500">
                                    {method.fee > 0 ? `Biaya: ${formatRupiah(method.fee)}` : 'Bebas Biaya'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Radio check indicator */}
                            <div className={`w-4 h-4 rounded-none flex items-center justify-center shrink-0 border ${
                              isSelected ? 'border-neutral-950 bg-neutral-950 text-white' : 'border-neutral-400 bg-white'
                            }`}>
                              {isSelected && <div className="w-1.5 h-1.5 rounded-none bg-white" />}
                            </div>
                          </div>

                          {method.description && (
                            <p className="text-[10px] text-neutral-500 leading-relaxed border-t border-neutral-100 pt-1.5">
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
          <div className="sticky top-20 bg-white rounded-none border border-neutral-200 p-4 sm:p-5 shadow-sm space-y-4">
            <h3 className="font-black uppercase tracking-tight text-neutral-950 text-sm sm:text-base pb-2 border-b border-neutral-200 flex items-center justify-between">
              <span>Ringkasan Pembayaran</span>
              <span className="text-[11px] text-neutral-500 font-normal">{checkoutItems.reduce((acc, i) => acc + i.quantity, 0)} barang</span>
            </h3>

            {/* Promo / Coupon Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-wider text-neutral-900 flex items-center gap-1">
                <Tag size={13} className="text-neutral-900" />
                <span>Makin Hemat Pakai Promo</span>
              </label>

              {appliedCoupon ? (
                <div className="p-2.5 bg-neutral-50 border border-neutral-300 rounded-none flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Sparkles size={14} className="text-neutral-900 shrink-0" />
                    <div>
                      <span className="font-black uppercase tracking-wider text-neutral-950 block">{appliedCoupon.code}</span>
                      <span className="text-[10px] text-neutral-600 font-bold">Hemat {formatRupiah(appliedCoupon.discount)}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="text-xs font-black uppercase tracking-wider text-rose-600 hover:text-rose-800 cursor-pointer"
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
                    placeholder="Masukkan kode promo"
                    className="flex-1 px-3 py-1.5 text-xs bg-neutral-50 border border-neutral-300 rounded-none focus:outline-none focus:border-neutral-950 uppercase font-medium"
                  />
                  <button
                    type="submit"
                    disabled={isApplyingCoupon}
                    className="px-3 py-1.5 bg-neutral-950 hover:bg-neutral-800 text-white rounded-none text-xs font-black uppercase tracking-wider transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                  >
                    {isApplyingCoupon ? 'Cek...' : 'Terapkan'}
                  </button>
                </form>
              )}

              {couponError && (
                <span className="text-[10px] text-rose-600 font-medium block">{couponError}</span>
              )}
            </div>

            {/* Detailed Itemized Costs */}
            <div className="space-y-2.5 text-xs text-neutral-700 pt-2 border-t border-neutral-200">
              <div className="flex justify-between">
                <span>Total Harga Barang</span>
                <span className="font-bold text-neutral-950">{formatRupiah(totalItemPrice)}</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-800">
                  <span>Diskon Promo Kupon</span>
                  <span className="font-bold">- {formatRupiah(discountAmount)}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Total Ongkos Kirim ({selectedExpedition.name})</span>
                <span className="font-bold text-neutral-950">
                  {selectedExpedition.is_free ? (
                    <span className="line-through text-neutral-400 font-normal mr-1.5">
                      {formatRupiah(selectedExpedition.baseCost || selectedExpedition.base_cost || 18000)}
                    </span>
                  ) : null}
                  <span>{selectedExpedition.is_free ? 'Gratis' : formatRupiah(shippingCost)}</span>
                </span>
              </div>

              {shippingSavings > 0 && (
                <div className="flex justify-between text-emerald-800">
                  <span>Potongan Bebas Ongkir</span>
                  <span className="font-bold">- {formatRupiah(shippingSavings)}</span>
                </div>
              )}

              {/* Insurance Checkbox */}
              <div className="flex items-center justify-between pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer select-none text-neutral-800">
                  <input
                    type="checkbox"
                    checked={withInsurance}
                    onChange={(e) => setWithInsurance(e.target.checked)}
                    className="w-3.5 h-3.5 rounded-none text-neutral-950 focus:ring-neutral-950 border-neutral-400 cursor-pointer"
                  />
                  <span>Asuransi Pengiriman</span>
                </label>
                <span className="font-bold text-neutral-950">
                  {withInsurance ? formatRupiah(2500) : 'Rp 0'}
                </span>
              </div>

              <div className="flex justify-between text-neutral-600">
                <span>Biaya Jasa Aplikasi</span>
                <span className="font-medium text-neutral-800">{formatRupiah(serviceFee)}</span>
              </div>

              {/* Biaya Penanganan App (Proteksi Request Multi-Check & Live Tracking API) */}
              <div className="flex justify-between text-neutral-600">
                <div className="flex items-center gap-1">
                  <span>Biaya Penanganan App</span>
                  <span title="Biaya penanganan sistem aplikasi untuk proteksi lonjakan request cek harga dan live-tracking posisi barang berulang kali" className="cursor-help">
                    <HelpCircle size={11} className="text-neutral-400" />
                  </span>
                </div>
                <span className="font-medium text-neutral-800">{formatRupiah(appHandlingFee)}</span>
              </div>

              {paymentFee > 0 && (
                <div className="flex justify-between text-neutral-600">
                  <span>Biaya Transaksi Pembayaran</span>
                  <span className="font-medium text-neutral-800">{formatRupiah(paymentFee)}</span>
                </div>
              )}
            </div>

            {/* Total Savings Highlight Banner */}
            {totalSavings > 0 && (
              <div className="p-2.5 bg-neutral-100 border border-neutral-300 rounded-none flex items-center gap-2 text-xs text-neutral-900 font-bold uppercase tracking-tight">
                <Sparkles size={16} className="text-neutral-900 shrink-0" />
                <span className="leading-snug">
                  Hemat <strong>{formatRupiah(totalSavings)}</strong> untuk pesanan ini!
                </span>
              </div>
            )}

            {/* Grand Total */}
            <div className="pt-3 border-t border-neutral-300 flex items-baseline justify-between">
              <div>
                <span className="text-xs text-neutral-500 font-bold uppercase tracking-wider block">Total Tagihan:</span>
                <span className="text-xl sm:text-2xl font-black text-neutral-950">
                  {formatRupiah(grandTotal)}
                </span>
              </div>
              <span className="text-[11px] text-neutral-500 font-medium">Termasuk PPN</span>
            </div>

            {/* Pay Button Card */}
            <div className="space-y-1.5">
              <div className="text-[11px] text-neutral-600 flex items-center justify-between">
                <span>Metode:</span>
                <strong className="text-neutral-900 uppercase font-black truncate max-w-[180px]">{selectedPayment.name}</strong>
              </div>

              <button
                type="button"
                disabled={isProcessing}
                onClick={handlePayNow}
                className="w-full py-3.5 px-4 bg-neutral-950 hover:bg-neutral-800 disabled:opacity-60 text-white font-black uppercase tracking-wider text-xs sm:text-sm rounded-none shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
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

            <div className="pt-1 flex items-center justify-center gap-1.5 text-[10px] text-neutral-500 text-center font-medium">
              <ShieldCheck size={13} className="text-neutral-900 shrink-0" />
              <span>Transaksi aman terenkripsi & Garansi Resmi</span>
            </div>
          </div>
        </div>

      </div>

      {/* Mobile Sticky Checkout Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-neutral-300 p-3 shadow-lg flex items-center justify-between gap-3">
        <div>
          <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider block">Total Tagihan:</span>
          <span className="text-base font-black text-neutral-950 leading-tight">
            {formatRupiah(grandTotal)}
          </span>
          {totalSavings > 0 && (
            <span className="text-[9px] text-emerald-800 font-black uppercase tracking-wider block">
              Hemat {formatRupiah(totalSavings)}
            </span>
          )}
        </div>
        <button
          type="button"
          disabled={isProcessing}
          onClick={handlePayNow}
          className="px-6 py-2.5 bg-neutral-950 hover:bg-neutral-800 disabled:opacity-50 text-white font-black uppercase text-xs tracking-wider rounded-none shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
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
        expeditions={calculatedExpeditions.length > 0 ? calculatedExpeditions : (availableExpeditions || mockExpeditions)}
        distanceKm={shippingDistanceKm}
        provider={shippingProvider}
        isLoadingRates={isLoadingShippingRates}
      />

      {/* Order Success / Payment Instructions Modal */}
      <PaymentInstructionModal
        isOpen={Boolean(orderSuccessData)}
        onClose={() => {
          const completed = orderSuccessData;
          setOrderSuccessData(null);
          if (completed) onFinishOrder(completed);
        }}
        orderData={orderSuccessData}
        onPaymentConfirmed={(order) => {
          const completed = order || orderSuccessData;
          setOrderSuccessData(null);
          if (completed) onFinishOrder(completed);
        }}
      />
    </div>
  );
}
