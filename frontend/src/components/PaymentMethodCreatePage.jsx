import React, { useState } from 'react';
import {
  ArrowLeft,
  Save,
  X,
  AlertCircle,
  CreditCard,
  Info,
  Layers,
  Percent
} from 'lucide-react';
import { paymentMethodService } from '../services/paymentMethodService';
import FormTipsPanel from './organisms/FormTipsPanel';
import IconButton from './atoms/IconButton';
import TextInput from './molecules/TextInput';
import TextArea from './molecules/TextArea';
import ServerSideSelect from './molecules/ServerSideSelect';
import Checkbox from './molecules/Checkbox';

const TYPE_OPTIONS = [
  { value: 'midtrans', label: 'Midtrans (Verifikasi Otomatis)' },
  { value: 'manual', label: 'Manual (Verifikasi Penjual)' },
];

const CATEGORY_OPTIONS = [
  { value: 'Virtual Account', label: 'Virtual Account' },
  { value: 'QRIS & E-Wallet', label: 'QRIS & E-Wallet' },
  { value: 'E-Wallet', label: 'E-Wallet' },
  { value: 'Transfer Manual', label: 'Transfer Manual' },
  { value: 'Gerai Retail', label: 'Gerai Retail' },
  { value: 'Kartu Kredit', label: 'Kartu Kredit' },
  { value: 'Lainnya', label: 'Lainnya' },
];

export default function PaymentMethodCreatePage({
  onNavigateBack = () => {},
  onShowToast = () => {}
}) {
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    category: 'Virtual Account',
    type: 'midtrans',
    badge: 'Otomatis',
    description: '',
    fee_percent: '',
    fee_fixed: '',
    sort_order: '',
    is_active: true
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setErrorMessage('');

    if (!formData.code.trim()) {
      setErrorMessage('Kode kanal wajib diisi.');
      return;
    }
    if (!/^[a-z0-9_]+$/.test(formData.code.trim().toLowerCase())) {
      setErrorMessage('Kode kanal hanya boleh huruf kecil, angka, dan garis bawah (mis. bca_va).');
      return;
    }
    if (!formData.name.trim()) {
      setErrorMessage('Nama kanal wajib diisi.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await paymentMethodService.createMethod({
        code: formData.code.trim().toLowerCase(),
        name: formData.name.trim(),
        category: formData.category,
        type: formData.type,
        badge: formData.badge.trim() || null,
        description: formData.description.trim() || null,
        fee_percent: formData.fee_percent === '' ? 0 : Number(formData.fee_percent),
        fee_fixed: formData.fee_fixed === '' ? 0 : Number(formData.fee_fixed),
        sort_order: formData.sort_order === '' ? 0 : Number(formData.sort_order),
        is_active: formData.is_active,
      });

      onShowToast({
        type: 'success',
        message: res?.message || `Kanal ${formData.name} berhasil ditambahkan.`,
      });

      onNavigateBack();
    } catch (err) {
      setErrorMessage(err.message || 'Gagal menambahkan kanal pembayaran.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const tips = [
    {
      icon: CreditCard,
      heading: 'Kode Semantik Kanal',
      text: 'Gunakan kode huruf kecil sesuai kanal Midtrans (misal: bca_va, qris, gopay). Kode menjadi kunci integrasi webhook dan tidak boleh duplikat.'
    },
    {
      icon: Percent,
      heading: 'Format Admin Fee',
      text: 'Isi persen (mis. 0.7 untuk QRIS) dan/atau nominal tetap rupiah (mis. 4000 untuk VA bank). Kosongkan keduanya untuk Bebas Biaya.'
    },
    {
      icon: Layers,
      heading: 'Tampil Otomatis di Checkout',
      text: 'Kanal aktif langsung muncul di halaman checkout pembeli beserta estimasi biayanya. Nonaktifkan untuk menyembunyikan sementara.'
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
            tooltip="Kembali ke Daftar Metode Pembayaran"
            ariaLabel="Kembali"
          />
          <div>
            <h1 className="text-xl sm:text-2xl font-black font-sport uppercase tracking-tight text-neutral-950">
              Tambah Metode Pembayaran
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
            tooltip="Simpan Kanal Pembayaran"
            ariaLabel="Simpan"
          />
        </div>
      </div>

      {/* Grid Desktop 3/4 + 1/4 */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Form Utama */}
        <div className="bg-white border border-neutral-300 rounded-none shadow-xs p-6 sm:p-8 lg:col-span-3">
          <form id="payment-method-create-form" onSubmit={handleSubmit} className="space-y-6">
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

            {/* Bagian 1: Identitas Kanal */}
            <div className="space-y-4">
              <h2 className="text-sm font-black font-sport text-neutral-950 uppercase tracking-wider flex items-center gap-2 border-b border-neutral-200 pb-3">
                <CreditCard size={16} className="text-amber-500" />
                <span>1. Data Pokok Kanal</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                    Kode Kanal <span className="text-rose-500">*</span>
                  </label>
                  <TextInput
                    value={formData.code}
                    onChange={(val) => setFormData(p => ({ ...p, code: val.toLowerCase().replace(/[^a-z0-9_]/g, '') }))}
                    placeholder="Contoh: bca_va, qris..."
                    required
                  />
                  <span className="text-[11px] text-neutral-500 font-sans block mt-1">
                    Huruf kecil, angka, garis bawah. Unik.
                  </span>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                    Nama Kanal <span className="text-rose-500">*</span>
                  </label>
                  <TextInput
                    value={formData.name}
                    onChange={(val) => setFormData(p => ({ ...p, name: val }))}
                    placeholder="Contoh: BCA Virtual Account..."
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                    Kategori
                  </label>
                  <ServerSideSelect
                    value={formData.category}
                    onChange={(val) => setFormData(p => ({ ...p, category: val }))}
                    options={CATEGORY_OPTIONS}
                    placeholder="Pilih kategori kanal..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                    Tipe Kanal <span className="text-rose-500">*</span>
                  </label>
                  <ServerSideSelect
                    value={formData.type}
                    onChange={(val) => setFormData(p => ({ ...p, type: val }))}
                    options={TYPE_OPTIONS}
                    placeholder="Pilih tipe kanal..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                    Label Badge
                  </label>
                  <TextInput
                    value={formData.badge}
                    onChange={(val) => setFormData(p => ({ ...p, badge: val }))}
                    placeholder="Contoh: Otomatis..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                  Deskripsi Kanal
                </label>
                <TextArea
                  rows={3}
                  value={formData.description}
                  onChange={(val) => setFormData(p => ({ ...p, description: val }))}
                  placeholder="Contoh: Verifikasi instan 24 jam tanpa perlu unggah struk..."
                />
              </div>
            </div>

            {/* Bagian 2: Admin Fee & Status */}
            <div className="space-y-4 pt-4 border-t border-neutral-200">
              <h2 className="text-sm font-black font-sport text-neutral-950 uppercase tracking-wider flex items-center gap-2 border-b border-neutral-200 pb-3">
                <Percent size={16} className="text-amber-500" />
                <span>2. Admin Fee &amp; Status Operasional</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                    Fee Persen (%)
                  </label>
                  <TextInput
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={formData.fee_percent}
                    onChange={(val) => setFormData(p => ({ ...p, fee_percent: val }))}
                    placeholder="Contoh: 0.7"
                  />
                  <span className="text-[11px] text-neutral-500 font-sans block mt-1">
                    Persen dari nominal transaksi.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                    Fee Tetap (Rp)
                  </label>
                  <TextInput
                    type="number"
                    min="0"
                    step="1"
                    value={formData.fee_fixed}
                    onChange={(val) => setFormData(p => ({ ...p, fee_fixed: val }))}
                    placeholder="Contoh: 4000"
                  />
                  <span className="text-[11px] text-neutral-500 font-sans block mt-1">
                    Nominal tetap per transaksi.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                    Urutan Tampil
                  </label>
                  <TextInput
                    type="number"
                    min="0"
                    step="1"
                    value={formData.sort_order}
                    onChange={(val) => setFormData(p => ({ ...p, sort_order: val }))}
                    placeholder="Contoh: 10"
                  />
                </div>
              </div>

              <div className="pt-2">
                <Checkbox
                  checked={formData.is_active}
                  onChange={(checked) => setFormData(p => ({ ...p, is_active: checked }))}
                  label="Aktifkan Kanal (Tampil di halaman checkout pembeli)"
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
                <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Kanal Pembayaran'}</span>
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
