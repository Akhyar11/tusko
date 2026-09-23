import React from 'react';
import {
  ArrowLeft,
  PackageCheck,
  Printer,
  Building2,
  Truck,
  Boxes,
  Calendar,
  UserCheck,
  Package,
  PackageX,
  Wallet,
  ShieldCheck
} from 'lucide-react';
import IconButton from './atoms/IconButton';
import { formatRupiah } from '../utils/formatters';

export default function GoodsReceivingDetailPage({
  grn = null,
  onNavigateBack = () => {},
  onShowToast = () => {}
}) {
  if (!grn) {
    return (
      <div className="space-y-6 pb-12 animate-in fade-in duration-200">
        <div className="bg-white p-5 sm:p-6 rounded-none border border-neutral-300 shadow-2xs text-center space-y-4">
          <div className="w-16 h-16 bg-neutral-100 text-neutral-400 rounded-none flex items-center justify-center mx-auto border border-neutral-200">
            <Package size={32} />
          </div>
          <h2 className="text-xl font-sport font-black text-neutral-950 uppercase tracking-tight">
            Dokumen GRN Tidak Ditemukan
          </h2>
          <p className="text-xs text-neutral-500 max-w-md mx-auto">
            Dokumen penerimaan barang yang Anda cari tidak tersedia.
          </p>
          <button
            type="button"
            onClick={onNavigateBack}
            className="px-5 py-2.5 bg-neutral-950 hover:bg-neutral-800 text-white font-sport font-black text-xs uppercase tracking-wider rounded-none cursor-pointer transition-colors"
          >
            Kembali ke Daftar GRN
          </button>
        </div>
      </div>
    );
  }

  const items = grn.items || [];
  const totalAccepted = items.reduce((s, it) => s + (Number(it.accepted_quantity) || 0), 0);
  const totalRejected = items.reduce((s, it) => s + (Number(it.rejected_quantity) || 0), 0);
  const totalValue = items.reduce((s, it) => s + ((Number(it.accepted_quantity) || 0) * (Number(it.unit_cost) || 0)), 0);
  const isDiscrepancy = grn.status === 'discrepancy';

  const statusBadge = isDiscrepancy
    ? 'bg-rose-50 text-rose-800 border-rose-300'
    : 'bg-emerald-50 text-emerald-800 border-emerald-300';

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Kartu Header Kanonis Halaman Detail */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-none border border-neutral-300 shadow-2xs">
        <div className="flex items-center gap-3">
          <IconButton
            icon={ArrowLeft}
            onClick={onNavigateBack}
            tooltip="Kembali ke Daftar GRN"
            variant="outline"
          />
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-black font-sport uppercase tracking-tight text-neutral-950 leading-tight">
              {grn.grn_number}
            </h1>
            <span className={`px-2.5 py-1 text-[11px] font-sport font-black uppercase tracking-wider rounded-none border ${statusBadge}`}>
              {isDiscrepancy ? 'Ada Selisih' : 'Terverifikasi'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <IconButton
            icon={Printer}
            onClick={() => window.print()}
            tooltip="Cetak Dokumen GRN"
            variant="secondary"
          />
        </div>
      </div>

      {/* Grid KPI Metrik Entitas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4">
        <div className="bg-white p-4 rounded-none border border-neutral-300 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-1.5">
            <span className="text-xs font-sport font-black uppercase tracking-wider">Unit Diterima</span>
            <PackageCheck size={16} className="text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-700 font-sport">{totalAccepted}</span>
            <span className="text-[11px] font-mono font-bold text-neutral-400">Pcs</span>
          </div>
          <div className="mt-2 text-[11px] border-t border-neutral-100 pt-1.5 text-neutral-500 font-medium">
            Masuk ke kartu stok gudang
          </div>
        </div>

        <div className="bg-white p-4 rounded-none border border-neutral-300 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-1.5">
            <span className="text-xs font-sport font-black uppercase tracking-wider">Unit Ditolak</span>
            <PackageX size={16} className="text-rose-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-black font-sport ${totalRejected > 0 ? 'text-rose-700' : 'text-neutral-950'}`}>
              {totalRejected}
            </span>
            <span className="text-[11px] font-mono font-bold text-neutral-400">Pcs</span>
          </div>
          <div className="mt-2 text-[11px] border-t border-neutral-100 pt-1.5 text-neutral-500 font-medium">
            Rusak / hilang, tidak ditagih
          </div>
        </div>

        <div className="bg-white p-4 rounded-none border border-neutral-300 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-1.5">
            <span className="text-xs font-sport font-black uppercase tracking-wider">Nilai Diterima</span>
            <Wallet size={16} className="text-neutral-500" />
          </div>
          <div className="text-lg sm:text-xl font-mono font-black text-neutral-950 truncate">
            {formatRupiah(totalValue)}
          </div>
          <div className="mt-2 text-[11px] border-t border-neutral-100 pt-1.5 text-neutral-500 font-medium">
            Basis nilai tagihan vendor
          </div>
        </div>

        <div className="bg-white p-4 rounded-none border border-neutral-300 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-1.5">
            <span className="text-xs font-sport font-black uppercase tracking-wider">Tanggal Terima</span>
            <Calendar size={16} className="text-neutral-500" />
          </div>
          <div className="text-sm font-mono font-black text-neutral-950">
            {grn.received_date || '-'}
          </div>
          <div className="mt-2 text-[11px] border-t border-neutral-100 pt-1.5 text-neutral-500 font-medium">
            {items.length} varian SKU tercatat
          </div>
        </div>
      </div>

      {/* Grid Informasi Terstruktur */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        <div className="bg-white p-5 sm:p-6 border border-neutral-300 rounded-none shadow-2xs space-y-5">
          <h2 className="text-sm font-black font-sport text-neutral-950 uppercase tracking-wider flex items-center gap-2 border-b border-neutral-200 pb-3">
            <Building2 size={16} className="text-amber-500" />
            <span>1. Vendor &amp; Referensi Dokumen</span>
          </h2>
          <div className="space-y-3 text-xs">
            <div>
              <span className="text-neutral-500 block text-[11px] font-sport font-bold uppercase">Vendor / Supplier</span>
              <strong className="text-neutral-900">{grn.vendor_name || '-'}</strong>
            </div>
            <div>
              <span className="text-neutral-500 block text-[11px] font-sport font-bold uppercase">Referensi No. PO</span>
              <span className="font-mono text-neutral-800">{grn.po_number || '-'}</span>
            </div>
            <div>
              <span className="text-neutral-500 block text-[11px] font-sport font-bold uppercase">Nomor Surat Jalan (DO)</span>
              <span className="font-mono text-neutral-800">{grn.delivery_order_number || '-'}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 sm:p-6 border border-neutral-300 rounded-none shadow-2xs space-y-5">
          <h2 className="text-sm font-black font-sport text-neutral-950 uppercase tracking-wider flex items-center gap-2 border-b border-neutral-200 pb-3">
            <Truck size={16} className="text-amber-500" />
            <span>2. Gudang &amp; Petugas</span>
          </h2>
          <div className="space-y-3 text-xs">
            <div>
              <span className="text-neutral-500 block text-[11px] font-sport font-bold uppercase">Gudang Penerima</span>
              <strong className="text-neutral-900">{grn.warehouse_name || '-'}</strong>
            </div>
            <div>
              <span className="text-neutral-500 block text-[11px] font-sport font-bold uppercase">Petugas Penerima</span>
              <span className="text-neutral-800 flex items-center gap-1.5">
                <UserCheck size={13} className="text-neutral-400" />
                {grn.received_by || '-'}
              </span>
            </div>
            {grn.notes && (
              <div>
                <span className="text-neutral-500 block text-[11px] font-sport font-bold uppercase">Catatan</span>
                <span className="text-neutral-700 italic">{grn.notes}</span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-5 sm:p-6 border border-neutral-300 rounded-none shadow-2xs space-y-5">
          <h2 className="text-sm font-black font-sport text-neutral-950 uppercase tracking-wider flex items-center gap-2 border-b border-neutral-200 pb-3">
            <ShieldCheck size={16} className="text-amber-500" />
            <span>3. Alur Dokumen (3-Way Matching)</span>
          </h2>
          <ul className="space-y-3 text-xs">
            <li className="flex items-center justify-between">
              <span className="text-neutral-500 font-sport font-bold uppercase text-[11px]">Purchase Order</span>
              <span className="font-mono text-neutral-800">{grn.po_number || '-'}</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-neutral-500 font-sport font-bold uppercase text-[11px]">Penerimaan (GRN)</span>
              <span className="font-mono text-neutral-800">{grn.grn_number}</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-neutral-500 font-sport font-bold uppercase text-[11px]">Tagihan Vendor</span>
              <span className="font-sport font-black uppercase text-[11px] text-amber-700">Otomatis terbit</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Tabel Rincian Item */}
      <div className="bg-white p-5 sm:p-6 border border-neutral-300 rounded-none shadow-2xs space-y-5">
        <h2 className="text-sm font-black font-sport text-neutral-950 uppercase tracking-wider flex items-center gap-2 border-b border-neutral-200 pb-3">
          <Boxes size={16} className="text-amber-500" />
          <span>Rincian Item Fisik Diterima &amp; Ditolak</span>
        </h2>
        <div className="overflow-x-auto border border-neutral-200">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-100 text-[11px] font-sport font-black uppercase tracking-wider text-neutral-700">
                <th className="py-2.5 px-3 min-w-[220px]">Produk &amp; SKU</th>
                <th className="py-2.5 px-3 w-28 text-center">Diterima</th>
                <th className="py-2.5 px-3 w-28 text-center">Ditolak</th>
                <th className="py-2.5 px-3 min-w-[180px]">Alasan Penolakan</th>
                <th className="py-2.5 px-3 w-36 text-right">HPP Satuan</th>
                <th className="py-2.5 px-3 w-40 text-right">Nilai Diterima</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 text-xs">
              {items.map((it, idx) => (
                <tr key={it.id || idx} className="hover:bg-neutral-50/80 transition-colors">
                  <td className="py-2 px-3">
                    <div className="font-sport font-black text-xs text-neutral-950 uppercase leading-snug">
                      {it.product_name}
                    </div>
                    <div className="font-mono text-[10px] text-neutral-500 mt-0.5">{it.sku || '-'}</div>
                    {it.notes && (
                      <div className="text-[10px] text-emerald-700 mt-0.5 italic">Catatan QC: {it.notes}</div>
                    )}
                  </td>
                  <td className="py-2 px-3 text-center font-mono font-bold text-emerald-700">
                    +{Number(it.accepted_quantity) || 0}
                  </td>
                  <td className="py-2 px-3 text-center font-mono font-bold text-rose-600">
                    {Number(it.rejected_quantity) > 0 ? `-${it.rejected_quantity}` : '0'}
                  </td>
                  <td className="py-2 px-3 text-rose-600 italic text-[11px]">
                    {it.rejection_reason || '-'}
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-neutral-700">
                    {formatRupiah(it.unit_cost || 0)}
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-black text-neutral-950">
                    {formatRupiah((Number(it.accepted_quantity) || 0) * (Number(it.unit_cost) || 0))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
