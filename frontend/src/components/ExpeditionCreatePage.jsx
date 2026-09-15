import React, { useState } from 'react';
import { 
  Truck, 
  ArrowLeft, 
  Save, 
  X,
  AlertCircle,
  Tag,
  Clock,
  DollarSign,
  Layers,
  ShieldCheck
} from 'lucide-react';
import IconButton from './atoms/IconButton';
import FormTipsPanel from './organisms/FormTipsPanel';
import ServerSideSelect from './molecules/ServerSideSelect';
import TextInput from './molecules/TextInput';
import TextArea from './molecules/TextArea';
import Checkbox from './molecules/Checkbox';
import { formatRupiah } from '../utils/formatters';

export default function ExpeditionCreatePage({
  onAddExpedition = () => {},
  onNavigateBack = () => {},
  onShowToast = () => {}
}) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [service, setService] = useState('');
  const [category, setCategory] = useState('Reguler');
  const [etd, setEtd] = useState('2 - 3 hari');
  const [rateType, setRateType] = useState('per_kg');
  const [baseRate, setBaseRate] = useState('');
  const [trackingSupport, setTrackingSupport] = useState(true);
  const [codSupport, setCodSupport] = useState(false);
  const [description, setDescription] = useState('');
  const [badge, setBadge] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!name.trim()) {
      errs.name = 'Nama ekspedisi wajib diisi';
    } else if (name.trim().length < 3) {
      errs.name = 'Nama ekspedisi minimal 3 karakter';
    }

    if (!code.trim()) {
      errs.code = 'Kode singkatan kurir wajib diisi (misal: jne, sicepat, jnt)';
    }

    if (!service.trim()) {
      errs.service = 'Nama layanan pengiriman wajib diisi';
    }

    if (!etd.trim()) {
      errs.etd = 'Estimasi pengiriman (ETD) wajib diisi';
    }

    const rateNum = Number(baseRate);
    if (!baseRate || isNaN(rateNum) || rateNum <= 0) {
      errs.baseRate = 'Tarif ongkir harus berupa angka lebih dari Rp 0';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const newExpedition = {
        id: Date.now(),
        name: name.trim(),
        code: code.trim().toLowerCase(),
        service: service.trim(),
        category,
        etd: etd.trim(),
        rateType,
        baseRate: Number(baseRate),
        isActive: true,
        trackingSupport,
        codSupport,
        description: description.trim() || `Layanan kurir ${name} layanan ${service}`,
        badge: badge || null,
        zones: [
          { zone: 'Jabodetabek', rate: Number(baseRate), etd: etd.trim() },
          { zone: 'Pulau Jawa (Luar Jabodetabek)', rate: Math.round(Number(baseRate) * 1.3), etd: '3 - 5 hari' },
          { zone: 'Luar Pulau Jawa', rate: Math.round(Number(baseRate) * 2.2), etd: '4 - 7 hari' }
        ]
      };

      if (onAddExpedition) {
        onAddExpedition(newExpedition);
      }
      onShowToast(`Layanan ekspedisi ${newExpedition.name} berhasil ditambahkan!`);
      onNavigateBack();
    } catch (err) {
      setErrors({ global: err.message || 'Gagal menambahkan layanan ekspedisi' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-none border border-neutral-300 shadow-2xs">
        <div className="flex items-center gap-3">
          <IconButton icon={ArrowLeft} onClick={onNavigateBack} title="Kembali ke Pengaturan Ekspedisi" variant="outline" />
          <div>
            <h1 className="text-xl sm:text-2xl font-black font-sport uppercase tracking-tight text-neutral-950">Tambah Mitra Ekspedisi Baru</h1>
          </div>
        </div>
        {/* Header Action Buttons (Icon-Only with Tooltip) */}
        <div className="flex items-center gap-2">
          <IconButton icon={X} onClick={onNavigateBack} title="Batal" variant="secondary" />
          <IconButton icon={Save} onClick={() => document.getElementById('expedition-form')?.requestSubmit()} title="Simpan Layanan Ekspedisi" variant="primary" />
        </div>
      </div>

      {/* Konten Form + Tips */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
      {/* Form Card */}
      <div className="bg-white border border-neutral-300 rounded-none shadow-xs p-6 sm:p-8 lg:col-span-3">
        <form id="expedition-form" onSubmit={handleSubmit} className="space-y-6">
          {errors.global && (
            <div className="p-4 bg-rose-50 border-l-4 border-rose-600 text-rose-800 rounded-none flex items-center justify-between animate-in fade-in duration-150">
              <div className="flex items-center gap-2 text-xs font-sport font-bold uppercase">
                <AlertCircle size={16} className="shrink-0 text-rose-600" />
                <span>{errors.global}</span>
              </div>
              <button
                type="button"
                onClick={() => setErrors((prev) => ({ ...prev, global: null }))}
                className="text-rose-600 hover:text-rose-800 cursor-pointer shrink-0"
                aria-label="Tutup pesan error"
              >
                ✕
              </button>
            </div>
          )}

          {/* Section 1: Identitas Kurir */}
          <div>
            <h2 className="text-sm font-black font-sport text-neutral-950 uppercase tracking-wider flex items-center gap-2 border-b border-neutral-200 pb-3">
              <Truck size={16} className="text-amber-500" />
              <span>1. Identitas Layanan Kurir</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                  Nama Ekspedisi <span className="text-rose-500">*</span>
                </label>
                <TextInput
                  required
                  value={name}
                  onChange={(val) => {
                    setName(val);
                    if (errors.name) setErrors({ ...errors, name: null });
                  }}
                  placeholder="J&T Express"
                  weight="bold"
                />
                {errors.name && <p className="text-[11px] text-rose-600 font-medium mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                  Kode Singkatan <span className="text-rose-500">*</span>
                </label>
                <TextInput
                  required
                  value={code}
                  onChange={(val) => {
                    setCode(val);
                    if (errors.code) setErrors({ ...errors, code: null });
                  }}
                  placeholder="jnt"
                  weight="mono"
                />
                {errors.code && <p className="text-[11px] text-rose-600 font-medium mt-1">{errors.code}</p>}
              </div>

              <div>
                <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                  Nama Layanan / Paket <span className="text-rose-500">*</span>
                </label>
                <TextInput
                  required
                  value={service}
                  onChange={(val) => {
                    setService(val);
                    if (errors.service) setErrors({ ...errors, service: null });
                  }}
                  placeholder="EZ (Reguler)"
                />
                {errors.service && <p className="text-[11px] text-rose-600 font-medium mt-1">{errors.service}</p>}
              </div>
            </div>
          </div>

          {/* Section 2: Tarif & Kategori */}
          <div>
            <h2 className="text-sm font-black font-sport text-neutral-950 uppercase tracking-wider flex items-center gap-2 border-b border-neutral-200 pb-3">
              <DollarSign size={16} className="text-amber-500" />
              <span>2. Kategori Layanan &amp; Tarif Dasar</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                  Kategori Layanan
                </label>
                <ServerSideSelect
                  value={category}
                  onChange={(val) => setCategory(val)}
                  options={[
                    { value: 'Reguler', label: 'Reguler' },
                    { value: 'Kargo', label: 'Kargo' },
                    { value: 'Instan', label: 'Instan' },
                    { value: 'Hemat', label: 'Hemat' }
                  ]}
                  placeholder="Pilih kategori layanan..."
                />
              </div>

              <div>
                <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                  Estimasi Tiba (ETD) <span className="text-rose-500">*</span>
                </label>
                <TextInput
                  required
                  value={etd}
                  onChange={(val) => {
                    setEtd(val);
                    if (errors.etd) setErrors({ ...errors, etd: null });
                  }}
                  placeholder="2 - 3 hari"
                />
                {errors.etd && <p className="text-[11px] text-rose-600 font-medium mt-1">{errors.etd}</p>}
              </div>

              <div>
                <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                  Skema Perhitungan Tarif
                </label>
                <ServerSideSelect
                  value={rateType}
                  onChange={(val) => setRateType(val)}
                  options={[
                    { value: 'per_kg', label: 'Tarif per Kilogram (/kg)' },
                    { value: 'flat', label: 'Tarif Rata (Flat Rate)' }
                  ]}
                  placeholder="Pilih skema perhitungan tarif..."
                />
              </div>

              <div>
                <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                  Tarif Dasar Ongkir (Rp) <span className="text-rose-500">*</span>
                </label>
                <TextInput
                  type="number"
                  required
                  min="1000"
                  value={baseRate}
                  onChange={(val) => {
                    setBaseRate(val);
                    if (errors.baseRate) setErrors({ ...errors, baseRate: null });
                  }}
                  placeholder="15000"
                  weight="mono"
                />
                {errors.baseRate && <p className="text-[11px] text-rose-600 font-medium mt-1">{errors.baseRate}</p>}
              </div>
            </div>
          </div>

          {/* Section 3: Fitur & Dukungan */}
          <div>
            <h2 className="text-sm font-black font-sport text-neutral-950 uppercase tracking-wider flex items-center gap-2 border-b border-neutral-200 pb-3">
              <ShieldCheck size={16} className="text-amber-500" />
              <span>3. Fitur Operasional &amp; Label Promo</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                  Badge Promosi (Opsional)
                </label>
                <ServerSideSelect
                  value={badge}
                  onChange={(val) => setBadge(val)}
                  options={[
                    { value: '', label: 'Tanpa Badge' },
                    { value: 'Official Partner', label: 'Official Partner' },
                    { value: 'Best Seller', label: 'Best Seller' },
                    { value: 'Paling Cepat', label: 'Paling Cepat' },
                    { value: 'Termurah', label: 'Termurah' }
                  ]}
                  placeholder="Pilih badge promosi..."
                />
              </div>

              <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                <label className="flex items-center gap-3 cursor-pointer p-3 bg-neutral-50 border border-neutral-200 rounded-none hover:bg-neutral-100 transition-colors">
                  <Checkbox
                    checked={trackingSupport}
                    onChange={(val) => setTrackingSupport(val)}
                  />
                  <span className="font-sport font-bold uppercase text-xs text-neutral-900">
                    Mendukung Live Tracking Resi
                  </span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer p-3 bg-neutral-50 border border-neutral-200 rounded-none hover:bg-neutral-100 transition-colors">
                  <Checkbox
                    checked={codSupport}
                    onChange={(val) => setCodSupport(val)}
                  />
                  <span className="font-sport font-bold uppercase text-xs text-neutral-900">
                    Mendukung Bayar di Tempat (COD)
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Section 4: Keterangan */}
          <div>
            <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
              Deskripsi Layanan (Opsional)
            </label>
            <TextArea
              rows={2}
              value={description}
              onChange={setDescription}
              placeholder="Deskripsi keunggulan rute dan garansi keamanan paket..."
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-neutral-200 space-y-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 border border-amber-500 text-neutral-950 text-xs font-sport font-black uppercase tracking-wider transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer rounded-none"
            >
              <Save size={15} />
              <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Layanan Ekspedisi'}</span>
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
          title="Panduan Ekspedisi"
          tips={[
            { icon: Tag, heading: 'Kode Kurir', text: 'Isi kode singkatan dengan huruf kecil tanpa spasi, contoh: jne, jnt, sicepat, agar konsisten dengan sistem resi.' },
            { icon: Truck, heading: 'Nama Layanan', text: 'Tulis nama paket sesuai katalog kurir, contoh: REG, EZ, YES, agar mudah dikenali pembeli saat checkout.' },
            { icon: Clock, heading: 'Format ETD', text: 'Gunakan rentang hari yang jelas seperti "2 - 3 hari" supaya estimasi tampil informatif di halaman checkout.' },
            { icon: DollarSign, heading: 'Per-Kg vs Flat', text: 'Pilih per-kg untuk kargo berbasis berat aktual, atau flat untuk tarif rata semua tujuan pengiriman.' },
            { icon: Layers, heading: 'Tarif Dasar', text: 'Isi tarif dasar Jabodetabek minimal Rp 1.000; zona lain dihitung otomatis sebagai kelipatannya.' },
            { icon: ShieldCheck, heading: 'Fitur COD & Tracking', text: 'Aktifkan COD hanya bila kurir mendukung tunai di tempat, dan tracking bila tersedia nomor resi live.' },
          ]}
        />
      </div>
    </div>
  );
}
