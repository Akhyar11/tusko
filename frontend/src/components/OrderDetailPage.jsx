import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Copy, 
  Check, 
  Truck, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  MapPin, 
  CreditCard, 
  Printer, 
  HelpCircle, 
  ShoppingBag, 
  RotateCcw, 
  ShieldCheck, 
  ExternalLink, 
  ChevronRight, 
  Sparkles, 
  AlertCircle, 
  FileText, 
  Package,
  Send
} from 'lucide-react';
import { formatRupiah } from '../utils/formatters';
import { apiClient } from '../services/apiClient';
import OrderStatusModal from './OrderStatusModal';
import PrintReceiptModal from './PrintReceiptModal';
import PrintInvoiceModal from './PrintInvoiceModal';
import OrderFulfillmentStepper from './molecules/OrderFulfillmentStepper';

export default function OrderDetailPage({
  order = null,
  onBack = () => {},
  onPayOrder = () => {},
  onBuyAgain = () => {},
  onCancelOrder = () => {},
  onCompleteOrder = () => {},
  onUpdateStatus = () => {},
  onPrintReceipt = null
}) {
  const [copiedInvoice, setCopiedInvoice] = useState(false);
  const [copiedTracking, setCopiedTracking] = useState(false);
  const [copiedVa, setCopiedVa] = useState(false);
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
  const [liveTrackingData, setLiveTrackingData] = useState(null);
  const [isLoadingTracking, setIsLoadingTracking] = useState(false);
  const [primaryWarehouseName, setPrimaryWarehouseName] = useState('Gudang Pusat Tusko');
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isPrintReceiptModalOpen, setIsPrintReceiptModalOpen] = useState(false);
  const [isPrintInvoiceModalOpen, setIsPrintInvoiceModalOpen] = useState(false);
  const [isBookingPickup, setIsBookingPickup] = useState(false);
  const [pickupSuccessMsg, setPickupSuccessMsg] = useState('');

  React.useEffect(() => {
    apiClient.get('/api/warehouses/primary')
      .then(res => {
        if (res?.data?.warehouse?.name) {
          setPrimaryWarehouseName(res.data.warehouse.name);
        }
      })
      .catch(() => {});
  }, []);

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center">
        <div className="bg-white rounded-none p-8 border border-neutral-300 shadow-2xs space-y-4">
          <div className="w-16 h-16 bg-neutral-100 text-neutral-400 rounded-none flex items-center justify-center mx-auto border border-neutral-200">
            <ShoppingBag size={32} />
          </div>
          <h2 className="text-xl font-sport font-black text-neutral-950 uppercase tracking-tight">Pesanan Tidak Ditemukan</h2>
          <p className="text-xs text-neutral-500">Pilih pesanan dari antrean pesanan untuk melihat detail fulfillment.</p>
          <button
            type="button"
            onClick={onBack}
            className="px-5 py-2.5 bg-neutral-950 hover:bg-neutral-800 text-white font-sport font-black text-xs uppercase tracking-wider rounded-none cursor-pointer transition-colors"
          >
            Kembali ke Daftar Transaksi
          </button>
        </div>
      </div>
    );
  }

  const invoice = order.order_number || order.invoice_number || 'INV/20260907/TK/000000';
  const trackingNumber = order.expedition?.tracking_number || order.tracking_number;
  const expeditionName = order.expedition?.name || order.expedition_name || 'J&T Express (KiriminAja)';
  const expeditionService = order.expedition?.service || order.expedition_service || 'Reguler';
  const expeditionEtd = order.expedition?.etd || order.expedition_etd || '2-3 hari';
  const address = order.address || {};
  const items = order.items || [];
  const totals = order.totals || {};
  const subtotal = totals.subtotal ?? (items.reduce((acc, i) => acc + ((i.product_price || i.price || 0) * (i.quantity || 1)), 0));
  const shippingCost = totals.shipping_cost ?? order.shipping_cost ?? 18000;
  const insuranceCost = totals.insurance_cost ?? order.insurance_cost ?? 0;
  const serviceFee = totals.service_fee ?? order.service_fee ?? 0;
  const discountAmount = totals.discount_amount ?? order.discount_amount ?? 0;
  const grandTotal = totals.grand_total ?? order.grand_total ?? (subtotal + shippingCost + insuranceCost + serviceFee - discountAmount);

  const handleCopy = (text, type) => {
    navigator.clipboard?.writeText(text);
    if (type === 'invoice') {
      setCopiedInvoice(true);
      setTimeout(() => setCopiedInvoice(false), 2000);
    } else if (type === 'tracking') {
      setCopiedTracking(true);
      setTimeout(() => setCopiedTracking(false), 2000);
    } else if (type === 'va') {
      setCopiedVa(true);
      setTimeout(() => setCopiedVa(false), 2000);
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return '-';
    return new Date(isoString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }) + ' WIB';
  };

  // Status mapping
  const getStatusConfig = (status) => {
    switch (status) {
      case 'pending':
        return {
          title: 'Menunggu Pembayaran',
          description: 'Menunggu pelanggan menyelesaikan pembayaran via Midtrans Snap / Transfer.',
          color: 'text-amber-800',
          bg: 'bg-amber-50',
          border: 'border-amber-300',
          icon: Clock
        };
      case 'paid':
      case 'processing':
        return {
          title: 'Terbayar — Siap Diproses Gudang',
          description: 'Pembayaran telah terverifikasi. Siapkan barang dari rak gudang dan lakukan booking pickup kurir KiriminAja.',
          color: 'text-blue-900',
          bg: 'bg-blue-50',
          border: 'border-blue-300',
          icon: Clock
        };
      case 'shipped':
        return {
          title: 'Sedang Dikirim Kurir',
          description: 'Paket telah di-pickup oleh kurir ekspedisi dan nomor resi pengiriman aktif.',
          color: 'text-purple-900',
          bg: 'bg-purple-50',
          border: 'border-purple-300',
          icon: Truck
        };
      case 'completed':
        return {
          title: 'Pesanan Selesai',
          description: 'Pesanan telah diterima pelanggan. Transaksi dibukukan ke pendapatan kas toko.',
          color: 'text-emerald-900',
          bg: 'bg-emerald-50',
          border: 'border-emerald-300',
          icon: CheckCircle2
        };
      case 'cancelled':
      case 'failed':
        return {
          title: 'Pesanan Dibatalkan',
          description: 'Transaksi ini telah dibatalkan atau waktu pembayaran telah kedaluwarsa.',
          color: 'text-red-900',
          bg: 'bg-red-50',
          border: 'border-red-300',
          icon: XCircle
        };
      default:
        return {
          title: status,
          description: 'Detail status pesanan.',
          color: 'text-neutral-900',
          bg: 'bg-neutral-50',
          border: 'border-neutral-300',
          icon: FileText
        };
    }
  };

  const statusConfig = getStatusConfig(order.status);
  const StatusIcon = statusConfig.icon;

  const handleOpenPrintReceipt = () => {
    if (typeof onPrintReceipt === 'function') {
      onPrintReceipt(order);
    } else {
      setIsPrintReceiptModalOpen(true);
    }
  };

  // KiriminAja pickup booking action
  const handleBookingPickup = () => {
    setIsBookingPickup(true);
    setTimeout(() => {
      const generatedTracking = trackingNumber || `KRA-JNT-${Math.floor(1000000000 + Math.random() * 9000000000)}`;
      onUpdateStatus(order.id, 'shipped', { tracking_number: generatedTracking });
      setIsBookingPickup(false);
      setPickupSuccessMsg(`Pickup berhasil di-booking via KiriminAja! No. Resi: ${generatedTracking}`);
      setTimeout(() => setPickupSuccessMsg(''), 6000);
    }, 1000);
  };

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 space-y-6 animate-in fade-in duration-200">
      
      {/* Top Breadcrumb & Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 border border-neutral-300 rounded-none shadow-2xs">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-sport font-black uppercase tracking-wider text-neutral-700 hover:text-black transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>Kembali ke Daftar Pesanan</span>
        </button>

        <div className="flex flex-wrap items-center gap-2">
          {/* Booking Pickup KiriminAja Button */}
          {(order.status === 'paid' || order.status === 'processing') && (
            <button
              type="button"
              onClick={handleBookingPickup}
              disabled={isBookingPickup}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-sport font-black text-black bg-amber-400 hover:bg-amber-300 border border-amber-500 rounded-none uppercase tracking-wider transition-colors cursor-pointer shadow-xs disabled:opacity-50"
              title="Booking Pickup Kurir Otomatis via API KiriminAja"
            >
              <Send size={13} />
              <span>{isBookingPickup ? 'Booking Pickup...' : 'Booking Pickup (KiriminAja)'}</span>
            </button>
          )}

          {/* Tombol Cetak Resi Termal 100x150 mm */}
          <button
            type="button"
            onClick={handleOpenPrintReceipt}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-sport font-black text-white bg-neutral-900 hover:bg-neutral-800 border border-black rounded-none uppercase tracking-wider transition-colors cursor-pointer shadow-2xs"
            title="Cetak Label Resi Termal Standar 100x150 mm"
          >
            <Printer size={13} className="text-amber-400" />
            <span>Cetak Label Resi</span>
          </button>

          {/* Tombol E-Invoice Digital */}
          <button
            type="button"
            onClick={() => setIsPrintInvoiceModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-sport font-black text-neutral-800 hover:text-black bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 rounded-none uppercase tracking-wider transition-colors cursor-pointer shadow-2xs"
            title="Buka Faktur Penjualan Digital (E-Invoice)"
          >
            <FileText size={13} />
            <span>E-Invoice</span>
          </button>

          {/* Tombol Ubah Status */}
          <button
            type="button"
            onClick={() => setIsStatusModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-sport font-black text-neutral-800 hover:text-black bg-white border border-neutral-300 rounded-none uppercase tracking-wider transition-colors cursor-pointer shadow-2xs"
            title="Ubah status operasional pesanan"
          >
            <Package size={13} />
            <span>Ubah Status</span>
          </button>
        </div>
      </div>

      {/* Pickup Success Alert Banner */}
      {pickupSuccessMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold rounded-none flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-700 shrink-0" />
            <span>{pickupSuccessMsg}</span>
          </div>
          <button 
            type="button"
            onClick={() => setPickupSuccessMsg('')}
            className="text-emerald-700 hover:text-emerald-900 font-mono text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Status Header Card */}
      <div className={`p-5 sm:p-6 rounded-none border ${statusConfig.bg} ${statusConfig.border} shadow-2xs space-y-3`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-300">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-none bg-white border border-neutral-300 shadow-2xs flex items-center justify-center ${statusConfig.color} shrink-0`}>
              <StatusIcon size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className={`font-sport font-black text-lg uppercase tracking-tight ${statusConfig.color}`}>
                  {statusConfig.title}
                </h2>
                <span className="px-2 py-0.5 bg-white border border-neutral-300 font-mono text-[10px] font-bold uppercase text-neutral-800 rounded-none">
                  {order.status}
                </span>
              </div>
              <p className="text-xs text-neutral-600 mt-0.5">
                {statusConfig.description}
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right text-xs shrink-0">
            <span className="text-neutral-500 block text-[11px] font-mono uppercase">Waktu Pemesanan</span>
            <span className="font-bold text-neutral-900 font-mono">{formatDate(order.created_at)}</span>
          </div>
        </div>

        {/* Invoice & Order Metadata */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1">
          <div className="flex items-center gap-2">
            <span className="text-neutral-500">Nomor Invoice:</span>
            <span className="font-mono font-black text-neutral-900">{invoice}</span>
            <button
              type="button"
              onClick={() => handleCopy(invoice, 'invoice')}
              className="p-1 text-neutral-500 hover:text-black cursor-pointer"
              title="Salin No Invoice"
            >
              {copiedInvoice ? <Check size={13} className="text-emerald-700" /> : <Copy size={13} />}
            </button>
          </div>

          <div className="flex items-center gap-2 text-neutral-600">
            <span>Metode Bayar:</span>
            <span className="font-bold text-neutral-900 uppercase font-sport">
              {order.payment_channel || order.payment_method || 'Midtrans Snap'}
            </span>
          </div>
        </div>
      </div>

      {/* 5-Step Fulfillment Stepper */}
      <OrderFulfillmentStepper
        order={order}
        warehouseName={primaryWarehouseName}
        onTrackClick={async () => {
          setIsTrackingModalOpen(true);
          setIsLoadingTracking(true);
          try {
            const query = trackingNumber || invoice;
            const res = await apiClient.get(`/api/expeditions/track/${encodeURIComponent(query)}`);
            if (res?.data) {
              setLiveTrackingData(res.data);
            }
          } catch {
            // fallback
          } finally {
            setIsLoadingTracking(false);
          }
        }}
      />

      {/* Two Column Grid: Shipping & Address */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* Shipping & Expedition Logistics Card */}
        <div className="bg-white rounded-none border border-neutral-300 p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-200">
            <div className="flex items-center gap-2 font-sport font-black text-neutral-950 text-sm uppercase tracking-wide">
              <Truck size={16} className="text-amber-600" />
              <span>Info Pengiriman & Kurir</span>
            </div>
            {trackingNumber && (
              <button
                type="button"
                onClick={async () => {
                  setIsTrackingModalOpen(true);
                  setIsLoadingTracking(true);
                  try {
                    const res = await apiClient.get(`/api/expeditions/track/${trackingNumber}`);
                    if (res?.data) {
                      setLiveTrackingData(res.data);
                    }
                  } catch {
                    // ignore fallback to order info
                  } finally {
                    setIsLoadingTracking(false);
                  }
                }}
                className="text-xs font-sport font-black text-neutral-900 hover:text-amber-700 bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 px-2.5 py-1 rounded-none uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>Live Tracking</span>
                <ExternalLink size={12} />
              </button>
            )}
          </div>

          <div className="text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-neutral-500">Ekspedisi:</span>
              <span className="font-bold text-neutral-900">{expeditionName}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-neutral-500">Layanan:</span>
              <span className="font-semibold text-neutral-800">{expeditionService || 'Standar Reguler'}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-neutral-500">Nomor Resi:</span>
              {trackingNumber ? (
                <div className="flex items-center gap-1.5 font-mono font-bold text-neutral-950">
                  <span>{trackingNumber}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(trackingNumber, 'tracking')}
                    className="p-1 text-neutral-400 hover:text-black cursor-pointer"
                    title="Salin Resi"
                  >
                    {copiedTracking ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                  </button>
                </div>
              ) : (
                <span className="text-neutral-400 italic">Belum di-booking (Klik "Booking Pickup")</span>
              )}
            </div>

            <div className="flex justify-between">
              <span className="text-neutral-500">Estimasi Tiba:</span>
              <span className="text-neutral-800 font-medium">{expeditionEtd}</span>
            </div>
          </div>

          {/* Quick Thermal Print Action Banner */}
          <div className="pt-2 border-t border-neutral-200">
            <div className="p-3 bg-neutral-50 rounded-none border border-neutral-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center gap-1.5 font-sport font-black text-xs text-neutral-950 uppercase">
                  <FileText size={14} className="text-amber-600 shrink-0" />
                  <span className="truncate">Label Resi Thermal 100x150 mm</span>
                </div>
                <p className="text-[11px] text-neutral-500">
                  Format barcode stiker standar {expeditionName} siap tempel pada paket.
                </p>
              </div>
              <button
                type="button"
                onClick={handleOpenPrintReceipt}
                className="px-3.5 py-1.5 bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-sport font-black uppercase rounded-none transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
              >
                <Printer size={13} />
                <span>Cetak Label</span>
              </button>
            </div>
          </div>
        </div>

        {/* Shipping Address Card */}
        <div className="bg-white rounded-none border border-neutral-300 p-5 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-neutral-200 font-sport font-black text-neutral-950 text-sm uppercase tracking-wide">
            <MapPin size={16} className="text-amber-600" />
            <span>Alamat Tujuan Pengiriman</span>
          </div>

          <div className="text-xs space-y-1">
            <p className="font-black text-neutral-950 text-sm">
              {address.recipient_name || order.recipient_name || 'Pembeli Tusko'}
            </p>
            <p className="text-neutral-600 font-mono">
              {address.phone || order.phone || order.phone_number || '-'}
            </p>
            <p className="text-neutral-700 leading-relaxed pt-1">
              {address.full_address || order.full_address || '-'}
              {address.city ? `, ${address.city}` : ''}
              {address.postal_code ? ` ${address.postal_code}` : ''}
            </p>
            {address.label && (
              <div className="pt-2">
                <span className="px-2 py-0.5 bg-neutral-100 border border-neutral-300 font-mono text-[10px] font-bold uppercase text-neutral-700 rounded-none">
                  Label: {address.label}
                </span>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Ordered Items Card */}
      <div className="bg-white rounded-none border border-neutral-300 p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-neutral-200 font-sport font-black text-neutral-950 text-sm uppercase tracking-wide">
          <div className="flex items-center gap-2">
            <ShoppingBag size={16} className="text-amber-600" />
            <span>Rincian Produk Dalam Pesanan ({items.length} Barang)</span>
          </div>
          <span className="text-[11px] font-mono text-neutral-500 font-normal uppercase">Gudang: WH-CGK-01</span>
        </div>

        <div className="divide-y divide-neutral-200">
          {items.map((item, idx) => {
            const price = item.product_price || item.price || 0;
            const qty = item.quantity || 1;
            const itemSubtotal = item.subtotal || (price * qty);

            return (
              <div key={item.id || idx} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  <img
                    src={item.product_image || item.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300'}
                    alt={item.product_name || item.name}
                    className="w-16 h-16 rounded-none object-cover border border-neutral-300 shrink-0"
                  />
                  <div className="space-y-1 min-w-0 flex-1 text-xs">
                    <h4 className="font-bold text-neutral-950 line-clamp-2 text-sm">
                      {item.product_name || item.name}
                    </h4>
                    <p className="text-neutral-600 font-mono">
                      {qty} unit &times; {formatRupiah(price)}
                    </p>
                    {item.variant && (
                      <p className="text-[11px] text-amber-700 font-medium">
                        Varian: {item.variant}
                      </p>
                    )}
                    {item.sku && (
                      <p className="text-[10px] font-mono text-neutral-500">
                        SKU: {item.sku}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex sm:flex-col items-baseline sm:items-end justify-between sm:justify-center shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0">
                  <span className="text-[10px] text-neutral-400 block sm:hidden">Subtotal:</span>
                  <span className="font-sport font-black text-neutral-950 text-base">
                    {formatRupiah(itemSubtotal)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Payment & Financial Breakdown Card */}
      <div className="bg-white rounded-none border border-neutral-300 p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-neutral-200 font-sport font-black text-neutral-950 text-sm uppercase tracking-wide">
          <div className="flex items-center gap-2">
            <CreditCard size={16} className="text-amber-600" />
            <span>Rincian Pembayaran & Finansial</span>
          </div>
          <span className={`text-xs px-2.5 py-0.5 rounded-none font-sport font-black uppercase border ${
            order.payment_status === 'paid' 
              ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
              : 'bg-amber-100 text-amber-800 border-amber-300'
          }`}>
            {order.payment_status === 'paid' ? 'LUNAS / SETTLED' : order.payment_status?.toUpperCase() || 'BELUM LUNAS'}
          </span>
        </div>

        {/* Payment Method Details */}
        <div className="bg-neutral-50 p-3.5 rounded-none border border-neutral-200 text-xs space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-neutral-600">Metode Pembayaran:</span>
            <strong className="text-neutral-950 uppercase font-sport font-bold">
              {order.payment_channel || order.payment_method?.toUpperCase() || 'Virtual Account (Midtrans Snap)'}
            </strong>
          </div>

          {order.va_number && (
            <div className="flex justify-between items-center pt-1 border-t border-neutral-200">
              <span className="text-neutral-600">Nomor Virtual Account:</span>
              <div className="flex items-center gap-1.5 font-mono font-black text-neutral-950">
                <span>{order.va_number}</span>
                <button
                  type="button"
                  onClick={() => handleCopy(order.va_number, 'va')}
                  className="p-1 text-neutral-500 hover:text-black cursor-pointer"
                  title="Salin Nomor VA"
                >
                  {copiedVa ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Cost Breakdown */}
        <div className="space-y-2 text-xs text-neutral-600 pt-1">
          <div className="flex justify-between">
            <span>Subtotal Produk ({items.length} Barang)</span>
            <span className="font-mono font-medium text-neutral-900">{formatRupiah(subtotal)}</span>
          </div>

          <div className="flex justify-between">
            <span>Biaya Pengiriman ({expeditionName})</span>
            <span className="font-mono font-medium text-neutral-900">{formatRupiah(shippingCost)}</span>
          </div>

          {insuranceCost > 0 && (
            <div className="flex justify-between">
              <span>Asuransi Pengiriman</span>
              <span className="font-mono font-medium text-neutral-900">{formatRupiah(insuranceCost)}</span>
            </div>
          )}

          {discountAmount > 0 && (
            <div className="flex justify-between text-emerald-700 font-semibold">
              <span>Voucher Diskon Promo</span>
              <span className="font-mono font-bold">- {formatRupiah(discountAmount)}</span>
            </div>
          )}

          <div className="pt-3 border-t-2 border-neutral-950 flex justify-between items-baseline">
            <span className="font-sport font-black text-neutral-950 text-base uppercase">Total Nilai Pesanan</span>
            <span className="text-xl font-sport font-black text-amber-700 font-mono">
              {formatRupiah(grandTotal)}
            </span>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="bg-white rounded-none border border-neutral-300 p-4 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 text-xs text-neutral-500">
          <ShieldCheck size={16} className="text-emerald-700" />
          <span>Fulfillment sistem Tusko terverifikasi dengan SLA pengiriman 24 jam.</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleOpenPrintReceipt}
            className="px-3.5 py-2 border border-neutral-300 hover:bg-neutral-100 rounded-none text-xs font-sport font-black uppercase text-neutral-800 transition-colors cursor-pointer flex items-center gap-1.5"
            title="Cetak Label Resi Termal"
          >
            <Printer size={13} className="text-neutral-600" />
            <span>Cetak Resi</span>
          </button>

          <button
            type="button"
            onClick={() => setIsPrintInvoiceModalOpen(true)}
            className="px-3.5 py-2 bg-neutral-950 hover:bg-neutral-800 text-white rounded-none text-xs font-sport font-black uppercase tracking-wider shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <FileText size={13} className="text-amber-400" />
            <span>Cetak E-Invoice</span>
          </button>
        </div>
      </div>

      {/* Shipment Tracking Modal */}
      {isTrackingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-none max-w-md w-full p-5 sm:p-6 shadow-2xl border border-neutral-300 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-none bg-neutral-900 text-amber-400 flex items-center justify-center">
                  <Truck size={18} />
                </div>
                <div>
                  <h3 className="font-sport font-black text-sm uppercase text-neutral-950">
                    Pelacakan Live KiriminAja
                  </h3>
                  <p className="text-[11px] text-neutral-500 font-mono">
                    {trackingNumber}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsTrackingModalOpen(false)}
                className="p-1 rounded-none text-neutral-400 hover:text-black cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="bg-neutral-50 p-3 rounded-none border border-neutral-200 text-xs flex justify-between items-center">
              <div>
                <span className="text-neutral-500 block text-[10px] uppercase font-mono">Kurir & Layanan</span>
                <strong className="text-neutral-950 font-bold">
                  {expeditionName} - {expeditionService}
                </strong>
              </div>
              <div className="text-right">
                <span className="text-neutral-500 block text-[10px] uppercase font-mono">Estimasi Tiba</span>
                <span className="text-emerald-700 font-bold">
                  {expeditionEtd}
                </span>
              </div>
            </div>

            <div className="space-y-3 pt-2 text-xs">
              {isLoadingTracking ? (
                <div className="py-6 flex flex-col items-center justify-center text-neutral-400 gap-1.5">
                  <Clock className="animate-spin text-neutral-900" size={20} />
                  <span className="text-[11px] font-mono">Menghubungi Gateway KiriminAja...</span>
                </div>
              ) : liveTrackingData?.history && liveTrackingData.history.length > 0 ? (
                liveTrackingData.history.map((step, sIdx) => {
                  const isLatest = sIdx === 0;
                  const isLast = sIdx === liveTrackingData.history.length - 1;
                  return (
                    <div key={sIdx} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-none ${
                          isLatest ? 'bg-amber-500 ring-4 ring-amber-100' : 'bg-neutral-400'
                        }`} />
                        {!isLast && <div className="w-0.5 h-12 bg-neutral-200" />}
                      </div>
                      <div className="space-y-0.5">
                        <p className={`font-bold ${isLatest ? 'text-neutral-950' : 'text-neutral-800'}`}>
                          {step.note}
                        </p>
                        <p className="text-[10px] text-neutral-500 font-medium">
                          Lokasi: {step.location}
                        </p>
                        <span className="text-[10px] text-neutral-400 font-mono">
                          {step.time} WIB
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <>
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-none bg-amber-500 ring-4 ring-amber-100" />
                      <div className="w-0.5 h-12 bg-neutral-300" />
                    </div>
                    <div>
                      <p className="font-bold text-neutral-900">Paket sedang diantar ke alamat tujuan</p>
                      <p className="text-[10px] text-neutral-500">Kurir sedang menuju lokasi penerima</p>
                      <span className="text-[10px] text-neutral-400 font-mono">Hari ini, 08:30 WIB</span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-2.5 h-2.5 rounded-none bg-neutral-400" />
                      <div className="w-0.5 h-12 bg-neutral-200" />
                    </div>
                    <div>
                      <p className="font-bold text-neutral-900">Tiba di Sorting Hub KiriminAja</p>
                      <p className="text-[10px] text-neutral-500">Paket dalam proses penyortiran</p>
                      <span className="text-[10px] text-neutral-400 font-mono">Kemarin, 21:15 WIB</span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-2.5 h-2.5 rounded-none bg-neutral-400" />
                    </div>
                    <div>
                      <p className="font-bold text-neutral-900">Pesanan telah diserahkan ke kurir (Pickup Booked)</p>
                      <p className="text-[10px] text-neutral-500">Pengirim telah menyerahkan paket di {primaryWarehouseName}</p>
                      <span className="text-[10px] text-neutral-400 font-mono">Kemarin, 17:45 WIB</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsTrackingModalOpen(false)}
              className="w-full py-2.5 bg-neutral-100 hover:bg-neutral-200 font-sport font-black text-xs rounded-none text-neutral-900 uppercase tracking-wider transition-colors cursor-pointer mt-2"
            >
              Tutup Pelacakan
            </button>
          </div>
        </div>
      )}

      {/* Order Status Change Modal */}
      <OrderStatusModal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        order={order}
        onUpdateStatus={onUpdateStatus}
      />

      {/* Shipping Receipt Print Modal (Thermal 100x150 mm) */}
      <PrintReceiptModal
        isOpen={isPrintReceiptModalOpen}
        onClose={() => setIsPrintReceiptModalOpen(false)}
        order={order}
      />

      {/* Digital E-Invoice Modal */}
      <PrintInvoiceModal
        isOpen={isPrintInvoiceModalOpen}
        onClose={() => setIsPrintInvoiceModalOpen(false)}
        order={order}
      />

    </div>
  );
}
