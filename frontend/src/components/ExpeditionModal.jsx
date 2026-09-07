import React, { useState } from 'react';
import { Truck, Check, X, Clock, ShieldAlert, Sparkles, Scale, Info, Search } from 'lucide-react';
import { formatRupiah } from '../utils/formatters';
import { mockExpeditions, mockExpeditionCategories } from '../data/mockCheckoutData';

export default function ExpeditionModal({
  isOpen = false,
  onClose = () => {},
  selectedExpedition = null,
  onSelectExpedition = () => {},
  totalWeight = 1.2, // in kg
  expeditions = null
}) {
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const rawList = (expeditions && expeditions.length > 0)
    ? expeditions.filter(e => e.isActive !== false)
    : mockExpeditions;

  const dynamicExpeditions = rawList.map(exp => {
    const baseRate = exp.baseRate || exp.baseCost || exp.cost || 18000;
    const rateType = exp.rateType || 'per_kg';
    const isFree = Boolean(exp.is_free);
    const calculatedCost = isFree 
      ? 0 
      : (rateType === 'per_kg' ? Math.max(1, Math.ceil(totalWeight)) * baseRate : baseRate);

    return {
      ...exp,
      baseCost: baseRate,
      cost: calculatedCost,
      is_free: isFree
    };
  });

  const filteredExpeditions = dynamicExpeditions.filter(exp => {
    const matchesCategory = selectedCategory === 'Semua' || exp.category === selectedCategory;
    const matchesSearch = exp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          exp.service.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          exp.category.toLowerCase().includes(searchQuery.toLowerCase());
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
      default:
        return 'bg-gray-800 text-white';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-gray-100 max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Truck size={18} />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-gray-900">
                Pilih Jasa Pengiriman
              </h3>
              <p className="text-[11px] text-gray-400">
                Pilih ekspedisi dan estimasi waktu sesuai kebutuhanmu
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 cursor-pointer transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Package Weight & Info Banner */}
        <div className="mt-3 p-3 bg-emerald-50/70 border border-emerald-100 rounded-2xl flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-2 text-emerald-900 font-medium">
            <Scale size={16} className="text-emerald-600 shrink-0" />
            <span>Total Bobot Paket: <strong>{totalWeight} kg</strong></span>
          </div>
          <span className="text-[11px] text-emerald-700 bg-white/80 px-2 py-0.5 rounded-md font-semibold border border-emerald-200">
            Dihitung {Math.ceil(totalWeight)} kg
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
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                  selectedCategory === cat
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* List of Expeditions */}
        <div className="flex-1 overflow-y-auto py-2 space-y-2.5 pr-1">
          {filteredExpeditions.length === 0 ? (
            <div className="py-12 text-center text-gray-500 text-xs">
              <Truck size={28} className="mx-auto text-gray-300 mb-2" />
              <p>Tidak ada opsi ekspedisi di kategori ini.</p>
            </div>
          ) : (
            filteredExpeditions.map(exp => {
              const isSelected = selectedExpedition?.id === exp.id;
              return (
                <div
                  key={exp.id}
                  onClick={() => {
                    onSelectExpedition(exp);
                    onClose();
                  }}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col gap-2 ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50/40 ring-1 ring-emerald-500 shadow-xs'
                      : 'border-gray-200 hover:border-emerald-300 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      {/* Courier Brand Tag */}
                      <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider shrink-0 ${getCourierColor(exp.code)}`}>
                        {exp.name}
                      </span>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-xs sm:text-sm text-gray-900">
                            {exp.service}
                          </span>
                          {exp.badge && (
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                              exp.is_free 
                                ? 'bg-emerald-100 text-emerald-800' 
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              {exp.badge}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-gray-500 mt-0.5">
                          <Clock size={12} className="text-gray-400" />
                          <span>Estimasi {exp.etd}</span>
                          <span>•</span>
                          <span className="text-gray-400">{exp.category}</span>
                        </div>
                      </div>
                    </div>

                    {/* Price Tag & Selector */}
                    <div className="text-right shrink-0">
                      {exp.is_free ? (
                        <div>
                          <span className="text-xs sm:text-sm font-extrabold text-emerald-600 block">
                            Gratis
                          </span>
                          <span className="text-[10px] text-gray-400 line-through">
                            {formatRupiah(exp.baseCost)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs sm:text-sm font-extrabold text-gray-900">
                          {formatRupiah(exp.cost)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-[11px] text-gray-600 leading-relaxed border-t border-gray-100 pt-1.5">
                    {exp.description}
                  </p>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 shrink-0">
          <div className="flex items-center gap-1.5 text-[11px]">
            <Sparkles size={13} className="text-amber-500" />
            <span>Ongkir otomatis disesuaikan dengan kota tujuan</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl cursor-pointer transition-colors"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
}
