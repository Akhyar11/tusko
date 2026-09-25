import React, { useState } from 'react';
import {
  ArrowLeft,
  Save,
  X,
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

const INITIAL_FORM = {
  code: '',
  title: '',
  description: '',
  badge: 'PROMO',
  discount_type: 'fixed',
  discount_value: '',
  min_purchase: '',
  max_discount: '',
  quota: '',
  per_user_limit: '',
  is_free_shipping: false,
  stackable: false,
  expires_at: '',
  is_active: true,
};

const loadProductOptions = async (query, page) => {
  const res = await productService.fetchProducts({ search: query, page, per_page: 15 });
  const list = res.data || [];
  return {
    options: list.map((p) => ({ value: p.id, label: p.sku ? `[${p.sku}] ${p.name}` : p.name })),
    hasMore: list.length >= 15,
  };
};

const loadCategoryOptions = (query, page) => categoryService.loadOptions(query, page);

export default function VoucherCreatePage({
  onNavigateBack = () => {},
  onShowToast = () => {},
}) {
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [targets, setTargets] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

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
      };

      if (cleanTargets.length > 0) {
        payload.targets = cleanTargets;
      }

      await voucherService.createVoucher(payload);
      onShowToast(`Voucher "${payload.code}" berhasil ditambahkan.`);
      onNavigateBack();
    } catch (err) {
      const validation = err?.errors ? Object.values(err.errors).flat()[0] : null;
      setErrorMessage(validation || err.message || 'Gagal menambahkan voucher.');
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
            Tambah Voucher Baru
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <IconButton icon={X} onClick={onNavigateBack} title="Batal" variant="secondary" />
          <IconButton
            icon={Save}
            onClick={() => document.getElementById('voucher-form')?.requestSubmit()}
            title="Simpan Voucher"
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
            submitLabel="Simpan Voucher"
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
          title="Panduan Voucher"
          tips={[
            { icon: Hash, heading: 'Kode Unik', text: 'Gunakan kode singkat huruf kapital (mis. TUSKOVIBES150). Kode otomatis diubah ke huruf besar dan wajib unik.' },
            { icon: TicketPercent, heading: 'Judul & Badge', text: 'Judul tampil di halaman voucher pelanggan; badge adalah label singkat seperti "DISKON SPESIAL".' },
            { icon: Percent, heading: 'Tipe & Nilai Diskon', text: 'Pilih Nominal Tetap (Rp) atau Persentase (%). Isi Maksimal Diskon agar potongan persentase tidak melebihi batas.' },
            { icon: Layers, heading: 'Kuota & Batas', text: 'Kuota total membatasi jumlah pemakaian; batas per pengguna mencegah satu akun memakai berulang.' },
            { icon: CalendarDays, heading: 'Masa Berlaku', text: 'Kosongkan tanggal bila voucher berlaku selamanya. Voucher kedaluwarsa otomatis tidak dapat dipakai.' },
            { icon: Target, heading: 'Cakupan', text: 'Tanpa cakupan = berlaku semua produk. Tambahkan produk/kategori bila promo hanya untuk item tertentu.' },
            { icon: Info, heading: 'Stacking & Gratis Ongkir', text: 'Aktifkan "Dapat Digabung" bila kupon boleh dipakai bersama kupon lain. Gratis Ongkir meniadakan biaya kirim.' },
          ]}
        />
      </div>
    </div>
  );
}
