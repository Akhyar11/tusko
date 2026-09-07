import React, { useState } from 'react';
import { 
  X, 
  Truck, 
  Plus, 
  AlertCircle, 
  Check, 
  DollarSign, 
  Clock, 
  Tag, 
  Layers 
} from 'lucide-react';
import { formatRupiah } from '../utils/formatters';

export default function AddExpeditionModal({
  isOpen = false,
  onClose = () => {},
  onAdd = () => {}
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

  // Errors state
  const [errors, setErrors] = useState({});

  if (!isOpen) return null;

  const validate = () => {
    const errs = {};
    if (!name.trim()) {
      errs.name = 'Nama ekspedisi wajib diisi';
    } else if (name.trim().length < 3) {
      errs.name = 'Nama ekspedisi minimal 3 karakter';
    }

    if (!code.trim()) {
      errs.code = 'Kode singkatan kurir wajib diisi (misal: jne, tiki, pos)';
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
      isDefault: false,
      trackingSupport,
      codSupport,
      description: description.trim() || `Layanan pengiriman ${service.trim()} oleh ${name.trim()}`,
      badge: badge.trim() || undefined
    };

    onAdd(newExpedition);
    handleResetForm();
    onClose();
  };

  const handleResetForm = () => {
    setName('');
    setCode('');
    setService('');
    setCategory('Reguler');
    setEtd('2 - 3 hari');
    setRateType('per_kg');
    setBaseRate('');
    setTrackingSupport(true);
    setCodSupport(false);
    setDescription('');
    setBadge('');
    setErrors({});
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Truck size={18} />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-gray-900">
                Tambah Ekspedisi Baru
              </h3>
              <p className="text-[11px] text-gray-500">
                Daftarkan kurir baru dan atur ongkir default
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          
          {/* Row 1: Nama Ekspedisi & Kode Singkatan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-gray-700 mb-1">
                Nama Ekspedisi <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors(prev => ({ ...prev, name: null }));
                }}
                placeholder="Contoh: TIKI, Ninja Xpress"
                className={`w-full px-3 py-2 bg-gray-50 border rounded-xl font-medium text-gray-900 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                  errors.name 
                    ? 'border-red-400 focus:ring-red-500/20' 
                    : 'border-gray-300 focus:ring-emerald-500/20 focus:border-emerald-500'
                }`}
              />
              {errors.name && (
                <p className="text-[11px] text-red-600 flex items-center gap-1 mt-1 font-semibold">
                  <AlertCircle size={12} />
                  <span>{errors.name}</span>
                </p>
              )}
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">
                Kode Kurir <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  if (errors.code) setErrors(prev => ({ ...prev, code: null }));
                }}
                placeholder="Contoh: tiki, ninja, pos"
                className={`w-full px-3 py-2 bg-gray-50 border rounded-xl font-medium text-gray-900 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                  errors.code 
                    ? 'border-red-400 focus:ring-red-500/20' 
                    : 'border-gray-300 focus:ring-emerald-500/20 focus:border-emerald-500'
                }`}
              />
              {errors.code && (
                <p className="text-[11px] text-red-600 flex items-center gap-1 mt-1 font-semibold">
                  <AlertCircle size={12} />
                  <span>{errors.code}</span>
                </p>
              )}
            </div>
          </div>

          {/* Row 2: Layanan & Kategori */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-gray-700 mb-1">
                Nama Layanan <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={service}
                onChange={(e) => {
                  setService(e.target.value);
                  if (errors.service) setErrors(prev => ({ ...prev, service: null }));
                }}
                placeholder="Contoh: Reguler, ONS, Kilat"
                className={`w-full px-3 py-2 bg-gray-50 border rounded-xl font-medium text-gray-900 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                  errors.service 
                    ? 'border-red-400 focus:ring-red-500/20' 
                    : 'border-gray-300 focus:ring-emerald-500/20 focus:border-emerald-500'
                }`}
              />
              {errors.service && (
                <p className="text-[11px] text-red-600 flex items-center gap-1 mt-1 font-semibold">
                  <AlertCircle size={12} />
                  <span>{errors.service}</span>
                </p>
              )}
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">
                Kategori Layanan
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl font-medium text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              >
                <option value="Reguler">Reguler</option>
                <option value="Instan & Same Day">Instan &amp; Same Day</option>
                <option value="Next Day">Next Day</option>
                <option value="Kargo">Kargo</option>
              </select>
            </div>
          </div>

          {/* Row 3: Estimasi Tiba (ETD) & Mode Tarif */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-gray-700 mb-1">
                Estimasi Tiba (ETD) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={etd}
                onChange={(e) => {
                  setEtd(e.target.value);
                  if (errors.etd) setErrors(prev => ({ ...prev, etd: null }));
                }}
                placeholder="Contoh: 1 - 2 hari, 3 jam"
                className={`w-full px-3 py-2 bg-gray-50 border rounded-xl font-medium text-gray-900 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                  errors.etd 
                    ? 'border-red-400 focus:ring-red-500/20' 
                    : 'border-gray-300 focus:ring-emerald-500/20 focus:border-emerald-500'
                }`}
              />
              {errors.etd && (
                <p className="text-[11px] text-red-600 flex items-center gap-1 mt-1 font-semibold">
                  <AlertCircle size={12} />
                  <span>{errors.etd}</span>
                </p>
              )}
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">
                Mode Perhitungan Ongkir
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRateType('per_kg')}
                  className={`py-2 px-2.5 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                    rateType === 'per_kg'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-600'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Per Kilogram
                </button>
                <button
                  type="button"
                  onClick={() => setRateType('flat')}
                  className={`py-2 px-2.5 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                    rateType === 'flat'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-600'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Tarif Flat
                </button>
              </div>
            </div>
          </div>

          {/* Row 4: Tarif Dasar (Rupiah) */}
          <div>
            <label className="block font-bold text-gray-700 mb-1">
              Tarif Dasar (Nominal Rupiah) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-gray-500 font-bold">
                Rp
              </span>
              <input
                type="number"
                min="0"
                step="1000"
                value={baseRate}
                onChange={(e) => {
                  setBaseRate(e.target.value);
                  if (errors.baseRate) setErrors(prev => ({ ...prev, baseRate: null }));
                }}
                placeholder="Contoh: 18000"
                className={`w-full pl-11 pr-3 py-2 bg-gray-50 border rounded-xl font-mono font-bold text-gray-900 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                  errors.baseRate 
                    ? 'border-red-400 focus:ring-red-500/20' 
                    : 'border-gray-300 focus:ring-emerald-500/20 focus:border-emerald-500'
                }`}
              />
            </div>
            {errors.baseRate ? (
              <p className="text-[11px] text-red-600 flex items-center gap-1 mt-1 font-semibold">
                <AlertCircle size={12} />
                <span>{errors.baseRate}</span>
              </p>
            ) : (
              <span className="text-[10.5px] text-gray-400 mt-1 block">
                {rateType === 'per_kg' ? 'Tarif per Kg pertama dan kelipatannya' : 'Biaya flat per satu pesanan'}
              </span>
            )}
          </div>

          {/* Row 5: Fitur Layanan (Tracking & COD) */}
          <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-200 space-y-2.5">
            <span className="font-bold text-gray-700 block">Fitur Pendukung</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={trackingSupport}
                  onChange={(e) => setTrackingSupport(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
                <span className="font-medium text-gray-800">
                  Dukungan Live Tracking Resi
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={codSupport}
                  onChange={(e) => setCodSupport(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
                <span className="font-medium text-gray-800">
                  Dukungan Pembayaran COD
                </span>
              </label>
            </div>
          </div>

          {/* Row 6: Deskripsi & Badge */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-gray-700 mb-1">
                Deskripsi Singkat Layanan
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Penjelasan keunggulan layanan..."
                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl font-medium text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block font-bold text-gray-700 mb-1">
                Label Badge Promosi (Opsional)
              </label>
              <input
                type="text"
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                placeholder="Contoh: Paling Hemat, Garansi Cepat"
                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl font-medium text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-gray-100 text-gray-700 font-bold rounded-xl border border-gray-200 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
            >
              <Plus size={15} />
              <span>Simpan Ekspedisi</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
