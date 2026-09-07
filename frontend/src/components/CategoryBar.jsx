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
    <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-neutral-200/90 my-4">
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-5 bg-amber-500 rounded-full" />
          <h3 className="text-sm sm:text-base font-black text-neutral-900 tracking-tight uppercase">
            Kategori Pilihan Andalan
          </h3>
          <span className="hidden sm:inline text-xs font-semibold text-neutral-400">
            • Koleksi Resmi Tusko
          </span>
        </div>
        {selectedCategoryId && (
          <button 
            onClick={() => onSelectCategory(null)}
            className="text-xs font-black uppercase tracking-wider text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 px-3 py-1 rounded-full transition-colors cursor-pointer"
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
              className={`flex flex-col items-center justify-center p-2 sm:p-2.5 rounded-xl border transition-all cursor-pointer text-center group relative ${
                isSelected 
                  ? 'border-neutral-900 bg-neutral-900 text-white shadow-md' 
                  : 'border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50 text-neutral-700'
              }`}
            >
              {/* Badge for featured/andalan category */}
              {cat.badge && (
                <span className={`absolute -top-1.5 -right-1 text-[8px] font-black px-1.5 py-0.2 rounded-full shadow-xs uppercase tracking-tighter ${
                  isSelected 
                    ? 'bg-amber-400 text-neutral-950' 
                    : cat.badge === 'HOT' 
                      ? 'bg-rose-500 text-white' 
                      : cat.badge === 'PRO'
                        ? 'bg-sky-500 text-white'
                        : 'bg-amber-500 text-neutral-950'
                }`}>
                  {cat.badge}
                </span>
              )}

              <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center mb-1.5 transition-transform group-hover:scale-105 ${
                isSelected ? 'bg-amber-500 text-neutral-950' : 'bg-neutral-100 text-neutral-700 group-hover:bg-amber-100 group-hover:text-amber-800'
              }`}>
                <IconComponent size={20} />
              </div>
              <span className={`text-[11px] font-bold line-clamp-1 ${isSelected ? 'text-white' : 'text-neutral-800'}`}>
                {cat.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
