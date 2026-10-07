import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Save, 
  X,
  AlertCircle,
  BookOpen,
  Info,
  Layers,
  Scale
} from 'lucide-react';
import { coaService } from '../services/coaService';
import FormTipsPanel from './organisms/FormTipsPanel';
import IconButton from './atoms/IconButton';
import TextInput from './molecules/TextInput';
import TextArea from './molecules/TextArea';
import Checkbox from './molecules/Checkbox';
import ServerSideSelect from './molecules/ServerSideSelect';

export default function ChartOfAccountCreatePage({
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

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const typeOptions = [
    { value: 'asset', label: 'ASET (Kas, Bank, Piutang, Persediaan)' },
    { value: 'liability', label: 'LIABILITAS (Hutang Usaha, Kewajiban)' },
    { value: 'equity', label: 'EKUITAS (Modal Pemilik, Prive, Laba Ditahan)' },
    { value: 'revenue', label: 'PENDAPATAN (Penjualan, Pendapatan Lain)' },
    { value: 'expense', label: 'BEBAN & BIAYA (HPP, Operasional, Pengiriman)' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!formData.account_code.trim()) {
      setErrorMessage('Kode akun wajib diisi.');
      return;
    }
    if (!formData.account_name.trim()) {
      setErrorMessage('Nama akun wajib diisi.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await coaService.createAccount({
        account_code: formData.account_code.trim(),
        account_name: formData.account_name.trim(),
        account_type: formData.account_type,
        description: formData.description.trim() || null,
        is_active: formData.is_active,
      });

      onShowToast({
        type: 'success',
        message: res?.message || `Akun ${formData.account_code} - ${formData.account_name} berhasil ditambahkan.`,
      });

      onNavigateBack();
    } catch (err) {
      setErrorMessage(err.message || 'Gagal menambahkan akun Chart of Account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const tips = [
    {
      icon: BookOpen,
      heading: 'Struktur Nomor Akun (Standard)',
      text: 'Gunakan standar penomoran akuntansi umum: 1xxx untuk Aset, 2xxx untuk Liabilitas, 3xxx untuk Ekuitas/Modal, 4xxx untuk Pendapatan, 5xxx untuk HPP, dan 6xxx untuk Beban.'
    },
    {
      icon: Layers,
      heading: 'Klasifikasi Akun yang Tepat',
      text: 'Pastikan klasifikasi akun sesuai dengan posisinya di Neraca Keuangan (Aset/Kewajiban/Modal) atau Laporan Laba Rugi (Pendapatan/Beban).'
    },
    {
      icon: Scale,
      heading: 'Pencatatan Jurnal Berpasangan',
      text: 'Akun yang Anda buat dapat langsung dipilih saat mencatat transaksi atau dipetakan ke rekening kas/bank baru.'
    }
  ];

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
            <h1 className="text-xl sm:text-2xl font-black font-sport uppercase tracking-tight text-neutral-950">
              Tambah Akun Bagan (COA)
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <IconButton
            variant="secondary"
            icon={X}
            onClick={onNavigateBack}
            tooltip="Batalkan Pengisian"
            ariaLabel="Batal"
          />
          <IconButton
            variant="primary"
            icon={Save}
            onClick={handleSubmit}
            disabled={isSubmitting}
            tooltip="Simpan Akun COA"
            ariaLabel="Simpan"
          />
        </div>
      </div>

      {/* Grid Desktop 3/4 + 1/4 */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Form Utama */}
        <div className="bg-white border border-neutral-300 rounded-none shadow-xs p-6 sm:p-8 lg:col-span-3">
          <form id="coa-create-form" onSubmit={handleSubmit} className="space-y-6">
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
                    placeholder="Contoh: 1150, 6500..."
                    required
                  />
                  <span className="text-[11px] text-neutral-500 font-sans block mt-1">
                    Kode nomor unik bagan akun.
                  </span>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                    Nama Akun <span className="text-rose-500">*</span>
                  </label>
                  <TextInput
                    value={formData.account_name}
                    onChange={(val) => setFormData(p => ({ ...p, account_name: val }))}
                    placeholder="Contoh: Kas Kecil Operasional Cabang..."
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
                <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Akun COA'}</span>
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
