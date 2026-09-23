import React, { useState } from 'react';
import {
  ArrowLeft,
  Receipt,
  Printer,
  CreditCard,
  Building2,
  FileText,
  Calendar,
  Wallet,
  PackageCheck,
  ShieldCheck
} from 'lucide-react';
import IconButton from './atoms/IconButton';
import ConfirmationModal from './ConfirmationModal';
import { formatRupiah } from '../utils/formatters';
import { procurementService } from '../services/procurementService';

export default function VendorBillDetailPage({
  bill = null,
  onNavigateBack = () => {},
  onShowToast = () => {}
}) {
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentBill, setCurrentBill] = useState(bill);

  if (!currentBill) {
    return (
      <div className="space-y-6 pb-12 animate-in fade-in duration-200">
        <div className="bg-white p-5 sm:p-6 rounded-none border border-neutral-300 shadow-2xs text-center space-y-4">
          <div className="w-16 h-16 bg-neutral-100 text-neutral-400 rounded-none flex items-center justify-center mx-auto border border-neutral-200">
            <Receipt size={32} />
          </div>
          <h2 className="text-xl font-sport font-black text-neutral-950 uppercase tracking-tight">
            Tagihan Tidak Ditemukan
          </h2>
          <p className="text-xs text-neutral-500 max-w-md mx-auto">
            Dokumen tagihan vendor yang Anda cari tidak tersedia.
          </p>
          <button
            type="button"
            onClick={onNavigateBack}
            className="px-5 py-2.5 bg-neutral-950 hover:bg-neutral-800 text-white font-sport font-black text-xs uppercase tracking-wider rounded-none cursor-pointer transition-colors"
          >
            Kembali ke Daftar Tagihan
          </button>
        </div>
      </div>
    );
  }

  const isPaid = currentBill.status === 'paid';
  const outstanding = Math.max(0, (Number(currentBill.amount) || 0) - (Number(currentBill.paid_amount) || 0));

  const handleConfirmPay = async () => {
    setIsSubmitting(true);
    try {
      const updated = await procurementService.payVendorBill(currentBill.id);
      if (updated) setCurrentBill(updated);
      else setCurrentBill({ ...currentBill, status: 'paid', paid_amount: currentBill.amount });
      setIsPayModalOpen(false);
      onShowToast(`Pelunasan tagihan ${currentBill.bill_number} berhasil dicatat.`);
    } catch (err) {
      onShowToast(err.message || 'Gagal mencatat pelunasan tagihan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Kartu Header Kanonis Halaman Detail */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-none border border-neutral-300 shadow-2xs">
        <div className="flex items-center gap-3">
          <IconButton
            icon={ArrowLeft}
            onClick={onNavigateBack}
            tooltip="Kembali ke Daftar Tagihan"
            variant="outline"
          />
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-black font-sport uppercase tracking-tight text-neutral-950 leading-tight">
              {currentBill.bill_number}
            </h1>
            <span className={`px-2.5 py-1 text-[11px] font-sport font-black uppercase tracking-wider rounded-none border ${
              isPaid ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-amber-50 text-amber-800 border-amber-300'
            }`}>
              {isPaid ? 'Lunas' : 'Belum Bayar'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <IconButton
            icon={Printer}
            onClick={() => window.print()}
            tooltip="Cetak Tagihan Vendor"
            variant="secondary"
          />
          {!isPaid && (
            <IconButton
              icon={CreditCard}
              onClick={() => setIsPayModalOpen(true)}
              tooltip="Bayar Tagihan"
              variant="primary"
            />
          )}
        </div>
      </div>

      {/* Grid KPI Metrik Entitas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4">
        <div className="bg-white p-4 rounded-none border border-neutral-300 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-1.5">
            <span className="text-xs font-sport font-black uppercase tracking-wider">Nominal Tagihan</span>
            <Receipt size={16} className="text-neutral-500" />
          </div>
          <div className="text-lg sm:text-xl font-mono font-black text-neutral-950 truncate">
            {formatRupiah(currentBill.amount)}
          </div>
          <div className="mt-2 text-[11px] border-t border-neutral-100 pt-1.5 text-neutral-500 font-medium">
            Faktur hutang dagang vendor
          </div>
        </div>

        <div className="bg-white p-4 rounded-none border border-neutral-300 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-1.5">
            <span className="text-xs font-sport font-black uppercase tracking-wider">Telah Dibayar</span>
            <Wallet size={16} className="text-emerald-600" />
          </div>
          <div className="text-lg sm:text-xl font-mono font-black text-emerald-700 truncate">
            {formatRupiah(currentBill.paid_amount || 0)}
          </div>
          <div className="mt-2 text-[11px] border-t border-neutral-100 pt-1.5 text-neutral-500 font-medium">
            Realisasi pelunasan kas
          </div>
        </div>

        <div className="bg-white p-4 rounded-none border border-neutral-300 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-1.5">
            <span className="text-xs font-sport font-black uppercase tracking-wider">Sisa Kewajiban</span>
            <CreditCard size={16} className="text-amber-600" />
          </div>
          <div className={`text-lg sm:text-xl font-mono font-black truncate ${outstanding > 0 ? 'text-amber-700' : 'text-neutral-950'}`}>
            {formatRupiah(outstanding)}
          </div>
          <div className="mt-2 text-[11px] border-t border-neutral-100 pt-1.5 text-neutral-500 font-medium">
            {outstanding > 0 ? 'Menunggu pelunasan' : 'Sudah lunas penuh'}
          </div>
        </div>

        <div className="bg-white p-4 rounded-none border border-neutral-300 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-1.5">
            <span className="text-xs font-sport font-black uppercase tracking-wider">Jatuh Tempo</span>
            <Calendar size={16} className="text-neutral-500" />
          </div>
          <div className="text-sm font-mono font-black text-neutral-950">
            {currentBill.due_date || '-'}
          </div>
          <div className="mt-2 text-[11px] border-t border-neutral-100 pt-1.5 text-neutral-500 font-medium">
            Tanggal faktur: {currentBill.bill_date || '-'}
          </div>
        </div>
      </div>

      {/* Grid Informasi Terstruktur */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        <div className="bg-white p-5 sm:p-6 border border-neutral-300 rounded-none shadow-2xs space-y-5">
          <h2 className="text-sm font-black font-sport text-neutral-950 uppercase tracking-wider flex items-center gap-2 border-b border-neutral-200 pb-3">
            <Building2 size={16} className="text-amber-500" />
            <span>1. Vendor Penerbit Faktur</span>
          </h2>
          <div className="space-y-3 text-xs">
            <div>
              <span className="text-neutral-500 block text-[11px] font-sport font-bold uppercase">Vendor / Supplier</span>
              <strong className="text-neutral-900">{currentBill.vendor_name || '-'}</strong>
            </div>
            <div>
              <span className="text-neutral-500 block text-[11px] font-sport font-bold uppercase">Status Pembayaran</span>
              <span className="text-neutral-800">{isPaid ? 'Lunas' : 'Belum Bayar'}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 sm:p-6 border border-neutral-300 rounded-none shadow-2xs space-y-5">
          <h2 className="text-sm font-black font-sport text-neutral-950 uppercase tracking-wider flex items-center gap-2 border-b border-neutral-200 pb-3">
            <FileText size={16} className="text-amber-500" />
            <span>2. Referensi Dokumen</span>
          </h2>
          <div className="space-y-3 text-xs">
            <div>
              <span className="text-neutral-500 block text-[11px] font-sport font-bold uppercase">Nomor Purchase Order</span>
              <span className="font-mono text-neutral-800">{currentBill.po_number || '-'}</span>
            </div>
            <div>
              <span className="text-neutral-500 block text-[11px] font-sport font-bold uppercase">Nomor GRN</span>
              <span className="font-mono text-neutral-800">{currentBill.grn_number || '-'}</span>
            </div>
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
              <span className="font-mono text-neutral-800">{currentBill.po_number || '-'}</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-neutral-500 font-sport font-bold uppercase text-[11px]">Penerimaan Barang</span>
              <span className="font-mono text-neutral-800">{currentBill.grn_number || '-'}</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-neutral-500 font-sport font-bold uppercase text-[11px]">Tagihan Vendor</span>
              <span className="font-mono text-neutral-800">{currentBill.bill_number}</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Modal Konfirmasi Pelunasan */}
      <ConfirmationModal
        isOpen={isPayModalOpen}
        onClose={() => setIsPayModalOpen(false)}
        onConfirm={handleConfirmPay}
        title="Konfirmasi Pelunasan Hutang"
        subtitle="Pencatatan pembayaran kas ke vendor."
        message={`Apakah Anda yakin ingin mencatat pelunasan penuh tagihan ${currentBill.bill_number} sebesar ${formatRupiah(currentBill.amount)}?`}
        confirmText="Konfirmasi Bayar"
        variant="info"
        isLoading={isSubmitting}
      />
    </div>
  );
}
