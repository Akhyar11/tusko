import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Save, 
  X,
  AlertCircle,
  BookOpen,
  Info,
  Layers,
  Scale,
  ShieldCheck
} from 'lucide-react';
import { coaService } from '../services/coaService';
import FormTipsPanel from './organisms/FormTipsPanel';
import IconButton from './atoms/IconButton';
import TextInput from './molecules/TextInput';
import TextArea from './molecules/TextArea';
import Checkbox from './molecules/Checkbox';
import ServerSideSelect from './molecules/ServerSideSelect';

export default function ChartOfAccountEditPage({
  accountId = null,
  onNavigateBack = () => {},
  onShowToast = () => {}
}) {
  const [formData, setFormData] = useState({
    account_code: '',
    account_name: '',
    account_type: 'asset',
    description: '',
    is_active: true
  });
  const [isSystem, setIsSystem] = useState(false);
  const [ledgerCount, setLedgerCount] = useState(0);
  const [accountsCount, setAccountsCount] = useState(0);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const effectiveId = accountId || (typeof window !== 'undefined' ? window.location.pathname.match(/\/admin\/chart-of-accounts\/([^/]+)\/edit/)?.[1] : null);

  const typeOptions = [
    { value: 'asset', label: 'ASET (Kas, Bank, Piutang, Persediaan)' },
    { value: 'liability', label: 'LIABILITAS (Hutang Usaha, Kewajiban)' },
    { value: 'equity', label: 'EKUITAS (Modal Pemilik, Prive, Laba Ditahan)' },
    { value: 'revenue', label: 'PENDAPATAN (Penjualan, Pendapatan Lain)' },
    { value: 'expense', label: 'BEBAN & BIAYA (HPP, Operasional, Pengiriman)' },
  ];

  useEffect(() => {
    let isMounted = true;
    if (effectiveId) {
      coaService.getAccount(effectiveId)
        .then(res => {
          if (!isMounted || !res) return;
          const data = res.data || res;
          setFormData({
            account_code: data.account_code || '',
            account_name: data.account_name || '',
            account_type: data.account_type || 'asset',
            description: data.description || '',
            is_active: Boolean(data.is_active)
          });
          setIsSystem(Boolean(data.is_system));
          setLedgerCount(data.ledger_entries_count || 0);
          setAccountsCount(data.financial_accounts_count || 0);
        })
        .catch(err => {
          if (isMounted) setErrorMessage(err.message || 'Gagal memuat data akun COA.');
        })
        .finally(() => {
          if (isMounted) setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }

    return () => { isMounted = false; };
  }, [effectiveId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!formData.account_name.trim()) {
      setErrorMessage('Nama akun wajib diisi.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await coaService.updateAccount(effectiveId, {
        account_code: formData.account_code.trim(),
        account_name: formData.account_name.trim(),
        account_type: formData.account_type,
        description: formData.description.trim() || null,
        is_active: formData.is_active,
      });

      onShowToast({
        type: 'success',
        message: res?.message || `Akun ${formData.account_code} berhasil diperbarui.`,
      });

      onNavigateBack();
    } catch (err) {
      setErrorMessage(err.message || 'Gagal memperbarui akun Chart of Account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const tips = [
    {
      icon: isSystem ? ShieldCheck : BookOpen,
      heading: isSystem ? 'Akun Inti Sistem (Terkunci)' : 'Struktur Nomor Akun',
      text: isSystem 
        ? 'Kode akun ini adalah referensi baku sistem transaksi otomatis Tusko. Kode akun dikunci agar integritas jurnal pesanan & pengadaan tidak terputus.'
        : 'Pastikan kode akun tidak tertukar dengan klasifikasi akun lain.'
    },
    {
      icon: Scale,
      heading: 'Riwayat Jurnal Terkait',
      text: `Akun ini saat ini memiliki ${ledgerCount} baris mutasi jurnal di buku besar dan ${accountsCount} rekening kas/bank aktif yang tertaut.`
    }
  ];

  if (isLoading) {
    return (
      <div className="p-12 text-center bg-white border border-neutral-300 rounded-none">
        <span className="text-xs font-sport font-black uppercase tracking-wider text-neutral-500 animate-pulse">
          Memuat Data Akun COA...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Kartu Header Form Kanonis */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-none border border-neutral-300 shadow-2xs">
        <div className="flex items-center gap-3">
          <IconButton
            variant="outline"
            icon={ArrowLeft}
            onClick={onNavigateBack}
            tooltip="Kembali ke Daftar COA"
            ariaLabel="Kembali"
          />
          <div>
            <h1 className="text-xl sm:text-2xl font-black font-sport uppercase tracking-tight text-neutral-950 flex items-center gap-2">
              <span>Ubah Akun Bagan ({formData.account_code})</span>
              {isSystem && (
                <span className="px-2 py-0.5 bg-amber-400 text-neutral-950 font-mono font-black text-[10px] rounded-none">
                  INTI SISTEM
                </span>
              )}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <IconButton
            variant="secondary"
            icon={X}
            onClick={onNavigateBack}
            tooltip="Batalkan Perubahan"
            ariaLabel="Batal"
          />
          <IconButton
            variant="primary"
            icon={Save}
            onClick={handleSubmit}
            disabled={isSubmitting}
            tooltip="Perbarui Akun COA"
            ariaLabel="Simpan Perubahan"
          />
        </div>
      </div>

      {/* Grid Desktop 3/4 + 1/4 */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Form Utama */}
        <div className="bg-white border border-neutral-300 rounded-none shadow-xs p-6 sm:p-8 lg:col-span-3">
          <form id="coa-edit-form" onSubmit={handleSubmit} className="space-y-6">
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

            {/* Banner Info Akun Sistem */}
            {isSystem && (
              <div className="p-4 bg-amber-50 border border-amber-300 rounded-none flex items-start gap-3 text-xs text-amber-950">
                <ShieldCheck size={18} className="text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-sport font-black uppercase tracking-wider block">
                    Proteksi Akun Inti Sistem Tusko
                  </strong>
                  <span className="font-sans text-[11px] leading-relaxed block mt-0.5">
                    Kode akun <strong>{formData.account_code}</strong> tidak dapat diubah karena menjadi acuan baku modul penjualan, kasir, dan akuntansi otomatis. Anda tetap dapat mengubah nama akun, deskripsi, dan status operasionalnya.
                  </span>
                </div>
              </div>
            )}

            {/* Bagian 1: Identitas Bagan Akun */}
            <div className="space-y-4">
              <h2 className="text-sm font-black font-sport text-neutral-950 uppercase tracking-wider flex items-center gap-2 border-b border-neutral-200 pb-3">
                <BookOpen size={16} className="text-amber-500" />
                <span>1. Data Pokok Akun COA</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                    Kode Akun <span className="text-rose-500">*</span>
                  </label>
                  <TextInput
                    value={formData.account_code}
                    onChange={(val) => setFormData(p => ({ ...p, account_code: val }))}
                    placeholder="Contoh: 1100..."
                    disabled={isSystem}
                    required
                  />
                  {isSystem && (
                    <span className="text-[11px] text-amber-700 font-sans block mt-1">
                      Kode dikunci (Akun Inti Sistem).
                    </span>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                    Nama Akun <span className="text-rose-500">*</span>
                  </label>
                  <TextInput
                    value={formData.account_name}
                    onChange={(val) => setFormData(p => ({ ...p, account_name: val }))}
                    placeholder="Contoh: Kas Toko & Kasir..."
                    required
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                    Klasifikasi Akun (Account Type) <span className="text-rose-500">*</span>
                  </label>
                  <ServerSideSelect
                    value={formData.account_type}
                    onChange={(val) => setFormData(p => ({ ...p, account_type: val }))}
                    options={typeOptions}
                    placeholder="Pilih klasifikasi akun..."
                  />
                </div>
              </div>
            </div>

            {/* Bagian 2: Deskripsi & Status */}
            <div className="space-y-4 pt-4 border-t border-neutral-200">
              <h2 className="text-sm font-black font-sport text-neutral-950 uppercase tracking-wider flex items-center gap-2 border-b border-neutral-200 pb-3">
                <Info size={16} className="text-amber-500" />
                <span>2. Deskripsi &amp; Konfigurasi Penggunaan</span>
              </h2>

              <div>
                <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                  Keterangan / Fungsi Akun
                </label>
                <TextArea
                  rows={3}
                  value={formData.description}
                  onChange={(val) => setFormData(p => ({ ...p, description: val }))}
                  placeholder="Catatan detail fungsi dan peruntukan akun akuntansi ini..."
                />
              </div>

              <div className="pt-2">
                <Checkbox
                  checked={formData.is_active}
                  onChange={(checked) => setFormData(p => ({ ...p, is_active: checked }))}
                  label="Aktifkan Akun (Siap digunakan dalam pencatatan jurnal & rekening)"
                />
              </div>
            </div>

            {/* Tombol Submit di Bawah Form */}
            <div className="pt-6 border-t border-neutral-200 flex flex-col sm:flex-row items-center gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto px-6 py-2.5 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 border border-amber-500 text-neutral-950 text-xs font-sport font-black uppercase tracking-wider transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer rounded-none"
              >
                <Save size={15} />
                <span>{isSubmitting ? 'Menyimpan...' : 'Perbarui Akun COA'}</span>
              </button>
              <button
                type="button"
                onClick={onNavigateBack}
                disabled={isSubmitting}
                className="w-full sm:w-auto px-6 py-2.5 bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 text-neutral-800 text-xs font-sport font-black uppercase tracking-wider transition-colors cursor-pointer rounded-none"
              >
                Batal
              </button>
            </div>
          </form>
        </div>

        {/* Panel Tips di Samping Kanan */}
        <div className="lg:col-span-1 lg:sticky lg:top-6">
          <FormTipsPanel tips={tips} />
        </div>
      </div>
    </div>
  );
}
