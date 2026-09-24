import React, { useState, useMemo, useEffect } from 'react';
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
  ShoppingBag
} from 'lucide-react';
import { formatRupiah } from '../utils/formatters';
import { mockAddresses, mockExpeditions, mockPaymentMethods, mockPaymentCategories } from '../data/mockCheckoutData';
import { checkoutService } from '../services/checkoutService';
import { authService } from '../services/authService';
import TextInput from './molecules/TextInput';
import Checkbox from './molecules/Checkbox';
import IconButton from './atoms/IconButton';
import AddressModal from './AddressModal';
import ExpeditionModal from './ExpeditionModal';
import PaymentInstructionModal from './PaymentInstructionModal';

export default function CheckoutPage({
  checkoutItems = [],
  onBackToCart = () => {},
  onFinishOrder = () => {},
  availableExpeditions = null
}) {
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
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
    setIsAddressModalOpen(false);
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

  // Muat alamat tersimpan pengguna dari API (fallback ke contoh bila kosong).
  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const list = await authService.getAddresses();
        const source = Array.isArray(list) && list.length > 0 ? list : mockAddresses;
        if (!active) return;
        setAddresses(source);
        const preferred = source.find((a) => a.is_default) || source[0];
        setSelectedAddressId(preferred?.id ?? null);
      } catch {
        if (!active) return;
        setAddresses(mockAddresses);
        setSelectedAddressId(mockAddresses[0]?.id ?? null);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const currentAddress = useMemo(() => {
    return addresses.find(a => a.id === selectedAddressId) || addresses[0] || {
      recipient_name: 'Penerima',
      phone: '081234567890',
      label: 'Rumah',
      full_address: 'Alamat belum diatur',
      city: 'Jakarta',
      province: 'DKI Jakarta',
      postal_code: '10110'
    };
  }, [addresses, selectedAddressId]);

  // Group items by seller
  const groupedItems = useMemo(() => {
    const groups = {};
    checkoutItems.forEach(item => {
      const sellerKey = item.seller_name || 'Tusko Warehouse';
      if (!groups[sellerKey]) {
        groups[sellerKey] = {
          sellerName: sellerKey,
          location: item.location || 'Gudang Pusat',
          isOfficial: item.is_official ?? true,
          items: []
        };
      }
      groups[sellerKey].items.push(item);
    });
    return Object.values(groups);
  }, [checkoutItems]);

  // Tarif kurir live dari ShippingRateService (fallback ke daftar ekspedisi yang ada).
  const [shippingRates, setShippingRates] = useState([]);

  // Active expeditions list with normalized cost and baseCost
  const activeExpeditions = useMemo(() => {
    const rawList = shippingRates.length > 0
      ? shippingRates
      : ((availableExpeditions && availableExpeditions.length > 0)
          ? availableExpeditions.filter(e => e.isActive)
          : mockExpeditions);

    return rawList.map(e => {
      const isFree = e.is_free !== undefined ? e.is_free : (e.cost === 0 || e.baseRate === 0);
      const costVal = isFree ? 0 : Number(e.cost !== undefined ? e.cost : (e.baseRate || 0));
      const baseCostVal = Number(e.baseCost !== undefined ? e.baseCost : (e.baseRate || 15000));
      return {
        ...e,
        is_free: isFree,
        cost: costVal,
        baseCost: baseCostVal,
      };
    });
  }, [shippingRates, availableExpeditions]);

  const [selectedExpedition, setSelectedExpedition] = useState(() => {
    if (availableExpeditions && availableExpeditions.length > 0) {
      const def = availableExpeditions.find(e => e.isDefault && e.isActive);
      const active = def || availableExpeditions.find(e => e.isActive);
      if (active) {
        const isFree = active.is_free !== undefined ? active.is_free : (active.cost === 0 || active.baseRate === 0);
        return {
          ...active,
          is_free: isFree,
          cost: isFree ? 0 : Number(active.cost !== undefined ? active.cost : (active.baseRate || 0)),
          baseCost: Number(active.baseCost !== undefined ? active.baseCost : (active.baseRate || 15000)),
        };
      }
    }
    return mockExpeditions[0];
  });

  const [isExpeditionModalOpen, setIsExpeditionModalOpen] = useState(false);

  // Total weight in grams (approx 400g per athletic product)
  const totalWeight = useMemo(() => {
    return checkoutItems.reduce((acc, item) => acc + (item.weight || 400) * item.quantity, 0);
  }, [checkoutItems]);

  // Muat tarif kurir live dari agregator berdasarkan kota tujuan & berat total.
  useEffect(() => {
    let active = true;
    const destination = currentAddress?.city;

    if (!destination || totalWeight <= 0) {
      return undefined;
    }

    (async () => {
      try {
        const res = await checkoutService.getShippingRates({ destination, weight: totalWeight });
        if (!active) return;

        const mapped = (res.data || []).map((rate, idx) => ({
          id: `rate-${rate.courier || 'kurir'}-${rate.service || idx}`,
          name: String(rate.courier || 'Kurir').toUpperCase(),
          service: rate.service || 'REG',
          service_name: rate.description || rate.service || 'Reguler',
          cost: Number(rate.cost) || 0,
          baseCost: Number(rate.cost) || 0,
          etd: rate.etd || null,
          is_free: false,
          isActive: true,
          provider: rate.provider || null,
        }));

        setShippingRates(mapped);

        if (mapped.length > 0) {
          setSelectedExpedition((prev) => (
            prev && mapped.some((item) => item.id === prev.id) ? prev : mapped[0]
          ));
        }
      } catch {
        // Fallback: tetap gunakan daftar ekspedisi yang tersedia.
      }
    })();

    return () => {
      active = false;
    };
  }, [currentAddress?.city, totalWeight]);

  // Payment Selection State
  const [selectedPaymentCategory, setSelectedPaymentCategory] = useState('Semua');
  const [selectedPayment, setSelectedPayment] = useState(() => {
    return mockPaymentMethods[0].methods[0];
  });

  // Insurance checkbox
  const [withInsurance, setWithInsurance] = useState(true);

  // Promo coupon
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    if (!couponInput.trim()) return;

    if (couponInput.toUpperCase() === 'DISKON20' || couponInput.toUpperCase() === 'TUSKO20') {
      setAppliedCoupon({
        code: couponInput.toUpperCase(),
        discount: 25000
      });
      setCouponError('');
    } else if (couponInput.toUpperCase() === 'HEMAT50') {
      setAppliedCoupon({
        code: couponInput.toUpperCase(),
        discount: 50000
      });
      setCouponError('');
    } else {
      setCouponError('Kupon tidak valid atau syarat minimal belanja belum terpenuhi.');
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput('');
    setCouponError('');
  };

  // Calculations
  const totalItemPrice = useMemo(() => {
    return checkoutItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  }, [checkoutItems]);

  const expeditionCost = selectedExpedition?.is_free ? 0 : (selectedExpedition?.cost ?? selectedExpedition?.baseRate ?? 0);
  const shippingCost = Number(expeditionCost) || 0;
  const insuranceCost = withInsurance ? 2500 : 0;
  const serviceFee = 1000;
  const paymentFee = selectedPayment?.fee || 0;
  const discountAmount = appliedCoupon ? appliedCoupon.discount : 0;
  const shippingSavings = selectedExpedition?.is_free ? Number(selectedExpedition?.baseCost ?? selectedExpedition?.baseRate ?? 15000) : 0;
  const totalSavings = discountAmount + shippingSavings;

  const grandTotal = Math.max(
    0, 
    totalItemPrice + shippingCost + insuranceCost + serviceFee + paymentFee - discountAmount
  );

  // Order processing state & order success modal
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderSuccessData, setOrderSuccessData] = useState(null);
  const [copiedVa, setCopiedVa] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');

  const handlePayNow = async () => {
    setIsProcessing(true);
    setCheckoutError('');

    const isManualTransfer = /manual|bank|transfer/i.test(selectedPayment?.name || '');

    const payload = {
      items: checkoutItems.map((item) => ({
        product_id: item.product_id ?? item.id,
        product_variant_id: item.product_variant_id ?? null,
        quantity: item.quantity,
        notes: item.notes || null,
      })),
      recipient_name: currentAddress.recipient_name,
      phone: currentAddress.phone,
      full_address: currentAddress.full_address,
      province: currentAddress.province,
      city: currentAddress.city,
      district: currentAddress.district || null,
      postal_code: currentAddress.postal_code,
      address_label: currentAddress.label,
      expedition_name: selectedExpedition?.name || 'Ekspedisi',
      expedition_service: selectedExpedition?.service || selectedExpedition?.service_name || 'Reguler',
      expedition_etd: selectedExpedition?.etd || null,
      shipping_cost: shippingCost,
      insurance_cost: insuranceCost,
      service_fee: serviceFee,
      discount_amount: discountAmount,
      coupon_code: appliedCoupon?.code || null,
      payment_method: isManualTransfer ? 'manual_transfer' : 'midtrans',
      payment_channel: selectedPayment?.name || null,
    };

    try {
      const response = await checkoutService.createOrder(payload);
      const order = response.data || {};

      const completedOrder = {
        invoiceNumber: order.order_number,
        vaNumber: order.va_number,
        address: currentAddress,
        items: checkoutItems,
        expedition: selectedExpedition,
        paymentMethod: selectedPayment,
        totalAmount: Number(order.grand_total ?? grandTotal),
        totalSavings,
        createdAt: order.created_at || new Date().toISOString(),
      };

      setOrderSuccessData(completedOrder);
      onFinishOrder(completedOrder);
    } catch (err) {
      const firstValidation = err.errors ? Object.values(err.errors)[0] : null;
      setCheckoutError(
        (Array.isArray(firstValidation) ? firstValidation[0] : firstValidation)
        || err.message
        || 'Gagal membuat pesanan. Silakan coba lagi.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  if (checkoutItems.length === 0) {
    return (
      <div className="w-full py-16 px-4 text-center">
        <div className="bg-white rounded-none border border-neutral-300 shadow-2xs p-5 sm:p-6 max-w-xl mx-auto">
          <p className="text-black font-sport font-bold uppercase text-sm">Tidak ada barang yang dipilih untuk checkout.</p>
          <button
            onClick={onBackToCart}
            className="mt-6 px-6 py-3 bg-black hover:bg-neutral-800 text-white rounded-none font-sport font-black uppercase text-xs tracking-wider transition-colors cursor-pointer -skew-x-3 hover:skew-x-0"
          >
            Kembali ke Keranjang
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Header Bar */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-none border border-neutral-300 shadow-2xs">
        <div className="flex items-center gap-3">
          <IconButton icon={ArrowLeft} variant="outline" tooltip="Kembali ke Keranjang" onClick={onBackToCart} />
          <h1 className="text-xl sm:text-2xl font-black font-sport uppercase tracking-tight text-neutral-950">
            Checkout
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <IconButton icon={ShieldCheck} variant="secondary" tooltip="Checkout aman &amp; terenkripsi" />
          <IconButton icon={ArrowLeft} variant="outline" tooltip="Kembali ke Keranjang" onClick={onBackToCart} />
        </div>
      </div>

      {/* Main Layout: Checkout Details (8 cols) | Summary (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* Left Form: Address, Items, Courier, Payment */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* 1. Alamat Pengiriman */}
          <div className="bg-white rounded-none border border-neutral-300 p-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-black font-sport text-neutral-950 uppercase tracking-wider flex items-center gap-2 border-b border-neutral-200 pb-3">
                <MapPin size={16} className="text-amber-500" />
                <span>Alamat Pengiriman</span>
              </h2>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleOpenAddressModal('add')}
                  className="text-xs font-sport font-bold uppercase text-black hover:text-amber-600 cursor-pointer flex items-center gap-1"
                >
                  <Plus size={13} strokeWidth={2.5} />
                  <span>Tambah Alamat</span>
                </button>
                <span className="text-neutral-300">|</span>
                <button
                  type="button"
                  onClick={() => handleOpenAddressModal('list')}
                  className="text-xs font-sport font-bold uppercase text-neutral-600 hover:text-black cursor-pointer"
                >
                  Pilih Alamat Lain
                </button>
              </div>
            </div>

            <div className="mt-3 text-xs text-neutral-700">
              <div className="flex items-center gap-2">
                <span className="font-sport font-black uppercase text-black text-sm">{currentAddress.recipient_name}</span>
                <span className="text-neutral-400">|</span>
                <span className="font-mono text-neutral-600 font-bold">{currentAddress.phone}</span>
                <span className="bg-black text-white font-sport font-black text-[9px] uppercase px-2 py-0.5 rounded-none ml-2">
                  {currentAddress.label}
                </span>
              </div>
              <p className="mt-1.5 text-neutral-600 leading-relaxed font-medium">
                {currentAddress.full_address}, {currentAddress.city}, {currentAddress.province}, {currentAddress.postal_code}
              </p>
            </div>
          </div>

          {/* 2. Daftar Barang per Toko & Pilihan Kurir */}
          {groupedItems.map((group, idx) => (
            <div key={idx} className="bg-white rounded-none border border-neutral-300 p-5 space-y-4">
              {/* Store title */}
              <div className="flex items-center gap-2 pb-3 border-b border-neutral-200">
                <Store size={16} className="text-black" />
                <span className="font-sport font-black uppercase text-xs sm:text-sm text-black tracking-wide">{group.sellerName}</span>
                {group.isOfficial && (
                  <span className="bg-black text-white text-[9px] font-sport font-black uppercase px-1.5 py-0.5 rounded-none flex items-center gap-0.5">
                    <BadgeCheck size={10} className="text-amber-400" />
                    Official Store
                  </span>
                )}
                <span className="text-[11px] text-neutral-500 font-medium">• Kota {group.location}</span>
              </div>

              {/* Items in store */}
              <div className="divide-y divide-neutral-200">
                {group.items.map(item => (
                  <div key={item.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={item.image_url}
                        alt=""
                        className="w-14 h-14 rounded-none object-cover border border-neutral-300 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-sport font-black uppercase text-black line-clamp-1">{item.name}</p>
                        <p className="text-[11px] text-neutral-600 mt-0.5 font-medium">
                          {item.quantity} unit x <strong className="text-black font-sport">{formatRupiah(item.price)}</strong>
                        </p>
                        {item.notes && (
                          <p className="text-[10px] text-neutral-500 italic mt-0.5">
                            Catatan: "{item.notes}"
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="text-xs sm:text-sm font-sport font-black text-black shrink-0">
                      {formatRupiah(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Courier Selection */}
              <div className="border-t border-neutral-200 bg-neutral-50 p-4 rounded-none space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                    Opsi Pengiriman (Ekspedisi)
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsExpeditionModalOpen(true)}
                    className="text-xs font-sport font-bold uppercase text-black hover:text-amber-600 cursor-pointer flex items-center gap-0.5"
                  >
                    <span>Pilih Ekspedisi</span>
                    <ChevronRight size={13} />
                  </button>
                </div>

                {/* Selected Expedition Card */}
                <div 
                  onClick={() => setIsExpeditionModalOpen(true)}
                  className="p-3.5 bg-white border border-neutral-300 shadow-2xs rounded-none cursor-pointer hover:bg-neutral-50 transition-all flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-none bg-black text-white font-sport font-black flex items-center justify-center text-xs shrink-0 -skew-x-6">
                      <span className="skew-x-6">{selectedExpedition.name.slice(0, 3).toUpperCase()}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-sport font-black uppercase text-black">{selectedExpedition.name} - {selectedExpedition.service}</span>
                        {selectedExpedition.badge && (
                          <span className={`text-[10px] font-sport font-black uppercase px-2 py-0.5 rounded-none ${
                            selectedExpedition.is_free ? 'bg-amber-400 text-black' : 'bg-neutral-200 text-black'
                          }`}>
                            {selectedExpedition.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-neutral-500 mt-0.5 font-medium">
                        Estimasi tiba: <strong>{selectedExpedition.etd}</strong> • {selectedExpedition.category}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    {selectedExpedition.is_free ? (
                      <div>
                        <span className="text-xs sm:text-sm font-sport font-black text-black bg-amber-400 px-2 py-0.5 rounded-none uppercase block">Gratis</span>
                        <span className="text-[10px] text-neutral-400 line-through font-sport font-bold">{formatRupiah(selectedExpedition.baseCost ?? selectedExpedition.baseRate ?? 0)}</span>
                      </div>
                    ) : (
                      <span className="text-xs sm:text-sm font-sport font-black text-black">{formatRupiah(selectedExpedition.cost ?? selectedExpedition.baseRate ?? 0)}</span>
                    )}
                    <span className="text-[10px] text-neutral-500 font-sport font-bold uppercase block mt-0.5">Ubah</span>
                  </div>
                </div>

                {/* Quick Selection Pills */}
                <div className="flex items-center gap-2 overflow-x-auto pb-0.5 text-xs no-scrollbar">
                  <span className="text-[10px] font-sport font-bold uppercase text-neutral-400 shrink-0">Pilihan Cepat:</span>
                  {mockExpeditions.slice(0, 4).map(exp => (
                    <button
                      key={exp.id}
                      type="button"
                      onClick={() => setSelectedExpedition(exp)}
                      className={`px-3 py-1.5 rounded-none border text-[11px] font-sport font-bold uppercase shrink-0 cursor-pointer transition-colors ${
                        selectedExpedition.id === exp.id
                          ? 'border-black bg-black text-white'
                          : 'border-neutral-300 bg-white text-black hover:border-black'
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
          <div className="bg-white rounded-none border border-neutral-300 p-5 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-black font-sport text-neutral-950 uppercase tracking-wider flex items-center gap-2 border-b border-neutral-200 pb-3">
                <CreditCard size={16} className="text-amber-500" />
                <span>Pilih Metode Pembayaran</span>
              </h2>
              <span className="text-[11px] font-sport font-bold uppercase text-neutral-400">Midtrans Gateway</span>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              {mockPaymentCategories.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedPaymentCategory(cat)}
                  className={`px-4 py-2 rounded-none text-xs font-sport font-black uppercase tracking-wider whitespace-nowrap cursor-pointer transition-colors ${
                    selectedPaymentCategory === cat
                      ? 'bg-black text-white'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
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
                  <span className="text-[11px] font-sport font-black text-neutral-600 uppercase tracking-wider block">
                    {cat.category}
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {cat.methods.map((method) => {
                      const isSelected = selectedPayment.id === method.id;
                      return (
                        <div
                          key={method.id}
                          onClick={() => setSelectedPayment(method)}
                          className={`p-3.5 rounded-none border-2 cursor-pointer transition-all flex flex-col justify-between gap-2.5 ${
                            isSelected
                              ? 'border-black bg-neutral-50 shadow-none'
                              : 'border-neutral-200 bg-white hover:border-neutral-400'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-3">
                              <div className={`p-2.5 rounded-none shrink-0 ${isSelected ? 'bg-black text-white' : 'bg-neutral-100 text-black'}`}>
                                {method.icon === 'QrCode' ? <QrCode size={16} /> : method.icon === 'Building2' ? <Building2 size={16} /> : <CreditCard size={16} />}
                              </div>
                              <div>
                                <p className="text-xs font-sport font-black uppercase text-black leading-snug">{method.name}</p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  {method.badge && (
                                    <span className="text-[9px] font-sport font-black uppercase px-1.5 py-0.5 bg-amber-400 text-black rounded-none">
                                      {method.badge}
                                    </span>
                                  )}
                                  <span className="text-[10px] text-neutral-500 font-medium">
                                    {method.fee > 0 ? `Biaya: ${formatRupiah(method.fee)}` : 'Bebas Biaya'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Radio check indicator */}
                            <div className={`w-4 h-4 rounded-none flex items-center justify-center shrink-0 border-2 ${
                              isSelected ? 'border-black bg-black text-white' : 'border-neutral-400 bg-white'
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
        <div className="lg:col-span-1">
          <div className="sticky top-24 bg-white rounded-none border border-neutral-300 shadow-2xs p-5 sm:p-6 space-y-4">
            <h2 className="text-sm font-black font-sport text-neutral-950 uppercase tracking-wider flex items-center gap-2 border-b border-neutral-200 pb-3">
              <span>Ringkasan Pembayaran</span>
              <span className="text-xs font-sport font-bold text-neutral-500">{checkoutItems.reduce((acc, i) => acc + i.quantity, 0)} barang</span>
            </h2>

            {/* Promo / Coupon Input */}
            <div className="space-y-2">
              <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                Kupon Promo (Coba: "DISKON20")
              </label>

              {appliedCoupon ? (
                <div className="p-3 bg-amber-400/20 border border-amber-400 rounded-none flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Sparkles size={14} className="text-black shrink-0" />
                    <div>
                      <span className="font-sport font-black uppercase text-black block">{appliedCoupon.code}</span>
                      <span className="text-[10px] font-sport font-bold uppercase text-neutral-700">Hemat {formatRupiah(appliedCoupon.discount)}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="text-xs font-sport font-black uppercase text-rose-600 hover:text-rose-800 cursor-pointer"
                  >
                    Hapus
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="space-y-3">
                  <TextInput
                    value={couponInput}
                    onChange={setCouponInput}
                    placeholder="Kode Kupon..."
                    weight="mono"
                  />
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 border border-amber-500 text-neutral-950 text-xs font-sport font-black uppercase tracking-wider transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer rounded-none"
                  >
                    <Tag size={15} />
                    <span>Terapkan</span>
                  </button>
                </form>
              )}

              {couponError && (
                <div className="p-4 bg-rose-50 border-l-4 border-rose-600 text-rose-800 rounded-none flex items-center justify-between animate-in fade-in duration-150">
                  <div className="flex items-center gap-2">
                    <AlertCircle size={16} className="text-rose-600 shrink-0" />
                    <span className="text-xs font-sport font-bold uppercase">{couponError}</span>
                  </div>
                  <button type="button" onClick={() => setCouponError('')} className="text-rose-600 hover:text-rose-800 cursor-pointer shrink-0" title="Tutup pesan">
                    <AlertCircle size={15} />
                  </button>
                </div>
              )}
            </div>

            {/* Detailed Itemized Costs */}
            <div className="space-y-2.5 text-xs text-neutral-700 pt-3 border-t border-neutral-200">
              <div className="flex justify-between items-center">
                <span>Total Harga Barang</span>
                <span className="font-sport font-black text-sm text-black">{formatRupiah(totalItemPrice)}</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between items-center text-amber-600 font-sport font-bold">
                  <span>Diskon Promo Kupon</span>
                  <span>- {formatRupiah(discountAmount)}</span>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span>Total Ongkos Kirim</span>
                <span className="font-sport font-bold text-black">
                  {selectedExpedition.is_free ? (
                    <span className="line-through text-neutral-400 font-normal mr-1.5">
                      {formatRupiah(selectedExpedition.baseCost ?? selectedExpedition.baseRate ?? 0)}
                    </span>
                  ) : null}
                  <span>{selectedExpedition.is_free ? 'Gratis' : formatRupiah(selectedExpedition.cost ?? selectedExpedition.baseRate ?? 0)}</span>
                </span>
              </div>

              {shippingSavings > 0 && (
                <div className="flex justify-between items-center text-amber-600 font-sport font-bold">
                  <span>Potongan Bebas Ongkir</span>
                  <span>- {formatRupiah(shippingSavings)}</span>
                </div>
              )}

              {/* Insurance Checkbox */}
              <div className="flex items-center justify-between pt-1 border-t border-neutral-100">
                <label className="flex items-center gap-2 cursor-pointer select-none text-black font-medium">
                  <Checkbox
                    checked={withInsurance}
                    onChange={setWithInsurance}
                    ariaLabel="Asuransi Pengiriman"
                  />
                  <span>Asuransi Pengiriman</span>
                </label>
                <span className="font-sport font-bold text-black">
                  {withInsurance ? formatRupiah(2500) : 'Rp 0'}
                </span>
              </div>

              <div className="flex justify-between items-center text-neutral-500">
                <span>Biaya Jasa Aplikasi</span>
                <span className="font-sport font-bold text-neutral-700">{formatRupiah(serviceFee)}</span>
              </div>

              {paymentFee > 0 && (
                <div className="flex justify-between items-center text-neutral-500">
                  <span>Biaya Transaksi Pembayaran</span>
                  <span className="font-sport font-bold text-neutral-700">{formatRupiah(paymentFee)}</span>
                </div>
              )}
            </div>

            {/* Total Savings Highlight Banner */}
            {totalSavings > 0 && (
              <div className="p-3 bg-neutral-100 border border-neutral-300 rounded-none flex items-center justify-between text-xs font-sport font-black uppercase text-black">
                <span>Total Hemat:</span>
                <span className="text-rose-600 font-black">{formatRupiah(totalSavings)}</span>
              </div>
            )}

            {/* Grand Total */}
            <div className="pt-3 border-t-2 border-black flex items-baseline justify-between">
              <div>
                <span className="text-[11px] font-sport font-bold uppercase text-neutral-500 block">Total Tagihan:</span>
                <span className="text-2xl sm:text-3xl font-sport font-black text-black tracking-tight">
                  {formatRupiah(grandTotal)}
                </span>
              </div>
              <span className="text-[10px] font-sport font-bold uppercase text-neutral-400">Termasuk PPN</span>
            </div>

            {/* Pay Button Card */}
            <div className="space-y-2">
              <div className="text-[11px] font-sport font-bold uppercase text-neutral-500 flex items-center justify-between">
                <span>Metode:</span>
                <strong className="text-black truncate max-w-[180px]">{selectedPayment.name}</strong>
              </div>

              {checkoutError && (
                <div className="p-3 bg-rose-50 border-l-4 border-rose-600 text-rose-800 rounded-none flex items-start gap-2">
                  <AlertCircle size={15} className="text-rose-600 shrink-0 mt-0.5" />
                  <span className="text-[11px] font-sport font-bold uppercase">{checkoutError}</span>
                </div>
              )}

              <button
                type="button"
                disabled={isProcessing}
                onClick={handlePayNow}
                className="w-full py-4 px-4 bg-black hover:bg-neutral-800 disabled:opacity-50 text-white font-sport font-black text-sm uppercase tracking-wider rounded-none transition-colors cursor-pointer flex items-center justify-center gap-2 -skew-x-3 hover:skew-x-0"
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

            <div className="pt-1 flex items-center justify-center gap-1.5 text-[10px] font-sport font-bold uppercase text-neutral-500 text-center">
              <ShieldCheck size={14} className="text-black shrink-0" />
              <span>Transaksi aman terenkripsi &amp; Bergaransi Resmi</span>
            </div>
          </div>
        </div>

      </div>

      {/* Mobile Sticky Checkout Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t-2 border-black p-3.5 flex items-center justify-between gap-3">
        <div>
          <span className="text-[10px] font-sport font-bold uppercase text-neutral-500 block">Total Tagihan:</span>
          <span className="text-lg font-sport font-black text-black leading-tight">
            {formatRupiah(grandTotal)}
          </span>
          {totalSavings > 0 && (
            <span className="text-[9px] font-sport font-bold uppercase text-amber-600 block">
              Hemat {formatRupiah(totalSavings)}
            </span>
          )}
        </div>
        <button
          type="button"
          disabled={isProcessing}
          onClick={handlePayNow}
          className="px-6 py-3 bg-black hover:bg-neutral-800 disabled:opacity-50 text-white font-sport font-black uppercase tracking-wider text-xs rounded-none transition-colors cursor-pointer flex items-center gap-1.5 -skew-x-3"
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
        expeditions={activeExpeditions}
      />

      {/* Order Success / Payment Instructions Modal */}
      <PaymentInstructionModal
        isOpen={Boolean(orderSuccessData)}
        onClose={() => setOrderSuccessData(null)}
        orderData={orderSuccessData}
        onPaymentConfirmed={() => setOrderSuccessData(null)}
      />
    </div>
  );
}
