import React from 'react';
import {
  TicketPercent,
  Percent,
  Layers,
  CalendarDays,
  AlertCircle,
  Save,
  Plus,
  Trash2,
  Target,
} from 'lucide-react';
import TextInput from '../molecules/TextInput';
import TextArea from '../molecules/TextArea';
import Checkbox from '../molecules/Checkbox';
import ServerSideSelect from '../molecules/ServerSideSelect';

const labelClass = 'block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5';
const sectionHeading = 'text-sm font-black font-sport text-neutral-950 uppercase tracking-wider flex items-center gap-2 border-b border-neutral-200 pb-3';

/**
 * VoucherFormFields — badan form voucher kanonis (aturan 25) dipakai bersama
 * oleh VoucherCreatePage & VoucherEditPage (mengurangi duplikasi markup).
 */
export default function VoucherFormFields({
  formId = 'voucher-form',
  onSubmit = () => {},
  isSubmitting = false,
  submitLabel = 'Simpan Voucher',
  onCancel = () => {},
  formData,
  setFormData,
  targets = [],
  onAddTarget = () => {},
  onRemoveTarget = () => {},
  onTargetChange = () => {},
  loadProductOptions = null,
  loadCategoryOptions = null,
  errorMessage = '',
  onDismissError = () => {},
}) {
  const setField = (key, value) => setFormData((prev) => ({ ...prev, [key]: value }));

  const discountTypeOptions = [
    { value: 'fixed', label: 'Nominal Tetap (Rp)' },
    { value: 'percent', label: 'Persentase (%)' },
  ];

  const targetTypeOptions = [
    { value: 'product', label: 'Produk Tertentu' },
    { value: 'category', label: 'Kategori Tertentu' },
  ];

  return (
    <form id={formId} onSubmit={onSubmit} className="space-y-5">
      {errorMessage && (
        <div className="p-4 bg-rose-50 border-l-4 border-rose-600 text-rose-800 rounded-none flex items-center justify-between animate-in fade-in duration-150">
          <div className="flex items-center gap-2 text-xs font-sport font-bold uppercase">
            <AlertCircle size={16} className="shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={onDismissError}
            className="text-rose-600 hover:text-rose-800 cursor-pointer shrink-0 ml-3"
            aria-label="Tutup pesan error"
          >
            ✕
          </button>
        </div>
      )}

      {/* Section 1: Identitas Voucher */}
      <div>
        <h2 className={sectionHeading}>
          <TicketPercent size={16} className="text-amber-500" />
          <span>1. Identitas Voucher</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <div>
            <label className={labelClass}>
              Kode Voucher <span className="text-rose-500">*</span>
            </label>
            <TextInput
              required
              value={formData.code}
              onChange={(val) => setField('code', val.toUpperCase())}
              placeholder="TUSKOVIBES150"
              weight="mono"
            />
          </div>
          <div>
            <label className={labelClass}>Badge Promo</label>
            <TextInput
              value={formData.badge}
              onChange={(val) => setField('badge', val)}
              placeholder="DISKON SPESIAL"
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>
              Judul Voucher <span className="text-rose-500">*</span>
            </label>
            <TextInput
              required
              value={formData.title}
              onChange={(val) => setField('title', val)}
              placeholder="Potongan Rp 150.000 Sepatu Lari"
              weight="bold"
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Deskripsi Singkat</label>
            <TextArea
              rows={3}
              value={formData.description}
              onChange={(val) => setField('description', val)}
              placeholder="Berlaku untuk semua sepatu lari dewasa, tidak dapat digabung dengan promo lain."
            />
          </div>
        </div>
      </div>

      {/* Section 2: Nilai & Ketentuan Diskon */}
      <div>
        <h2 className={sectionHeading}>
          <Percent size={16} className="text-amber-500" />
          <span>2. Nilai &amp; Ketentuan Diskon</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <div>
            <label className={labelClass}>
              Tipe Diskon <span className="text-rose-500">*</span>
            </label>
            <ServerSideSelect
              options={discountTypeOptions}
              value={formData.discount_type}
              onChange={(val) => setField('discount_type', val)}
              placeholder="Pilih tipe diskon..."
            />
          </div>
          <div>
            <label className={labelClass}>
              Nilai Diskon <span className="text-rose-500">*</span>
            </label>
            <TextInput
              required
              type="number"
              min={0}
              weight="mono"
              prefix={formData.discount_type === 'percent' ? '%' : 'Rp'}
              value={formData.discount_value}
              onChange={(val) => setField('discount_value', val)}
              placeholder={formData.discount_type === 'percent' ? '15' : '150000'}
            />
          </div>
          <div>
            <label className={labelClass}>Maksimal Diskon (Opsional)</label>
            <TextInput
              type="number"
              min={0}
              weight="mono"
              prefix="Rp"
              value={formData.max_discount}
              onChange={(val) => setField('max_discount', val)}
              placeholder="Kosongkan bila tanpa batas"
            />
          </div>
          <div>
            <label className={labelClass}>Minimal Belanja</label>
            <TextInput
              type="number"
              min={0}
              weight="mono"
              prefix="Rp"
              value={formData.min_purchase}
              onChange={(val) => setField('min_purchase', val)}
              placeholder="0"
            />
          </div>
        </div>
      </div>

      {/* Section 3: Kuota & Kebijakan */}
      <div>
        <h2 className={sectionHeading}>
          <Layers size={16} className="text-amber-500" />
          <span>3. Kuota &amp; Kebijakan Pemakaian</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <div>
            <label className={labelClass}>Kuota Total (Opsional)</label>
            <TextInput
              type="number"
              min={1}
              weight="mono"
              value={formData.quota}
              onChange={(val) => setField('quota', val)}
              placeholder="Kosongkan bila tak terbatas"
            />
          </div>
          <div>
            <label className={labelClass}>Batas Per Pengguna (Opsional)</label>
            <TextInput
              type="number"
              min={1}
              weight="mono"
              value={formData.per_user_limit}
              onChange={(val) => setField('per_user_limit', val)}
              placeholder="Kosongkan bila bebas"
            />
          </div>
          <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="flex items-center gap-3 cursor-pointer p-4 bg-neutral-50 border border-neutral-200 rounded-none hover:bg-neutral-100 transition-colors">
              <Checkbox checked={formData.is_free_shipping} onChange={(val) => setField('is_free_shipping', val)} />
              <span className="font-sport font-bold uppercase text-xs text-neutral-900 leading-tight">
                Gratis Ongkir
              </span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer p-4 bg-neutral-50 border border-neutral-200 rounded-none hover:bg-neutral-100 transition-colors">
              <Checkbox checked={formData.stackable} onChange={(val) => setField('stackable', val)} />
              <span className="font-sport font-bold uppercase text-xs text-neutral-900 leading-tight">
                Dapat Digabung Kupon Lain
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Section 4: Masa Berlaku & Cakupan */}
      <div>
        <h2 className={sectionHeading}>
          <CalendarDays size={16} className="text-amber-500" />
          <span>4. Masa Berlaku &amp; Cakupan</span>
        </h2>
        <div className="space-y-4 mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Tanggal Kedaluwarsa</label>
              <TextInput
                type="date"
                value={formData.expires_at}
                onChange={(val) => setField('expires_at', val)}
                title="Kosongkan bila tanpa batas waktu"
              />
            </div>
          </div>

          <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-none space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Target size={14} className="text-amber-500" />
                <span className="text-xs font-sport font-black uppercase tracking-wider text-neutral-900">
                  Cakupan Produk / Kategori
                </span>
              </div>
              <button
                type="button"
                onClick={onAddTarget}
                className="px-2.5 py-1 bg-white hover:bg-neutral-100 border border-neutral-300 text-neutral-800 font-sport font-bold text-[11px] uppercase rounded-none cursor-pointer flex items-center gap-1.5"
              >
                <Plus size={12} />
                <span>Tambah Cakupan</span>
              </button>
            </div>

            {targets.length === 0 ? (
              <p className="text-[11px] text-neutral-500 leading-relaxed">
                Berlaku untuk <strong>semua produk</strong>. Tambahkan cakupan bila voucher hanya berlaku
                untuk produk atau kategori tertentu.
              </p>
            ) : (
              <div className="space-y-2">
                {targets.map((target, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-44 shrink-0">
                      <ServerSideSelect
                        options={targetTypeOptions}
                        value={target.target_type}
                        onChange={(val) => onTargetChange(index, 'target_type', val)}
                        placeholder="Pilih tipe..."
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <ServerSideSelect
                        key={target.target_type}
                        loadOptions={target.target_type === 'category' ? loadCategoryOptions : loadProductOptions}
                        value={target.target_id}
                        onChange={(val) => onTargetChange(index, 'target_id', val)}
                        placeholder={target.target_type === 'category' ? 'Pilih kategori...' : 'Pilih produk...'}
                        isClearable
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemoveTarget(index)}
                      className="p-2 text-rose-600 hover:bg-rose-50 border border-neutral-300 rounded-none cursor-pointer shrink-0"
                      title="Hapus Cakupan"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Section 5: Status */}
      <div>
        <h2 className={sectionHeading}>
          <TicketPercent size={16} className="text-amber-500" />
          <span>5. Status Publikasi</span>
        </h2>
        <label className="mt-4 flex items-center gap-3 cursor-pointer p-4 bg-neutral-50 border border-neutral-200 rounded-none hover:bg-neutral-100 transition-colors">
          <Checkbox checked={formData.is_active} onChange={(val) => setField('is_active', val)} />
          <div>
            <span className="font-sport font-bold uppercase text-xs text-neutral-900 block leading-tight">
              Voucher Aktif
            </span>
            <span className="text-[11px] text-neutral-500 block mt-0.5">
              Voucher dapat diklaim &amp; dipakai pelanggan di storefront
            </span>
          </div>
        </label>
      </div>

      {/* Action Buttons */}
      <div className="pt-3 border-t border-neutral-200 space-y-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 border border-amber-500 text-neutral-950 text-xs font-sport font-black uppercase tracking-wider transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer rounded-none"
        >
          <Save size={15} />
          <span>{isSubmitting ? 'Menyimpan...' : submitLabel}</span>
        </button>

        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="w-full py-2 bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 text-neutral-800 text-xs font-sport font-black uppercase tracking-wider transition-colors cursor-pointer rounded-none"
        >
          Batal
        </button>
      </div>
    </form>
  );
}
