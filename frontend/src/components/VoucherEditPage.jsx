import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Save,
  X,
  AlertCircle,
  Hash,
  TicketPercent,
  Percent,
  Layers,
  CalendarDays,
  Target,
  Info,
} from 'lucide-react';
import { voucherService } from '../services/voucherService';
import { productService } from '../services/productService';
import { categoryService } from '../services/categoryService';
import FormTipsPanel from './organisms/FormTipsPanel';
import VoucherFormFields from './organisms/VoucherFormFields';
import IconButton from './atoms/IconButton';

const loadProductOptions = async (query, page) => {
  const res = await productService.fetchProducts({ search: query, page, per_page: 15 });
  const list = res.data || [];
  return {
    options: list.map((p) => ({ value: p.id, label: p.sku ? `[${p.sku}] ${p.name}` : p.name })),
    hasMore: list.length >= 15,
  };
};

const loadCategoryOptions = (query, page) => categoryService.loadOptions(query, page);

function toFormData(voucher) {
  return {
    code: voucher?.code || '',
    title: voucher?.title || '',
    description: voucher?.description || '',
    badge: voucher?.badge || 'PROMO',
    discount_type: voucher?.discount_type || 'fixed',
    discount_value: voucher?.discount_value !== undefined && voucher?.discount_value !== null ? String(voucher.discount_value) : '',
    min_purchase: voucher?.min_purchase !== undefined && voucher?.min_purchase !== null ? String(voucher.min_purchase) : '',
    max_discount: voucher?.max_discount !== undefined && voucher?.max_discount !== null ? String(voucher.max_discount) : '',
    quota: voucher?.quota !== undefined && voucher?.quota !== null ? String(voucher.quota) : '',
    per_user_limit: voucher?.per_user_limit !== undefined && voucher?.per_user_limit !== null ? String(voucher.per_user_limit) : '',
    is_free_shipping: Boolean(voucher?.is_free_shipping),
    stackable: Boolean(voucher?.stackable),
    expires_at: voucher?.expires_at ? String(voucher.expires_at).slice(0, 10) : '',
    is_active: voucher?.is_active !== undefined ? Boolean(voucher.is_active) : true,
  };
}

function toTargets(voucher) {
  if (!Array.isArray(voucher?.targets)) return [];
  return voucher.targets
    .filter((t) => t && t.target_type && t.target_type !== 'all')
    .map((t) => ({ target_type: t.target_type, target_id: t.target_id ?? '' }));
}

export default function VoucherEditPage({
  voucher = null,
  onNavigateBack = () => {},
  onShowToast = () => {},
}) {
  const [formData, setFormData] = useState(() => toFormData(voucher));
  const [targets, setTargets] = useState(() => toTargets(voucher));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    setFormData(toFormData(voucher));
    setTargets(toTargets(voucher));
  }, [voucher]);

  if (!voucher) {
    return (
      <div className="bg-white border border-neutral-300 p-8 text-center rounded-none max-w-2xl mx-auto space-y-4">
        <AlertCircle size={40} className="mx-auto text-amber-500" />
        <h2 className="text-base font-sport font-black uppercase text-neutral-900">Data Voucher Tidak Ditemukan</h2>
        <p className="text-xs text-neutral-500">Silakan pilih voucher dari daftar untuk melakukan penyuntingan.</p>
        <button
          type="button"
          onClick={onNavigateBack}
          className="px-4 py-2 bg-neutral-950 text-white text-xs font-sport font-bold uppercase rounded-none hover:bg-neutral-800 transition-colors"
        >
          Kembali ke Daftar Voucher
        </button>
      </div>
    );
  }

  const handleAddTarget = () => setTargets((prev) => [...prev, { target_type: 'product', target_id: '' }]);
  const handleRemoveTarget = (index) => setTargets((prev) => prev.filter((_, i) => i !== index));
  const handleTargetChange = (index, key, value) =>
    setTargets((prev) =>
      prev.map((t, i) => (i === index ? { ...t, [key]: value, ...(key === 'target_type' ? { target_id: '' } : {}) } : t))
    );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.code.trim() || !formData.title.trim() || formData.discount_value === '') {
      setErrorMessage('Harap lengkapi kode voucher, judul, dan nilai diskon.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const cleanTargets = targets
        .filter((t) => t.target_id !== '' && t.target_id !== null && t.target_id !== undefined)
        .map((t) => ({ target_type: t.target_type, target_id: Number(t.target_id) }));

      const payload = {
        code: formData.code.trim().toUpperCase(),
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        badge: formData.badge.trim() || 'PROMO',
        discount_type: formData.discount_type,
        discount_value: Number(formData.discount_value) || 0,
        min_purchase: formData.min_purchase === '' ? 0 : Number(formData.min_purchase),
        max_discount: formData.max_discount === '' ? null : Number(formData.max_discount),
        quota: formData.quota === '' ? null : Number(formData.quota),
        per_user_limit: formData.per_user_limit === '' ? null : Number(formData.per_user_limit),
        is_free_shipping: Boolean(formData.is_free_shipping),
        stackable: Boolean(formData.stackable),
        expires_at: formData.expires_at || null,
        is_active: Boolean(formData.is_active),
        targets: cleanTargets,
      };

      await voucherService.updateVoucher(voucher.id, payload);
      onShowToast(`Voucher "${payload.code}" berhasil diperbarui.`);
      onNavigateBack();
    } catch (err) {
      const validation = err?.errors ? Object.values(err.errors).flat()[0] : null;
      setErrorMessage(validation || err.message || 'Gagal memperbarui voucher.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Header Card (spesimen form kanonis) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-none border border-neutral-300 shadow-2xs">
        <div className="flex items-center gap-3">
          <IconButton icon={ArrowLeft} onClick={onNavigateBack} title="Kembali ke Daftar Voucher" variant="outline" />
          <h1 className="text-xl sm:text-2xl font-black font-sport uppercase tracking-tight text-neutral-950">
            Edit Voucher: {voucher.code}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <IconButton icon={X} onClick={onNavigateBack} title="Batal" variant="secondary" />
          <IconButton
            icon={Save}
            onClick={() => document.getElementById('voucher-form')?.requestSubmit()}
            title="Simpan Perubahan Voucher"
            variant="primary"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        <div className="bg-white p-5 sm:p-6 border border-neutral-300 rounded-none shadow-2xs space-y-5 lg:col-span-3">
          <VoucherFormFields
            formId="voucher-form"
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            submitLabel="Simpan Perubahan"
            onCancel={onNavigateBack}
            formData={formData}
            setFormData={setFormData}
            targets={targets}
            onAddTarget={handleAddTarget}
            onRemoveTarget={handleRemoveTarget}
            onTargetChange={handleTargetChange}
            loadProductOptions={loadProductOptions}
            loadCategoryOptions={loadCategoryOptions}
            errorMessage={errorMessage}
            onDismissError={() => setErrorMessage('')}
          />
        </div>

        <FormTipsPanel
          className="lg:col-span-1"
          title="Panduan Ubah Voucher"
          tips={[
            { icon: Hash, heading: 'Kode Voucher', text: 'Hindari mengubah kode yang sudah dipakai pelanggan agar tidak membingungkan; kode otomatis huruf besar.' },
            { icon: TicketPercent, heading: 'Judul & Badge', text: 'Perbarui judul/badge agar pesan promo tetap relevan dengan kampanye berjalan.' },
            { icon: Percent, heading: 'Nilai Diskon', text: 'Pastikan nilai dan batas maksimal diskon selaras dengan margin produk sebelum menyimpan.' },
            { icon: Layers, heading: 'Kuota', text: 'Naikkan kuota bila promo diperpanjang; kosongkan bila ingin tanpa batas.' },
            { icon: CalendarDays, heading: 'Masa Berlaku', text: 'Perpanjang tanggal kedaluwarsa untuk melanjutkan promo atau kosongkan untuk berlaku selamanya.' },
            { icon: Target, heading: 'Cakupan', text: 'Ubah cakupan bila promo dialihkan ke produk/kategori lain; hapus semua cakupan untuk semua produk.' },
            { icon: Info, heading: 'Status', text: 'Nonaktifkan voucher bila promo dihentikan tanpa menghapus riwayat pemakaiannya.' },
          ]}
        />
      </div>
    </div>
  );
}
