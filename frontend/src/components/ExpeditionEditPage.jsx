import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  ArrowLeft, 
  Check, 
  Save, 
  X,
  AlertCircle,
  DollarSign,
  Edit3
} from 'lucide-react';
import IconButton from './atoms/IconButton';
import FormTipsPanel from './organisms/FormTipsPanel';
import ServerSideSelect from './molecules/ServerSideSelect';
import TextInput from './molecules/TextInput';
import { formatRupiah } from '../utils/formatters';

export default function ExpeditionEditPage({
  expedition = null,
  onEditRate = () => {},
  onNavigateBack = () => {},
  onShowToast = () => {}
}) {
  const [rateType, setRateType] = useState('per_kg');
  const [baseRate, setBaseRate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (expedition) {
      setRateType(expedition.rateType || 'per_kg');
      setBaseRate(String(expedition.baseRate || ''));
    }
  }, [expedition]);

  if (!expedition) {
    return (
      <div className="bg-white border border-neutral-300 p-8 text-center rounded-none max-w-2xl mx-auto space-y-4">
        <AlertCircle size={40} className="mx-auto text-amber-500" />
        <h2 className="text-base font-sport font-black uppercase text-neutral-900">
          Data Ekspedisi Tidak Ditemukan
        </h2>
        <p className="text-xs text-neutral-500">
          Silakan pilih layanan ekspedisi dari daftar untuk mengubah tarif.
        </p>
        <button
          type="button"
          onClick={onNavigateBack}
          className="px-4 py-2 bg-neutral-950 text-white text-xs font-sport font-bold uppercase rounded-none hover:bg-neutral-800 transition-colors"
        >
          Kembali ke Pengaturan Ekspedisi
        </button>
      </div>
    );
  }

  const handlePresetClick = (amount) => {
    setBaseRate(String(amount));
    setError('');
  };

  const handleIncrement = (amount) => {
    setBaseRate(prev => String(Math.max(0, (Number(prev) || 0) + amount)));
    setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const rateNum = Number(baseRate);
    if (!baseRate || isNaN(rateNum) || rateNum <= 0) {
      setError('Nominal tarif harus berupa angka lebih dari Rp 0');
      return;
    }

    setIsSubmitting(true);
    try {
      if (onEditRate) {
        onEditRate({
          id: expedition.id,
          rateType,
          baseRate: rateNum
        });
      }
      onShowToast(`Tarif ${expedition.name} berhasil diperbarui.`);
      onNavigateBack();
    } catch (err) {
      setError(err.message || 'Gagal memperbarui tarif ekspedisi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-none border border-neutral-300 shadow-2xs">
        <div className="flex items-center gap-3">
          <IconButton icon={ArrowLeft} onClick={onNavigateBack} title="Kembali ke Daftar Ekspedisi" variant="outline" />
          <div>
            <h1 className="text-xl sm:text-2xl font-black font-sport uppercase tracking-tight text-neutral-950">Ubah Tarif: {expedition.name} ({expedition.service})</h1>
          </div>
        </div>
        {/* Header Action Buttons (Icon-Only with Tooltip) */}
        <div className="flex items-center gap-2">
          <IconButton icon={X} onClick={onNavigateBack} title="Batal" variant="secondary" />
          <IconButton icon={Save} onClick={() => document.getElementById('expedition-form')?.requestSubmit()} title="Simpan Tarif Ekspedisi" variant="primary" />
        </div>
      </div>

      {/* Konten Form + Tips */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
      {/* Form Card */}
      <div className="bg-white border border-neutral-300 rounded-none shadow-xs p-6 sm:p-8 lg:col-span-3">
        <form id="expedition-form" onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 bg-rose-50 border-l-4 border-rose-600 text-rose-800 rounded-none flex items-center justify-between animate-in fade-in duration-150">
              <div className="flex items-center gap-2 text-xs font-sport font-bold uppercase">
                <AlertCircle size={16} className="shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
              <button
                type="button"
                onClick={() => setError('')}
                className="text-rose-600 hover:text-rose-800 cursor-pointer shrink-0"
                aria-label="Tutup pesan error"
              >
                ✕
              </button>
            </div>
          )}

          {/* Quick presets */}
          <div>
            <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-2">
              Preset Tarif Populer
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[10000, 15000, 18000, 22000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => handlePresetClick(amt)}
                  className={`py-2 px-3 text-xs font-mono font-bold rounded-none border cursor-pointer transition-colors ${
                    Number(baseRate) === amt
                      ? 'bg-neutral-950 text-amber-400 border-neutral-950'
                      : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-800 border-neutral-300'
                  }`}
                >
                  {formatRupiah(amt)}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Skema Perhitungan */}
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

            {/* Nominal Tarif */}
            <div>
              <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                Nominal Tarif Dasar (Rp) <span className="text-rose-500">*</span>
              </label>
              <TextInput
                type="number"
                required
                min="1000"
                value={baseRate}
                onChange={(val) => {
                  setBaseRate(val);
                  setError('');
                }}
                placeholder="18000"
                weight="mono"
              />
            </div>
          </div>

          {/* Quick Increment buttons */}
          <div>
            <span className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-500 mb-1.5">
              Penyesuaian Cepat (+/-)
            </span>
            <div className="flex gap-2">
              {[1000, 2000, 5000].map((inc) => (
                <button
                  key={inc}
                  type="button"
                  onClick={() => handleIncrement(inc)}
                  className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 rounded-none text-xs font-mono font-bold text-neutral-800 cursor-pointer"
                >
                  +{formatRupiah(inc)}
                </button>
              ))}
              {[-1000, -2000].map((dec) => (
                <button
                  key={dec}
                  type="button"
                  onClick={() => handleIncrement(dec)}
                  className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 rounded-none text-xs font-mono font-bold text-neutral-800 cursor-pointer"
                >
                  {formatRupiah(dec)}
                </button>
              ))}
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
              <span>{isSubmitting ? 'Memperbarui...' : 'Simpan Tarif'}</span>
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
          title="Panduan Ubah Tarif"
          tips={[
            { icon: DollarSign, heading: 'Preset Tarif', text: 'Gunakan tombol preset untuk memilih tarif populer dengan cepat sebelum menyesuaikan nominal manual.' },
            { icon: Truck, heading: 'Skema Perhitungan', text: 'Pilih per-kg bila ongkir mengikuti berat paket, atau flat bila satu tarif berlaku semua berat.' },
            { icon: Edit3, heading: 'Penyesuaian Cepat', text: 'Pakai tombol tambah/kurang untuk menaikkan atau menurunkan tarif tanpa mengetik ulang angka.' },
            { icon: Check, heading: 'Nominal Valid', text: 'Pastikan tarif lebih dari Rp 0 agar ongkir tampil benar di halaman checkout pembeli.' },
          ]}
        />
      </div>
    </div>
  );
}
