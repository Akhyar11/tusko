import React, { useState, useEffect } from 'react';
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

export default function WarehouseEditPage({
  warehouse = null,
  onNavigateBack = () => {},
  onShowToast = () => {}
}) {
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    address: '',
    city: '',
    province: '',
    postal_code: '',
    is_primary: false,
    is_active: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (warehouse) {
      setFormData({
        code: warehouse.code || '',
        name: warehouse.name || '',
        address: warehouse.address || '',
        city: warehouse.city || '',
        province: warehouse.province || '',
        postal_code: warehouse.postal_code || '',
        is_primary: Boolean(warehouse.is_primary),
        is_active: warehouse.is_active !== undefined ? Boolean(warehouse.is_active) : true
      });
    }
  }, [warehouse]);

  if (!warehouse) {
    return (
      <div className="bg-white border border-neutral-300 p-8 text-center rounded-none max-w-2xl mx-auto space-y-4">
        <AlertCircle size={40} className="mx-auto text-amber-500" />
        <h2 className="text-base font-sport font-black uppercase text-neutral-900">
          Data Fasilitas Gudang Tidak Ditemukan
        </h2>
        <p className="text-xs text-neutral-500">
          Silakan pilih fasilitas gudang dari daftar untuk melakukan penyuntingan informasi.
        </p>
        <button
          type="button"
          onClick={onNavigateBack}
          className="px-4 py-2 bg-neutral-950 text-white text-xs font-sport font-bold uppercase rounded-none hover:bg-neutral-800 transition-colors"
        >
          Kembali ke Master Gudang
        </button>
      </div>
    );
  }

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

      await warehouseService.updateWarehouse(warehouse.id, payload);
      onShowToast(`Fasilitas gudang "${payload.name}" berhasil diperbarui.`);
      onNavigateBack();
    } catch (err) {
      setErrorMessage(err.message || 'Gagal memperbarui data fasilitas gudang.');
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
            <h1 className="text-xl sm:text-2xl font-black font-sport uppercase tracking-tight text-neutral-950">Ubah Fasilitas Gudang</h1>
          </div>
        </div>
        {/* Header Action Buttons (Icon-Only with Tooltip) */}
        <div className="flex items-center gap-2">
          <IconButton icon={X} onClick={onNavigateBack} title="Batal" variant="secondary" />
          <IconButton icon={Save} onClick={() => document.getElementById('warehouse-edit-form')?.requestSubmit()} title="Simpan Perubahan" variant="primary" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Form Card */}
        <div className="bg-white border border-neutral-300 rounded-none shadow-xs p-6 sm:p-8 lg:col-span-3">
          <form id="warehouse-edit-form" onSubmit={handleSubmit} className="space-y-6">
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
                    Kode Gudang <span className="text-rose-500">*</span>
                  </label>
                  <TextInput
                    required
                    value={formData.code}
                    onChange={(val) => setFormData(p => ({ ...p, code: val }))}
                    placeholder="WH-001"
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
                <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
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
            { icon: Hash, heading: 'Kode Fasilitas', text: 'Kode gudang harus unik di seluruh sistem ERP Tusko untuk menjaga integritas mutasi stok.' },
            { icon: Building, heading: 'Nama Fasilitas', text: 'Perbarui nama gudang jika terjadi relokasi atau restrukturisasi fasilitas logistik.' },
            { icon: MapPin, heading: 'Alamat Pengiriman', text: 'Pastikan alamat valid karena akan tercetak pada surat jalan dokumen penerimaan (GRN).' },
            { icon: Star, heading: 'Central Hub', text: 'Mengubah gudang ini menjadi Central Hub akan otomatis memindahkan status utama dari gudang sebelumnya.' },
            { icon: Info, heading: 'Status Operasional', text: 'Jika gudang sedang renovasi atau ditutup, nonaktifkan statusnya agar tidak dipilih pada PO baru.' },
          ]}
        />
      </div>
    </div>
  );
}
