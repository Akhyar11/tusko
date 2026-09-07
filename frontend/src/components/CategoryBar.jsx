import React from 'react';
import { 
  Tv, 
  Laptop, 
  Smartphone, 
  Shirt, 
  Sparkles, 
  Car, 
  Coffee, 
  HeartPulse,
  Grid
} from 'lucide-react';

const iconMap = {
  Tv: Tv,
  Laptop: Laptop,
  Smartphone: Smartphone,
  Shirt: Shirt,
  Sparkles: Sparkles,
  Car: Car,
  Coffee: Coffee,
  HeartPulse: HeartPulse,
};

export default function CategoryBar({ 
  categories = [], 
  selectedCategoryId = null, 
  onSelectCategory = () => {} 
}) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-2xs border border-gray-100 my-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
          <Grid size={16} className="text-emerald-600" />
          Kategori Pilihan
        </h3>
        {selectedCategoryId && (
          <button 
            onClick={() => onSelectCategory(null)}
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 cursor-pointer"
          >
            Reset Filter
          </button>
        )}
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2.5">
        {categories.map((cat) => {
          const IconComponent = iconMap[cat.icon] || Grid;
          const isSelected = selectedCategoryId === cat.id;

          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(isSelected ? null : cat.id)}
              className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all cursor-pointer text-center group ${
                isSelected 
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-700 shadow-2xs' 
                  : 'border-gray-100 hover:border-emerald-200 hover:bg-gray-50 text-gray-700'
              }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-1.5 transition-transform group-hover:scale-105 ${
                isSelected ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 group-hover:bg-emerald-100 group-hover:text-emerald-700'
              }`}>
                <IconComponent size={20} />
              </div>
              <span className="text-[11px] font-medium line-clamp-1">
                {cat.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
