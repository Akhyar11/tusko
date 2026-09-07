import React from 'react';
import { 
  Shirt, 
  Footprints, 
  Dumbbell, 
  Shield, 
  Zap, 
  Trophy, 
  Activity, 
  Sparkles,
  Flame,
  Grid
} from 'lucide-react';

const iconMap = {
  Shirt: Shirt,
  Footprints: Footprints,
  Dumbbell: Dumbbell,
  Shield: Shield,
  Zap: Zap,
  Trophy: Trophy,
  Activity: Activity,
  Sparkles: Sparkles,
  Flame: Flame,
};

export default function CategoryBar({ 
  categories = [], 
  selectedCategoryId = null, 
  onSelectCategory = () => {} 
}) {
  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-gray-200/80 my-4">
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2">
          <div className="w-2 h-5 bg-amber-500 rounded-full" />
          <h3 className="text-sm sm:text-base font-extrabold text-gray-900 tracking-tight uppercase">
            Kategori Unggulan
          </h3>
        </div>
        {selectedCategoryId && (
          <button 
            onClick={() => onSelectCategory(null)}
            className="text-xs font-bold text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-full transition-colors cursor-pointer"
          >
            Reset Pilihan
          </button>
        )}
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2.5 sm:gap-3">
        {categories.map((cat) => {
          const IconComponent = iconMap[cat.icon] || Grid;
          const isSelected = selectedCategoryId === cat.id;

          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(isSelected ? null : cat.id)}
              className={`flex flex-col items-center justify-center p-2 sm:p-2.5 rounded-xl border transition-all cursor-pointer text-center group ${
                isSelected 
                  ? 'border-gray-900 bg-gray-900 text-white shadow-md' 
                  : 'border-gray-200 hover:border-gray-400 hover:bg-gray-50 text-gray-700'
              }`}
            >
              <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center mb-1.5 transition-transform group-hover:scale-105 ${
                isSelected ? 'bg-amber-500 text-gray-950' : 'bg-gray-100 text-gray-700 group-hover:bg-amber-100 group-hover:text-amber-800'
              }`}>
                <IconComponent size={20} />
              </div>
              <span className={`text-[11px] font-semibold line-clamp-1 ${isSelected ? 'text-white' : 'text-gray-800'}`}>
                {cat.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
