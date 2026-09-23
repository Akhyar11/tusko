import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Receipt,
  Printer,
  CreditCard,
  Building2,
  FileText,
  Calendar,
  Wallet,
  ShieldCheck,
  Boxes,
  Upload,
  Trash2,
  History,
  AlertCircle
} from 'lucide-react';
import IconButton from './atoms/IconButton';
import ConfirmationModal from './ConfirmationModal';
import TextInput from './molecules/TextInput';
import TextArea from './molecules/TextArea';
import FileInput from './molecules/FileInput';
import ServerSideSelect from './molecules/ServerSideSelect';
import { formatRupiah } from '../utils/formatters';
import { procurementService } from '../services/procurementService';

const PAYMENT_METHODS = [
  { value: 'Transfer Bank BCA', label: 'Transfer Bank BCA' },
  { value: 'Transfer Bank Mandiri', label: 'Transfer Bank Mandiri' },
  { value: 'Transfer Bank BNI', label: 'Transfer Bank BNI' },
  { value: 'Transfer Bank BRI', label: 'Transfer Bank BRI' },
  { value: 'Tunai', label: 'Tunai / Kas Toko' },
  { value: 'Cek / Giro', label: 'Cek / Giro' },
  { value: 'Virtual Account', label: 'Virtual Account' },
  { value: 'Lainnya', label: 'Lainnya' }
];

export default function VendorBillDetailPage({
  bill = null,
  initialPayMode = false,
  onNavigateBack = () => {},
  onShowToast = () => {}
}) {
  const [currentBill, setCurrentBill] = useState(bill);
  const [isLoading, setIsLoading] = useState(false);
  const [isPayOpen, setIsPayOpen] = useState(Boolean(initialPayMode));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [voidPayment, setVoidPayment] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Payment form state
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState(PAYMENT_METHODS[0].value);
  const [payDate, setPayDate] = useState(new Date().toISOString().slice(0, 10));
  const [payReference, setPayReference] = useState('');
  const [payNotes, setPayNotes] = useState('');
  const [payProof, setPayProof] = useState(null);

  const loadBill = async () => {
    if (!bill?.id) return;
    setIsLoading(true);
    try {
      const data = await procurementService.getVendorBillById(bill.id);
      if (data) setCurrentBill(data);
    } catch (err) {
      // fallback: gunakan data dari prop
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBill();
  }, [bill?.id]);

  const outstanding = useMemo(() => {
    if (!currentBill) return 0;
    return Math.max(0, (Number(currentBill.amount) || 0) - (Number(currentBill.paid_amount) || 0));
  }, [currentBill]);

  const items = currentBill?.items || [];
  const payments = currentBill?.payments || [];
  const isPaid = currentBill?.status === 'paid';

  useEffect(() => {
    if (isPayOpen && currentBill) {
      setPayAmount(String(outstanding));
    }
  }, [isPayOpen, currentBill?.id]);

  const resetPayForm = () => {
    setPayAmount(String(outstanding));
    setPayMethod(PAYMENT_METHODS[0].value);
    setPayDate(new Date().toISOString().slice(0, 10));
    setPayReference('');
    setPayNotes('');
    setPayProof(null);
    setErrorMessage('');
  };

  const handleSubmitPayment = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setErrorMessage('');

    const amount = Number(payAmount) || 0;
    if (amount <= 0) {
      setErrorMessage('Nominal pembayaran wajib lebih dari 0.');
      return;
    }
    if (amount > outstanding + 0.001) {
      setErrorMessage(`Nominal tidak boleh melebihi sisa hutang (${formatRupiah(outstanding)}).`);
      return;
    }
    if (!payProof) {
      setErrorMessage('Bukti pembayaran (foto/PDF) wajib diunggah.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await procurementService.createVendorBillPayment(currentBill.id, {
        amount,
        payment_method: payMethod,
        paid_at: payDate,
        reference_number: payReference,
        notes: payNotes,
        proof_file: payProof
      });
      if (result?.bill) setCurrentBill(result.bill);
      else await loadBill();
      setIsPayOpen(false);
      resetPayForm();
      onShowToast(`Pembayaran tagihan ${currentBill.bill_number} berhasil dicatat.`);
    } catch (err) {
      setErrorMessage(err.message || 'Gagal mencatat pembayaran.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmVoid = async () => {
    if (!voidPayment) return;
    setIsSubmitting(true);
    try {
      const updated = await procurementService.voidVendorBillPayment(currentBill.id, voidPayment.id);
      if (updated) setCurrentBill(updated);
      else await loadBill();
      setVoidPayment(null);
      onShowToast('Pembayaran berhasil dibatalkan.');
    } catch (err) {
      onShowToast(err.message || 'Gagal membatalkan pembayaran.', { type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

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

  const statusBadge = isPaid
    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
    : currentBill.status === 'partially_paid'
    ? 'bg-amber-50 text-amber-800 border-amber-300'
    : 'bg-rose-50 text-rose-800 border-rose-300';
  const statusLabel = isPaid ? 'Lunas' : currentBill.status === 'partially_paid' ? 'Dibayar Sebagian' : 'Belum Bayar';

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
            <span className={`px-2.5 py-1 text-[11px] font-sport font-black uppercase tracking-wider rounded-none border ${statusBadge}`}>
              {statusLabel}
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
              onClick={() => { resetPayForm(); setIsPayOpen(true); }}
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
            {payments.length} kali pembayaran
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

      {/* Panel Pembayaran Inline */}
      {isPayOpen && !isPaid && (
        <div className="bg-white p-5 sm:p-6 border border-neutral-300 rounded-none shadow-2xs space-y-5">
          <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
            <h2 className="text-sm font-black font-sport text-neutral-950 uppercase tracking-wider flex items-center gap-2">
              <CreditCard size={16} className="text-amber-500" />
              <span>Catat Pembayaran Tagihan</span>
              <span className="px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-sport font-black uppercase tracking-wider rounded-none">
                Sisa {formatRupiah(outstanding)}
              </span>
            </h2>
          </div>

          <form onSubmit={handleSubmitPayment} className="space-y-6">
            {errorMessage && (
              <div className="p-4 bg-rose-50 border-l-4 border-rose-600 text-rose-800 rounded-none flex items-center justify-between animate-in fade-in duration-150">
                <div className="flex items-center gap-2 text-xs font-sport font-bold uppercase">
                  <AlertCircle size={16} className="shrink-0 text-rose-600" />
                  <span>{errorMessage}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setErrorMessage('')}
                  className="cursor-pointer text-rose-600 hover:text-rose-800 shrink-0 ml-3"
                >
                  ✕
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                  Nominal Bayar (Rp) <span className="text-rose-500">*</span>
                </label>
                <TextInput
                  type="number"
                  min="1"
                  weight="mono"
                  value={payAmount}
                  onChange={setPayAmount}
                />
                <span className="text-[11px] text-neutral-500 mt-1 block">
                  Boleh sebagian (cicilan), maksimal {formatRupiah(outstanding)}.
                </span>
              </div>

              <div>
                <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                  Metode Pembayaran <span className="text-rose-500">*</span>
                </label>
                <ServerSideSelect
                  value={payMethod}
                  onChange={setPayMethod}
                  options={PAYMENT_METHODS}
                  placeholder="Pilih metode pembayaran..."
                />
              </div>

              <div>
                <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                  Tanggal Bayar <span className="text-rose-500">*</span>
                </label>
                <TextInput type="date" weight="mono" value={payDate} onChange={setPayDate} />
              </div>

              <div>
                <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                  Nomor Referensi
                </label>
                <TextInput
                  type="text"
                  weight="mono"
                  value={payReference}
                  onChange={setPayReference}
                  placeholder="No. transfer / cek / VA..."
                />
              </div>

              <div>
                <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                  Bukti Pembayaran (Foto/PDF) <span className="text-rose-500">*</span>
                </label>
                <FileInput accept="image/*,application/pdf" onChange={setPayProof}>
                  <div className="w-full min-h-[42px] px-3.5 py-2.5 bg-neutral-50 hover:bg-neutral-100 border border-dashed border-neutral-300 hover:border-amber-500 rounded-none flex items-center gap-2 cursor-pointer transition-colors">
                    <Upload size={15} className="text-neutral-500 shrink-0" />
                    <span className="text-xs font-medium text-neutral-700 truncate">
                      {payProof ? payProof.name : 'Pilih bukti transfer (JPG/PNG/PDF)...'}
                    </span>
                  </div>
                </FileInput>
              </div>

              <div>
                <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                  Catatan
                </label>
                <TextInput
                  type="text"
                  value={payNotes}
                  onChange={setPayNotes}
                  placeholder="Catatan pembayaran (opsional)..."
                />
              </div>
            </div>

            <div className="pt-3 border-t border-neutral-200 flex flex-col sm:flex-row gap-2 sm:justify-end">
              <button
                type="button"
                onClick={() => { setIsPayOpen(false); resetPayForm(); }}
                disabled={isSubmitting}
                className="w-full sm:w-auto px-4 py-2 bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 text-neutral-800 text-xs font-sport font-black uppercase tracking-wider transition-colors cursor-pointer rounded-none disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto px-4 py-2 bg-amber-400 hover:bg-amber-300 border border-amber-500 text-neutral-950 text-xs font-sport font-black uppercase tracking-wider transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer rounded-none disabled:opacity-50"
              >
                <CreditCard size={15} />
                <span>{isSubmitting ? 'Memproses...' : 'Simpan Pembayaran'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

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
              <span className="text-neutral-800">{statusLabel}</span>
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

      {/* Rincian Item Barang */}
      <div className="bg-white p-5 sm:p-6 border border-neutral-300 rounded-none shadow-2xs space-y-5">
        <h2 className="text-sm font-black font-sport text-neutral-950 uppercase tracking-wider flex items-center gap-2 border-b border-neutral-200 pb-3">
          <Boxes size={16} className="text-amber-500" />
          <span>Rincian Item Barang (dari GRN)</span>
        </h2>
        <div className="overflow-x-auto border border-neutral-200">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-100 text-[11px] font-sport font-black uppercase tracking-wider text-neutral-700">
                <th className="py-2.5 px-3 min-w-[220px]">Produk &amp; SKU</th>
                <th className="py-2.5 px-3 w-24 text-center">Diterima</th>
                <th className="py-2.5 px-3 w-24 text-center">Ditolak</th>
                <th className="py-2.5 px-3 w-36 text-right">Harga Satuan</th>
                <th className="py-2.5 px-3 w-40 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 text-xs">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-4 px-3 text-center text-neutral-500">
                    Tidak ada rincian item.
                  </td>
                </tr>
              ) : (
                items.map((it, idx) => (
                  <tr key={it.id || idx} className="hover:bg-neutral-50/80 transition-colors">
                    <td className="py-2 px-3">
                      <div className="font-sport font-black text-xs text-neutral-950 uppercase leading-snug">
                        {it.product_name || '-'}
                      </div>
                      <div className="font-mono text-[10px] text-neutral-500 mt-0.5">
                        {it.variant_name ? `${it.variant_name} • ` : ''}{it.sku || '-'}
                      </div>
                    </td>
                    <td className="py-2 px-3 text-center font-mono font-bold text-emerald-700">
                      +{Number(it.accepted_quantity) || 0}
                    </td>
                    <td className="py-2 px-3 text-center font-mono font-bold text-rose-600">
                      {Number(it.rejected_quantity) > 0 ? `-${it.rejected_quantity}` : '0'}
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-neutral-700">
                      {formatRupiah(it.unit_cost || 0)}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-black text-neutral-950">
                      {formatRupiah(it.subtotal || 0)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bukti Invoice Vendor */}
      <div className="bg-white p-5 sm:p-6 border border-neutral-300 rounded-none shadow-2xs space-y-5">
        <h2 className="text-sm font-black font-sport text-neutral-950 uppercase tracking-wider flex items-center gap-2 border-b border-neutral-200 pb-3">
          <FileText size={16} className="text-amber-500" />
          <span>Bukti Invoice Vendor</span>
        </h2>
        {currentBill.invoice_file_url ? (
          currentBill.invoice_file_mime && currentBill.invoice_file_mime.startsWith('image/') ? (
            <a href={currentBill.invoice_file_url} target="_blank" rel="noreferrer" className="inline-block">
              <img
                src={currentBill.invoice_file_url}
                alt={currentBill.invoice_file_name || 'Bukti Invoice Vendor'}
                className="max-h-96 w-auto rounded-none border border-neutral-200 bg-neutral-50"
              />
            </a>
          ) : (
            <a
              href={currentBill.invoice_file_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-xs font-sport font-black uppercase tracking-wider text-amber-700 hover:text-amber-800 transition-colors"
            >
              <FileText size={15} />
              <span>Lihat Invoice ({currentBill.invoice_file_name || 'Dokumen PDF'})</span>
            </a>
          )
        ) : (
          <p className="text-xs text-neutral-500 italic">Belum ada bukti invoice terlampir pada tagihan ini.</p>
        )}
      </div>

      {/* Riwayat Pembayaran */}
      <div className="bg-white p-5 sm:p-6 border border-neutral-300 rounded-none shadow-2xs space-y-5">
        <h2 className="text-sm font-black font-sport text-neutral-950 uppercase tracking-wider flex items-center gap-2 border-b border-neutral-200 pb-3">
          <History size={16} className="text-amber-500" />
          <span>Riwayat Pembayaran</span>
        </h2>
        {payments.length === 0 ? (
          <p className="text-xs text-neutral-500 italic">Belum ada pembayaran tercatat untuk tagihan ini.</p>
        ) : (
          <div className="overflow-x-auto border border-neutral-200">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-100 text-[11px] font-sport font-black uppercase tracking-wider text-neutral-700">
                  <th className="py-2.5 px-3 min-w-[120px]">Tanggal</th>
                  <th className="py-2.5 px-3 w-40">Metode</th>
                  <th className="py-2.5 px-3 min-w-[140px]">Referensi</th>
                  <th className="py-2.5 px-3 w-40 text-right">Nominal</th>
                  <th className="py-2.5 px-3 w-28 text-center">Bukti</th>
                  <th className="py-2.5 px-3 w-20 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 text-xs">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-neutral-50/80 transition-colors">
                    <td className="py-2 px-3 font-mono text-neutral-700">{p.paid_at || '-'}</td>
                    <td className="py-2 px-3 text-neutral-800">{p.payment_method || '-'}</td>
                    <td className="py-2 px-3 font-mono text-neutral-700">{p.reference_number || '-'}</td>
                    <td className="py-2 px-3 text-right font-mono font-black text-neutral-950">
                      {formatRupiah(p.amount || 0)}
                    </td>
                    <td className="py-2 px-3 text-center">
                      {p.proof_file_url ? (
                        <a
                          href={p.proof_file_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] font-sport font-black uppercase text-amber-700 hover:text-amber-800"
                        >
                          Lihat
                        </a>
                      ) : (
                        <span className="text-neutral-400">-</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => setVoidPayment(p)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 rounded-none transition-colors cursor-pointer"
                        title="Batalkan Pembayaran"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Konfirmasi Void Pembayaran */}
      <ConfirmationModal
        isOpen={Boolean(voidPayment)}
        onClose={() => setVoidPayment(null)}
        onConfirm={handleConfirmVoid}
        title="Batalkan Pembayaran"
        subtitle="Tindakan ini akan menghapus catatan pembayaran & transaksi kas terkait."
        message={`Apakah Anda yakin ingin membatalkan pembayaran sebesar ${formatRupiah(voidPayment?.amount || 0)} (${voidPayment?.payment_method || '-'})?`}
        confirmText="Batalkan Pembayaran"
        variant="danger"
        isLoading={isSubmitting}
      />
    </div>
  );
}
