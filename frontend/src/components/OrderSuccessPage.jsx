import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Copy, 
  Clock, 
  MapPin, 
  Truck, 
  PackageCheck, 
  CreditCard, 
  Printer, 
  ArrowLeft, 
  ShoppingBag, 
  ExternalLink, 
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Check,
  Building2,
  QrCode
} from 'lucide-react';
import { formatRupiah } from '../utils/formatters';

export default function OrderSuccessPage({
  orderData = null,
  onContinueShopping = () => {},
  onViewInstruction = () => {}
}) {
  const [copiedInvoice, setCopiedInvoice] = useState(false);
  const [copiedVa, setCopiedVa] = useState(false);

  if (!orderData) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center">
        <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-xs space-y-4">
          <div className="w-16 h-16 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto">
            <ShoppingBag size={32} />
          </div>
          <h2 className="text-xl font-black text-gray-800">Tidak ada riwayat transaksi aktif</h2>
          <p className="text-xs text-gray-500">Mulai belanja sekarang dan temukan jutaan produk impianmu!</p>
          <button
            type="button"
            onClick={onContinueShopping}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl cursor-pointer"
          >
            Mulai Belanja
          </button>
        </div>
      </div>
    );
  }

  const {
    invoiceNumber,
    vaNumber,
    totalAmount,
    totalSavings = 0,
    paymentMethod = {},
    address = {},
    expedition = {},
    items = [],
    createdAt,
    appliedCoupon
  } = orderData;

  const handleCopy = (text, type) => {
    navigator.clipboard?.writeText(text);
    if (type === 'invoice') {
      setCopiedInvoice(true);
      setTimeout(() => setCopiedInvoice(false), 2000);
    } else {
      setCopiedVa(true);
      setTimeout(() => setCopiedVa(false), 2000);
    }
  };

  const formattedDate = new Date(createdAt || Date.now()).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const mockResiNumber = `TKP${Math.floor(1000000000 + Math.random() * 9000000000)}`;

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-6">
      
      {/* Top Banner: Success Header */}
      <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 text-center shadow-xs relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-40 h-40 bg-emerald-50 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-emerald-50 rounded-full blur-2xl pointer-events-none" />

        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xs animate-in zoom-in-50 duration-300">
          <CheckCircle2 size={36} strokeWidth={2.5} />
        </div>

        <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
          Pesanan Berhasil Dibuat!
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-md mx-auto">
          Terima kasih telah berbelanja di TokoOnline. Pesananmu telah masuk ke sistem kami.
        </p>

        {/* Invoice Bar */}
        <div className="mt-5 inline-flex items-center gap-2 px-3.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs">
          <span className="text-gray-400">No. Invoice:</span>
          <strong className="font-mono text-gray-900">{invoiceNumber}</strong>
          <button
            type="button"
            onClick={() => handleCopy(invoiceNumber, 'invoice')}
            className="text-emerald-700 hover:text-emerald-800 font-bold ml-1 flex items-center gap-1 cursor-pointer"
          >
            <Copy size={12} />
            <span>{copiedInvoice ? 'Disalin' : 'Salin'}</span>
          </button>
        </div>

        <div className="mt-2 text-[11px] text-gray-400">
          Dibuat pada: {formattedDate} WIB
        </div>
      </div>

      {/* Main Grid: Left Details (Order & Delivery) | Right (Payment Info & Actions) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        
        {/* Left Col: Shipment & Order Items (7 cols) */}
        <div className="md:col-span-7 space-y-4">
          
          {/* Tracking & Shipment Status Box */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2.5 border-b border-gray-100">
              <h3 className="font-bold text-xs sm:text-sm text-gray-900 flex items-center gap-2">
                <Truck size={16} className="text-emerald-600" />
                <span>Informasi Pengiriman</span>
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md">
                Menunggu Pengiriman
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-gray-400 block text-[11px]">Kurir & Layanan</span>
                <span className="font-bold text-gray-800">{expedition.name} - {expedition.service}</span>
                <span className="text-[10px] text-gray-500 block mt-0.5">Estimasi {expedition.etd}</span>
              </div>

              <div>
                <span className="text-gray-400 block text-[11px]">No. Resi (Dummy)</span>
                <span className="font-mono font-bold text-emerald-700">{mockResiNumber}</span>
                <span className="text-[10px] text-emerald-600 block mt-0.5">Dapat dilacak otomatis</span>
              </div>
            </div>

            {/* Destination Address Card */}
            <div className="p-3 bg-gray-50/80 rounded-xl border border-gray-200 text-xs text-gray-700 space-y-1">
              <div className="flex items-center gap-2">
                <MapPin size={13} className="text-emerald-600 shrink-0" />
                <span className="font-bold text-gray-900">{address.recipient_name}</span>
                <span className="text-gray-400">|</span>
                <span className="text-gray-500">{address.phone}</span>
                <span className="text-[10px] bg-white px-1.5 py-0.2 rounded border border-gray-200 text-gray-600">
                  {address.label}
                </span>
              </div>
              <p className="text-[11px] text-gray-600 pl-5 leading-relaxed">
                {address.full_address}, {address.city}, {address.province}, {address.postal_code}
              </p>
              {address.notes && (
                <p className="text-[10px] text-gray-400 italic pl-5">
                  Patokan: {address.notes}
                </p>
              )}
            </div>
          </div>

          {/* Purchased Items List */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-2xs space-y-3">
            <h3 className="font-bold text-xs sm:text-sm text-gray-900 flex items-center gap-2 pb-2 border-b border-gray-100">
              <PackageCheck size={16} className="text-emerald-600" />
              <span>Daftar Produk ({items.reduce((acc, i) => acc + i.quantity, 0)} barang)</span>
            </h3>

            <div className="divide-y divide-gray-100">
              {items.map((item) => (
                <div key={item.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={item.image_url}
                      alt=""
                      className="w-12 h-12 rounded-xl object-cover border border-gray-200 shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-800 line-clamp-1">{item.name}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        {item.quantity} x {formatRupiah(item.price)}
                      </p>
                      {item.notes && (
                        <p className="text-[10px] text-emerald-700 italic">Catatan: "{item.notes}"</p>
                      )}
                    </div>
                  </div>
                  <span className="text-xs font-bold text-gray-900 shrink-0">
                    {formatRupiah(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Col: Payment Summary & Action Buttons (5 cols) */}
        <div className="md:col-span-5 space-y-4">
          
          {/* Payment Status & Details Box */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-2xs space-y-4">
            <h3 className="font-bold text-xs sm:text-sm text-gray-900 pb-2 border-b border-gray-100 flex items-center justify-between">
              <span>Rincian Pembayaran</span>
              <span className="text-[10px] bg-amber-50 text-amber-800 font-bold px-2 py-0.5 rounded border border-amber-200">
                Menunggu Pembayaran
              </span>
            </h3>

            {/* Payment Method Card */}
            <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Metode Pembayaran</span>
                <span className="font-bold text-gray-900">{paymentMethod.name}</span>
              </div>

              {/* Number display */}
              <div className="p-2.5 bg-white rounded-lg border border-emerald-300 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-gray-400 block font-medium">Nomor Pembayaran (VA)</span>
                  <span className="font-mono text-sm font-extrabold text-emerald-700 tracking-wider">
                    {vaNumber}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(vaNumber, 'va')}
                  className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-md font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Copy size={11} />
                  <span>{copiedVa ? 'Disalin' : 'Salin'}</span>
                </button>
              </div>

              <div className="flex items-center gap-1.5 text-[10px] text-amber-800 pt-0.5">
                <Clock size={12} className="shrink-0" />
                <span>Batas waktu bayar: <strong>23 jam 59 menit</strong></span>
              </div>
            </div>

            {/* Cost Breakdown */}
            <div className="space-y-2 text-xs text-gray-600 border-t border-gray-100 pt-3">
              <div className="flex justify-between">
                <span>Total Harga Barang</span>
                <span className="font-medium text-gray-800">
                  {formatRupiah(items.reduce((acc, i) => acc + (i.price * i.quantity), 0))}
                </span>
              </div>

              {appliedCoupon && (
                <div className="flex justify-between text-emerald-700">
                  <span>Diskon Kupon ({appliedCoupon.code})</span>
                  <span className="font-bold">- {formatRupiah(appliedCoupon.discount)}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Total Ongkos Kirim</span>
                <span className="font-medium text-gray-800">
                  {expedition.is_free ? 'Gratis' : formatRupiah(expedition.cost)}
                </span>
              </div>

              <div className="flex justify-between text-gray-500">
                <span>Biaya Jasa Aplikasi</span>
                <span className="font-medium text-gray-800">Rp 1.000</span>
              </div>

              {paymentMethod.fee > 0 && (
                <div className="flex justify-between text-gray-500">
                  <span>Biaya Transaksi</span>
                  <span className="font-medium text-gray-800">{formatRupiah(paymentMethod.fee)}</span>
                </div>
              )}

              {totalSavings > 0 && (
                <div className="p-2 bg-emerald-50 rounded-lg text-emerald-800 text-[11px] font-semibold flex items-center gap-1.5">
                  <Sparkles size={13} className="text-emerald-600 shrink-0" />
                  <span>Total Penghematan Kamu: <strong>{formatRupiah(totalSavings)}</strong></span>
                </div>
              )}
            </div>

            {/* Grand Total */}
            <div className="border-t border-gray-200 pt-3 flex items-baseline justify-between">
              <div>
                <span className="text-[11px] text-gray-500 block">Total Pembayaran</span>
                <span className="text-xl font-black text-emerald-700">
                  {formatRupiah(totalAmount)}
                </span>
              </div>
              <span className="text-[10px] text-gray-400">Lunas / Bergaransi</span>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={onViewInstruction}
                className="w-full py-2.5 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold text-xs rounded-xl cursor-pointer transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Lihat Instruksi Pembayaran</span>
                <ExternalLink size={13} />
              </button>

              <button
                type="button"
                onClick={onContinueShopping}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs cursor-pointer transition-colors flex items-center justify-center gap-1.5"
              >
                <ShoppingBag size={14} />
                <span>Belanja Produk Lainnya</span>
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold text-xs rounded-xl cursor-pointer transition-colors flex items-center justify-center gap-1.5"
              >
                <Printer size={13} />
                <span>Cetak Bukti Tagihan</span>
              </button>
            </div>

            <div className="flex items-center justify-center gap-1.5 text-[10px] text-gray-400 text-center pt-1">
              <ShieldCheck size={13} className="text-emerald-600 shrink-0" />
              <span>Garansi 100% uang kembali bila pesanan tidak sesuai</span>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
