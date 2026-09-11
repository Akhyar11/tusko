import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  XCircle,
  TrendingDown,
  ArrowRight,
  PlusCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Boxes,
  Warehouse,
  ExternalLink,
  ShieldAlert,
  Sparkles,
  ShoppingBag
} from 'lucide-react';
import { formatRupiah } from '../utils/formatters';

export default function LowStockAlertWidget({
  inventory = [],
  onRestockProduct = () => {},
  onViewAllStock = () => {},
  isCompact = false
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [alertFilter, setAlertFilter] = useState('all'); // 'all' | 'out_of_stock' | 'low_stock'

  // Filter produk kritis (habis atau menipis di bawah minimum)
  const criticalItems = useMemo(() => {
    return inventory.filter((item) => {
      const isOutOfStock = item.stock === 0;
      const isLow = item.stock > 0 && item.stock <= item.stock_minimum;

      if (alertFilter === 'out_of_stock') return isOutOfStock;
      if (alertFilter === 'low_stock') return isLow;
      return isOutOfStock || isLow;
    });
  }, [inventory, alertFilter]);

  // Statistik rekomendasi pengadaan (Reorder Suggestion)
  const stats = useMemo(() => {
    let outOfStockCount = 0;
    let lowStockCount = 0;
    let totalSuggestedUnits = 0;
    let totalEstimatedBudget = 0;

    inventory.forEach((item) => {
      if (item.stock === 0) {
        outOfStockCount++;
        const suggested = Math.max(10, item.stock_minimum * 2);
        totalSuggestedUnits += suggested;
        totalEstimatedBudget += suggested * (item.cost_price || 0);
      } else if (item.stock <= item.stock_minimum) {
        lowStockCount++;
        const suggested = Math.max(5, (item.stock_minimum * 2) - item.stock);
        totalSuggestedUnits += suggested;
        totalEstimatedBudget += suggested * (item.cost_price || 0);
      }
    });

    return {
      outOfStockCount,
      lowStockCount,
      totalCritical: outOfStockCount + lowStockCount,
      totalSuggestedUnits,
      totalEstimatedBudget
    };
  }, [inventory]);

  if (stats.totalCritical === 0) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-none p-4 sm:p-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-none bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle2 size={22} />
          </div>
          <div>
            <h4 className="font-black text-sm text-emerald-950">Semua Stok Gudang Dalam Batas Aman</h4>
            <p className="text-xs text-emerald-700 mt-0.5">
              Tidak ada produk yang berada di bawah safety stock minimum saat ini.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onViewAllStock}
          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-none transition-colors cursor-pointer shrink-0"
        >
          Lihat Katalog
        </button>
      </div>
    );
  }

  // Compact version (misal untuk sidebar atau preview widget)
  if (isCompact) {
    return (
      <div className="bg-amber-50/80 border border-amber-300/80 rounded-none p-4 space-y-3 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-900 font-black text-xs uppercase tracking-wide">
            <AlertTriangle size={16} className="text-amber-600" />
            <span>Peringatan Stok ({stats.totalCritical})</span>
          </div>
          <button
            type="button"
            onClick={onViewAllStock}
            className="text-[11px] font-bold text-amber-800 hover:underline flex items-center gap-1"
          >
            <span>Kelola</span>
            <ArrowRight size={12} />
          </button>
        </div>

        <div className="divide-y divide-amber-200/60">
          {criticalItems.slice(0, 3).map((item) => (
            <div key={item.id} className="py-2 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="text-xs font-bold text-gray-900 truncate">{item.name}</div>
                <div className="text-[10px] text-gray-500 font-mono">
                  Sisa: <span className="font-bold text-rose-700">{item.stock} unit</span> / min {item.stock_minimum}
                </div>
              </div>
              <button
                type="button"
                onClick={() => onRestockProduct(item)}
                className="px-2 py-1 bg-amber-400 hover:bg-amber-300 text-neutral-950 text-[10px] font-extrabold rounded-none shrink-0 cursor-pointer"
              >
                Restock
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Full Banner / Interactive Card Version
  return (
    <div className="bg-gradient-to-r from-amber-50 via-orange-50/40 to-amber-50/20 border border-amber-300 rounded-none shadow-xs overflow-hidden">
      {/* Header Bar */}
      <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-200/70">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-none bg-amber-500 text-neutral-950 flex items-center justify-center font-black shadow-xs shrink-0">
            <ShieldAlert size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-amber-950 tracking-tight">
                Peringatan Stok Menipis & Kritis
              </h3>
              <span className="px-2 py-0.5 rounded-none text-[10px] font-extrabold bg-rose-600 text-white uppercase tracking-wider">
                {stats.totalCritical} SKU Kritis
              </span>
            </div>
            <p className="text-xs text-amber-800/80 mt-0.5">
              {stats.outOfStockCount > 0 && (
                <span className="font-bold text-rose-700 mr-2">
                  • {stats.outOfStockCount} produk stok habis (0)
                </span>
              )}
              {stats.lowStockCount > 0 && (
                <span className="font-bold text-amber-800">
                  • {stats.lowStockCount} produk di bawah safety stock minimum
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
          {/* Filter Pills */}
          <div className="flex items-center bg-white p-0.5 rounded-none border border-amber-300/80 text-[11px] font-bold">
            <button
              type="button"
              onClick={() => setAlertFilter('all')}
              className={`px-2.5 py-1 rounded-none transition-colors cursor-pointer ${
                alertFilter === 'all'
                  ? 'bg-amber-500 text-neutral-950 font-black'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Semua ({stats.totalCritical})
            </button>
            <button
              type="button"
              onClick={() => setAlertFilter('out_of_stock')}
              className={`px-2.5 py-1 rounded-none transition-colors cursor-pointer ${
                alertFilter === 'out_of_stock'
                  ? 'bg-rose-600 text-white font-black'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Habis ({stats.outOfStockCount})
            </button>
            <button
              type="button"
              onClick={() => setAlertFilter('low_stock')}
              className={`px-2.5 py-1 rounded-none transition-colors cursor-pointer ${
                alertFilter === 'low_stock'
                  ? 'bg-amber-600 text-white font-black'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Menipis ({stats.lowStockCount})
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 text-amber-800 hover:bg-amber-200/50 rounded-none transition-colors cursor-pointer"
            title={isExpanded ? 'Sembunyikan Daftar' : 'Tampilkan Daftar'}
          >
            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>
      </div>

      {/* Expandable Content Area */}
      {isExpanded && (
        <div className="p-4 sm:p-5 space-y-4">
          {/* Smart Reorder Recommendation Banner */}
          <div className="p-3.5 bg-white/90 backdrop-blur-xs rounded-none border border-amber-200 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 text-gray-700">
              <Sparkles size={16} className="text-amber-500 shrink-0" />
              <div>
                <span className="font-bold text-gray-900">Rekomendasi Reorder Batch:</span> Disarankan pengadaan{' '}
                <span className="font-black text-amber-800">+{stats.totalSuggestedUnits} unit</span> untuk memenuhi safety stock buffer 2x minimum.
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-gray-500">Estimasi Kebutuhan Kas:</span>
              <span className="font-black text-neutral-900">{formatRupiah(stats.totalEstimatedBudget)}</span>
            </div>
          </div>

          {/* Grid of Critical Products */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {criticalItems.map((item) => {
              const isOutOfStock = item.stock === 0;
              const suggestedReorder = isOutOfStock
                ? Math.max(10, item.stock_minimum * 2)
                : Math.max(5, (item.stock_minimum * 2) - item.stock);

              return (
                <div
                  key={item.id}
                  className="bg-white p-3.5 rounded-none border border-amber-200 shadow-2xs flex flex-col justify-between hover:border-amber-400 transition-all gap-3"
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-14 h-14 rounded-none object-cover border border-gray-200 shrink-0 bg-gray-50"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-mono text-[10px] text-gray-500 font-bold truncate">
                          {item.sku}
                        </span>
                        {isOutOfStock ? (
                          <span className="px-2 py-0.5 rounded-none text-[9px] font-black uppercase bg-rose-50 text-rose-700 border border-rose-200 shrink-0">
                            Stok Habis
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-none text-[9px] font-black uppercase bg-amber-50 text-amber-800 border border-amber-300 shrink-0">
                            Menipis
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-xs text-gray-950 line-clamp-2 mt-0.5 leading-snug">
                        {item.name}
                      </h4>
                      <div className="text-[11px] text-gray-500 mt-1 flex items-center gap-1">
                        <Warehouse size={11} className="text-gray-400" />
                        <span>{item.warehouse_bin || 'Gudang'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Stock Metrics & Reorder Action */}
                  <div className="pt-2 border-t border-gray-150 flex items-center justify-between text-xs">
                    <div>
                      <div className="text-[11px] text-gray-500">
                        Sisa Fisik:{' '}
                        <span className={`font-black ${isOutOfStock ? 'text-rose-600' : 'text-amber-700'}`}>
                          {item.stock} unit
                        </span>{' '}
                        <span className="text-[10px] text-gray-400 font-medium">
                          (min {item.stock_minimum})
                        </span>
                      </div>
                      <div className="text-[10px] text-gray-500 mt-0.5">
                        Saran Order: <span className="font-bold text-neutral-800">+{suggestedReorder} unit</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onRestockProduct(item)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-amber-400 text-xs font-extrabold rounded-none shadow-xs transition-colors cursor-pointer shrink-0"
                    >
                      <PlusCircle size={13} />
                      <span>Restock</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
