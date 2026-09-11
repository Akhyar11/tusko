import React, { useState, useMemo } from 'react';
import { 
  Package, 
  AlertTriangle, 
  TrendingUp, 
  DollarSign, 
  Wallet, 
  Calendar, 
  BarChart3, 
  ArrowUpRight, 
  ArrowDownRight, 
  Boxes, 
  ShoppingBag, 
  ArrowRight,
  ShieldCheck,
  Sparkles,
  RefreshCw,
  Clock,
  Award,
  Zap,
  TrendingDown,
  Layers,
  Truck
} from 'lucide-react';
import { formatRupiah } from '../utils/formatters';

export default function AdminDashboardPage({
  products = [],
  orders = [],
  transactions = [],
  onNavigate = () => {}
}) {
  const [chartPeriod, setChartPeriod] = useState('monthly'); // 'monthly' | 'weekly'
  const [hoveredBar, setHoveredBar] = useState(null);
  const [biTab, setBiTab] = useState('fast'); // 'fast' | 'slow'

  // 1. KPI Metrics
  const metrics = useMemo(() => {
    // Total Produk
    const totalProducts = products.length;

    // Produk Perlu Restok
    const lowStockProducts = products.filter(
      (p) => Number(p.stock) <= Number(p.stock_minimum || 5)
    );
    const lowStockCount = lowStockProducts.length;

    // Hitung dari data transaksi jika tersedia, atau gunakan baseline toko Tusko
    let grossMonthlyIncome = 0;
    let monthlyExpense = 0;
    let totalAccountBalance = 0;

    transactions.forEach((tx) => {
      const amount = Number(tx.amount || 0);
      if (tx.status === 'settled') {
        if (tx.type === 'income') {
          grossMonthlyIncome += amount;
          totalAccountBalance += amount;
        } else if (tx.type === 'expense') {
          monthlyExpense += amount;
          totalAccountBalance -= amount;
        }
      }
    });

    const grossRevenueMonth = grossMonthlyIncome > 0 ? grossMonthlyIncome : 428500000;
    const netRevenueMonth = grossMonthlyIncome > 0 
      ? Math.max(0, grossMonthlyIncome - monthlyExpense) 
      : 184200000;
    const accountBalance = totalAccountBalance > 0 ? totalAccountBalance : 612450000;

    return {
      totalProducts,
      lowStockCount,
      grossRevenueMonth,
      netRevenueMonth,
      accountBalance
    };
  }, [products, transactions]);

  // 2. Data Grafik Revenue (Bulanan vs Mingguan)
  const monthlyChartData = [
    { label: 'Apr 2026', gross: 290000000, net: 115000000, growth: '+8.2%' },
    { label: 'Mei 2026', gross: 325000000, net: 132000000, growth: '+12.1%' },
    { label: 'Jun 2026', gross: 360000000, net: 148000000, growth: '+10.8%' },
    { label: 'Jul 2026', gross: 395000000, net: 162000000, growth: '+9.7%' },
    { label: 'Agu 2026', gross: 380000000, net: 155000000, growth: '-3.8%' },
    { label: 'Sep 2026', gross: 428500000, net: 184200000, growth: '+12.7%' }
  ];

  const weeklyChartData = [
    { label: 'Minggu 1 (1-7 Sep)', gross: 94500000, net: 41200000, growth: '+5.4%' },
    { label: 'Minggu 2 (8-14 Sep)', gross: 118200000, net: 52400000, growth: '+25.1%' },
    { label: 'Minggu 3 (15-21 Sep)', gross: 104800000, net: 44600000, growth: '-11.3%' },
    { label: 'Minggu 4 (22-28 Sep)', gross: 111000000, net: 46000000, growth: '+5.9%' }
  ];

  const activeChartData = chartPeriod === 'monthly' ? monthlyChartData : weeklyChartData;
  const maxGross = Math.max(...activeChartData.map((d) => d.gross));

  // 3. PRD Fase 5: Business Intelligence Fast vs Slow Moving SKUs
  const fastMovingSKUs = [
    { sku: 'TSK-AERO-01-BLK-L', name: 'AeroSwift Pro Training Tee', category: 'Apparel', soldWeekly: 142, turnoverDays: 8, stockOnHand: 34, status: 'Restok Cepat' },
    { sku: 'TSK-COMP-02-NVY-M', name: 'Elite Compression Tight Pant', category: 'Running', soldWeekly: 98, turnoverDays: 12, stockOnHand: 22, status: 'Restok Cepat' },
    { sku: 'TSK-JACK-03-BLK-XL', name: 'StormShield Windrunner Jacket', category: 'Outerwear', soldWeekly: 67, turnoverDays: 16, stockOnHand: 18, status: 'Stok Aman' }
  ];

  const slowMovingSKUs = [
    { sku: 'TSK-HEAVY-09-GRY-XXL', name: 'Heavy Fleece Winter Training Top', category: 'Apparel', soldWeekly: 2, turnoverDays: 94, stockOnHand: 120, status: 'Cuci Gudang' },
    { sku: 'TSK-CAP-04-RED-OS', name: 'Heritage Classic Runner Cap (Red)', category: 'Accessories', soldWeekly: 4, turnoverDays: 78, stockOnHand: 85, status: 'Promo Diskon' },
    { sku: 'TSK-SOCK-07-WHT-M', name: 'Cushion High Crew Socks 3-Pack', category: 'Accessories', soldWeekly: 6, turnoverDays: 62, stockOnHand: 95, status: 'Bundling' }
  ];

  // 4. PRD Fase 5: Customer Loyalty Points Liability Monitor
  const loyaltyMetrics = {
    totalPointsOutstanding: 2450000,
    pointExchangeRate: 10, // 1 Poin = Rp 10
    totalFinancialLiability: 24500000, // Rp 24.500.000
    redemptionRate: 68.4,
    pointsExpiringThisMonth: 120000,
    liabilityExpiringThisMonth: 1200000
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* 1. Header Bar Dashboard Admin */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-none border border-neutral-300 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-neutral-500 uppercase tracking-widest mb-1">
            <span className="text-amber-700 font-bold">OPERATIONAL ERP CONTROL</span>
            <span>&bull;</span>
            <span>Tusko Central Platform</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-neutral-950 font-sport tracking-tight uppercase">
            Dashboard Utama Toko
          </h1>
          <p className="text-xs sm:text-sm text-neutral-600 mt-1">
            Ringkasan performa finansial, ketersediaan multi-gudang, dan analitik Business Intelligence (BI).
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="px-3 py-2 bg-neutral-100 border border-neutral-300 text-neutral-800 text-xs font-mono font-bold flex items-center gap-2 rounded-none">
            <Clock size={14} className="text-amber-600" />
            <span>Live Sync 2026</span>
          </div>
        </div>
      </div>

      {/* 2. Top 5 KPI Cards Grid (Wajib Sudut Siku rounded-none) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        
        {/* KPI 1: Total Produk */}
        <div className="bg-white border border-neutral-300 p-5 rounded-none shadow-2xs hover:border-black transition-colors">
          <div className="flex items-center justify-between text-neutral-600 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Total Produk</span>
            <div className="w-8 h-8 bg-neutral-100 text-neutral-900 border border-neutral-300 flex items-center justify-center rounded-none">
              <Package size={16} />
            </div>
          </div>
          <div className="font-sport font-black text-3xl text-neutral-950 tracking-tight">
            {metrics.totalProducts}
          </div>
          <div className="mt-2 text-[11px] text-neutral-500 flex items-center justify-between border-t border-neutral-100 pt-2">
            <span>SKU Aktif di Katalog</span>
            <button 
              type="button" 
              onClick={() => onNavigate('products-admin')}
              className="text-amber-700 hover:text-amber-900 font-bold flex items-center gap-0.5 cursor-pointer font-sport uppercase"
            >
              <span>Kelola</span>
              <ArrowRight size={11} />
            </button>
          </div>
        </div>

        {/* KPI 2: Produk Perlu Restok */}
        <div className={`bg-white border p-5 rounded-none shadow-2xs transition-colors ${
          metrics.lowStockCount > 0 ? 'border-amber-400 bg-amber-50/20' : 'border-neutral-300'
        }`}>
          <div className="flex items-center justify-between text-neutral-600 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Perlu Restok</span>
            <div className={`w-8 h-8 flex items-center justify-center rounded-none border ${
              metrics.lowStockCount > 0 
                ? 'bg-amber-100 text-amber-900 border-amber-300' 
                : 'bg-neutral-100 text-neutral-900 border-neutral-300'
            }`}>
              <AlertTriangle size={16} />
            </div>
          </div>
          <div className="font-sport font-black text-3xl text-neutral-950 tracking-tight flex items-baseline gap-2">
            <span>{metrics.lowStockCount}</span>
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider font-sport">Item Kritis</span>
          </div>
          <div className="mt-2 text-[11px] text-neutral-500 flex items-center justify-between border-t border-neutral-100 pt-2">
            <span>Safety Stock Alert</span>
            <button 
              type="button" 
              onClick={() => onNavigate('procurement')}
              className="text-amber-700 hover:text-amber-900 font-bold flex items-center gap-0.5 cursor-pointer font-sport uppercase"
            >
              <span>Buat PO</span>
              <ArrowRight size={11} />
            </button>
          </div>
        </div>

        {/* KPI 3: Revenue Kotor Bulan Ini */}
        <div className="bg-white border border-neutral-300 p-5 rounded-none shadow-2xs hover:border-black transition-colors">
          <div className="flex items-center justify-between text-neutral-600 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Revenue Kotor (Bulan)</span>
            <div className="w-8 h-8 bg-neutral-900 text-white border border-neutral-900 flex items-center justify-center rounded-none">
              <TrendingUp size={16} className="text-amber-400" />
            </div>
          </div>
          <div className="font-sport font-black text-xl lg:text-2xl text-neutral-950 tracking-tight truncate">
            {formatRupiah(metrics.grossRevenueMonth)}
          </div>
          <div className="mt-2 text-[11px] text-emerald-700 font-bold flex items-center gap-1 border-t border-neutral-100 pt-2">
            <ArrowUpRight size={13} />
            <span>+12.7% vs bulan lalu</span>
          </div>
        </div>

        {/* KPI 4: Revenue Bersih Bulan Ini */}
        <div className="bg-white border border-neutral-300 p-5 rounded-none shadow-2xs hover:border-black transition-colors">
          <div className="flex items-center justify-between text-neutral-600 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Revenue Bersih (Bulan)</span>
            <div className="w-8 h-8 bg-amber-50 text-amber-800 border border-amber-300 flex items-center justify-center rounded-none">
              <DollarSign size={16} />
            </div>
          </div>
          <div className="font-sport font-black text-xl lg:text-2xl text-amber-900 tracking-tight truncate">
            {formatRupiah(metrics.netRevenueMonth)}
          </div>
          <div className="mt-2 text-[11px] text-neutral-500 flex items-center justify-between border-t border-neutral-100 pt-2">
            <span>Margin Bersih: ~43%</span>
            <span className="text-emerald-700 font-bold">Laba Positif</span>
          </div>
        </div>

        {/* KPI 5: Total Saldo Rekening */}
        <div className="bg-neutral-950 text-white border border-black p-5 rounded-none shadow-md">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Total Saldo Rekening</span>
            <div className="w-8 h-8 bg-neutral-800 text-amber-400 border border-neutral-700 flex items-center justify-center rounded-none">
              <Wallet size={16} />
            </div>
          </div>
          <div className="font-sport font-black text-xl lg:text-2xl text-white tracking-tight truncate">
            {formatRupiah(metrics.accountBalance)}
          </div>
          <div className="mt-2 text-[11px] text-neutral-400 flex items-center justify-between border-t border-neutral-800 pt-2">
            <span>Buku Kas & Bank</span>
            <button 
              type="button" 
              onClick={() => onNavigate('finance')}
              className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-0.5 cursor-pointer font-sport uppercase"
            >
              <span>Detail</span>
              <ArrowRight size={11} />
            </button>
          </div>
        </div>

      </div>

      {/* 3. Performa Grafik Revenue Interaktif (Filter: Bulan & Minggu) */}
      <div className="bg-white border border-neutral-300 p-5 sm:p-6 rounded-none shadow-2xs">
        {/* Chart Header & Toggle Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-neutral-200">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 size={20} className="text-amber-600" />
              <h2 className="text-lg sm:text-xl font-black text-neutral-950 font-sport uppercase tracking-tight">
                Grafik Performa Revenue Toko
              </h2>
            </div>
            <p className="text-xs text-neutral-600 mt-1">
              Perbandingan tren Revenue Kotor (Gross) dan Revenue Bersih (Net Margin) real-time.
            </p>
          </div>

          {/* Tab Filter Periode: Bulan vs Minggu */}
          <div className="flex items-center border border-neutral-300 bg-neutral-100 p-1 rounded-none self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setChartPeriod('monthly')}
              className={`px-3.5 py-1.5 text-xs font-sport font-black uppercase tracking-wider transition-colors cursor-pointer rounded-none ${
                chartPeriod === 'monthly'
                  ? 'bg-black text-white shadow-xs'
                  : 'text-neutral-700 hover:text-black hover:bg-neutral-200'
              }`}
            >
              Bulan
            </button>
            <button
              type="button"
              onClick={() => setChartPeriod('weekly')}
              className={`px-3.5 py-1.5 text-xs font-sport font-black uppercase tracking-wider transition-colors cursor-pointer rounded-none ${
                chartPeriod === 'weekly'
                  ? 'bg-black text-white shadow-xs'
                  : 'text-neutral-700 hover:text-black hover:bg-neutral-200'
              }`}
            >
              Minggu
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-6 pt-4 text-xs font-bold uppercase tracking-wider text-neutral-700">
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 bg-neutral-900 rounded-none border border-black"></div>
            <span>Revenue Kotor (Gross)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 bg-amber-500 rounded-none border border-amber-600"></div>
            <span>Revenue Bersih (Net)</span>
          </div>
        </div>

        {/* Bar Chart Visualization Area */}
        <div className="mt-6 pt-2">
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 sm:gap-6 items-end h-64 border-b border-neutral-200 pb-3">
            {activeChartData.map((bar, idx) => {
              const grossHeight = Math.round((bar.gross / maxGross) * 100);
              const netHeight = Math.round((bar.net / maxGross) * 100);
              const isHovered = hoveredBar === idx;

              return (
                <div 
                  key={bar.label} 
                  className="flex flex-col items-center h-full justify-end group relative cursor-pointer"
                  onMouseEnter={() => setHoveredBar(idx)}
                  onMouseLeave={() => setHoveredBar(null)}
                >
                  {/* Tooltip Popup */}
                  {isHovered && (
                    <div className="absolute -top-16 z-20 bg-neutral-900 text-white text-[11px] p-2.5 rounded-none shadow-xl border border-neutral-700 whitespace-nowrap pointer-events-none">
                      <div className="font-bold text-amber-400 font-sport uppercase">{bar.label}</div>
                      <div className="mt-0.5">Kotor: <span className="font-mono font-bold">{formatRupiah(bar.gross)}</span></div>
                      <div>Bersih: <span className="font-mono font-bold text-emerald-400">{formatRupiah(bar.net)}</span></div>
                    </div>
                  )}

                  {/* Dual Bars Container */}
                  <div className="w-full flex items-end justify-center gap-1.5 sm:gap-2.5 h-full">
                    {/* Gross Bar */}
                    <div 
                      style={{ height: `${grossHeight}%` }}
                      className="w-5 sm:w-8 bg-neutral-900 hover:bg-neutral-800 transition-all rounded-none relative flex flex-col justify-between"
                    >
                      <span className="sr-only">{formatRupiah(bar.gross)}</span>
                    </div>

                    {/* Net Bar */}
                    <div 
                      style={{ height: `${netHeight}%` }}
                      className="w-5 sm:w-8 bg-amber-500 hover:bg-amber-400 transition-all rounded-none relative flex flex-col justify-between"
                    >
                      <span className="sr-only">{formatRupiah(bar.net)}</span>
                    </div>
                  </div>

                  {/* Growth Tag */}
                  <div className="mt-2 text-[10px] font-mono font-bold text-emerald-700 truncate">
                    {bar.growth}
                  </div>

                  {/* Label Bawah */}
                  <div className="mt-1 text-[11px] font-bold text-neutral-800 truncate text-center max-w-full">
                    {bar.label.split(' ')[0]}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart Summary Footer */}
        <div className="mt-4 pt-3 border-t border-neutral-100 flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-500 gap-2">
          <div>
            Periode aktif: <span className="font-bold text-neutral-900">{chartPeriod === 'monthly' ? '6 Bulan Terakhir (Apr - Sep 2026)' : 'Bulan Ini (Minggu 1 - 4 Sep 2026)'}</span>
          </div>
          <div className="font-mono text-neutral-700 font-bold">
            Total Perputaran: {formatRupiah(activeChartData.reduce((acc, c) => acc + c.gross, 0))}
          </div>
        </div>
      </div>

      {/* 4. PRD Fase 5: Business Intelligence (Fast vs Slow Moving & Loyalty Points Liability) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* BI Widget 1: Fast Moving vs Slow Moving SKUs */}
        <div className="bg-white border border-neutral-300 p-5 rounded-none shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-200">
            <div>
              <div className="flex items-center gap-2">
                <Zap size={18} className="text-amber-600" />
                <h3 className="font-sport font-black text-base uppercase text-neutral-950">
                  Analisis Fast vs Slow Moving SKU
                </h3>
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">
                Pemantauan velocity penjualan per minggu & rasio perputaran hari stok gudang.
              </p>
            </div>

            {/* Toggle Tab */}
            <div className="flex items-center border border-neutral-300 bg-neutral-100 p-1 rounded-none self-start">
              <button
                type="button"
                onClick={() => setBiTab('fast')}
                className={`px-3 py-1 text-xs font-sport font-black uppercase tracking-wider rounded-none cursor-pointer transition-colors ${
                  biTab === 'fast'
                    ? 'bg-neutral-950 text-white'
                    : 'text-neutral-600 hover:text-black'
                }`}
              >
                Fast-Moving
              </button>
              <button
                type="button"
                onClick={() => setBiTab('slow')}
                className={`px-3 py-1 text-xs font-sport font-black uppercase tracking-wider rounded-none cursor-pointer transition-colors ${
                  biTab === 'slow'
                    ? 'bg-neutral-950 text-white'
                    : 'text-neutral-600 hover:text-black'
                }`}
              >
                Slow-Moving
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-neutral-100 border-b border-neutral-300 font-sport font-black uppercase text-[11px] text-neutral-700">
                  <th className="py-2.5 px-3">SKU & Produk</th>
                  <th className="py-2.5 px-3 text-center">Velocity/Mgg</th>
                  <th className="py-2.5 px-3 text-center">Hari Stok</th>
                  <th className="py-2.5 px-3 text-center">On-Hand</th>
                  <th className="py-2.5 px-3 text-right">Rekomendasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 font-sans">
                {(biTab === 'fast' ? fastMovingSKUs : slowMovingSKUs).map((item) => (
                  <tr key={item.sku} className="hover:bg-neutral-50">
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-neutral-950">{item.name}</div>
                      <div className="font-mono text-[10px] text-neutral-500">{item.sku}</div>
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold">
                      {item.soldWeekly} pcs
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-neutral-600">
                      {item.turnoverDays} hari
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold text-neutral-900">
                      {item.stockOnHand} unit
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <span className={`px-2 py-0.5 text-[10px] font-sport font-bold uppercase rounded-none border ${
                        biTab === 'fast'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : 'bg-amber-50 text-amber-800 border-amber-300'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-[11px] text-neutral-500">
            <span>Data diperbarui otomatis dari rekonsiliasi checkout & pesanan.</span>
            <button
              type="button"
              onClick={() => onNavigate('procurement')}
              className="text-amber-700 hover:text-amber-900 font-sport font-black uppercase flex items-center gap-1 cursor-pointer"
            >
              <span>Procurement ERP</span>
              <ArrowRight size={12} />
            </button>
          </div>
        </div>

        {/* BI Widget 2: Customer Loyalty Points Liability Monitor */}
        <div className="bg-white border border-neutral-300 p-5 rounded-none shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
            <div className="flex items-center gap-2">
              <Award size={18} className="text-amber-600" />
              <h3 className="font-sport font-black text-base uppercase text-neutral-950">
                Liabilitas Poin Loyalitas Member
              </h3>
            </div>
            <span className="px-2 py-0.5 bg-neutral-100 text-neutral-700 border border-neutral-300 font-mono text-[10px] font-bold uppercase rounded-none">
              Valuasi: 1 Pts = Rp 10
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-3.5 bg-neutral-50 border border-neutral-200 rounded-none space-y-1">
              <span className="text-[10px] font-mono uppercase text-neutral-500 font-bold block">
                Total Poin Beredar (Active)
              </span>
              <div className="font-sport font-black text-2xl text-neutral-950">
                {loyaltyMetrics.totalPointsOutstanding.toLocaleString('id-ID')} Pts
              </div>
              <span className="text-[11px] text-neutral-500 block">
                Dimiliki oleh member terdaftar
              </span>
            </div>

            <div className="p-3.5 bg-amber-50/40 border border-amber-300 rounded-none space-y-1">
              <span className="text-[10px] font-mono uppercase text-amber-900 font-bold block">
                Beban Liabilitas Finansial
              </span>
              <div className="font-sport font-black text-2xl text-amber-900 font-mono">
                {formatRupiah(loyaltyMetrics.totalFinancialLiability)}
              </div>
              <span className="text-[11px] text-amber-700 block">
                Kewajiban kas saat ditukar
              </span>
            </div>
          </div>

          <div className="space-y-2 text-xs border border-neutral-200 p-3.5 bg-white rounded-none">
            <div className="flex justify-between items-center text-neutral-600">
              <span>Tingkat Penukaran Poin (Redemption Rate):</span>
              <span className="font-mono font-bold text-neutral-900">{loyaltyMetrics.redemptionRate}%</span>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-neutral-200 h-2 rounded-none overflow-hidden">
              <div 
                className="bg-neutral-950 h-full rounded-none" 
                style={{ width: `${loyaltyMetrics.redemptionRate}%` }}
              />
            </div>
            <div className="flex justify-between items-center pt-2 text-neutral-600 border-t border-neutral-100">
              <span>Poin Kedaluwarsa Bulan Ini:</span>
              <span className="font-mono font-bold text-amber-800">
                {loyaltyMetrics.pointsExpiringThisMonth.toLocaleString('id-ID')} Pts ({formatRupiah(loyaltyMetrics.liabilityExpiringThisMonth)})
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-[11px] text-neutral-500">
            <span>Cadangan dana liabilitas dialokasikan pada Buku Kas COA.</span>
            <button
              type="button"
              onClick={() => onNavigate('finance')}
              className="text-amber-700 hover:text-amber-900 font-sport font-black uppercase flex items-center gap-1 cursor-pointer"
            >
              <span>Audit Buku Kas</span>
              <ArrowRight size={12} />
            </button>
          </div>
        </div>

      </div>

      {/* 5. Quick Navigational Shortcuts */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-neutral-300 p-4 rounded-none shadow-2xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-neutral-100 border border-neutral-300 text-neutral-900 flex items-center justify-center rounded-none">
              <Boxes size={20} />
            </div>
            <div>
              <div className="font-sport font-black text-sm uppercase text-neutral-950">
                Stok Multi-Gudang
              </div>
              <div className="text-xs text-neutral-500">
                {metrics.lowStockCount} SKU perlu restok
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('stock')}
            className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-sport font-black uppercase rounded-none transition-colors cursor-pointer"
          >
            Buka
          </button>
        </div>

        <div className="bg-white border border-neutral-300 p-4 rounded-none shadow-2xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-neutral-100 border border-neutral-300 text-neutral-900 flex items-center justify-center rounded-none">
              <Truck size={20} />
            </div>
            <div>
              <div className="font-sport font-black text-sm uppercase text-neutral-950">
                Pengadaan (PO & GRN)
              </div>
              <div className="text-xs text-neutral-500">
                Manajemen Vendor & Tagihan
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('procurement')}
            className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-sport font-black uppercase rounded-none transition-colors cursor-pointer"
          >
            Buka
          </button>
        </div>

        <div className="bg-white border border-neutral-300 p-4 rounded-none shadow-2xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-neutral-100 border border-neutral-300 text-neutral-900 flex items-center justify-center rounded-none">
              <ShoppingBag size={20} />
            </div>
            <div>
              <div className="font-sport font-black text-sm uppercase text-neutral-950">
                Antrean Pesanan
              </div>
              <div className="text-xs text-neutral-500">
                {orders.length} pesanan aktif
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('orders')}
            className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-sport font-black uppercase rounded-none transition-colors cursor-pointer"
          >
            Buka
          </button>
        </div>

        <div className="bg-white border border-neutral-300 p-4 rounded-none shadow-2xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-neutral-100 border border-neutral-300 text-neutral-900 flex items-center justify-center rounded-none">
              <Wallet size={20} />
            </div>
            <div>
              <div className="font-sport font-black text-sm uppercase text-neutral-950">
                Keuangan & COA
              </div>
              <div className="text-xs text-neutral-500">
                HPP & Margin Laba
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('finance')}
            className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-sport font-black uppercase rounded-none transition-colors cursor-pointer"
          >
            Buka
          </button>
        </div>
      </div>

    </div>
  );
}
