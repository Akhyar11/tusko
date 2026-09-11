import React, { useState } from 'react';
import { 
  Printer, 
  Download, 
  X, 
  Truck, 
  Package, 
  QrCode, 
  Barcode, 
  Copy, 
  Check, 
  ShieldCheck, 
  Calendar, 
  MapPin, 
  Phone, 
  Store, 
  Info, 
  FileDown 
} from 'lucide-react';
import { formatRupiah } from '../utils/formatters';

export default function PrintReceiptModal({
  isOpen = false,
  onClose = () => {},
  order = null
}) {
  const [copied, setCopied] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  if (!isOpen || !order) return null;

  const invoice = order.order_number || order.invoice_number || 'INV/20260907/TK/000000';
  const trackingNumber = order.expedition?.tracking_number || order.tracking_number || 'TRK-98827391823';
  const expeditionName = order.expedition?.name || order.expedition_name || 'J&T Express (KiriminAja)';
  const expeditionService = order.expedition?.service || order.expedition_service || 'EZ (Reguler)';
  const expeditionEtd = order.expedition?.etd || order.expedition_etd || '1-3 hari';
  
  const address = order.address || {};
  const recipientName = address.recipient_name || order.recipient_name || 'Pembeli Tusko';
  const recipientPhone = address.phone || order.phone || order.phone_number || '0812-3456-7890';
  const fullAddress = address.full_address || order.full_address || 'Jl. Sudirman No. 45, RT 01 / RW 02';
  const city = address.city || order.city || 'Jakarta Selatan';
  const postalCode = address.postal_code || order.postal_code || '12190';
  
  const items = order.items || [];
  const totalWeight = order.total_weight || items.reduce((sum, item) => sum + (item.quantity * 0.5), 0.5);
  const totalAmount = order.total_amount || order.grand_total || order.total_price || 0;
  
  const orderDate = order.created_at 
    ? new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    : '7 September 2026';

  const handlePrint = () => {
    const originalTitle = document.title;
    document.title = `Resi_${expeditionName.replace(/[^a-zA-Z0-9]/g, '_')}_${trackingNumber}`;
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
    const safeTitle = `Resi_${expeditionName.replace(/[^a-zA-Z0-9]/g, '_')}_${trackingNumber}`;
    document.title = safeTitle;

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

  const handleCopyTracking = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(trackingNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const cityCode = city.toUpperCase().slice(0, 3) || 'CGK';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white print:static">
      {/* Print Specific CSS Style Injection */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-shipping-label, #printable-shipping-label * {
            visibility: visible;
          }
          #printable-shipping-label {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0 !important;
            padding: 0 !important;
          }
          @page {
            size: 100mm 150mm;
            margin: 3mm;
          }
        }
      `}</style>

      <div className="bg-white w-full max-w-xl rounded-none shadow-2xl border border-neutral-300 overflow-hidden animate-in fade-in duration-150 my-auto print:shadow-none print:border-none print:max-w-none print:rounded-none">
        
        {/* Modal Toolbar */}
        <div className="flex items-center justify-between px-5 py-4 bg-neutral-950 text-white print:hidden border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-none bg-neutral-900 border border-neutral-700 text-amber-400 flex items-center justify-center">
              <Printer size={18} />
            </div>
            <div>
              <h3 className="font-sport font-black text-sm uppercase tracking-wide">Label Resi Pengiriman (KiriminAja)</h3>
              <p className="text-[11px] text-neutral-400">Format stiker thermal 100x150 mm ({expeditionName})</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
              className="px-3.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs rounded-none border border-neutral-600 flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              title="Unduh label resi sebagai file PDF"
            >
              <Download size={14} />
              <span>{isDownloadingPdf ? 'Membuka PDF...' : 'Unduh PDF'}</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-sport font-black text-xs rounded-none flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs uppercase tracking-wider"
            >
              <Printer size={14} />
              <span>Cetak Label</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-none transition-colors cursor-pointer"
              title="Tutup Modal"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Shipping Label Content */}
        <div className="p-5 sm:p-6 space-y-4 text-xs text-neutral-900 bg-white" id="printable-shipping-label">
          
          {/* Label Outer Container (Standar Stiker Thermal 100mm x 150mm) */}
          <div className="border-2 border-black rounded-none p-4 sm:p-5 space-y-3 font-sans bg-white text-black">
            
            {/* Header Kurir & Resi Baris 1 */}
            <div className="flex items-center justify-between border-b-2 border-black pb-3 gap-2">
              <div className="flex items-center gap-2">
                <div className="px-2.5 py-1 bg-black text-white font-black text-lg tracking-wider rounded-none uppercase">
                  {expeditionName}
                </div>
                <div>
                  <span className="px-2 py-0.5 border border-black text-black font-black text-[11px] rounded-none uppercase">
                    {expeditionService}
                  </span>
                  <span className="text-[10px] text-neutral-700 block mt-0.5 font-medium">
                    Estimasi {expeditionEtd}
                  </span>
                </div>
              </div>

              {/* Sorting City Code Box */}
              <div className="text-right">
                <div className="px-2.5 py-1 bg-black text-white font-mono font-black text-sm tracking-widest rounded-none text-center">
                  {cityCode}
                </div>
                <span className="text-[9px] font-bold text-neutral-600 block mt-0.5">KODE SORTIR</span>
              </div>
            </div>

            {/* Barcode & Tracking Number Area */}
            <div className="py-2.5 border-b-2 border-black flex flex-col items-center justify-center text-center space-y-1.5 bg-neutral-50 rounded-none">
              {/* Simulasi Garis Barcode Thermal */}
              <div className="w-full max-w-[300px] h-14 flex items-stretch justify-center gap-[2px] px-2">
                {[3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 1, 2, 4, 1, 2, 3, 1, 4, 2, 1, 3, 2, 4, 1, 2, 3, 1, 2, 3, 1, 2].map((w, i) => (
                  <div 
                    key={i} 
                    className="bg-black h-full" 
                    style={{ width: `${w * 1.8}px` }}
                  />
                ))}
              </div>

              <div className="flex items-center gap-2">
                <span className="font-mono font-black text-base tracking-widest text-black">
                  {trackingNumber}
                </span>
                <button
                  type="button"
                  onClick={handleCopyTracking}
                  className="p-1 rounded-none text-neutral-500 hover:text-black hover:bg-neutral-200 transition-colors print:hidden cursor-pointer"
                  title="Salin No Resi"
                >
                  {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                </button>
              </div>

              <span className="text-[9px] font-bold tracking-wider text-neutral-600 uppercase">
                NO. RESI KURIR PENGIRIMAN (KIRIMINAJA BOOKED)
              </span>
            </div>

            {/* Address Grid: Penerima & Pengirim */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-b-2 border-black pb-3">
              
              {/* Kolom Penerima */}
              <div className="space-y-1 pr-0 sm:pr-2 border-b sm:border-b-0 sm:border-r border-black/30 pb-2 sm:pb-0">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-neutral-600">
                    KEPADA (PENERIMA):
                  </span>
                  <span className="px-1.5 py-0.2 bg-black text-white text-[9px] font-bold rounded-none">
                    TUJUAN
                  </span>
                </div>
                <p className="font-black text-sm text-black pt-0.5 leading-tight">
                  {recipientName}
                </p>
                <p className="font-mono font-bold text-xs text-black">
                  {recipientPhone}
                </p>
                <p className="text-[11px] text-neutral-800 leading-snug pt-0.5">
                  {fullAddress}
                  {city ? `, ${city}` : ''}
                </p>
                <div className="inline-block mt-1 px-2 py-0.5 border border-black font-mono font-bold text-[11px] rounded-none bg-neutral-50">
                  KODEPOS: {postalCode}
                </div>
              </div>

              {/* Kolom Pengirim */}
              <div className="space-y-1 pl-0 sm:pl-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-neutral-600">
                    DARI (PENGIRIM):
                  </span>
                  <span className="px-1.5 py-0.2 border border-black text-black text-[9px] font-bold rounded-none">
                    STORE
                  </span>
                </div>
                <p className="font-black text-sm text-black pt-0.5 leading-tight">
                  Tusko Official Central Warehouse
                </p>
                <p className="font-mono text-xs text-neutral-800">
                  0811-9876-5432
                </p>
                <p className="text-[11px] text-neutral-800 leading-snug pt-0.5">
                  Gudang Logistik Sentral Tusko (WH-CGK-01), Pergudangan Daan Mogot, Jakarta Barat, 11840
                </p>
              </div>

            </div>

            {/* Package Metadata & Summary Row */}
            <div className="space-y-2 border-b-2 border-black pb-3 text-[11px]">
              <div className="grid grid-cols-3 gap-2 bg-neutral-50 p-2 rounded-none border border-black/20 text-center font-bold">
                <div>
                  <span className="text-[9px] text-neutral-600 block">NO. INVOICE</span>
                  <span className="font-mono text-[10px] sm:text-[11px] text-black font-extrabold truncate block">
                    {invoice}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] text-neutral-600 block">BERAT PAKET</span>
                  <span className="text-black font-extrabold">
                    {Number(totalWeight).toFixed(1)} Kg
                  </span>
                </div>
                <div>
                  <span className="text-[9px] text-neutral-600 block">TIPE TRANSAKSI</span>
                  <span className="text-emerald-700 font-black uppercase">
                    LUNAS (NON-COD)
                  </span>
                </div>
              </div>

              {/* Items checklist */}
              <div className="space-y-1 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-neutral-700 uppercase">
                    DAFTAR BARANG DALAM PAKET ({items.length} ITEM):
                  </span>
                  <span className="text-[9px] text-neutral-500 font-mono">
                    QC PASSED
                  </span>
                </div>
                <div className="divide-y divide-neutral-200 border-t border-b border-neutral-200 py-1">
                  {items.map((item, idx) => (
                    <div key={idx} className="py-1 flex justify-between items-center text-[11px]">
                      <div className="truncate pr-2">
                        <span className="font-bold text-black">{item.quantity}x</span>{' '}
                        <span className="text-neutral-900 font-medium">{item.product_name || item.name}</span>
                        {item.variant && <span className="text-amber-700 text-[10px]"> ({item.variant})</span>}
                      </div>
                      <span className="font-mono text-black font-bold text-[10px] shrink-0">
                        [ &check; ]
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Thermal Footer Instruction */}
            <div className="pt-1 flex items-center justify-between text-[10px] text-neutral-700">
              <span className="italic">Wajib rekam video unboxing saat membuka paket untuk klaim garansi.</span>
              <span className="font-bold text-black uppercase font-sport">Tusko Fulfillment System</span>
            </div>

          </div>

          {/* Quick Notice under label for UI Screen */}
          <div className="p-3.5 bg-neutral-100 rounded-none border border-neutral-300 text-[11px] text-neutral-800 flex items-start gap-2.5 print:hidden">
            <Info size={16} className="text-neutral-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Panduan Cetak Thermal 100mm x 150mm (A6)</p>
              <p className="text-neutral-600 text-[10.5px] mt-0.5">
                Format label telah disesuaikan dengan standar printer resi stiker thermal KiriminAja. Pada jendela dialog print browser Anda, pilih <strong>Destination: Thermal Printer</strong> dan set <strong>Margins: None</strong>.
              </p>
            </div>
          </div>

        </div>

        {/* Modal Footer (Hidden on print) */}
        <div className="flex items-center justify-between p-4 bg-neutral-50 border-t border-neutral-200 print:hidden">
          <span className="text-xs text-neutral-500">
            Invoice: <strong className="font-mono text-neutral-800">{invoice}</strong>
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 bg-white hover:bg-neutral-100 text-neutral-700 font-bold text-xs rounded-none border border-neutral-300 transition-colors cursor-pointer"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
              className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs rounded-none transition-colors cursor-pointer border border-neutral-600 flex items-center gap-1.5 disabled:opacity-50"
              title="Unduh label resi sebagai file PDF"
            >
              <Download size={14} />
              <span>{isDownloadingPdf ? 'Membuka PDF...' : 'Unduh PDF'}</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-sport font-black text-xs rounded-none transition-colors cursor-pointer shadow-xs flex items-center gap-1.5 uppercase tracking-wider"
            >
              <Printer size={14} />
              <span>Cetak Label Resi</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
