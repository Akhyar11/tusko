import React, { useState } from 'react';
import { Truck, Clock, Check, X, Sparkles, Scale, Info } from 'lucide-react';
import { formatRupiah } from '../utils/formatters';
import { mockExpeditionCategories } from '../data/mockCheckoutData';

export default function ExpeditionModal({
  isOpen = false,
  onClose = () => {},
  selectedExpedition = null,
  onSelectExpedition = () => {},
  totalWeight = 1,
  expeditions = []
}) {
  const [selectedCategory, setSelectedCategory] = useState('Semua');

  if (!isOpen) return null;

  const filteredExpeditions = expeditions.filter(exp => {
    if (selectedCategory === 'Semua') return true;
    return exp.category === selectedCategory;
  });

  const getCourierColor = (code) => {
    switch (code) {
      case 'jne':
        return 'bg-neutral-900 text-white';
      case 'jnt':
        return 'bg-red-600 text-white';
      case 'sicepat':
        return 'bg-red-700 text-white';
      case 'anteraja':
        return 'bg-neutral-800 text-amber-400';
      case 'pos':
        return 'bg-amber-500 text-black';
      case 'tiki':
        return 'bg-neutral-900 text-white';
      default:
        return 'bg-black text-white';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-none max-w-lg w-full p-5 sm:p-6 shadow-2xl border-2 border-black max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b-2 border-black shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-none bg-black text-white flex items-center justify-center -skew-x-6">
              <Truck size={16} className="text-amber-400 skew-x-6" />
            </div>
            <div>
              <h3 className="font-sport font-black uppercase text-sm sm:text-base text-black tracking-wide">
                Pilih Jasa Pengiriman
              </h3>
              <p className="text-[11px] text-neutral-500 font-medium">
                Pilih ekspedisi dan estimasi waktu sesuai kebutuhanmu
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-none text-neutral-400 hover:text-black hover:bg-neutral-100 cursor-pointer transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Package Weight & Info Banner */}
        <div className="mt-3 p-3 bg-neutral-100 border border-neutral-300 rounded-none flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-2 text-black font-sport font-bold uppercase">
            <Scale size={16} className="text-black shrink-0" />
            <span>Total Bobot Paket: <strong>{totalWeight} kg</strong></span>
          </div>
          <span className="text-[10px] text-black bg-white px-2 py-0.5 rounded-none font-sport font-black uppercase border border-neutral-300">
            Dihitung {Math.ceil(totalWeight)} kg
          </span>
        </div>

        {/* Categories Tabs */}
        <div className="pt-3 pb-1 shrink-0">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {mockExpeditionCategories.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-none text-xs font-sport font-black uppercase tracking-wider whitespace-nowrap cursor-pointer transition-colors ${
                  selectedCategory === cat
                    ? 'bg-black text-white'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
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
            <div className="py-12 text-center text-neutral-500 text-xs">
              <Truck size={28} className="mx-auto text-neutral-300 mb-2" />
              <p className="font-sport font-bold uppercase">Tidak ada opsi ekspedisi di kategori ini.</p>
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
                  className={`p-3.5 rounded-none border-2 cursor-pointer transition-all flex flex-col gap-2 ${
                    isSelected
                      ? 'border-black bg-neutral-50 shadow-none'
                      : 'border-neutral-200 hover:border-black bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      {/* Courier Brand Tag */}
                      <span className={`px-2 py-1 rounded-none text-[10px] font-sport font-black uppercase tracking-wider shrink-0 ${getCourierColor(exp.code)}`}>
                        {exp.name}
                      </span>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-sport font-black uppercase text-xs sm:text-sm text-black">
                            {exp.service}
                          </span>
                          {exp.badge && (
                            <span className={`text-[10px] font-sport font-black uppercase px-2 py-0.5 rounded-none ${
                              exp.is_free 
                                ? 'bg-amber-400 text-black' 
                                : 'bg-neutral-200 text-black'
                            }`}>
                              {exp.badge}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 mt-0.5 font-medium">
                          <Clock size={12} className="text-neutral-400" />
                          <span>Estimasi {exp.etd}</span>
                          <span>•</span>
                          <span className="text-neutral-400">{exp.category}</span>
                        </div>
                      </div>
                    </div>

                    {/* Price Tag & Selector */}
                    <div className="text-right shrink-0">
                      {exp.is_free ? (
                        <div>
                          <span className="text-xs sm:text-sm font-sport font-black text-black bg-amber-400 px-2 py-0.5 rounded-none uppercase block">
                            Gratis
                          </span>
                          <span className="text-[10px] text-neutral-400 line-through font-sport font-bold">
                            {formatRupiah(exp.baseCost)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs sm:text-sm font-sport font-black text-black">
                          {formatRupiah(exp.cost)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-[11px] text-neutral-600 leading-relaxed border-t border-neutral-100 pt-1.5 font-medium">
                    {exp.description}
                  </p>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="pt-3 border-t border-neutral-200 flex items-center justify-between text-xs text-neutral-500 shrink-0">
          <div className="flex items-center gap-1.5 text-[11px] font-medium">
            <Sparkles size={13} className="text-amber-500" />
            <span>Ongkir otomatis disesuaikan dengan kota tujuan</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-black font-sport font-bold uppercase rounded-none border border-neutral-300 cursor-pointer transition-colors"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
}
