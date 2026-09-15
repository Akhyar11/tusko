import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Building2, 
  Warehouse, 
  Boxes, 
  FileCheck, 
  Printer, 
  PackageCheck, 
  XCircle, 
  Clock, 
  CheckCircle2, 
  Calendar, 
  Phone, 
  Mail, 
  MapPin, 
  CreditCard, 
  FileText, 
  Check, 
  AlertCircle,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Package
} from 'lucide-react';
import IconButton from './atoms/IconButton';
import { formatRupiah } from '../utils/formatters';
import { procurementService } from '../services/procurementService';
import { vendorService } from '../services/vendorService';
import { warehouseService } from '../services/warehouseService';

export default function PurchaseOrderDetailPage({
  po = null,
  poId = null,
  onNavigateBack = () => {},
  onReceivePO = null,
  onCancelPO = null,
  onShowToast = () => {}
}) {
  const [currentPO, setCurrentPO] = useState(po);
  const [vendorDetails, setVendorDetails] = useState(null);
  const [warehouseDetails, setWarehouseDetails] = useState(null);
  const [relatedGRN, setRelatedGRN] = useState(null);
  const [relatedBill, setRelatedBill] = useState(null);

  useEffect(() => {
    let resolvedPO = po;
    if (!resolvedPO && poId) {
      resolvedPO = procurementService.getPurchaseOrderById(poId);
    }
    setCurrentPO(resolvedPO);

    if (resolvedPO) {
      // Find vendor details
      if (resolvedPO.vendor_id) {
        vendorService.fetchVendors({}).then(res => {
          const vList = res?.data || [];
          const found = vList.find(v => String(v.id) === String(resolvedPO.vendor_id));
          if (found) setVendorDetails(found);
        }).catch(() => {});
      }

      // Find warehouse details
      if (resolvedPO.warehouse_id) {
        warehouseService.fetchWarehouses({}).then(res => {
          const wList = res?.data || [];
          const found = wList.find(w => String(w.id) === String(resolvedPO.warehouse_id));
          if (found) setWarehouseDetails(found);
        }).catch(() => {});
      }

      // Find linked GRN
      const allGRNs = procurementService.getGoodsReceivingNotes();
      const grn = allGRNs.find(g => g.po_number === resolvedPO.po_number);
      if (grn) setRelatedGRN(grn);

      // Find linked Bill
      const allBills = procurementService.getVendorBills();
      const bill = allBills.find(b => b.po_number === resolvedPO.po_number);
      if (bill) setRelatedBill(bill);
    }
  }, [po, poId]);

  if (!currentPO) {
    return (
      <div className="space-y-6 pb-12 animate-in fade-in duration-200">
        <div className="bg-white p-5 sm:p-6 rounded-none border border-neutral-300 shadow-2xs text-center space-y-4">
          <div className="w-16 h-16 bg-neutral-100 text-neutral-400 rounded-none flex items-center justify-center mx-auto border border-neutral-200">
            <Package size={32} />
          </div>
          <h2 className="text-xl font-sport font-black text-neutral-950 uppercase tracking-tight">
            Purchase Order Tidak Ditemukan
          </h2>
          <p className="text-xs text-neutral-500 max-w-md mx-auto">
            Dokumen PO yang Anda cari tidak tersedia dalam antrean pengadaan atau mungkin telah dihapus.
          </p>
          <button
            type="button"
            onClick={onNavigateBack}
            className="px-5 py-2.5 bg-neutral-950 hover:bg-neutral-800 text-white font-sport font-black text-xs uppercase tracking-wider rounded-none cursor-pointer transition-colors"
          >
            Kembali ke Antrean PO
          </button>
        </div>
      </div>
    );
  }

  const items = currentPO.items || [];
  const totalOrderedUnits = items.reduce((s, it) => s + (Number(it.ordered_quantity) || 0), 0);
  const totalReceivedUnits = items.reduce((s, it) => s + (Number(it.received_quantity) || 0), 0);
  const totalPendingUnits = Math.max(0, totalOrderedUnits - totalReceivedUnits);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'received':
        return {
          label: 'Barang Lengkap Diterima',
          className: 'bg-emerald-50 text-emerald-800 border-emerald-300',
          dot: 'bg-emerald-500'
        };
      case 'partially_received':
        return {
          label: 'Diterima Sebagian',
          className: 'bg-blue-50 text-blue-800 border-blue-300',
          dot: 'bg-blue-500'
        };
      case 'approved':
      case 'ordered':
      case 'sent':
        return {
          label: 'Pesanan Aktif / Dipesan',
          className: 'bg-amber-50 text-amber-800 border-amber-300',
          dot: 'bg-amber-500'
        };
      case 'cancelled':
        return {
          label: 'Dibatalkan',
          className: 'bg-rose-50 text-rose-800 border-rose-300',
          dot: 'bg-rose-500'
        };
      default:
        return {
          label: status || 'Draft',
          className: 'bg-neutral-100 text-neutral-700 border-neutral-300',
          dot: 'bg-neutral-400'
        };
    }
  };

  const statusInfo = getStatusBadge(currentPO.status);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Kartu Header Kanonis Halaman Detail */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-none border border-neutral-300 shadow-2xs">
        <div className="flex items-center gap-3">
          <IconButton
            icon={ArrowLeft}
            onClick={onNavigateBack}
            tooltip="Kembali ke Antrean PO"
            variant="outline"
          />
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-black font-sport uppercase tracking-tight text-neutral-950 leading-tight">
              {currentPO.po_number}
            </h1>
            <span className={`px-2.5 py-1 text-[11px] font-sport font-black uppercase tracking-wider rounded-none border flex items-center gap-1.5 ${statusInfo.className}`}>
              <span className={`w-2 h-2 rounded-none shrink-0 ${statusInfo.dot}`} />
              <span>{statusInfo.label}</span>
            </span>
          </div>
        </div>

        {/* Action Controls Icon-Only dengan Tooltip */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <IconButton
            icon={Printer}
            onClick={handlePrint}
            tooltip="Cetak Purchase Order"
            variant="secondary"
          />
          {['approved', 'ordered', 'sent', 'partially_received'].includes(currentPO.status) && onReceivePO && (
            <IconButton
              icon={PackageCheck}
              onClick={() => onReceivePO(currentPO)}
              tooltip="Terima Barang Fisik (GRN)"
              variant="primary"
            />
          )}
          {['draft', 'approved', 'ordered'].includes(currentPO.status) && onCancelPO && (
            <IconButton
              icon={XCircle}
              onClick={() => onCancelPO(currentPO)}
              tooltip="Batalkan Purchase Order"
              variant="danger"
            />
          )}
        </div>
      </div>

      {/* Grid KPI Metrik Pengadaan Kanonis (4 Kartu) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4">
        <div className="bg-white p-4 rounded-none border border-neutral-300 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-1.5">
            <span className="text-xs font-sport font-black uppercase tracking-wider">Total Belanja Modal</span>
            <TrendingUp size={16} className="text-neutral-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-black text-neutral-950 font-sport font-mono">
              {formatRupiah(currentPO.total_amount)}
            </span>
          </div>
          <div className="mt-2 text-[11px] border-t border-neutral-100 pt-1.5 text-neutral-500 font-medium">
            Komitmen anggaran pengadaan
          </div>
        </div>

        <div className="bg-white p-4 rounded-none border border-neutral-300 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-1.5">
            <span className="text-xs font-sport font-black uppercase tracking-wider">Total Kuantitas Pesan</span>
            <Boxes size={16} className="text-neutral-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-neutral-950 font-sport">{totalOrderedUnits}</span>
            <span className="text-[11px] font-mono font-bold text-neutral-400">Unit</span>
          </div>
          <div className="mt-2 text-[11px] border-t border-neutral-100 pt-1.5 text-neutral-500 font-medium">
            {items.length} varian SKU terpilih
          </div>
        </div>

        <div className="bg-white p-4 rounded-none border border-neutral-300 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-1.5">
            <span className="text-xs font-sport font-black uppercase tracking-wider">Fisik Diterima</span>
            <PackageCheck size={16} className="text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-700 font-sport">{totalReceivedUnits}</span>
            <span className="text-[11px] font-mono font-bold text-neutral-400">Unit</span>
          </div>
          <div className="mt-2 text-[11px] border-t border-neutral-100 pt-1.5 text-neutral-500 font-medium">
            Tercatat di kartu stok gudang
          </div>
        </div>

        <div className="bg-white p-4 rounded-none border border-neutral-300 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-1.5">
            <span className="text-xs font-sport font-black uppercase tracking-wider">Sisa Belum Diterima</span>
            <Clock size={16} className="text-amber-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-black font-sport ${totalPendingUnits > 0 ? 'text-amber-600' : 'text-neutral-950'}`}>
              {totalPendingUnits}
            </span>
            <span className="text-[11px] font-mono font-bold text-neutral-400">Unit</span>
          </div>
          <div className="mt-2 text-[11px] border-t border-neutral-100 pt-1.5 text-neutral-500 font-medium">
            Outstanding penerimaan vendor
          </div>
        </div>
      </div>

      {/* Grid Informasi Terstruktur: 3 Kartu Seksi Kanonis */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* Seksi 1: Profil Rekanan Vendor */}
        <div className="bg-white p-5 sm:p-6 border border-neutral-300 rounded-none shadow-2xs space-y-5">
          <h2 className="text-sm font-black font-sport text-neutral-950 uppercase tracking-wider flex items-center gap-2 border-b border-neutral-200 pb-3">
            <Building2 size={16} className="text-amber-500" />
            <span>1. Rekanan Vendor &amp; Syarat Dagang</span>
          </h2>

          <div className="space-y-3.5 text-xs">
            <div>
              <span className="text-neutral-500 font-sport font-bold uppercase block text-[11px]">Nama Perusahaan:</span>
              <span className="font-bold text-neutral-950 text-sm mt-0.5 block">{currentPO.vendor_name}</span>
              {vendorDetails?.code && (
                <span className="font-mono text-[11px] text-neutral-500">Kode: {vendorDetails.code}</span>
              )}
            </div>

            <div className="border-t border-neutral-100 pt-3">
              <span className="text-neutral-500 font-sport font-bold uppercase block text-[11px]">Narahubung / PIC:</span>
              <span className="text-neutral-900 font-medium">{vendorDetails?.contact_person || 'Divisi Sales & Distribusi'}</span>
            </div>

            <div className="border-t border-neutral-100 pt-3 flex items-center justify-between">
              <div>
                <span className="text-neutral-500 font-sport font-bold uppercase block text-[11px]">Kontak Telepon:</span>
                <span className="text-neutral-900 font-mono font-bold">{vendorDetails?.phone || '-'}</span>
              </div>
              <Phone size={14} className="text-neutral-400" />
            </div>

            <div className="border-t border-neutral-100 pt-3 flex items-center justify-between">
              <div>
                <span className="text-neutral-500 font-sport font-bold uppercase block text-[11px]">Email Resmi:</span>
                <span className="text-neutral-900 font-mono">{vendorDetails?.email || '-'}</span>
              </div>
              <Mail size={14} className="text-neutral-400" />
            </div>

            <div className="border-t border-neutral-100 pt-3">
              <span className="text-neutral-500 font-sport font-bold uppercase block text-[11px]">Syarat Pembayaran:</span>
              <span className="inline-block mt-1 px-2 py-0.5 bg-neutral-100 text-neutral-800 font-mono font-bold text-xs border border-neutral-300">
                Net {vendorDetails?.payment_terms_days || 30} Hari
              </span>
            </div>

            {vendorDetails?.bank_account_info && (
              <div className="border-t border-neutral-100 pt-3">
                <span className="text-neutral-500 font-sport font-bold uppercase block text-[11px]">Rekening Bank:</span>
                <span className="font-mono text-neutral-800 font-semibold">{vendorDetails.bank_account_info}</span>
              </div>
            )}
          </div>
        </div>

        {/* Seksi 2: Logistik & Gudang Penerima */}
        <div className="bg-white p-5 sm:p-6 border border-neutral-300 rounded-none shadow-2xs space-y-5">
          <h2 className="text-sm font-black font-sport text-neutral-950 uppercase tracking-wider flex items-center gap-2 border-b border-neutral-200 pb-3">
            <Warehouse size={16} className="text-amber-500" />
            <span>2. Gudang Penerima &amp; Jadwal</span>
          </h2>

          <div className="space-y-3.5 text-xs">
            <div>
              <span className="text-neutral-500 font-sport font-bold uppercase block text-[11px]">Gudang Tujuan:</span>
              <span className="font-bold text-neutral-950 text-sm mt-0.5 block">{currentPO.warehouse_name}</span>
              {warehouseDetails?.code && (
                <span className="font-mono text-[11px] text-neutral-500">Kode: {warehouseDetails.code}</span>
              )}
            </div>

            <div className="border-t border-neutral-100 pt-3">
              <span className="text-neutral-500 font-sport font-bold uppercase block text-[11px]">Alamat / Wilayah Simpan:</span>
              <span className="text-neutral-900 font-medium">
                {warehouseDetails?.address ? `${warehouseDetails.address}, ${warehouseDetails.city || ''}` : 'Fasilitas Pergudangan Utama'}
              </span>
            </div>

            <div className="border-t border-neutral-100 pt-3 flex items-center justify-between">
              <div>
                <span className="text-neutral-500 font-sport font-bold uppercase block text-[11px]">Tanggal Pemesanan:</span>
                <span className="text-neutral-900 font-mono font-bold">{currentPO.order_date || '-'}</span>
              </div>
              <Calendar size={14} className="text-neutral-400" />
            </div>

            <div className="border-t border-neutral-100 pt-3 flex items-center justify-between">
              <div>
                <span className="text-neutral-500 font-sport font-bold uppercase block text-[11px]">Perkiraan Tiba:</span>
                <span className="text-neutral-900 font-mono font-bold text-amber-700">{currentPO.expected_delivery_date || '-'}</span>
              </div>
              <Clock size={14} className="text-amber-500" />
            </div>

            <div className="border-t border-neutral-100 pt-3">
              <span className="text-neutral-500 font-sport font-bold uppercase block text-[11px]">Peran Hub Fasilitas:</span>
              <span className="inline-block mt-1 px-2 py-0.5 bg-neutral-950 text-amber-400 font-sport font-bold text-[11px] uppercase tracking-wider">
                {warehouseDetails?.is_primary ? 'Fasilitas Central Hub' : 'Fasilitas Satelit'}
              </span>
            </div>
          </div>
        </div>

        {/* Seksi 3: Alur Keterhubungan Dokumen (3-Way Matching Flow) */}
        <div className="bg-white p-5 sm:p-6 border border-neutral-300 rounded-none shadow-2xs space-y-5">
          <h2 className="text-sm font-black font-sport text-neutral-950 uppercase tracking-wider flex items-center gap-2 border-b border-neutral-200 pb-3">
            <FileCheck size={16} className="text-amber-500" />
            <span>3. Audit Dokumen 3-Way Match</span>
          </h2>

          <div className="space-y-3.5 text-xs">
            {/* Step 1: PO */}
            <div className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-none bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                <Check size={12} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-sport font-bold uppercase text-[11px] text-neutral-900">Purchase Order (PO)</span>
                  <span className="font-mono text-[11px] text-neutral-500">Langkah 1</span>
                </div>
                <span className="font-mono font-bold text-neutral-950 block">{currentPO.po_number}</span>
                <span className="text-[11px] text-neutral-500">Disahkan oleh Tim Pengadaan</span>
              </div>
            </div>

            {/* Step 2: GRN */}
            <div className="border-t border-neutral-100 pt-3 flex items-start gap-2.5">
              <div className={`w-5 h-5 rounded-none flex items-center justify-center shrink-0 mt-0.5 ${relatedGRN ? 'bg-emerald-600 text-white' : 'bg-neutral-200 text-neutral-500'}`}>
                {relatedGRN ? <Check size={12} /> : <Clock size={12} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-sport font-bold uppercase text-[11px] text-neutral-900">Penerimaan Fisik (GRN)</span>
                  <span className="font-mono text-[11px] text-neutral-500">Langkah 2</span>
                </div>
                {relatedGRN ? (
                  <>
                    <span className="font-mono font-bold text-emerald-700 block">{relatedGRN.grn_number}</span>
                    <span className="text-[11px] text-neutral-500">
                      Surat Jalan: {relatedGRN.delivery_order_number || '-'} ({relatedGRN.received_date})
                    </span>
                  </>
                ) : (
                  <span className="text-[11px] text-neutral-400 italic block mt-0.5">
                    Menunggu pengiriman fisik dari rekanan vendor
                  </span>
                )}
              </div>
            </div>

            {/* Step 3: Vendor Bill */}
            <div className="border-t border-neutral-100 pt-3 flex items-start gap-2.5">
              <div className={`w-5 h-5 rounded-none flex items-center justify-center shrink-0 mt-0.5 ${relatedBill ? 'bg-emerald-600 text-white' : 'bg-neutral-200 text-neutral-500'}`}>
                {relatedBill ? <Check size={12} /> : <Clock size={12} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-sport font-bold uppercase text-[11px] text-neutral-900">Faktur Tagihan (Bill)</span>
                  <span className="font-mono text-[11px] text-neutral-500">Langkah 3</span>
                </div>
                {relatedBill ? (
                  <>
                    <span className="font-mono font-bold text-neutral-950 block">{relatedBill.bill_number}</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`px-1.5 py-0.5 text-[10px] font-sport font-black uppercase rounded-none border ${relatedBill.status === 'paid' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-amber-50 text-amber-800 border-amber-300'}`}>
                        {relatedBill.status === 'paid' ? 'Lunas' : 'Belum Bayar'}
                      </span>
                      <span className="font-mono text-[11px] text-neutral-500">
                        Jatuh Tempo: {relatedBill.due_date}
                      </span>
                    </div>
                  </>
                ) : (
                  <span className="text-[11px] text-neutral-400 italic block mt-0.5">
                    Diterbitkan otomatis setelah fisik diterima di gudang
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Matriks Rincian Item & Varian Produk Kanonis */}
      <div className="bg-white p-5 sm:p-6 border border-neutral-300 rounded-none shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-200 pb-3">
          <h2 className="text-sm font-black font-sport text-neutral-950 uppercase tracking-wider flex items-center gap-2">
            <Boxes size={16} className="text-amber-500" />
            <span>Matriks Item &amp; Varian Produk Dipesan</span>
          </h2>
          <span className="text-xs font-mono font-bold text-neutral-500">
            {items.length} Baris SKU / {totalOrderedUnits} Total Unit
          </span>
        </div>

        <div className="overflow-x-auto border border-neutral-200 bg-white">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-100 text-[11px] font-sport font-black uppercase tracking-wider text-neutral-700">
                <th className="py-3 px-3.5">Produk &amp; Varian</th>
                <th className="py-3 px-3.5">Kode SKU</th>
                <th className="py-3 px-3.5 text-center">Dipesan</th>
                <th className="py-3 px-3.5 text-center">Diterima Fisik</th>
                <th className="py-3 px-3.5 text-center">Sisa Tertunda</th>
                <th className="py-3 px-3.5 text-right">HPP Pokok (Rp)</th>
                <th className="py-3 px-3.5 text-right">Subtotal Nilai</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 text-xs font-medium">
              {items.map((it, idx) => {
                const ordered = Number(it.ordered_quantity) || 0;
                const received = Number(it.received_quantity) || 0;
                const pending = Math.max(0, ordered - received);
                const unitPrice = Number(it.unit_price) || 0;
                const subtotal = Number(it.subtotal) || (ordered * unitPrice);

                return (
                  <tr key={it.id || idx} className="hover:bg-neutral-50/80 transition-colors">
                    <td className="py-3 px-3.5">
                      <div className="font-sport font-black text-xs text-neutral-950 uppercase leading-snug">
                        {it.product_name}
                      </div>
                      {it.variant_name && (
                        <div className="text-[11px] font-mono text-neutral-500 mt-0.5">
                          Varian: <span className="font-bold text-neutral-800">{it.variant_name}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3.5 font-mono text-neutral-800">
                      {it.sku || '-'}
                    </td>
                    <td className="py-3 px-3.5 text-center font-mono font-bold text-neutral-950">
                      {ordered}
                    </td>
                    <td className="py-3 px-3.5 text-center font-mono font-bold text-emerald-700">
                      {received}
                    </td>
                    <td className="py-3 px-3.5 text-center font-mono font-bold">
                      <span className={pending > 0 ? 'text-amber-600' : 'text-neutral-400'}>
                        {pending}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 text-right font-mono text-neutral-900">
                      {formatRupiah(unitPrice)}
                    </td>
                    <td className="py-3 px-3.5 text-right font-mono font-black text-neutral-950">
                      {formatRupiah(subtotal)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-neutral-50 border-t-2 border-neutral-300 font-sport font-black uppercase text-xs text-neutral-950">
                <td colSpan={2} className="py-3 px-3.5">
                  Total Rekapitulasi Pemesanan:
                </td>
                <td className="py-3 px-3.5 text-center font-mono font-black">
                  {totalOrderedUnits}
                </td>
                <td className="py-3 px-3.5 text-center font-mono font-black text-emerald-700">
                  {totalReceivedUnits}
                </td>
                <td className="py-3 px-3.5 text-center font-mono font-black text-amber-600">
                  {totalPendingUnits}
                </td>
                <td className="py-3 px-3.5 text-right text-neutral-500 font-bold">
                  Total Nilai PO:
                </td>
                <td className="py-3 px-3.5 text-right font-mono font-black text-sm text-neutral-950">
                  {formatRupiah(currentPO.total_amount)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Catatan / Instruksi Pengiriman Khusus Vendor */}
      <div className="bg-white p-5 sm:p-6 border border-neutral-300 rounded-none shadow-2xs space-y-3">
        <h2 className="text-sm font-black font-sport text-neutral-950 uppercase tracking-wider flex items-center gap-2 border-b border-neutral-200 pb-3">
          <FileText size={16} className="text-amber-500" />
          <span>Instruksi Khusus &amp; Catatan Pengiriman</span>
        </h2>
        <p className="text-xs text-neutral-700 leading-relaxed font-mono whitespace-pre-line bg-neutral-50 p-4 border border-neutral-200">
          {currentPO.notes ? currentPO.notes : 'Tidak ada catatan atau instruksi khusus dari tim pengadaan.'}
        </p>
      </div>
    </div>
  );
}
