import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Save, 
  X,
  AlertCircle,
  Building2,
  Info,
  Layers,
  Landmark
} from 'lucide-react';
import { bankService } from '../services/bankService';
import FormTipsPanel from './organisms/FormTipsPanel';
import IconButton from './atoms/IconButton';
import TextInput from './molecules/TextInput';
import TextArea from './molecules/TextArea';
import Checkbox from './molecules/Checkbox';

export default function BankCreatePage({
  onNavigateBack = () => {},
  onShowToast = () => {}
}) {
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    notes: '',
    is_active: true
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!formData.code.trim()) {
      setErrorMessage('Kode bank wajib diisi.');
      return;
    }
    if (!formData.name.trim()) {
      setErrorMessage('Nama bank wajib diisi.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await bankService.createBank({
        code: formData.code.trim().toUpperCase(),
        name: formData.name.trim(),
        notes: formData.notes.trim() || null,
        is_active: formData.is_active,
      });

      onShowToast({
        type: 'success',
        message: res?.message || `Bank ${formData.name} berhasil ditambahkan.`,
      });

      onNavigateBack();
    } catch (err) {
      setErrorMessage(err.message || 'Gagal menambahkan data bank.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const tips = [
    {
      icon: Building2,
      heading: 'Standardisasi Kode Bank',
      text: 'Gunakan singkatan resmi bank dalam huruf kapital (misal: BCA, MANDIRI, BRI, BNI, BSI, BTPN, SEABANK).'
    },
    {
      icon: Landmark,
      heading: 'Format Nama Bank',
      text: 'Tuliskan nama lengkap lembaga perbankan (misal: Bank Central Asia (BCA) atau Bank Mandiri) agar mudah dikenali di dropdown form rekening.'
    },
    {
      icon: Layers,
      heading: 'Otomatis Tersedia di Server',
      text: 'Setelah disimpan, bank ini akan langsung muncul dan dapat dicari secara server-side pada form pembuatan & perubahan rekening bank.'
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
            tooltip="Kembali ke Daftar Bank"
            ariaLabel="Kembali"
          />
          <div>
            <h1 className="text-xl sm:text-2xl font-black font-sport uppercase tracking-tight text-neutral-950">
              Tambah Master Bank
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
            tooltip="Simpan Data Bank"
            ariaLabel="Simpan"
          />
        </div>
      </div>

      {/* Grid Desktop 3/4 + 1/4 */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Form Utama */}
        <div className="bg-white border border-neutral-300 rounded-none shadow-xs p-6 sm:p-8 lg:col-span-3">
          <form id="bank-create-form" onSubmit={handleSubmit} className="space-y-6">
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

            {/* Bagian 1: Identitas Lembaga Bank */}
            <div className="space-y-4">
              <h2 className="text-sm font-black font-sport text-neutral-950 uppercase tracking-wider flex items-center gap-2 border-b border-neutral-200 pb-3">
                <Building2 size={16} className="text-amber-500" />
                <span>1. Data Pokok Bank</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                    Kode Bank <span className="text-rose-500">*</span>
                  </label>
                  <TextInput
                    value={formData.code}
                    onChange={(val) => setFormData(p => ({ ...p, code: val.toUpperCase() }))}
                    placeholder="Contoh: BCA, BTPN..."
                    required
                  />
                  <span className="text-[11px] text-neutral-500 font-sans block mt-1">
                    Kode identifikasi unik bank.
                  </span>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                    Nama Lembaga Bank <span className="text-rose-500">*</span>
                  </label>
                  <TextInput
                    value={formData.name}
                    onChange={(val) => setFormData(p => ({ ...p, name: val }))}
                    placeholder="Contoh: Bank Central Asia (BCA)..."
                    required
                  />
                </div>
              </div>
            </div>

            {/* Bagian 2: Keterangan & Status */}
            <div className="space-y-4 pt-4 border-t border-neutral-200">
              <h2 className="text-sm font-black font-sport text-neutral-950 uppercase tracking-wider flex items-center gap-2 border-b border-neutral-200 pb-3">
                <Info size={16} className="text-amber-500" />
                <span>2. Keterangan &amp; Status Operasional</span>
              </h2>

              <div>
                <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                  Catatan / Keterangan Bank
                </label>
                <TextArea
                  rows={3}
                  value={formData.notes}
                  onChange={(val) => setFormData(p => ({ ...p, notes: val }))}
                  placeholder="Contoh: Bank swasta nasional untuk pembayaran transaksi..."
                />
              </div>

              <div className="pt-2">
                <Checkbox
                  checked={formData.is_active}
                  onChange={(checked) => setFormData(p => ({ ...p, is_active: checked }))}
                  label="Aktifkan Bank (Dapat dipilih pada form rekening kas/bank)"
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
                <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Data Bank'}</span>
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
