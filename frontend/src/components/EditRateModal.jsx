import React, { useState, useEffect } from 'react';
import { 
  X, 
  DollarSign, 
  Calculator, 
  Scale, 
  Layers, 
  AlertCircle, 
  Check, 
  HelpCircle,
  Truck,
  ArrowRight
} from 'lucide-react';
import { formatRupiah } from '../utils/formatters';

export default function EditRateModal({
  isOpen = false,
  onClose = () => {},
  expedition = null,
  onSave = () => {}
}) {
  const [rateType, setRateType] = useState('per_kg');
  const [baseRate, setBaseRate] = useState(18000);
  const [error, setError] = useState(null);

  // Sync state with selected expedition
  useEffect(() => {
    if (expedition) {
      setRateType(expedition.rateType || 'per_kg');
      setBaseRate(expedition.baseRate || 0);
      setError(null);
    }
  }, [expedition, isOpen]);

  if (!isOpen || !expedition) return null;

  const handlePresetClick = (amount) => {
    setBaseRate(amount);
    setError(null);
  };

  const handleIncrement = (amount) => {
    setBaseRate(prev => Math.max(0, (Number(prev) || 0) + amount));
    setError(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const rateNum = Number(baseRate);
    if (!baseRate || isNaN(rateNum) || rateNum <= 0) {
      setError('Nominal tarif harus lebih dari Rp 0');
      return;
    }

    onSave({
      id: expedition.id,
      rateType,
      baseRate: rateNum
    });

    onClose();
  };

  // Calculation simulation sample weights
  const simulationWeights = [1, 2, 3, 5];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-lg rounded-none shadow-2xl border border-gray-200 overflow-hidden my-auto">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-none bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <DollarSign size={20} />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-gray-900">
                Pengaturan Tarif Ongkir
              </h3>
              <p className="text-[11px] text-gray-500 font-medium">
                {expedition.name} - {expedition.service} ({expedition.category})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-none transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs">
          
          {/* Mode Selector (Flat vs Per Kg) */}
          <div className="space-y-2">
            <label className="font-extrabold text-gray-800 text-xs block">
              Pilih Skema / Mode Perhitungan Ongkir:
            </label>
            <div className="grid grid-cols-2 gap-3">
              
              {/* Option 1: Per Kilogram */}
              <div
                onClick={() => {
                  setRateType('per_kg');
                  setError(null);
                }}
                className={`p-3.5 rounded-none border transition-all cursor-pointer space-y-1.5 ${
                  rateType === 'per_kg'
                    ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-500 shadow-xs'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-black text-xs text-gray-900 flex items-center gap-1.5">
                    <Scale size={14} className={rateType === 'per_kg' ? 'text-emerald-700' : 'text-gray-400'} />
                    <span>Per Kilogram</span>
                  </span>
                  {rateType === 'per_kg' && (
                    <div className="w-4 h-4 rounded-none bg-emerald-600 text-white flex items-center justify-center text-[10px]">
                      &check;
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-gray-500 leading-snug">
                  Tarif dikalikan berat paket per 1 Kg (misal: 2.3 kg dihitung 3 kg).
                </p>
              </div>

              {/* Option 2: Flat Rate */}
              <div
                onClick={() => {
                  setRateType('flat');
                  setError(null);
                }}
                className={`p-3.5 rounded-none border transition-all cursor-pointer space-y-1.5 ${
                  rateType === 'flat'
                    ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-500 shadow-xs'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-black text-xs text-gray-900 flex items-center gap-1.5">
                    <Layers size={14} className={rateType === 'flat' ? 'text-emerald-700' : 'text-gray-400'} />
                    <span>Tarif Flat (Tetap)</span>
                  </span>
                  {rateType === 'flat' && (
                    <div className="w-4 h-4 rounded-none bg-emerald-600 text-white flex items-center justify-center text-[10px]">
                      &check;
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-gray-500 leading-snug">
                  Biaya ongkir sama dan tetap berapa pun berat barang belanjaan.
                </p>
              </div>

            </div>
          </div>

          {/* Nominal Input & Quick Preset Buttons */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-extrabold text-gray-800 text-xs">
                {rateType === 'per_kg' ? 'Tarif Dasar per Kilogram (Rp)' : 'Tarif Flat per Pesanan (Rp)'}
              </label>
              <span className="text-[10.5px] text-gray-400 font-mono">
                {formatRupiah(baseRate || 0)}
              </span>
            </div>

            <div className="relative">
              <span className="absolute left-4 top-2.5 text-gray-500 font-bold text-sm">
                Rp
              </span>
              <input
                type="number"
                min="1000"
                step="500"
                value={baseRate}
                onChange={(e) => {
                  setBaseRate(e.target.value);
                  if (error) setError(null);
                }}
                className={`w-full pl-12 pr-4 py-2.5 bg-gray-50 border rounded-none font-mono font-bold text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                  error 
                    ? 'border-red-400 focus:ring-red-500/20' 
                    : 'border-gray-300 focus:ring-emerald-500/20 focus:border-emerald-500'
                }`}
                placeholder="0"
              />
            </div>

            {error && (
              <p className="text-[11px] text-red-600 flex items-center gap-1 font-semibold">
                <AlertCircle size={12} />
                <span>{error}</span>
              </p>
            )}

            {/* Quick Presets */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10.5px] text-gray-400 mr-1">Preset Cepat:</span>
              {[10000, 15000, 18000, 20000, 25000, 35000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handlePresetClick(preset)}
                  className={`px-2.5 py-1 rounded-none font-mono text-[11px] border transition-colors cursor-pointer ${
                    Number(baseRate) === preset
                      ? 'bg-emerald-600 text-white font-bold border-emerald-600'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-200'
                  }`}
                >
                  {formatRupiah(preset)}
                </button>
              ))}
            </div>

            {/* Step Increments */}
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[10.5px] text-gray-400 mr-1">Tambah:</span>
              {[1000, 2000, 5000].map((inc) => (
                <button
                  key={inc}
                  type="button"
                  onClick={() => handleIncrement(inc)}
                  className="px-2 py-0.5 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-none text-[10.5px] font-mono border border-gray-200 cursor-pointer"
                >
                  +{inc.toLocaleString('id-ID')}
                </button>
              ))}
            </div>
          </div>

          {/* Live Simulation Box */}
          <div className="bg-neutral-900 text-white p-4 rounded-none space-y-2.5 shadow-sm">
            <div className="flex items-center justify-between text-xs border-b border-neutral-800 pb-2">
              <div className="flex items-center gap-1.5 font-bold text-amber-400">
                <Calculator size={14} />
                <span>Simulasi Biaya Ongkir untuk Pembeli</span>
              </div>
              <span className="text-[10px] text-neutral-400">
                Mode: <strong className="text-white">{rateType === 'per_kg' ? 'Per Kg' : 'Flat'}</strong>
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center text-[11px]">
              {simulationWeights.map((w) => {
                const calculatedCost = rateType === 'per_kg'
                  ? Number(baseRate || 0) * w
                  : Number(baseRate || 0);

                return (
                  <div key={w} className="bg-neutral-800/80 p-2 rounded-none border border-neutral-700 space-y-0.5">
                    <span className="text-[10px] text-neutral-400 block font-medium">
                      Paket {w} Kg
                    </span>
                    <span className="font-mono font-bold text-amber-300 text-xs block">
                      {formatRupiah(calculatedCost)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Submit Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-white hover:bg-gray-100 text-gray-700 font-bold text-xs rounded-none border border-gray-200 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-none transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
            >
              <Check size={14} />
              <span>Simpan Tarif</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
