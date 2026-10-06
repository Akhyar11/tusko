import React, { useState, useEffect } from 'react';
import { 
  Coins, 
  ArrowLeft, 
  Save, 
  X,
  AlertCircle,
  Wallet,
  BookOpen,
  Info,
  CheckCircle2,
  Scale
} from 'lucide-react';
import { financialAccountService } from '../services/financialAccountService';
import { apiClient } from '../services/apiClient';
import FormTipsPanel from './organisms/FormTipsPanel';
import IconButton from './atoms/IconButton';
import TextInput from './molecules/TextInput';
import TextArea from './molecules/TextArea';
import Checkbox from './molecules/Checkbox';
import ServerSideSelect from './molecules/ServerSideSelect';

export default function CashAccountCreatePage({
  onNavigateBack = () => {},
  onShowToast = () => {}
}) {
  const [formData, setFormData] = useState({
    account_name: '',
    opening_balance: '',
    chart_of_account_id: '',
    notes: '',
    is_active: true
  });

  const [coaOptions, setCoaOptions] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Muat opsi COA bertipe asset (Kas)
  useEffect(() => {
    let isMounted = true;
    apiClient.get('/api/chart-of-accounts')
      .then(res => {
        if (!isMounted) return;
        const list = Array.isArray(res.data) ? res.data : [];
        const options = list
          .filter(c => c.account_type === 'asset' || c.account_code?.startsWith('11'))
          .map(c => ({
            value: String(c.id),
            label: `${c.account_code} - ${c.account_name}`
          }));
        setCoaOptions(options);

        // Auto pilih COA 1100 jika ada
        const defaultCashCoa = list.find(c => c.account_code === '1100');
        if (defaultCashCoa) {
          setFormData(prev => ({ ...prev, chart_of_account_id: String(defaultCashCoa.id) }));
        }
      })
      .catch(() => {});
    return () => { isMounted = false; };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.account_name.trim()) {
      setErrorMessage('Nama akun kas wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const payload = {
        type: 'cash',
        account_name: formData.account_name.trim(),
        opening_balance: formData.opening_balance ? parseFloat(formData.opening_balance) : 0,
        chart_of_account_id: formData.chart_of_account_id ? parseInt(formData.chart_of_account_id, 10) : undefined,
        notes: formData.notes.trim() || null,
        is_active: formData.is_active
      };

      await financialAccountService.createAccount(payload);
      onShowToast(`Akun kas "${payload.account_name}" berhasil ditambahkan.`);
      onNavigateBack();
    } catch (err) {
      setErrorMessage(err.message || 'Gagal menambahkan akun kas.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const tips = [
    {
      icon: Coins,
      heading: 'Identitas Kas Toko',
      text: 'Gunakan nama spesifik seperti "Kasir Utama Store 1", "Kas Kecil Operasional", atau "Brankas Toko".'
    },
    {
      icon: Scale,
      heading: 'Saldo Awal & Modal Toko',
      text: 'Mengisi Saldo Awal akan otomatis mencatat Setoran Modal Awal Pemilik ke Buku Kas dan memposting jurnal Debit Kas (1100) & Kredit Modal (3100).'
    },
    {
      icon: BookOpen,
      heading: 'Pemetaan COA',
      text: 'Akun kas terhubung ke Bagan Akun (COA 1100) agar seluruh laporan laba rugi, neraca saldo, dan arus kas selalu sinkron.'
    },
    {
      icon: CheckCircle2,
      heading: 'Status Operasional',
      text: 'Akun aktif dapat langsung dipilih pada transaksi pembayaran atau penerimaan kas tunai di toko.'
    }
  ];

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Header Form Kanonis */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-none border border-neutral-300 shadow-2xs">
        <div className="flex items-center gap-3">
          <IconButton icon={ArrowLeft} onClick={onNavigateBack} title="Kembali ke Daftar Kas Toko" variant="outline" />
          <div>
            <h1 className="text-xl sm:text-2xl font-black font-sport uppercase tracking-tight text-neutral-950">
              Tambah Master Kas Toko
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <IconButton icon={X} onClick={onNavigateBack} title="Batal" variant="secondary" />
          <IconButton 
            icon={Save} 
            onClick={() => document.getElementById('cash-account-form')?.requestSubmit()} 
            title="Simpan Akun Kas" 
            variant="primary" 
          />
        </div>
      </div>

      {/* Grid Desktop 3/4 + 1/4 */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Form Utama */}
        <div className="bg-white border border-neutral-300 rounded-none shadow-xs p-6 sm:p-8 lg:col-span-3">
          <form id="cash-account-form" onSubmit={handleSubmit} className="space-y-6">
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

            {/* Bagian 1: Data Utama Kas */}
            <div className="space-y-4">
              <h2 className="text-sm font-black font-sport text-neutral-950 uppercase tracking-wider flex items-center gap-2 border-b border-neutral-200 pb-3">
                <Coins size={16} className="text-amber-500" />
                <span>1. Data Pokok Kas Toko</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                    Nama Akun Kas <span className="text-rose-500">*</span>
                  </label>
                  <TextInput
                    value={formData.account_name}
                    onChange={(val) => setFormData(p => ({ ...p, account_name: val }))}
                    placeholder="Contoh: Kasir Utama Store 1, Kas Kecil Operasional..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                    Saldo Awal / Modal Awal (Rp)
                  </label>
                  <TextInput
                    type="number"
                    min="0"
                    step="1"
                    weight="mono"
                    value={formData.opening_balance}
                    onChange={(val) => setFormData(p => ({ ...p, opening_balance: val }))}
                    placeholder="0"
                  />
                  <span className="text-[11px] text-neutral-500 mt-1 block">
                    Bila diisi, sistem otomatis mencatat setoran modal awal pemilik.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                    Mapping Bagan Akun (COA)
                  </label>
                  <ServerSideSelect
                    value={formData.chart_of_account_id}
                    onChange={(val) => setFormData(p => ({ ...p, chart_of_account_id: val }))}
                    options={coaOptions}
                    placeholder="Pilih bagan akun COA..."
                  />
                  <span className="text-[11px] text-neutral-500 mt-1 block">
                    Standar Kas Toko dipetakan ke 1100 - Kas Toko &amp; Kasir.
                  </span>
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
                  placeholder="Catatan peruntukan kas, penanggung jawab kasir, dll..."
                />
              </div>

              <div className="pt-2">
                <Checkbox
                  checked={formData.is_active}
                  onChange={(checked) => setFormData(p => ({ ...p, is_active: checked }))}
                  label="Aktifkan Akun Kas Ini (Siap Digunakan untuk Transaksi Kasir/Operasional)"
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
                <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Akun Kas'}</span>
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
          title="Panduan Kas Toko"
          tips={tips}
          className="lg:col-span-1"
        />
      </div>
    </div>
  );
}
