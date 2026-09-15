import React, { useState } from 'react';
import { 
  Building2, 
  ArrowLeft, 
  Save, 
  X,
  AlertCircle,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Hash,
  FileText,
  Info
} from 'lucide-react';
import { vendorService } from '../services/vendorService';
import FormTipsPanel from './organisms/FormTipsPanel';
import IconButton from './atoms/IconButton';
import TextInput from './molecules/TextInput';
import TextArea from './molecules/TextArea';
import Checkbox from './molecules/Checkbox';

export default function SupplierCreatePage({
  onNavigateBack = () => {},
  onShowToast = () => {}
}) {
  const [formData, setFormData] = useState({
    code: '',
    company_name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    bank_account_info: '',
    categories: 'Apparel',
    is_active: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.company_name.trim() || !formData.contact_person.trim() || !formData.phone.trim()) {
      setErrorMessage('Harap lengkapi nama perusahaan, nama kontak PIC, dan nomor telepon.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const parsedCategories = formData.categories
        .split(',')
        .map(c => c.trim())
        .filter(Boolean);

      const payload = {
        code: formData.code.trim() || undefined,
        company_name: formData.company_name.trim(),
        contact_person: formData.contact_person.trim(),
        email: formData.email.trim() || null,
        phone: formData.phone.trim(),
        address: formData.address.trim() || null,
        bank_account_info: formData.bank_account_info.trim() || null,
        categories: parsedCategories.length > 0 ? parsedCategories : ['Apparel'],
        is_active: formData.is_active
      };

      await vendorService.createVendor(payload);
      onShowToast(`Supplier "${payload.company_name}" berhasil ditambahkan.`);
      onNavigateBack();
    } catch (err) {
      setErrorMessage(err.message || 'Gagal menambahkan data supplier.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-none border border-neutral-300 shadow-2xs">
        <div className="flex items-center gap-3">
          <IconButton icon={ArrowLeft} onClick={onNavigateBack} title="Kembali ke Daftar Supplier" variant="outline" />
          <div>
            <h1 className="text-xl sm:text-2xl font-black font-sport uppercase tracking-tight text-neutral-950">Tambah Supplier Baru</h1>
          </div>
        </div>
        {/* Header Action Buttons (Icon-Only with Tooltip) */}
        <div className="flex items-center gap-2">
          <IconButton icon={X} onClick={onNavigateBack} title="Batal" variant="secondary" />
          <IconButton icon={Save} onClick={() => document.getElementById('supplier-form')?.requestSubmit()} title="Simpan Supplier" variant="primary" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
      {/* Form Card */}
      <div className="bg-white border border-neutral-300 rounded-none shadow-xs p-6 sm:p-8 lg:col-span-3">
        <form id="supplier-form" onSubmit={handleSubmit} className="space-y-6">
          {errorMessage && (
            <div className="p-4 bg-rose-50 border-l-4 border-rose-600 text-rose-800 rounded-none flex items-center justify-between animate-in fade-in duration-150">
              <div className="flex items-center gap-2 text-xs font-sport font-bold uppercase">
                <AlertCircle size={16} className="shrink-0 text-rose-600" />
                <span>{errorMessage}</span>
              </div>
              <button type="button" onClick={() => setErrorMessage('')} className="text-rose-600 hover:text-rose-800 cursor-pointer shrink-0 ml-3" aria-label="Tutup pesan error">
                ✕
              </button>
            </div>
          )}

          {/* Section 1: Identitas Perusahaan */}
          <div>
            <h2 className="text-sm font-black font-sport text-neutral-950 uppercase tracking-wider flex items-center gap-2 border-b border-neutral-200 pb-3">
              <Building2 size={16} className="text-amber-500" />
              <span>1. Identitas Rekanan Vendor</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                  Nama Perusahaan / Vendor <span className="text-rose-500">*</span>
                </label>
                <TextInput
                  required
                  value={formData.company_name}
                  onChange={(val) => setFormData(p => ({ ...p, company_name: val }))}
                  placeholder="PT Tekstil Atletik Prima"
                  weight="bold"
                />
              </div>

              <div>
                <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                  Kode Vendor (Opsional)
                </label>
                <TextInput
                  value={formData.code}
                  onChange={(val) => setFormData(p => ({ ...p, code: val }))}
                  placeholder="Otomatis digenerate jika kosong"
                  weight="mono"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Kontak & Komunikasi */}
          <div>
            <h2 className="text-sm font-black font-sport text-neutral-950 uppercase tracking-wider flex items-center gap-2 border-b border-neutral-200 pb-3">
              <Phone size={16} className="text-amber-500" />
              <span>2. Kontak &amp; Penanggung Jawab (PIC)</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                  Nama Kontak PIC <span className="text-rose-500">*</span>
                </label>
                <TextInput
                  required
                  value={formData.contact_person}
                  onChange={(val) => setFormData(p => ({ ...p, contact_person: val }))}
                  placeholder="Budi Santoso"
                />
              </div>

              <div>
                <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                  No. Telepon / WhatsApp <span className="text-rose-500">*</span>
                </label>
                <TextInput
                  required
                  value={formData.phone}
                  onChange={(val) => setFormData(p => ({ ...p, phone: val }))}
                  placeholder="0812-3456-7890"
                  weight="mono"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                  Email Kontak
                </label>
                <TextInput
                  type="email"
                  value={formData.email}
                  onChange={(val) => setFormData(p => ({ ...p, email: val }))}
                  placeholder="budi@vendor.co.id"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Rekening & Kategori Pasokan */}
          <div>
            <h2 className="text-sm font-black font-sport text-neutral-950 uppercase tracking-wider flex items-center gap-2 border-b border-neutral-200 pb-3">
              <CreditCard size={16} className="text-amber-500" />
              <span>3. Keuangan &amp; Pasokan</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                  Informasi Rekening Bank
                </label>
                <TextInput
                  value={formData.bank_account_info}
                  onChange={(val) => setFormData(p => ({ ...p, bank_account_info: val }))}
                  placeholder="BCA 7788990011 a.n PT Tekstil"
                  weight="mono"
                />
              </div>

              <div>
                <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                  Kategori Pasokan (Pisahkan dengan koma)
                </label>
                <TextInput
                  value={formData.categories}
                  onChange={(val) => setFormData(p => ({ ...p, categories: val }))}
                  placeholder="Apparel, Jersey, Running Shorts"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Alamat & Status */}
          <div>
            <h2 className="text-sm font-black font-sport text-neutral-950 uppercase tracking-wider flex items-center gap-2 border-b border-neutral-200 pb-3">
              <MapPin size={16} className="text-amber-500" />
              <span>4. Alamat &amp; Status Kemitraan</span>
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                  Alamat Kantor / Pabrik / Gudang
                </label>
                <TextArea
                  rows={3}
                  value={formData.address}
                  onChange={(val) => setFormData(p => ({ ...p, address: val }))}
                  placeholder="Kawasan Industri Jababeka Blok C-12, Cikarang, Jawa Barat"
                />
              </div>

              <div>
                <label className="flex items-center gap-3 cursor-pointer p-4 bg-neutral-50 border border-neutral-200 rounded-none hover:bg-neutral-100 transition-colors">
                  <Checkbox
                    checked={formData.is_active}
                    onChange={(val) => setFormData(p => ({ ...p, is_active: val }))}
                  />
                  <div>
                    <span className="font-sport font-bold uppercase text-xs text-neutral-900 block leading-tight">
                      Kemitraan Vendor Aktif
                    </span>
                    <span className="text-[11px] text-neutral-500 block mt-0.5">
                      Vendor dapat langsung dipilih saat menerbitkan Purchase Order (PO) &amp; input produk
                    </span>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-neutral-200 space-y-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 border border-amber-500 text-neutral-950 text-xs font-sport font-black uppercase tracking-wider transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer rounded-none"
            >
              <Save size={15} />
              <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Supplier'}</span>
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
        title="Panduan Supplier"
        tips={[
          { icon: Hash, heading: 'Format Kode', text: 'Kode boleh dikosongkan agar digenerate otomatis. Bila diisi manual, gunakan format singkat huruf kapital seperti VND-001.' },
          { icon: Building2, heading: 'Nama Perusahaan', text: 'Isi nama resmi perusahaan atau vendor sesuai dokumen agar cocok dengan data PO dan pencatatan keuangan.' },
          { icon: Phone, heading: 'Kontak PIC', text: 'Wajib isi nama PIC dan nomor telepon/WhatsApp aktif agar tim mudah menghubungi saat pengadaan stok.' },
          { icon: Mail, heading: 'Email & Rekening', text: 'Cantumkan email valid dan info rekening lengkap dengan nama pemilik untuk memperlancar pembayaran.' },
          { icon: FileText, heading: 'Kategori Koma', text: 'Tulis kategori pasokan dipisah koma, contoh "Apparel, Jersey, Running Shorts", agar vendor mudah difilter.' },
          { icon: Info, heading: 'Status Aktif', text: 'Centang kemitraan aktif agar vendor langsung bisa dipilih saat menerbitkan PO dan input produk.' },
        ]}
      />
      </div>
    </div>
  );
}
