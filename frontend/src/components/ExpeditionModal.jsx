import React, { useState } from 'react';
import { Truck, Check, X, Clock, ShieldAlert, Sparkles, Scale, Info, Search, Loader2 } from 'lucide-react';
import { formatRupiah } from '../utils/formatters';
import { mockExpeditionCategories } from '../data/mockCheckoutData';

export default function ExpeditionModal({
  isOpen = false,
  onClose = () => {},
  selectedExpedition = null,
  onSelectExpedition = () => {},
  totalWeight = 1.0, // in kg
  expeditions = [],
  distanceKm = null,
  provider = null,
  isLoadingRates = false
}) {
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const filteredExpeditions = (expeditions || []).filter(exp => {
    const matchesCategory = selectedCategory === 'Semua' || exp.category === selectedCategory;
    const matchesSearch = (exp.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (exp.service || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (exp.category || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getCourierColor = (code) => {
    switch (code) {
      case 'jne':
        return 'bg-blue-600 text-white';
      case 'sicepat':
        return 'bg-rose-600 text-white';
      case 'jnt':
        return 'bg-red-600 text-white';
      case 'gosend':
        return 'bg-emerald-600 text-white';
      case 'grab':
        return 'bg-green-600 text-white';
      case 'anteraja':
        return 'bg-amber-600 text-white';
      case 'pos':
        return 'bg-orange-600 text-white';
      default:
        return 'bg-neutral-900 text-white';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-none max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-neutral-300 max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-200 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-none bg-neutral-900 text-white flex items-center justify-center">
              <Truck size={18} />
            </div>
            <div>
              <h3 className="font-black uppercase tracking-tight text-sm sm:text-base text-neutral-950">
                Pilih Jasa Pengiriman
              </h3>
              <p className="text-[11px] text-neutral-500">
                Tarif real-time berdasarkan jarak & bobot paket {provider ? `(${provider})` : ''}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-none text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 cursor-pointer transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Package Weight & Distance Banner */}
        <div className="mt-3 p-3 bg-neutral-100 border border-neutral-300 rounded-none flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-2 text-neutral-900 font-bold uppercase tracking-wider text-[11px]">
            <Scale size={15} className="text-neutral-900 shrink-0" />
            <span>Bobot: <strong>{totalWeight} kg</strong></span>
            {distanceKm !== null && (
              <>
                <span className="text-neutral-300">•</span>
                <span>Jarak: <strong>{distanceKm} km</strong></span>
              </>
            )}
          </div>
          <span className="text-[10px] text-neutral-900 bg-white px-2 py-0.5 rounded-none font-black uppercase tracking-wider border border-neutral-300">
            Dihitung {Math.max(1, Math.ceil(totalWeight))} kg
          </span>
        </div>

        {/* Categories Tabs */}
        <div className="pt-3 pb-1 shrink-0">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {mockExpeditionCategories.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-none text-xs font-bold uppercase tracking-wider whitespace-nowrap cursor-pointer transition-colors ${
                  selectedCategory === cat
                    ? 'bg-neutral-950 text-white shadow-xs'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 border border-neutral-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* List of Expeditions */}
        <div className="flex-1 overflow-y-auto py-2 space-y-2.5 pr-1">
          {isLoadingRates ? (
            <div className="py-12 text-center text-neutral-500 text-xs flex flex-col items-center justify-center gap-2">
              <Loader2 size={24} className="animate-spin text-neutral-900" />
              <span>Menghitung estimasi tarif ongkir Indonesia...</span>
            </div>
          ) : filteredExpeditions.length === 0 ? (
            <div className="py-12 text-center text-neutral-500 text-xs">
              <Truck size={28} className="mx-auto text-neutral-400 mb-2" />
              <p>Tidak ada opsi ekspedisi di kategori ini.</p>
            </div>
          ) : (
            filteredExpeditions.map(exp => {
              const isSelected = selectedExpedition?.id === exp.id || selectedExpedition?.code === exp.code;
              return (
                <div
                  key={exp.id || `${exp.code}-${exp.service}`}
                  onClick={() => {
                    onSelectExpedition(exp);
                    onClose();
                  }}
                  className={`p-3.5 rounded-none border cursor-pointer transition-all flex flex-col gap-2 ${
                    isSelected
                      ? 'border-neutral-950 bg-neutral-50 ring-1 ring-neutral-950 shadow-xs'
                      : 'border-neutral-200 hover:border-neutral-400 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      {/* Courier Brand Tag */}
                      <span className={`px-2 py-1 rounded-none text-[10px] font-black uppercase tracking-wider shrink-0 ${getCourierColor(exp.code)}`}>
                        {exp.name}
                      </span>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-xs sm:text-sm text-neutral-950 uppercase tracking-tight">
                            {exp.service}
                          </span>
                          {exp.badge && (
                            <span className={`text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-none ${
                              exp.is_free 
                                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' 
                                : 'bg-neutral-200 text-neutral-900 border border-neutral-300'
                            }`}>
                              {exp.badge}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-neutral-600 mt-0.5">
                          <Clock size={12} className="text-neutral-500" />
                          <span>Estimasi {exp.etd}</span>
                          <span>•</span>
                          <span className="text-neutral-500 uppercase tracking-wider text-[10px]">{exp.category}</span>
                        </div>
                      </div>
                    </div>

                    {/* Price Tag & Selector */}
                    <div className="text-right shrink-0">
                      {exp.is_free ? (
                        <div>
                          <span className="text-xs sm:text-sm font-black text-emerald-700 uppercase tracking-wider block">
                            Gratis
                          </span>
                          <span className="text-[10px] text-neutral-400 line-through">
                            {formatRupiah(exp.base_cost || exp.baseCost || 18000)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs sm:text-sm font-black text-neutral-950">
                          {formatRupiah(exp.cost)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  {exp.description && (
                    <p className="text-[11px] text-neutral-600 leading-relaxed border-t border-neutral-100 pt-1.5">
                      {exp.description}
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="pt-3 border-t border-neutral-200 flex items-center justify-between text-xs text-neutral-600 shrink-0">
          <div className="flex items-center gap-1.5 text-[11px]">
            <Sparkles size={13} className="text-neutral-900" />
            <span>Ongkir otomatis disesuaikan dengan koordinat/kota tujuan</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-neutral-950 hover:bg-neutral-800 text-white font-black uppercase text-xs tracking-wider rounded-none cursor-pointer transition-colors"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
}
