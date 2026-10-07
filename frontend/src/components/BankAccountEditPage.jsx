import React, { useState, useEffect } from 'react';
import { 
  Landmark, 
  ArrowLeft, 
  Save, 
  X,
  AlertCircle,
  CreditCard,
  BookOpen,
  Info,
  CheckCircle2,
  Wallet,
  Loader2,
  ArrowUpRight
} from 'lucide-react';
import { financialAccountService } from '../services/financialAccountService';
import { apiClient } from '../services/apiClient';
import { formatRupiah } from '../utils/formatters';
import FormTipsPanel from './organisms/FormTipsPanel';
import IconButton from './atoms/IconButton';
import TextInput from './molecules/TextInput';
import TextArea from './molecules/TextArea';
import Checkbox from './molecules/Checkbox';
import ServerSideSelect from './molecules/ServerSideSelect';
import CapitalDepositModal from './organisms/CapitalDepositModal';

const COMMON_BANKS = [
  { value: 'BCA', label: 'BCA (Bank Central Asia)' },
  { value: 'Bank Mandiri', label: 'Bank Mandiri' },
  { value: 'BRI', label: 'BRI (Bank Rakyat Indonesia)' },
  { value: 'BNI', label: 'BNI (Bank Negara Indonesia)' },
  { value: 'BSI', label: 'BSI (Bank Syariah Indonesia)' },
  { value: 'CIMB Niaga', label: 'CIMB Niaga' },
  { value: 'Permata Bank', label: 'Permata Bank' },
  { value: 'Bank Danamon', label: 'Bank Danamon' },
  { value: 'Bank Lainnya', label: 'Bank Lainnya' },
];

export default function BankAccountEditPage({
  accountId = null,
  onNavigateBack = () => {},
  onShowToast = () => {}
}) {
  const [formData, setFormData] = useState({
    account_name: '',
    bank_name: 'BCA',
    account_number: '',
    account_holder: '',
    chart_of_account_id: '',
    notes: '',
    is_active: true
  });
  const [rawAccount, setRawAccount] = useState(null);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [coaOptions, setCoaOptions] = useState([]);
  const [bankOptions, setBankOptions] = useState(COMMON_BANKS);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const effectiveAccountId = accountId || (typeof window !== 'undefined' ? window.location.pathname.match(/\/admin\/bank-accounts\/([^/]+)\/edit/)?.[1] : null);

  useEffect(() => {
    let isMounted = true;

    // Muat opsi Bank
    apiClient.get('/api/banks?all=true')
      .then(res => {
        if (!isMounted) return;
        const list = Array.isArray(res.data) ? res.data : [];
        if (list.length > 0) {
          setBankOptions(list.map(b => ({
            value: b.name,
            label: b.name,
          })));
        }
      })
      .catch(() => {});

    // Muat opsi COA
    apiClient.get('/api/chart-of-accounts')
      .then(res => {
        if (!isMounted) return;
        const list = Array.isArray(res.data) ? res.data : [];
        const options = list
          .filter(c => c.account_type === 'asset' || c.account_code?.startsWith('12'))
          .map(c => ({
            value: String(c.id),
            label: `${c.account_code} - ${c.account_name}`
          }));
        setCoaOptions(options);
      })
      .catch(() => {});

    // Muat data akun bank
    if (effectiveAccountId) {
      financialAccountService.getAccount(effectiveAccountId)
        .then(res => {
          if (!isMounted || !res) return;
          setRawAccount(res);
          setFormData({
            account_name: res.account_name || '',
            bank_name: res.bank_name || 'BCA',
            account_number: res.account_number || '',
            account_holder: res.account_holder || '',
            chart_of_account_id: res.chart_of_account_id ? String(res.chart_of_account_id) : '',
            notes: res.notes || '',
            is_active: Boolean(res.is_active)
          });
          setCurrentBalance(parseFloat(res.current_balance) || 0);
        })
        .catch(err => {
          if (isMounted) setErrorMessage(err.message || 'Gagal memuat data rekening bank.');
        })
        .finally(() => {
          if (isMounted) setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }

    return () => { isMounted = false; };
  }, [effectiveAccountId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.account_name.trim()) {
      setErrorMessage('Nama akun rekening wajib diisi.');
      return;
    }
    if (!formData.bank_name.trim()) {
      setErrorMessage('Nama bank wajib diisi.');
      return;
    }
    if (!formData.account_number.trim()) {
      setErrorMessage('Nomor rekening bank wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const payload = {
        type: 'bank',
        account_name: formData.account_name.trim(),
        bank_name: formData.bank_name.trim(),
        account_number: formData.account_number.trim(),
        account_holder: formData.account_holder.trim() || null,
        chart_of_account_id: formData.chart_of_account_id ? parseInt(formData.chart_of_account_id, 10) : undefined,
        notes: formData.notes.trim() || null,
        is_active: formData.is_active
      };

      await financialAccountService.updateAccount(effectiveAccountId, payload);
      onShowToast(`Rekening bank "${payload.account_name}" berhasil diperbarui.`);
      onNavigateBack();
    } catch (err) {
      setErrorMessage(err.message || 'Gagal memperbarui rekening bank.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const tips = [
    {
      icon: Landmark,
      heading: 'Perubahan Rekening',
      text: 'Mengubah nama atau nomor rekening tidak akan mempengaruhi riwayat transaksi atau jurnal akuntansi yang telah dibukukan.'
    },
    {
      icon: Wallet,
      heading: 'Saldo Bank Terkini',
      text: 'Saldo bank bertambah saat ada penerimaan pembayaran order/modal dan berkurang saat pelunasan tagihan vendor atau transfer antar rekening.'
    },
    {
      icon: BookOpen,
      heading: 'Sinkronisasi COA',
      text: 'Pastikan rekening bank terpetakan ke akun COA Bank yang benar agar laporan laba rugi dan neraca saldo tetap valid.'
    },
    {
      icon: CheckCircle2,
      heading: 'Status Keaktifan',
      text: 'Rekening yang dinonaktifkan tidak akan muncul pada pilihan akun bayar di modul tagihan vendor atau formulir transaksi kas.'
    }
  ];

  if (isLoading) {
    return (
      <div className="bg-white p-12 border border-neutral-300 rounded-none shadow-2xs flex flex-col items-center justify-center space-y-3">
        <Loader2 className="animate-spin text-amber-500" size={32} />
        <span className="text-xs font-sport font-black uppercase text-neutral-600">
          Memuat Data Rekening Bank...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Header Form Kanonis */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-none border border-neutral-300 shadow-2xs">
        <div className="flex items-center gap-3">
          <IconButton icon={ArrowLeft} onClick={onNavigateBack} title="Kembali ke Daftar Rekening Bank" variant="outline" />
          <div>
            <h1 className="text-xl sm:text-2xl font-black font-sport uppercase tracking-tight text-neutral-950">
              Edit Master Rekening Bank
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <IconButton icon={X} onClick={onNavigateBack} title="Batal" variant="secondary" />
          <IconButton 
            icon={Save} 
            onClick={() => document.getElementById('bank-account-edit-form')?.requestSubmit()} 
            title="Simpan Perubahan" 
            variant="primary" 
          />
        </div>
      </div>

      {/* Grid Desktop 3/4 + 1/4 */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Form Utama */}
        <div className="bg-white border border-neutral-300 rounded-none shadow-xs p-6 sm:p-8 lg:col-span-3">
          <form id="bank-account-edit-form" onSubmit={handleSubmit} className="space-y-6">
            {errorMessage && (
              <div className="p-4 bg-rose-50 border-l-4 border-rose-600 text-rose-800 rounded-none flex items-center justify-between animate-in fade-in duration-150">
                <div className="flex items-center gap-3">
                  <AlertCircle size={16} className="text-rose-600 shrink-0" />
                  <span className="text-xs font-sport font-bold uppercase">{errorMessage}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setErrorMessage('')}
                  className="cursor-pointer text-rose-600 hover:text-rose-800 shrink-0"
                >
                  <X size={15} />
                </button>
              </div>
            )}

            {/* Banner Saldo Terkini & Aksi Setor Modal */}
            <div className="p-4 bg-neutral-50 border border-neutral-300 rounded-none flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-sport font-bold uppercase tracking-wider text-neutral-500 block">
                  Saldo Rekening Terkini
                </span>
                <span className="text-xl font-black font-sport text-neutral-950">
                  {formatRupiah(currentBalance)}
                </span>
                <span className="text-[11px] font-mono text-neutral-400 block mt-0.5">
                  Otomatis disinkronkan dari mutasi bayar vendor &amp; transaksi
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsDepositModalOpen(true)}
                className="px-3.5 py-2 bg-amber-400 hover:bg-amber-300 border border-amber-500 text-neutral-950 text-xs font-sport font-black uppercase tracking-wider rounded-none flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors shrink-0"
              >
                <ArrowUpRight size={15} />
                <span>Setor / Tambah Modal</span>
              </button>
            </div>

            {/* Bagian 1: Data Bank & Rekening */}
            <div className="space-y-4">
              <h2 className="text-sm font-black font-sport text-neutral-950 uppercase tracking-wider flex items-center gap-2 border-b border-neutral-200 pb-3">
                <Landmark size={16} className="text-amber-500" />
                <span>1. Data Pokok Rekening Bank</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                    Nama Akun Rekening <span className="text-rose-500">*</span>
                  </label>
                  <TextInput
                    value={formData.account_name}
                    onChange={(val) => setFormData(p => ({ ...p, account_name: val }))}
                    placeholder="Contoh: BCA Rekening Operasional Utama..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                    Nama Bank <span className="text-rose-500">*</span>
                  </label>
                  <ServerSideSelect
                    value={formData.bank_name}
                    onChange={(val) => setFormData(p => ({ ...p, bank_name: val }))}
                    options={bankOptions}
                    placeholder="Pilih bank penerbit..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                    Nomor Rekening <span className="text-rose-500">*</span>
                  </label>
                  <TextInput
                    weight="mono"
                    value={formData.account_number}
                    onChange={(val) => setFormData(p => ({ ...p, account_number: val }))}
                    placeholder="Contoh: 8012345678"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                    Nama Pemegang Rekening (Atas Nama)
                  </label>
                  <TextInput
                    value={formData.account_holder}
                    onChange={(val) => setFormData(p => ({ ...p, account_holder: val }))}
                    placeholder="Contoh: PT Tusko Niaga Atletik"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                    Mapping Bagan Akun (COA)
                  </label>
                  <ServerSideSelect
                    value={formData.chart_of_account_id}
                    onChange={(val) => setFormData(p => ({ ...p, chart_of_account_id: val }))}
                    options={coaOptions}
                    placeholder="Pilih bagan akun COA..."
                  />
                </div>
              </div>
            </div>

            {/* Bagian 2: Catatan & Status */}
            <div className="space-y-4">
              <h2 className="text-sm font-black font-sport text-neutral-950 uppercase tracking-wider flex items-center gap-2 border-b border-neutral-200 pb-3">
                <Info size={16} className="text-amber-500" />
                <span>2. Keterangan &amp; Status Operasional</span>
              </h2>

              <div>
                <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                  Catatan / Keterangan Tambahan
                </label>
                <TextArea
                  rows={3}
                  value={formData.notes}
                  onChange={(val) => setFormData(p => ({ ...p, notes: val }))}
                  placeholder="Catatan cabang bank, peruntukan giro/rekening..."
                />
              </div>

              <div className="pt-2">
                <Checkbox
                  checked={formData.is_active}
                  onChange={(checked) => setFormData(p => ({ ...p, is_active: checked }))}
                  label="Aktifkan Rekening Bank Ini (Siap Digunakan untuk Pembayaran &amp; Penerimaan)"
                />
              </div>
            </div>

            {/* Submit Action Buttons */}
            <div className="pt-4 border-t border-neutral-200 flex flex-col sm:flex-row gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto px-6 py-2.5 bg-amber-400 hover:bg-amber-300 border border-amber-500 text-neutral-950 text-xs font-sport font-black uppercase tracking-wider transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer rounded-none disabled:opacity-50"
              >
                <Save size={15} />
                <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
              </button>
              <button
                type="button"
                onClick={onNavigateBack}
                disabled={isSubmitting}
                className="w-full sm:w-auto px-6 py-2 bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 text-neutral-800 text-xs font-sport font-black uppercase tracking-wider transition-colors cursor-pointer rounded-none disabled:opacity-50"
              >
                Batal
              </button>
            </div>
          </form>
        </div>

        {/* Panel Tips */}
        <FormTipsPanel
          title="Panduan Rekening Bank"
          tips={tips}
          className="lg:col-span-1"
        />
      </div>

      {/* Modal Setor / Tambah Modal */}
      <CapitalDepositModal
        isOpen={isDepositModalOpen}
        onClose={() => setIsDepositModalOpen(false)}
        account={rawAccount ? { ...rawAccount, current_balance: currentBalance } : null}
        onSuccess={() => {
          if (effectiveAccountId) {
            financialAccountService.getAccount(effectiveAccountId).then(res => {
              if (res) {
                setRawAccount(res);
                setCurrentBalance(parseFloat(res.current_balance) || 0);
              }
            });
          }
        }}
        onShowToast={onShowToast}
      />
    </div>
  );
}
