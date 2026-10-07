import React, { useState } from 'react';
import { Landmark, Coins, ArrowUpRight, X, Save, AlertCircle } from 'lucide-react';
import TextInput from '../molecules/TextInput';
import TextArea from '../molecules/TextArea';
import { financialAccountService } from '../../services/financialAccountService';
import { formatRupiah } from '../../utils/formatters';

export default function CapitalDepositModal({
  isOpen = false,
  onClose = () => {},
  account = null,
  onSuccess = () => {},
  onShowToast = () => {}
}) {
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen || !account) return null;

  const currentBal = parseFloat(account.current_balance) || 0;
  const depositVal = parseFloat(amount) || 0;
  const projectedBal = currentBal + depositVal;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!depositVal || depositVal <= 0) {
      setErrorMessage('Nominal setoran modal harus lebih dari Rp 0.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage('');

      const res = await financialAccountService.depositCapital(account.id, {
        amount: depositVal,
        notes: notes.trim() || null,
        reference_number: referenceNumber.trim() || null,
      });

      onShowToast({
        type: 'success',
        message: res?.message || `Setoran modal ${formatRupiah(depositVal)} ke ${account.account_name} berhasil dicatat.`,
      });

      setAmount('');
      setNotes('');
      setReferenceNumber('');
      onSuccess();
      onClose();
    } catch (err) {
      setErrorMessage(err.message || 'Gagal mencatat setoran modal.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isBank = account.type === 'bank';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop overlay */}
      <div 
        className="fixed inset-0 bg-neutral-950/70 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg bg-white border border-neutral-300 shadow-2xl rounded-none z-10 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 bg-neutral-950 text-white flex items-center justify-between border-b border-neutral-800 rounded-none">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-neutral-900 border border-neutral-700 text-amber-400 flex items-center justify-center rounded-none font-black">
              {isBank ? <Landmark size={20} /> : <Coins size={20} />}
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black font-sport uppercase tracking-wider text-white flex items-center gap-2">
                <span>Setor / Tambah Modal</span>
                <span className="px-1.5 py-0.5 bg-amber-400 text-neutral-950 text-[10px] font-mono font-black rounded-none">
                  EKUITAS
                </span>
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                {account.account_name} {account.account_number ? `(${account.account_number})` : ''}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-900 rounded-none transition-colors cursor-pointer"
            title="Batal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border-l-4 border-rose-600 text-rose-800 rounded-none flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <AlertCircle size={15} className="text-rose-600 shrink-0" />
                <span className="text-xs font-sport font-bold uppercase">{errorMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setErrorMessage('')}
                className="text-rose-600 hover:text-rose-800"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* Saldo Simulation Card */}
          <div className="p-4 bg-neutral-50 border border-neutral-300 rounded-none space-y-3">
            <div className="flex items-center justify-between text-xs font-sport font-bold text-neutral-600 uppercase">
              <span>Saldo Saat Ini:</span>
              <span className="font-mono text-neutral-900 font-bold">{formatRupiah(currentBal)}</span>
            </div>
            <div className="flex items-center justify-between text-xs font-sport font-bold text-amber-600 uppercase">
              <span className="flex items-center gap-1">
                <ArrowUpRight size={13} />
                <span>Tambahan Modal Disetor:</span>
              </span>
              <span className="font-mono font-bold">+{formatRupiah(depositVal)}</span>
            </div>
            <div className="pt-2 border-t border-neutral-200 flex items-center justify-between text-xs font-sport font-black text-neutral-950 uppercase">
              <span>Proyeksi Saldo Akhir:</span>
              <span className="text-sm font-mono text-emerald-600 font-black">{formatRupiah(projectedBal)}</span>
            </div>
          </div>

          {/* Input Nominal Setoran */}
          <div>
            <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
              Nominal Setoran Modal (Rp) <span className="text-rose-500">*</span>
            </label>
            <TextInput
              type="number"
              min="1"
              step="1"
              value={amount}
              onChange={(val) => setAmount(val)}
              placeholder="Contoh: 10000000"
              required
              autoFocus
            />
            <span className="text-[11px] text-neutral-500 font-sans block mt-1">
              Nominal uang tunai atau transfer modal yang disetor pemilik ke rekening ini.
            </span>
          </div>

          {/* Input Referensi Bukti */}
          <div>
            <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
              Nomor Referensi Bukti / Kwitansi (Opsional)
            </label>
            <TextInput
              value={referenceNumber}
              onChange={(val) => setReferenceNumber(val)}
              placeholder="Contoh: BKT-MODAL-2026/001"
            />
          </div>

          {/* Input Catatan */}
          <div>
            <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
              Keterangan / Tujuan Modal
            </label>
            <TextArea
              rows={2}
              value={notes}
              onChange={(val) => setNotes(val)}
              placeholder="Contoh: Setoran modal tambahan untuk pengadaan stok awal bulan..."
            />
          </div>

          {/* Info Akuntansi */}
          <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-none text-[11px] text-amber-950 leading-relaxed font-sans">
            <strong>Pencatatan Otomatis:</strong> Sistem akan mencatat transaksi pemasukan kas/bank dan menjurnal otomatis: 
            <span className="font-mono font-bold block mt-0.5">
              • Debit: {account.chartOfAccount?.account_code || (isBank ? '1200' : '1100')} ({account.account_name})<br />
              • Kredit: 3100 (Modal Pemilik / Setoran Kas Pemilik)
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-2.5 px-4 bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 text-neutral-800 text-xs font-sport font-black uppercase tracking-wider rounded-none transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !depositVal}
              className="flex-1 py-2.5 px-4 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 disabled:cursor-not-allowed border border-amber-500 text-neutral-950 text-xs font-sport font-black uppercase tracking-wider flex items-center justify-center gap-2 rounded-none transition-all shadow-xs cursor-pointer"
            >
              <Save size={15} />
              <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Modal'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
