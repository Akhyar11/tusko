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
  Package
} from 'lucide-react';
import { formatRupiah } from '../utils/formatters';
import OrderStatusModal from './OrderStatusModal';
import PrintReceiptModal from './PrintReceiptModal';

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
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isPrintReceiptModalOpen, setIsPrintReceiptModalOpen] = useState(false);

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center">
        <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-2xs space-y-4">
          <div className="w-16 h-16 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto">
            <ShoppingBag size={32} />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Pesanan Tidak Ditemukan</h2>
          <p className="text-xs text-gray-500">Pilih pesanan dari daftar transaksi untuk melihat detail.</p>
          <button
            type="button"
            onClick={onBack}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl cursor-pointer transition-colors"
          >
            Kembali ke Daftar Transaksi
          </button>
        </div>
      </div>
    );
  }

  const invoice = order.order_number || order.invoice_number || 'INV/20260907/TK/000000';
  const trackingNumber = order.expedition?.tracking_number || order.tracking_number;
  const expeditionName = order.expedition?.name || order.expedition_name || 'Kurir Reguler';
  const expeditionService = order.expedition?.service || order.expedition_service || '';
  const expeditionEtd = order.expedition?.etd || order.expedition_etd || '2-3 hari';
  const address = order.address || {};
  const items = order.items || [];
  const totals = order.totals || {};
  const subtotal = totals.subtotal ?? (items.reduce((acc, i) => acc + (i.product_price * i.quantity), 0));
  const shippingCost = totals.shipping_cost ?? order.shipping_cost ?? 0;
  const insuranceCost = totals.insurance_cost ?? order.insurance_cost ?? 0;
  const serviceFee = totals.service_fee ?? order.service_fee ?? 1000;
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
          description: 'Selesaikan pembayaran sebelum batas waktu berakhir agar pesanan segera diproses penjual.',
          color: 'text-amber-700',
          bg: 'bg-amber-50',
          border: 'border-amber-200',
          icon: Clock
        };
      case 'processing':
        return {
          title: 'Pesanan Sedang Diproses',
          description: 'Pembayaran telah dikonfirmasi. Penjual sedang menyiapkan dan mengemas pesanan Anda.',
          color: 'text-blue-700',
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          icon: Clock
        };
      case 'shipped':
        return {
          title: 'Pesanan Sedang Dikirim',
          description: 'Paket telah diserahkan ke kurir ekspedisi dan sedang dalam perjalanan menuju alamat Anda.',
          color: 'text-purple-700',
          bg: 'bg-purple-50',
          border: 'border-purple-200',
          icon: Truck
        };
      case 'completed':
        return {
          title: 'Pesanan Selesai',
          description: 'Pesanan telah berhasil diterima. Terima kasih telah berbelanja di Toko Online!',
          color: 'text-emerald-700',
          bg: 'bg-emerald-50',
          border: 'border-emerald-200',
          icon: CheckCircle2
        };
      case 'cancelled':
      case 'failed':
        return {
          title: 'Pesanan Dibatalkan',
          description: 'Transaksi ini telah dibatalkan atau waktu pembayaran telah kedaluwarsa.',
          color: 'text-red-700',
          bg: 'bg-red-50',
          border: 'border-red-200',
          icon: XCircle
        };
      default:
        return {
          title: status,
          description: 'Detail status pesanan Anda.',
          color: 'text-gray-700',
          bg: 'bg-gray-50',
          border: 'border-gray-200',
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

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-5">
      
      {/* Back to Order List Navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-xs sm:text-sm font-bold text-gray-600 hover:text-emerald-700 transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>Kembali ke Daftar Transaksi</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Tombol Cetak Resi Pengiriman */}
          <button
            type="button"
            onClick={handleOpenPrintReceipt}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-indigo-700 font-bold bg-indigo-50 border border-indigo-300 rounded-xl hover:bg-indigo-100 transition-colors cursor-pointer shadow-2xs"
            title="Cetak Label Resi Pengiriman"
          >
            <Printer size={14} className="text-indigo-600" />
            <span>Cetak Resi</span>
          </button>

          <button
            type="button"
            onClick={() => setIsStatusModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-emerald-700 font-bold bg-emerald-50 border border-emerald-300 rounded-xl hover:bg-emerald-100 transition-colors cursor-pointer shadow-2xs"
            title="Ubah status pesanan"
          >
            <Package size={14} />
            <span>Ubah Status</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 hover:text-gray-900 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer shadow-2xs"
          >
            <Printer size={14} />
            <span>Cetak Invoice</span>
          </button>
        </div>
      </div>

      {/* Main Status Header Card */}
      <div className={`p-5 sm:p-6 rounded-2xl border ${statusConfig.bg} ${statusConfig.border} shadow-2xs space-y-3`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-200/60">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl bg-white shadow-2xs flex items-center justify-center ${statusConfig.color} shrink-0`}>
              <StatusIcon size={20} />
            </div>
            <div>
              <h2 className={`font-black text-base sm:text-lg ${statusConfig.color}`}>
                {statusConfig.title}
              </h2>
              <p className="text-xs text-gray-600 mt-0.5">
                {statusConfig.description}
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right text-xs shrink-0">
            <span className="text-gray-500 block text-[11px]">Waktu Pemesanan</span>
            <span className="font-semibold text-gray-800">{formatDate(order.created_at)}</span>
          </div>
        </div>

        {/* Invoice & Expiry metadata */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1">
          <div className="flex items-center gap-2">
            <span className="text-gray-500 text-[11px]">No. Invoice:</span>
            <strong className="font-mono text-gray-900 font-bold">{invoice}</strong>
            <button
              type="button"
              onClick={() => handleCopy(invoice, 'invoice')}
              className="p-1 text-gray-400 hover:text-emerald-700 transition-colors cursor-pointer"
              title="Salin Invoice"
            >
              {copiedInvoice ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
            </button>
          </div>

          {order.status === 'pending' && (
            <div className="flex items-center gap-1.5 text-amber-800 font-semibold bg-white/80 px-2.5 py-1 rounded-lg border border-amber-200 text-[11px]">
              <Clock size={13} />
              <span>Batas Waktu Bayar: 24 Jam sejak pemesanan</span>
            </div>
          )}
        </div>
      </div>

      {/* Grid: Delivery Info & Tracking */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Delivery Details Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <div className="flex items-center gap-2 font-bold text-gray-900 text-xs sm:text-sm">
              <Truck size={16} className="text-emerald-600" />
              <span>Info Pengiriman & Resi</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleOpenPrintReceipt}
                className="text-xs font-bold text-indigo-700 hover:text-indigo-800 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-lg flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                title="Cetak Label Resi Pengiriman"
              >
                <Printer size={12} />
                <span>Cetak Resi</span>
              </button>
              {trackingNumber && (
                <button
                  type="button"
                  onClick={() => setIsTrackingModalOpen(true)}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                >
                  <span>Lacak</span>
                  <ChevronRight size={13} />
                </button>
              )}
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-500">Kurir:</span>
              <strong className="text-gray-900">{expeditionName} {expeditionService}</strong>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-500">No. Resi:</span>
              {trackingNumber ? (
                <div className="flex items-center gap-1 font-mono font-bold text-gray-900">
                  <span>{trackingNumber}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(trackingNumber, 'tracking')}
                    className="p-1 text-gray-400 hover:text-emerald-700 cursor-pointer"
                    title="Salin Resi"
                  >
                    {copiedTracking ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                  </button>
                </div>
              ) : (
                <span className="text-gray-400 italic">Belum tersedia (menunggu kurir)</span>
              )}
            </div>

            <div className="flex justify-between">
              <span className="text-gray-500">Estimasi Tiba:</span>
              <span className="text-gray-700 font-medium">{expeditionEtd}</span>
            </div>
          </div>

          {/* Action Box Cetak Label Resi Siap Tempel */}
          <div className="pt-2 border-t border-gray-100">
            <div className="p-3 bg-neutral-50 rounded-xl border border-dashed border-gray-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center gap-1.5 font-bold text-xs text-gray-900">
                  <FileText size={14} className="text-indigo-600 shrink-0" />
                  <span className="truncate">Label Resi Pengiriman Paket</span>
                </div>
                <p className="text-[11px] text-gray-500">
                  Format barcode & alamat standar {expeditionName} siap cetak & tempel pada paket.
                </p>
              </div>
              <button
                type="button"
                onClick={handleOpenPrintReceipt}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
              >
                <Printer size={13} />
                <span>Cetak Label Resi</span>
              </button>
            </div>
          </div>
        </div>

        {/* Shipping Address Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100 font-bold text-gray-900 text-xs sm:text-sm">
            <MapPin size={16} className="text-emerald-600" />
            <span>Alamat Tujuan</span>
          </div>

          <div className="text-xs space-y-1">
            <p className="font-extrabold text-gray-900">
              {address.recipient_name || order.recipient_name || 'Pembeli'}
            </p>
            <p className="text-gray-600 font-mono">
              {address.phone || order.phone || order.phone_number || '-'}
            </p>
            <p className="text-gray-600 leading-relaxed pt-1">
              {address.full_address || order.full_address || '-'}
              {address.city ? `, ${address.city}` : ''}
              {address.postal_code ? ` ${address.postal_code}` : ''}
            </p>
          </div>
        </div>

      </div>

      {/* Ordered Items Card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-gray-100 font-bold text-gray-900 text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <ShoppingBag size={16} className="text-emerald-600" />
            <span>Rincian Produk ({items.length} Barang)</span>
          </div>
          <span className="text-[11px] font-normal text-gray-500">Official Store Toko Online</span>
        </div>

        <div className="divide-y divide-gray-100">
          {items.map((item, idx) => {
            const price = item.product_price || item.price || 0;
            const qty = item.quantity || 1;
            const itemSubtotal = item.subtotal || (price * qty);

            return (
              <div key={item.id || idx} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  <img
                    src={item.product_image || item.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300'}
                    alt={item.product_name}
                    className="w-16 h-16 rounded-xl object-cover border border-gray-200 shrink-0"
                  />
                  <div className="space-y-1 min-w-0 flex-1 text-xs">
                    <h4 className="font-bold text-gray-900 line-clamp-2">
                      {item.product_name}
                    </h4>
                    <p className="text-gray-500">
                      {qty} barang × {formatRupiah(price)}
                    </p>
                    {item.notes && (
                      <p className="text-[11px] text-gray-400 italic">
                        Catatan: {item.notes}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex sm:flex-col items-baseline sm:items-end justify-between sm:justify-center shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0">
                  <span className="text-[10px] text-gray-400 block sm:hidden">Subtotal:</span>
                  <span className="font-bold text-gray-900 text-xs sm:text-sm">
                    {formatRupiah(itemSubtotal)}
                  </span>
                  {order.status === 'completed' && (
                    <button
                      type="button"
                      onClick={() => onBuyAgain(item)}
                      className="mt-1.5 px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[11px] rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <RotateCcw size={11} />
                      <span>Beli Lagi</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Payment & Financial Breakdown Card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-gray-100 font-bold text-gray-900 text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <CreditCard size={16} className="text-emerald-600" />
            <span>Rincian Pembayaran</span>
          </div>
          <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            {order.payment_status === 'paid' ? 'LUNAS' : order.payment_status?.toUpperCase() || 'PENDING'}
          </span>
        </div>

        {/* Payment Method Details */}
        <div className="bg-gray-50/80 p-3.5 rounded-xl border border-gray-200/80 text-xs space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Metode Pembayaran:</span>
            <strong className="text-gray-900">
              {order.payment_channel || order.payment_method?.toUpperCase() || 'Virtual Account'}
            </strong>
          </div>

          {order.va_number && (
            <div className="flex justify-between items-center pt-1 border-t border-gray-200/60">
              <span className="text-gray-500">Nomor Rekening / Virtual Account:</span>
              <div className="flex items-center gap-1.5 font-mono font-black text-gray-900">
                <span>{order.va_number}</span>
                <button
                  type="button"
                  onClick={() => handleCopy(order.va_number, 'va')}
                  className="p-1 text-gray-400 hover:text-emerald-700 cursor-pointer"
                  title="Salin Nomor VA"
                >
                  {copiedVa ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Cost Breakdown */}
        <div className="space-y-2 text-xs text-gray-600 pt-1">
          <div className="flex justify-between">
            <span>Total Harga ({items.length} Barang)</span>
            <span className="font-medium text-gray-900">{formatRupiah(subtotal)}</span>
          </div>

          <div className="flex justify-between">
            <span>Total Ongkos Kirim</span>
            <span className="font-medium text-gray-900">{formatRupiah(shippingCost)}</span>
          </div>

          {insuranceCost > 0 && (
            <div className="flex justify-between">
              <span>Biaya Asuransi Pengiriman</span>
              <span className="font-medium text-gray-900">{formatRupiah(insuranceCost)}</span>
            </div>
          )}

          {serviceFee > 0 && (
            <div className="flex justify-between">
              <span>Biaya Layanan</span>
              <span className="font-medium text-gray-900">{formatRupiah(serviceFee)}</span>
            </div>
          )}

          {discountAmount > 0 && (
            <div className="flex justify-between text-emerald-700 font-semibold">
              <span>Total Diskon Promo</span>
              <span>- {formatRupiah(discountAmount)}</span>
            </div>
          )}

          <div className="pt-3 border-t border-gray-200 flex justify-between items-baseline">
            <span className="font-extrabold text-gray-900 text-sm">Total Belanja</span>
            <span className="text-lg font-black text-emerald-700">
              {formatRupiah(grandTotal)}
            </span>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <ShieldCheck size={16} className="text-emerald-600" />
          <span>Transaksi aman dan dilindungi oleh garansi Toko Online</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Tombol Cetak Resi di Footer */}
          <button
            type="button"
            onClick={handleOpenPrintReceipt}
            className="px-3.5 py-2 border border-gray-200 hover:bg-gray-50 rounded-xl text-xs font-bold text-gray-700 transition-colors cursor-pointer flex items-center gap-1.5"
            title="Cetak Label Resi Pengiriman"
          >
            <Printer size={13} className="text-indigo-600" />
            <span>Cetak Resi</span>
          </button>

          {order.status === 'pending' && (
            <>
              <button
                type="button"
                onClick={() => onCancelOrder(order)}
                className="px-4 py-2 border border-gray-300 hover:bg-red-50 hover:border-red-200 hover:text-red-600 rounded-xl text-xs font-bold text-gray-700 transition-colors cursor-pointer"
              >
                Batalkan Pesanan
              </button>
              <button
                type="button"
                onClick={() => onPayOrder(order)}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-xs transition-colors cursor-pointer"
              >
                Bayar Sekarang
              </button>
            </>
          )}

          {order.status === 'shipped' && (
            <>
              <button
                type="button"
                onClick={() => setIsTrackingModalOpen(true)}
                className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Truck size={14} />
                <span>Lacak Kurir</span>
              </button>
              <button
                type="button"
                onClick={() => onCompleteOrder(order)}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-xs transition-colors cursor-pointer"
              >
                Konfirmasi Pesanan Diterima
              </button>
            </>
          )}

          {order.status === 'completed' && (
            <button
              type="button"
              onClick={() => onBuyAgain(items[0])}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw size={14} />
              <span>Beli Produk Ini Lagi</span>
            </button>
          )}
        </div>
      </div>

      {/* Shipment Tracking Modal */}
      {isTrackingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-gray-100 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Truck size={18} />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-gray-900">
                    Pelacakan Real-time
                  </h3>
                  <p className="text-[11px] text-gray-500 font-mono">
                    {trackingNumber}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsTrackingModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-xs flex justify-between items-center">
              <div>
                <span className="text-gray-400 block text-[10px]">Kurir & Layanan</span>
                <strong className="text-gray-800 font-bold">
                  {expeditionName} - {expeditionService}
                </strong>
              </div>
              <div className="text-right">
                <span className="text-gray-400 block text-[10px]">Estimasi Tiba</span>
                <span className="text-emerald-700 font-bold">
                  {expeditionEtd}
                </span>
              </div>
            </div>

            <div className="space-y-3 pt-2 text-xs">
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full bg-emerald-600 ring-4 ring-emerald-100" />
                  <div className="w-0.5 h-12 bg-emerald-200" />
                </div>
                <div>
                  <p className="font-bold text-emerald-800">Paket sedang diantar ke alamat tujuan</p>
                  <p className="text-[10px] text-gray-500">Kurir sedang menuju lokasi penerima</p>
                  <span className="text-[10px] text-gray-400">07 Sep 2026, 08:30 WIB</span>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-gray-400" />
                  <div className="w-0.5 h-12 bg-gray-200" />
                </div>
                <div>
                  <p className="font-bold text-gray-800">Tiba di Hub Sortir Jakarta Selatan</p>
                  <p className="text-[10px] text-gray-500">Paket dalam proses penyortiran</p>
                  <span className="text-[10px] text-gray-400">06 Sep 2026, 21:15 WIB</span>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-gray-400" />
                </div>
                <div>
                  <p className="font-bold text-gray-800">Pesanan telah diserahkan ke kurir</p>
                  <p className="text-[10px] text-gray-500">Pengirim telah menyerahkan paket</p>
                  <span className="text-[10px] text-gray-400">05 Sep 2026, 17:45 WIB</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsTrackingModalOpen(false)}
              className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 font-bold text-xs rounded-xl text-gray-800 transition-colors cursor-pointer mt-2"
            >
              Tutup
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

      {/* Shipping Receipt Print Modal */}
      <PrintReceiptModal
        isOpen={isPrintReceiptModalOpen}
        onClose={() => setIsPrintReceiptModalOpen(false)}
        order={order}
      />

    </div>
  );
}
