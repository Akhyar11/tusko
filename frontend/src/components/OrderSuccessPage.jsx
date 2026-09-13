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
  ShoppingBag, 
  ExternalLink, 
  Sparkles, 
  ShieldCheck, 
  Check, 
  QrCode
} from 'lucide-react';
import { formatRupiah } from '../utils/formatters';

export default function OrderSuccessPage({
  orderData = null,
  onContinueShopping = () => {},
  onViewInstruction = () => {},
  onViewOrdersList = () => {}
}) {
  const [copiedInvoice, setCopiedInvoice] = useState(false);
  const [copiedVa, setCopiedVa] = useState(false);
  const [copiedResi, setCopiedResi] = useState(false);

  if (!orderData) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center">
        <div className="bg-white rounded-none p-10 border-2 border-black space-y-4">
          <div className="w-16 h-16 bg-neutral-100 text-neutral-400 rounded-none flex items-center justify-center mx-auto border border-neutral-300">
            <ShoppingBag size={32} />
          </div>
          <h2 className="text-xl font-sport font-black uppercase text-black tracking-tight">
            Tidak Ada Riwayat Transaksi Aktif
          </h2>
          <p className="text-xs text-neutral-600 max-w-sm mx-auto font-medium">
            Yuk, jelajahi katalog perlengkapan atletik Tusko dan temukan produk terbaikmu sekarang!
          </p>
          <button
            type="button"
            onClick={onContinueShopping}
            className="px-8 py-3 bg-black hover:bg-neutral-800 text-white font-sport font-black text-xs uppercase tracking-wider rounded-none cursor-pointer transition-colors -skew-x-3 hover:skew-x-0"
          >
            Mulai Belanja Sekarang
          </button>
        </div>
      </div>
    );
  }

  const {
    invoiceNumber = 'INV/TUSKO/001',
    vaNumber = '88081234567890',
    trackingResi = 'TKP1234567890',
    totalAmount = 0,
    totalSavings = 0,
    paymentMethod = { name: 'Virtual Account', type: 'midtrans' },
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
    } else if (type === 'va') {
      setCopiedVa(true);
      setTimeout(() => setCopiedVa(false), 2000);
    } else if (type === 'resi') {
      setCopiedResi(true);
      setTimeout(() => setCopiedResi(false), 2000);
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

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-6">
      
      {/* Top Banner: Success Header */}
      <div className="bg-white rounded-none border-2 border-black p-6 sm:p-8 text-center relative overflow-hidden">
        <div className="w-16 h-16 bg-black text-white rounded-none flex items-center justify-center mx-auto mb-4 -skew-x-6">
          <CheckCircle2 size={36} strokeWidth={2.5} className="skew-x-6 text-amber-400" />
        </div>

        <h1 className="text-xl sm:text-2xl font-sport font-black uppercase text-black tracking-tight">
          Pesanan Berhasil Dibuat!
        </h1>
        <p className="text-xs sm:text-sm text-neutral-600 mt-1 max-w-md mx-auto font-medium">
          Terima kasih telah berbelanja di Tusko Performance Store. Pesananmu telah tersimpan dan siap diproses oleh gudang.
        </p>

        {/* Invoice Bar */}
        <div className="mt-5 inline-flex items-center gap-2.5 px-4 py-2 bg-neutral-100 border-2 border-black rounded-none text-xs">
          <span className="text-neutral-500 font-sport font-bold uppercase">No. Invoice:</span>
          <strong className="font-mono font-black text-black">{invoiceNumber}</strong>
          <button
            type="button"
            onClick={() => handleCopy(invoiceNumber, 'invoice')}
            className="text-black hover:text-neutral-700 font-sport font-black uppercase ml-1 flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Copy size={13} />
            <span>{copiedInvoice ? 'Disalin!' : 'Salin'}</span>
          </button>
        </div>

        <div className="mt-3 text-[11px] font-sport font-bold uppercase text-neutral-400">
          Waktu Transaksi: {formattedDate} WIB
        </div>
      </div>

      {/* Main Grid: Left Details (Order & Delivery) | Right (Payment Info & Actions) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        
        {/* Left Col: Shipment & Order Items (7 cols) */}
        <div className="md:col-span-7 space-y-4">
          
          {/* Tracking & Shipment Status Box */}
          <div className="bg-white rounded-none border-2 border-black p-5 space-y-3">
            <div className="flex items-center justify-between pb-2.5 border-b-2 border-black">
              <h3 className="font-sport font-black uppercase text-xs sm:text-sm text-black flex items-center gap-2">
                <Truck size={16} className="text-black" />
                <span>Informasi Pengiriman</span>
              </h3>
              <span className="text-[10px] font-sport font-black uppercase px-2.5 py-0.5 bg-neutral-100 text-black border border-black rounded-none">
                Standby di Gudang
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-neutral-500 block text-[11px] font-sport font-bold uppercase">Kurir &amp; Layanan</span>
                <span className="font-sport font-black uppercase text-black">{expedition.name || 'KiriminAja Logistics'} - {expedition.service || 'Reguler'}</span>
                <span className="text-[10px] text-neutral-500 font-medium block mt-0.5">Estimasi {expedition.etd || '2-3 hari'}</span>
              </div>

              <div>
                <span className="text-neutral-500 block text-[11px] font-sport font-bold uppercase">No. Resi Pengiriman</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="font-mono font-black text-black">{trackingResi}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(trackingResi, 'resi')}
                    className="text-neutral-500 hover:text-black cursor-pointer"
                    title="Salin Resi"
                  >
                    <Copy size={11} />
                  </button>
                </div>
                <span className="text-[10px] text-neutral-500 block mt-0.5">{copiedResi ? 'Resi disalin!' : 'Multi-kurir KiriminAja'}</span>
              </div>
            </div>

            {/* Destination Address Card */}
            <div className="p-3.5 bg-neutral-100 rounded-none border border-neutral-300 text-xs text-neutral-700 space-y-1">
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-black shrink-0" />
                <span className="font-sport font-black uppercase text-black">{address.recipient_name || 'Penerima'}</span>
                <span className="text-neutral-400">|</span>
                <span className="text-neutral-600 font-medium">{address.phone || address.phone_number || '-'}</span>
                {address.label && (
                  <span className="text-[10px] bg-white px-2 py-0.5 rounded-none border border-neutral-300 font-sport font-bold uppercase text-black">
                    {address.label}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-neutral-600 pl-5 leading-relaxed font-medium">
                {address.full_address || address.address}, {address.city}, {address.province}, {address.postal_code}
              </p>
              {address.notes && (
                <p className="text-[10px] text-neutral-500 italic pl-5">
                  Patokan: "{address.notes}"
                </p>
              )}
            </div>
          </div>

          {/* Purchased Items List */}
          <div className="bg-white rounded-none border-2 border-black p-5 space-y-3">
            <h3 className="font-sport font-black uppercase text-xs sm:text-sm text-black flex items-center gap-2 pb-2.5 border-b-2 border-black">
              <PackageCheck size={16} className="text-black" />
              <span>Daftar Produk ({items.reduce((acc, i) => acc + i.quantity, 0)} barang)</span>
            </h3>

            <div className="divide-y-2 divide-neutral-100">
              {items.map((item) => (
                <div key={item.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={item.image_url}
                      alt=""
                      className="w-12 h-12 rounded-none object-cover border border-neutral-300 shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-sport font-black uppercase text-black truncate">{item.name}</p>
                      <p className="text-[11px] text-neutral-500 mt-0.5 font-medium">
                        {item.quantity} x {formatRupiah(item.price)}
                      </p>
                      {item.notes && (
                        <p className="text-[10px] text-neutral-600 italic">Catatan: "{item.notes}"</p>
                      )}
                    </div>
                  </div>
                  <span className="text-xs font-sport font-black text-black shrink-0">
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
          <div className="bg-white rounded-none border-2 border-black p-5 space-y-4">
            <h3 className="font-sport font-black uppercase text-xs sm:text-sm text-black pb-2.5 border-b-2 border-black flex items-center justify-between">
              <span>Rincian Pembayaran</span>
              <span className="text-[10px] font-sport font-black uppercase px-2 py-0.5 bg-amber-400 text-black rounded-none">
                Menunggu Pembayaran
              </span>
            </h3>

            {/* Payment Method Card */}
            <div className="p-3.5 bg-neutral-100 border border-neutral-300 rounded-none space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-neutral-600 font-sport font-bold uppercase">Metode Pembayaran</span>
                <span className="font-sport font-black uppercase text-black">{paymentMethod.name || 'Midtrans Virtual Account'}</span>
              </div>

              {/* Number display */}
              <div className="p-3 bg-white rounded-none border-2 border-black flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-neutral-400 block font-sport font-bold uppercase">Nomor Pembayaran (VA)</span>
                  <span className="font-mono text-sm sm:text-base font-black text-black tracking-wider">
                    {vaNumber}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(vaNumber, 'va')}
                  className="px-3 py-1.5 bg-black hover:bg-neutral-800 text-white rounded-none font-sport font-black text-[11px] uppercase flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Copy size={11} />
                  <span>{copiedVa ? 'Disalin' : 'Salin'}</span>
                </button>
              </div>

              <div className="flex items-center gap-1.5 text-[10px] font-sport font-bold uppercase text-neutral-600 pt-0.5">
                <Clock size={12} className="shrink-0 text-black" />
                <span>Batas Waktu Bayar: <strong>24 Jam</strong></span>
              </div>
            </div>

            {/* Cost Breakdown */}
            <div className="space-y-2 text-xs text-neutral-600 border-t border-neutral-200 pt-3">
              <div className="flex justify-between">
                <span>Total Harga Barang</span>
                <span className="font-sport font-bold text-black">
                  {formatRupiah(items.reduce((acc, i) => acc + (i.price * i.quantity), 0))}
                </span>
              </div>

              {appliedCoupon && (
                <div className="flex justify-between text-neutral-900 font-sport font-bold">
                  <span>Diskon Kupon ({appliedCoupon.code})</span>
                  <span>- {formatRupiah(appliedCoupon.discount)}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Ongkos Kirim ({expedition.name || 'KiriminAja'})</span>
                <span className="font-sport font-bold text-black">
                  {expedition.is_free ? 'Gratis' : formatRupiah(expedition.cost || 0)}
                </span>
              </div>

              <div className="flex justify-between text-neutral-500">
                <span>Biaya Layanan &amp; Penanganan</span>
                <span className="font-sport font-bold text-neutral-700">
                  {formatRupiah(orderData.appHandlingFee || 1000)}
                </span>
              </div>

              {paymentMethod.fee > 0 && (
                <div className="flex justify-between text-neutral-500">
                  <span>Biaya Transaksi</span>
                  <span className="font-sport font-bold text-neutral-700">{formatRupiah(paymentMethod.fee)}</span>
                </div>
              )}

              {totalSavings > 0 && (
                <div className="p-2.5 bg-neutral-100 border border-neutral-300 rounded-none text-black text-[11px] font-sport font-black uppercase flex items-center justify-between">
                  <span>Total Penghematan:</span>
                  <span className="text-red-600 font-black">{formatRupiah(totalSavings)}</span>
                </div>
              )}
            </div>

            {/* Grand Total */}
            <div className="border-t-2 border-black pt-3 flex items-baseline justify-between">
              <div>
                <span className="text-[11px] font-sport font-bold uppercase text-neutral-500 block">Total Tagihan:</span>
                <span className="text-xl sm:text-2xl font-sport font-black text-black">
                  {formatRupiah(totalAmount)}
                </span>
              </div>
              <span className="text-[10px] font-sport font-bold uppercase text-neutral-400">Jaminan Tusko</span>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={onViewInstruction}
                className="w-full py-3 px-4 bg-amber-400 hover:bg-amber-300 text-black border-2 border-black font-sport font-black text-xs uppercase tracking-wider rounded-none cursor-pointer transition-colors flex items-center justify-center gap-1.5 -skew-x-3 hover:skew-x-0"
              >
                <span>Petunjuk Pembayaran Lengkap</span>
                <ExternalLink size={13} />
              </button>

              <button
                type="button"
                onClick={onViewOrdersList}
                className="w-full py-2.5 px-4 bg-white hover:bg-neutral-100 text-black border-2 border-black font-sport font-black text-xs uppercase tracking-wider rounded-none cursor-pointer transition-colors flex items-center justify-center gap-1.5"
              >
                <ShoppingBag size={14} />
                <span>Lihat Daftar Pesanan</span>
              </button>

              <button
                type="button"
                onClick={onContinueShopping}
                className="w-full py-3 px-4 bg-black hover:bg-neutral-800 text-white font-sport font-black text-xs uppercase tracking-wider rounded-none cursor-pointer transition-colors flex items-center justify-center gap-1.5 -skew-x-3 hover:skew-x-0"
              >
                <ShoppingBag size={14} />
                <span>Lanjut Belanja Katalog</span>
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="w-full py-2 px-4 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-sport font-bold text-xs uppercase tracking-wider rounded-none border border-neutral-300 cursor-pointer transition-colors flex items-center justify-center gap-1.5"
              >
                <Printer size={13} />
                <span>Cetak Bukti Transaksi</span>
              </button>
            </div>

            <div className="flex items-center justify-center gap-1.5 text-[10px] text-neutral-500 text-center pt-1 font-sport font-bold uppercase">
              <ShieldCheck size={13} className="text-black shrink-0" />
              <span>Garansi 100% Produk Original &amp; Pengiriman Aman</span>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
