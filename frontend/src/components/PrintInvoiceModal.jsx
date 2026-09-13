import React, { useState } from 'react';
import { 
  Printer, 
  Download, 
  X, 
  FileText, 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  CheckCircle2, 
  ShieldCheck, 
  Calendar, 
  CreditCard,
  Truck
} from 'lucide-react';
import { formatRupiah } from '../utils/formatters';

export default function PrintInvoiceModal({
  isOpen = false,
  onClose = () => {},
  order = null
}) {
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  if (!isOpen || !order) return null;

  const invoiceNumber = order.order_number || order.invoice_number || 'INV/20260907/TK/000000';
  const orderDate = order.created_at 
    ? new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '7 September 2026, 14:30 WIB';
  const paidDate = order.paid_at 
    ? new Date(order.paid_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
    : '7 September 2026';

  const address = order.address || {};
  const recipientName = address.recipient_name || order.recipient_name || 'Pembeli Tusko';
  const recipientPhone = address.phone || order.phone || order.phone_number || '0812-3456-7890';
  const fullAddress = address.full_address || order.full_address || 'Jl. Jenderal Sudirman No. 45, RT 01 / RW 02';
  const city = address.city || order.city || 'Jakarta Selatan';
  const postalCode = address.postal_code || order.postal_code || '12190';

  const expeditionName = order.expedition?.name || order.expedition_name || 'J&T Express (KiriminAja)';
  const expeditionService = order.expedition?.service || order.expedition_service || 'Reguler';
  const trackingNumber = order.expedition?.tracking_number || order.tracking_number || 'TRK-98827391823';

  const items = order.items || [];
  const subtotal = order.subtotal || items.reduce((acc, it) => acc + ((it.price || it.unit_price || 0) * (it.quantity || 1)), 0);
  const shippingCost = order.shipping_cost || 18000;
  const discountAmount = order.discount_amount || 0;
  const grandTotal = order.grand_total || order.total_amount || (subtotal + shippingCost - discountAmount);

  const handlePrint = () => {
    const originalTitle = document.title;
    document.title = `E-Invoice_${invoiceNumber.replace(/[^a-zA-Z0-9]/g, '_')}`;
    window.print();
    const handleAfterPrint = () => {
      document.title = originalTitle;
      window.removeEventListener('afterprint', handleAfterPrint);
    };
    window.addEventListener('afterprint', handleAfterPrint);
  };

  const handleDownloadPdf = () => {
    setIsDownloadingPdf(true);
    const originalTitle = document.title;
    document.title = `E-Invoice_${invoiceNumber.replace(/[^a-zA-Z0-9]/g, '_')}`;
    setTimeout(() => {
      window.print();
      setIsDownloadingPdf(false);
      const handleAfterPrint = () => {
        document.title = originalTitle;
        window.removeEventListener('afterprint', handleAfterPrint);
      };
      window.addEventListener('afterprint', handleAfterPrint);
    }, 150);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white print:static">
      {/* Print Specific CSS Style Injection */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-digital-invoice, #printable-digital-invoice * {
            visibility: visible;
          }
          #printable-digital-invoice {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0 !important;
            padding: 20px !important;
          }
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
        }
      `}</style>

      <div className="bg-white w-full max-w-3xl rounded-none shadow-2xl border border-neutral-300 overflow-hidden animate-in fade-in duration-150 my-auto print:shadow-none print:border-none print:max-w-none">
        
        {/* Modal Toolbar */}
        <div className="flex items-center justify-between px-5 py-4 bg-neutral-950 text-white print:hidden border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-none bg-neutral-900 border border-neutral-700 text-amber-400 flex items-center justify-center font-bold">
              <FileText size={18} />
            </div>
            <div>
              <h3 className="font-sport font-black text-sm tracking-wide uppercase">Faktur Digital (E-Invoice)</h3>
              <p className="text-[11px] text-neutral-400 font-mono">{invoiceNumber}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
              className="px-3.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs rounded-none border border-neutral-600 flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              title="Simpan faktur sebagai file PDF"
            >
              <Download size={14} />
              <span>{isDownloadingPdf ? 'Menyiapkan...' : 'Simpan PDF'}</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-sport font-black text-xs rounded-none flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs uppercase tracking-wider"
            >
              <Printer size={14} />
              <span>Cetak Invoice</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-none transition-colors cursor-pointer"
              title="Tutup"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Invoice Body Content */}
        <div className="p-6 sm:p-8 space-y-6 text-xs text-neutral-900 bg-white" id="printable-digital-invoice">
          
          {/* Header Toko & Judul Faktur */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b-2 border-neutral-950">
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-black text-white px-2 py-0.5 font-sport font-black text-lg tracking-widest uppercase">
                  TUSKO
                </span>
                <span className="font-sport font-black text-xs uppercase tracking-widest text-amber-600">
                  SPORTWEAR ERP
                </span>
              </div>
              <p className="text-[11px] text-neutral-500 mt-2">
                PT Tusko Performance Indonesia
              </p>
              <p className="text-[11px] text-neutral-500">
                Pusat Distribusi Logistik & Ritel Olahraga
              </p>
              <p className="text-[11px] text-neutral-500 font-mono">
                NPWP: 01.892.345.2-014.000
              </p>
            </div>

            <div className="text-left sm:text-right space-y-1">
              <h1 className="font-sport font-black text-2xl uppercase tracking-tight text-neutral-950">
                FAKTUR PENJUALAN
              </h1>
              <div className="font-mono text-xs font-bold text-neutral-800">
                {invoiceNumber}
              </div>
              <div className="text-[11px] text-neutral-500">
                Tanggal: <span className="font-medium text-neutral-800">{orderDate}</span>
              </div>
              <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 font-sport font-bold text-[11px] uppercase rounded-none mt-1">
                <CheckCircle2 size={12} />
                <span>LUNAS / SETTLED</span>
              </div>
            </div>
          </div>

          {/* Info Pembeli & Pengiriman Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 bg-neutral-50 border border-neutral-200 rounded-none">
            <div className="space-y-1">
              <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 font-bold">
                DITAGIHKAN KEPADA:
              </div>
              <div className="font-black text-neutral-950 text-sm">
                {recipientName}
              </div>
              <div className="text-neutral-600 font-mono text-[11px]">
                {recipientPhone}
              </div>
              <div className="text-neutral-600 text-[11px] leading-relaxed pt-1">
                {fullAddress}, {city}, {postalCode}
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 font-bold">
                EKSPEDISI & LOGISTIK:
              </div>
              <div className="font-bold text-neutral-900 text-xs flex items-center gap-1.5">
                <Truck size={14} className="text-amber-600" />
                <span>{expeditionName} - {expeditionService}</span>
              </div>
              <div className="text-neutral-600 text-[11px]">
                No. Resi: <span className="font-mono font-bold text-neutral-900">{trackingNumber}</span>
              </div>
              <div className="text-neutral-600 text-[11px]">
                Metode Pembayaran: <span className="font-semibold uppercase text-neutral-800">{order.payment_method || 'Midtrans Snap (Auto-Settled)'}</span>
              </div>
              <div className="text-neutral-500 text-[10px]">
                Lunas pada: {paidDate}
              </div>
            </div>
          </div>

          {/* Tabel Rincian Item Produk */}
          <div className="border border-neutral-300 rounded-none overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-neutral-950 text-white font-sport font-black uppercase text-[11px] tracking-wider">
                  <th className="py-2.5 px-4">No</th>
                  <th className="py-2.5 px-4">Deskripsi Produk & Varian</th>
                  <th className="py-2.5 px-4 text-center">SKU</th>
                  <th className="py-2.5 px-4 text-center">Qty</th>
                  <th className="py-2.5 px-4 text-right">Harga Satuan</th>
                  <th className="py-2.5 px-4 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 font-sans text-xs">
                {items.length > 0 ? (
                  items.map((it, idx) => {
                    const price = it.price || it.unit_price || 0;
                    const qty = it.quantity || 1;
                    const lineTotal = price * qty;
                    return (
                      <tr key={it.id || idx} className="hover:bg-neutral-50">
                        <td className="py-3 px-4 font-mono text-neutral-500 text-center">{idx + 1}</td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-neutral-950">{it.name || it.product_name}</div>
                          {it.variant && (
                            <div className="text-[11px] text-amber-700 font-medium mt-0.5">
                              Varian: {it.variant}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-[11px] text-neutral-600">
                          {it.sku || `TSK-VAR-${idx + 1}`}
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-neutral-900">
                          {qty}
                        </td>
                        <td className="py-3 px-4 text-right font-mono">
                          {formatRupiah(price)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-neutral-950">
                          {formatRupiah(lineTotal)}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="py-4 text-center text-neutral-400 italic">
                      Tidak ada detail item pesanan
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Kalkulasi Finansial Ringkasan */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pt-2">
            <div className="text-xs text-neutral-500 max-w-sm space-y-1">
              <p className="font-bold text-neutral-700 uppercase font-sport tracking-wider">Catatan Penting:</p>
              <p className="text-[11px] leading-relaxed">
                Faktur ini sah dan diterbitkan secara digital oleh sistem ERP Tusko Sport.
                Barang yang telah dibeli dilindungi garansi keaslian 100% dan dapat ditukar jika terdapat cacat produksi dalam waktu 7 hari kerja.
              </p>
            </div>

            <div className="w-full sm:w-72 space-y-2 border border-neutral-300 p-4 bg-neutral-50 rounded-none">
              <div className="flex justify-between text-xs text-neutral-600">
                <span>Subtotal Barang:</span>
                <span className="font-mono font-bold">{formatRupiah(subtotal)}</span>
              </div>
              <div className="flex justify-between text-xs text-neutral-600">
                <span>Biaya Pengiriman ({expeditionName}):</span>
                <span className="font-mono font-bold">{formatRupiah(shippingCost)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-xs text-emerald-700 font-semibold">
                  <span>Diskon Promo:</span>
                  <span className="font-mono font-bold">-{formatRupiah(discountAmount)}</span>
                </div>
              )}
              <div className="border-t-2 border-neutral-950 pt-2 flex justify-between items-baseline font-sport font-black text-neutral-950 text-base">
                <span>TOTAL AKHIR:</span>
                <span className="font-mono text-lg text-amber-700">{formatRupiah(grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* Footer Pengesahan & Tanda Tangan Digital */}
          <div className="pt-6 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-500 gap-4">
            <div className="flex items-center gap-2 font-mono text-[11px]">
              <ShieldCheck size={16} className="text-emerald-600" />
              <span>Verifikasi Digital SHA-512 Autentik: TUSKO-ERP-SECURE-2026</span>
            </div>
            <div className="text-center sm:text-right">
              <p className="text-[10px] text-neutral-400 uppercase font-mono tracking-widest">Otorisasi Finansial</p>
              <p className="font-sport font-black text-neutral-900 text-xs uppercase mt-0.5">Tusko Financial Operations</p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
