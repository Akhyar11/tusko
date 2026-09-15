import React, { useState } from 'react';
import {
  Warehouse,
  ArrowLeft,
  Save,
  X,
  AlertCircle,
  MapPin,
  Star,
  Hash,
  Building,
  Info
} from 'lucide-react';
import { warehouseService } from '../services/warehouseService';
import FormTipsPanel from './organisms/FormTipsPanel';
import IconButton from './atoms/IconButton';
import TextInput from './molecules/TextInput';
import TextArea from './molecules/TextArea';
import Checkbox from './molecules/Checkbox';

export default function WarehouseCreatePage({
  onNavigateBack = () => {},
  onShowToast = () => {}
}) {
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    address: '',
    city: '',
    province: 'DKI Jakarta',
    postal_code: '',
    is_primary: false,
    is_active: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.address.trim() || !formData.city.trim() || !formData.province.trim()) {
      setErrorMessage('Harap lengkapi nama fasilitas gudang, alamat lengkap, kota, dan provinsi.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const payload = {
        code: formData.code.trim() || undefined,
        name: formData.name.trim(),
        address: formData.address.trim(),
        city: formData.city.trim(),
        province: formData.province.trim(),
        postal_code: formData.postal_code.trim() || null,
        is_primary: formData.is_primary,
        is_active: formData.is_active
      };

      await warehouseService.createWarehouse(payload);
      onShowToast(`Fasilitas gudang "${payload.name}" berhasil ditambahkan.`);
      onNavigateBack();
    } catch (err) {
      setErrorMessage(err.message || 'Gagal menambahkan data fasilitas gudang.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-none border border-neutral-300 shadow-2xs">
        <div className="flex items-center gap-3">
          <IconButton icon={ArrowLeft} onClick={onNavigateBack} title="Kembali ke Master Gudang" variant="outline" />
          <div>
            <h1 className="text-xl sm:text-2xl font-black font-sport uppercase tracking-tight text-neutral-950">Tambah Fasilitas Gudang Baru</h1>
          </div>
        </div>
        {/* Header Action Buttons (Icon-Only with Tooltip) */}
        <div className="flex items-center gap-2">
          <IconButton icon={X} onClick={onNavigateBack} title="Batal" variant="secondary" />
          <IconButton icon={Save} onClick={() => document.getElementById('warehouse-form')?.requestSubmit()} title="Simpan Fasilitas Gudang" variant="primary" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Form Card */}
        <div className="bg-white border border-neutral-300 rounded-none shadow-xs p-6 sm:p-8 lg:col-span-3">
          <form id="warehouse-form" onSubmit={handleSubmit} className="space-y-6">
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

            {/* Section 1: Identitas Gudang */}
            <div>
              <h2 className="text-sm font-black font-sport text-neutral-950 uppercase tracking-wider flex items-center gap-2 border-b border-neutral-200 pb-3">
                <Warehouse size={16} className="text-amber-500" />
                <span>1. Identitas &amp; Kode Fasilitas</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                    Nama Fasilitas Gudang <span className="text-rose-500">*</span>
                  </label>
                  <TextInput
                    required
                    value={formData.name}
                    onChange={(val) => setFormData(p => ({ ...p, name: val }))}
                    placeholder="Gudang Distribusi Cakung Jakarta"
                    weight="bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                    Kode Gudang (Opsional)
                  </label>
                  <TextInput
                    value={formData.code}
                    onChange={(val) => setFormData(p => ({ ...p, code: val }))}
                    placeholder="Otomatis WH-XXX jika kosong"
                    weight="mono"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Lokasi & Alamat Fisik */}
            <div>
              <h2 className="text-sm font-black font-sport text-neutral-950 uppercase tracking-wider flex items-center gap-2 border-b border-neutral-200 pb-3">
                <MapPin size={16} className="text-amber-500" />
                <span>2. Lokasi Geografis &amp; Titik Alamat</span>
              </h2>

              <div className="space-y-4 mt-4">
                <div>
                  <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                    Alamat Lengkap Fasilitas <span className="text-rose-500">*</span>
                  </label>
                  <TextArea
                    required
                    rows={3}
                    value={formData.address}
                    onChange={(val) => setFormData(p => ({ ...p, address: val }))}
                    placeholder="Kawasan Industri Pulogadung Blok H-10, Jl. Rawagelam V, Jakarta Timur"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                      Kota / Kabupaten <span className="text-rose-500">*</span>
                    </label>
                    <TextInput
                      required
                      value={formData.city}
                      onChange={(val) => setFormData(p => ({ ...p, city: val }))}
                      placeholder="Jakarta Timur"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                      Provinsi <span className="text-rose-500">*</span>
                    </label>
                    <TextInput
                      required
                      value={formData.province}
                      onChange={(val) => setFormData(p => ({ ...p, province: val }))}
                      placeholder="DKI Jakarta"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                      Kode Pos
                    </label>
                    <TextInput
                      value={formData.postal_code}
                      onChange={(val) => setFormData(p => ({ ...p, postal_code: val }))}
                      placeholder="13930"
                      weight="mono"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Konfigurasi Peran & Status Operasional */}
            <div>
              <h2 className="text-sm font-black font-sport text-neutral-950 uppercase tracking-wider flex items-center gap-2 border-b border-neutral-200 pb-3">
                <Star size={16} className="text-amber-500" />
                <span>3. Konfigurasi Peran &amp; Status Fasilitas</span>
              </h2>

              <div className="space-y-3 mt-4">
                <label className="flex items-center gap-3 cursor-pointer p-4 bg-neutral-50 border border-neutral-200 rounded-none hover:bg-neutral-100 transition-colors">
                  <Checkbox
                    checked={formData.is_primary}
                    onChange={(val) => setFormData(p => ({ ...p, is_primary: val }))}
                  />
                  <div>
                    <span className="font-sport font-bold uppercase text-xs text-neutral-900 block leading-tight">
                      Jadikan Gudang Utama (Central Hub)
                    </span>
                    <span className="text-[11px] text-neutral-500 block mt-0.5">
                      Gudang utama menjadi titik default penerimaan barang pengadaan PO dan pemenuhan order reguler
                    </span>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer p-4 bg-neutral-50 border border-neutral-200 rounded-none hover:bg-neutral-100 transition-colors">
                  <Checkbox
                    checked={formData.is_active}
                    onChange={(val) => setFormData(p => ({ ...p, is_active: val }))}
                  />
                  <div>
                    <span className="font-sport font-bold uppercase text-xs text-neutral-900 block leading-tight">
                      Fasilitas Gudang Aktif Beroperasi
                    </span>
                    <span className="text-[11px] text-neutral-500 block mt-0.5">
                      Gudang dapat dipilih saat pengadaan Purchase Order, mutasi barang, dan alokasi stok produk
                    </span>
                  </div>
                </label>
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
                <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Fasilitas Gudang'}</span>
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
          title="Panduan Gudang"
          tips={[
            { icon: Hash, heading: 'Kode Fasilitas', text: 'Gunakan kode alfanumerik singkat unik seperti WH-CGK-01 atau biarkan kosong agar digenerate otomatis sistem.' },
            { icon: Building, heading: 'Nama Fasilitas', text: 'Tulis nama deskriptif disertai lokasi, contoh: "Gudang Utama Cakung (Jakarta)" untuk mempermudah identifikasi tim gudang.' },
            { icon: MapPin, heading: 'Alamat Pengiriman', text: 'Cantumkan alamat fisik lengkap karena alamat ini digunakan sebagai tujuan pengiriman surat jalan vendor pada PO.' },
            { icon: Star, heading: 'Central Hub', text: 'Menandai fasilitas sebagai Gudang Utama akan menjadikannya pilihan default pada form PO dan mutasi inventaris.' },
            { icon: Info, heading: 'Status Operasional', text: 'Hanya fasilitas berstatus aktif yang akan muncul di dropdown pilihan PO dan manajemen mutasi stok.' },
          ]}
        />
      </div>
    </div>
  );
}
