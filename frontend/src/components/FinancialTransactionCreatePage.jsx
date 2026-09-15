import React, { useState } from 'react';
import { 
  Receipt, 
  ArrowLeft, 
  Check, 
  Save, 
  X,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  CreditCard,
  FileText
} from 'lucide-react';
import IconButton from './atoms/IconButton';
import { 
  transactionCategories, 
  mockFinancialAccounts 
} from '../data/mockTransactions';
import FormTipsPanel from './organisms/FormTipsPanel';
import ServerSideSelect from './molecules/ServerSideSelect';
import TextInput from './molecules/TextInput';
import TextArea from './molecules/TextArea';
import { formatRupiah } from '../utils/formatters';

export default function FinancialTransactionCreatePage({
  financialAccounts = mockFinancialAccounts,
  onAddTransaction = () => {},
  onNavigateBack = () => {},
  onShowToast = () => {}
}) {
  const [formType, setFormType] = useState('expense');
  const [formCategory, setFormCategory] = useState('operational');
  const [formAmount, setFormAmount] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPaymentMethod, setFormPaymentMethod] = useState(
    financialAccounts[0]?.name ? `${financialAccounts[0].name} (${financialAccounts[0].account_number})` : 'BCA Bisnis Transfer'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const amountNum = Number(formAmount);
    if (!formAmount || isNaN(amountNum) || amountNum <= 0) {
      setErrorMessage('Nominal transaksi harus berupa angka lebih besar dari Rp 0.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const matchedCat = transactionCategories.find((c) => c.id === formCategory);
      const newTx = {
        id: Date.now(),
        transaction_number: `TRX/${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}/${formType === 'income' ? 'IN' : 'EX'}-${Math.floor(1000 + Math.random() * 9000)}`,
        order_id: null,
        order_number: null,
        type: formType,
        category: formCategory,
        category_label: matchedCat?.label || 'Manual Record',
        amount: amountNum,
        description: formDescription.trim() || `Catatan manual ${matchedCat?.label || ''}`,
        payment_method: formPaymentMethod,
        status: 'settled',
        created_at: new Date().toISOString(),
        customer_name: formType === 'income' ? 'Pelanggan Walk-In / Tunai' : 'Pengeluaran Toko'
      };

      if (onAddTransaction) {
        onAddTransaction(newTx);
      }
      onShowToast(`Berhasil mencatat transaksi ${newTx.transaction_number}!`);
      onNavigateBack();
    } catch (err) {
      setErrorMessage(err.message || 'Gagal menyimpan transaksi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-none border border-neutral-300 shadow-2xs">
        <div className="flex items-center gap-3">
          <IconButton icon={ArrowLeft} onClick={onNavigateBack} title="Kembali ke Buku Kas" variant="outline" />
          <div>
            <h1 className="text-xl sm:text-2xl font-black font-sport uppercase tracking-tight text-neutral-950">Catat Transaksi Kas Baru</h1>
          </div>
        </div>
        {/* Header Action Buttons (Icon-Only with Tooltip) */}
        <div className="flex items-center gap-2">
          <IconButton icon={X} onClick={onNavigateBack} title="Batal" variant="secondary" />
          <IconButton icon={Save} onClick={() => document.getElementById('transaction-form')?.requestSubmit()} title="Simpan Transaksi Kas" variant="primary" />
        </div>
      </div>

      {/* Konten Form + Tips */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
      {/* Form Card */}
      <div className="bg-white border border-neutral-300 rounded-none shadow-xs p-6 sm:p-8 lg:col-span-3">
        <form id="transaction-form" onSubmit={handleSubmit} className="space-y-6">
          {errorMessage && (
            <div className="p-4 bg-rose-50 border-l-4 border-rose-600 text-rose-800 rounded-none flex items-center justify-between animate-in fade-in duration-150">
              <div className="flex items-center gap-2 text-xs font-sport font-bold uppercase">
                <AlertCircle size={16} className="shrink-0 text-rose-600" />
                <span>{errorMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setErrorMessage('')}
                className="text-rose-600 hover:text-rose-800 cursor-pointer shrink-0"
                aria-label="Tutup pesan error"
              >
                ✕
              </button>
            </div>
          )}

          {/* Arah Aliran Kas */}
          <div>
            <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-2">
              Arah Aliran Kas <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormType('income')}
                className={`py-3 px-4 text-xs font-sport font-black uppercase tracking-wider rounded-none border cursor-pointer transition-colors flex items-center justify-center gap-2 ${
                  formType === 'income'
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                    : 'bg-neutral-50 text-neutral-700 border-neutral-300 hover:bg-neutral-100'
                }`}
              >
                <TrendingUp size={16} />
                <span>+ Kas Masuk (Income)</span>
              </button>

              <button
                type="button"
                onClick={() => setFormType('expense')}
                className={`py-3 px-4 text-xs font-sport font-black uppercase tracking-wider rounded-none border cursor-pointer transition-colors flex items-center justify-center gap-2 ${
                  formType === 'expense'
                    ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
                    : 'bg-neutral-50 text-neutral-700 border-neutral-300 hover:bg-neutral-100'
                }`}
              >
                <TrendingDown size={16} />
                <span>- Kas Keluar (Expense)</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Kategori Transaksi */}
            <div>
              <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                Kategori Transaksi <span className="text-rose-500">*</span>
              </label>
              <ServerSideSelect
                value={formCategory}
                onChange={(val) => setFormCategory(val)}
                options={transactionCategories.map((c) => ({ value: c.id, label: c.label }))}
                placeholder="Pilih kategori transaksi..."
              />
            </div>

            {/* Nominal */}
            <div>
              <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                Nominal Transaksi (Rp) <span className="text-rose-500">*</span>
              </label>
              <TextInput
                type="number"
                required
                min="1000"
                weight="mono"
                value={formAmount}
                onChange={setFormAmount}
                placeholder="Contoh: 150000"
              />
            </div>
          </div>

          {/* Rekening Pembayaran / Kas */}
          <div>
            <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
              Rekening Sumber / Tujuan Kas <span className="text-rose-500">*</span>
            </label>
            <ServerSideSelect
              value={formPaymentMethod}
              onChange={(val) => setFormPaymentMethod(val)}
              options={financialAccounts.map((acc) => ({
                value: `${acc.name} (${acc.account_number})`,
                label: `${acc.name} (${acc.account_number}) — Saldo ${formatRupiah(acc.balance)}`
              }))}
              placeholder="Pilih rekening sumber kas..."
            />
          </div>

          {/* Keterangan / Memo */}
          <div>
            <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
              Keterangan / Memo Rincian Transaksi
            </label>
            <TextArea
              rows={3}
              value={formDescription}
              onChange={setFormDescription}
              placeholder="Contoh: Biaya packing lakban & bubble wrap pengiriman batch 4..."
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-neutral-200 space-y-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 border border-amber-500 text-neutral-950 text-xs font-sport font-black uppercase tracking-wider transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer rounded-none"
            >
              <Save size={15} />
              <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Transaksi'}</span>
            </button>

            <button
              type="button"
              onClick={onNavigateBack}
              disabled={isSubmitting}
              className="w-full py-2 bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 text-neutral-800 text-xs font-sport font-black uppercase tracking-wider transition-colors cursor-pointer rounded-none"
            >
              Batal
            </button>
          </div>
        </form>
      </div>

        <FormTipsPanel
          className="lg:col-span-1"
          title="Panduan Kas"
          tips={[
            { icon: TrendingUp, heading: 'Income vs Expense', text: 'Pilih kas masuk untuk pemasukan penjualan, dan kas keluar untuk belanja operasional seperti packing atau gaji.' },
            { icon: FileText, heading: 'Kategori Tepat', text: 'Sesuaikan kategori dengan jenis transaksi agar laporan buku kas mudah dibaca dan diaudit.' },
            { icon: CreditCard, heading: 'Rekening Kas', text: 'Pilih rekening sumber atau tujuan dana yang benar supaya saldo tiap akun tetap akurat.' },
            { icon: Receipt, heading: 'Nominal Valid', text: 'Isi nominal lebih dari Rp 0; nomor referensi TRX dibuat otomatis saat transaksi disimpan.' },
            { icon: Check, heading: 'Memo Jelas', text: 'Tulis keterangan singkat seperti keperluan dan batch pengiriman agar mudah dilacak kemudian.' },
          ]}
        />
      </div>
    </div>
  );
}
