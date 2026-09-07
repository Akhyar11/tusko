import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  Filter,
  Download,
  PlusCircle,
  FileText,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Calendar,
  Wallet,
  Building2,
  ShoppingBag,
  CreditCard,
  Printer,
  X,
  Sparkles,
  RefreshCw,
  Boxes
} from 'lucide-react';
import { formatRupiah } from '../utils/formatters';
import { mockTransactions, transactionCategories } from '../data/mockTransactions';

export default function FinancialTransactionsPage({
  transactions: initialTransactions = mockTransactions,
  onBackToShopping = () => {},
  onViewOrders = () => {},
  onViewOrderDetail = () => {},
  onOpenStock = () => {}
}) {
  const [transactions, setTransactions] = useState(initialTransactions);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'income' | 'expense' | 'pending'
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [dateRange, setDateRange] = useState('all'); // 'all' | 'this_month' | '30days' | '7days'
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [receiptModalTx, setReceiptModalTx] = useState(null);
  
  // New transaction form state
  const [formType, setFormType] = useState('expense');
  const [formCategory, setFormCategory] = useState('operational');
  const [formAmount, setFormAmount] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPaymentMethod, setFormPaymentMethod] = useState('Kas Toko / QRIS');
  const [formSuccessMessage, setFormSuccessMessage] = useState('');

  // Hitung KPI Keuangan
  const stats = useMemo(() => {
    let totalIncome = 0;
    let totalExpense = 0;
    let totalPending = 0;
    let settledCount = 0;

    transactions.forEach((tx) => {
      if (tx.status === 'settled') {
        settledCount++;
        if (tx.type === 'income') {
          totalIncome += Number(tx.amount);
        } else if (tx.type === 'expense') {
          totalExpense += Number(tx.amount);
        }
      } else if (tx.status === 'pending') {
        totalPending += Number(tx.amount);
      }
    });

    const netCashflow = totalIncome - totalExpense;

    return {
      totalIncome,
      totalExpense,
      totalPending,
      netCashflow,
      settledCount,
      totalCount: transactions.length
    };
  }, [transactions]);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // 1. Tab filter
      if (activeTab === 'income' && tx.type !== 'income') return false;
      if (activeTab === 'expense' && tx.type !== 'expense') return false;
      if (activeTab === 'pending' && tx.status !== 'pending') return false;

      // 2. Kategori filter
      if (selectedCategory !== 'all' && tx.category !== selectedCategory) return false;

      // 3. Tanggal filter
      if (dateRange !== 'all') {
        const txDate = new Date(tx.created_at);
        const now = new Date();
        const diffDays = (now - txDate) / (1000 * 60 * 60 * 24);
        if (dateRange === '7days' && diffDays > 7) return false;
        if (dateRange === '30days' && diffDays > 30) return false;
        if (dateRange === 'this_month') {
          if (txDate.getMonth() !== now.getMonth() || txDate.getFullYear() !== now.getFullYear()) {
            return false;
          }
        }
      }

      // 4. Pencarian
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchNumber = tx.transaction_number?.toLowerCase().includes(q);
        const matchOrder = tx.order_number?.toLowerCase().includes(q);
        const matchDesc = tx.description?.toLowerCase().includes(q);
        const matchCustomer = tx.customer_name?.toLowerCase().includes(q);
        const matchMethod = tx.payment_method?.toLowerCase().includes(q);
        return matchNumber || matchOrder || matchDesc || matchCustomer || matchMethod;
      }

      return true;
    });
  }, [transactions, activeTab, selectedCategory, dateRange, searchQuery]);

  // Handle submit transaksi baru
  const handleAddTransaction = (e) => {
    e.preventDefault();
    if (!formAmount || Number(formAmount) <= 0 || !formDescription.trim()) return;

    const catObj = transactionCategories.find((c) => c.id === formCategory);
    const newTx = {
      id: Date.now(),
      transaction_number: `TRX/${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}/${formType === 'income' ? 'IN' : 'EX'}-${Math.floor(1000 + Math.random() * 9000)}`,
      order_id: null,
      order_number: null,
      type: formType,
      category: formCategory,
      category_label: catObj ? catObj.label : 'Transaksi Lain',
      amount: Number(formAmount),
      description: formDescription.trim(),
      payment_method: formPaymentMethod,
      status: 'settled',
      created_at: new Date().toISOString(),
      customer_name: formType === 'income' ? 'Pelanggan Toko' : 'Kasir / Admin'
    };

    setTransactions((prev) => [newTx, ...prev]);
    setFormAmount('');
    setFormDescription('');
    setFormSuccessMessage('Transaksi berhasil dicatat ke dalam buku kas!');
    setTimeout(() => {
      setFormSuccessMessage('');
      setIsAddModalOpen(false);
    }, 1200);
  };

  // Unduh CSV
  const handleExportCSV = () => {
    const headers = ['Nomor Transaksi', 'Tanggal', 'Tipe', 'Kategori', 'Nominal', 'Status', 'Metode Pembayaran', 'Nomor Order', 'Deskripsi'];
    const rows = filteredTransactions.map((t) => [
      t.transaction_number,
      new Date(t.created_at).toLocaleString('id-ID'),
      t.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
      t.category_label || t.category,
      t.amount,
      t.status,
      `"${t.payment_method || ''}"`,
      t.order_number || '-',
      `"${t.description.replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Laporan_Keuangan_Toko_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 mb-1">
            <button onClick={onBackToShopping} className="hover:text-amber-600 transition-colors cursor-pointer">
              Beranda
            </button>
            <ChevronRight size={13} />
            <button onClick={onViewOrders} className="hover:text-amber-600 transition-colors cursor-pointer">
              Pesanan
            </button>
            <ChevronRight size={13} />
            <span className="text-gray-900 font-bold">Transaksi Keuangan</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-950 flex items-center gap-2 tracking-tight">
            <Wallet className="text-amber-500" size={24} />
            Pencatatan Transaksi Keuangan
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
            Monitoring arus kas masuk & keluar, settlement gateway Midtrans, dan biaya operasional.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={onViewOrders}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
          >
            <ShoppingBag size={15} />
            <span>Lihat Pesanan</span>
          </button>
          <button
            type="button"
            onClick={onOpenStock}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-colors cursor-pointer"
          >
            <Boxes size={15} className="text-blue-600" />
            <span>Stok Gudang</span>
          </button>
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer shadow-2xs"
            title="Download CSV"
          >
            <Download size={15} />
            <span className="hidden sm:inline">Ekspor CSV</span>
          </button>
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-extrabold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <PlusCircle size={16} />
            <span>Catat Kas Baru</span>
          </button>
        </div>
      </div>

      {/* KPI Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Saldo Bersih */}
        <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 text-white p-5 rounded-2xl border border-neutral-750 shadow-md relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider uppercase text-neutral-400">Saldo Kas Bersih</span>
            <div className="w-8 h-8 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center text-amber-400">
              <Wallet size={16} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black tracking-tight text-white">
              {formatRupiah(stats.netCashflow)}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-[11px] text-neutral-300">
              <span className={`inline-flex items-center font-bold ${stats.netCashflow >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {stats.netCashflow >= 0 ? <TrendingUp size={13} className="mr-0.5" /> : <TrendingDown size={13} className="mr-0.5" />}
                {stats.netCashflow >= 0 ? 'Surplus Kas' : 'Defisit Kas'}
              </span>
              <span className="text-neutral-500">•</span>
              <span>{stats.settledCount} transaksi terselesaikan</span>
            </div>
          </div>
          <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-amber-500/10 rounded-full blur-xl pointer-events-none"></div>
        </div>

        {/* Card 2: Total Uang Masuk */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider uppercase text-gray-500">Total Uang Masuk</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <ArrowDownLeft size={16} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black tracking-tight text-emerald-600">
              +{formatRupiah(stats.totalIncome)}
            </div>
            <p className="mt-1 text-[11px] text-gray-500">
              Dari pembayaran pesanan & modal masuk
            </p>
          </div>
        </div>

        {/* Card 3: Total Uang Keluar */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider uppercase text-gray-500">Total Uang Keluar</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
              <ArrowUpRight size={16} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black tracking-tight text-rose-600">
              -{formatRupiah(stats.totalExpense)}
            </div>
            <p className="mt-1 text-[11px] text-gray-500">
              Ongkir kurir, restock, operasional & MDR
            </p>
          </div>
        </div>

        {/* Card 4: Menunggu Settlement */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider uppercase text-gray-500">Pending Settlement</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <Clock size={16} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black tracking-tight text-amber-600">
              {formatRupiah(stats.totalPending)}
            </div>
            <p className="mt-1 text-[11px] text-gray-500">
              Pesanan belum dibayar oleh customer
            </p>
          </div>
        </div>
      </div>

      {/* Main Filter & Table Container */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
        {/* Navigation Tabs */}
        <div className="flex items-center border-b border-gray-200 px-4 sm:px-6 overflow-x-auto gap-1 sm:gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`py-3.5 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'all'
                ? 'border-amber-500 text-amber-600'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            Semua Transaksi ({transactions.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('income')}
            className={`py-3.5 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'income'
                ? 'border-emerald-500 text-emerald-600'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Uang Masuk (Income)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('expense')}
            className={`py-3.5 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'expense'
                ? 'border-rose-500 text-rose-600'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            Uang Keluar (Expense)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('pending')}
            className={`py-3.5 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'pending'
                ? 'border-amber-500 text-amber-600'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            Tertunda (Pending)
          </button>
        </div>

        {/* Filter Toolbar */}
        <div className="p-4 sm:p-5 border-b border-gray-150 bg-gray-50/50 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nomor TRX, invoice, atau deskripsi..."
              className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-gray-900"
            />
            <Search className="absolute left-3 top-2.5 text-gray-400" size={15} />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Select Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 text-xs font-semibold bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-amber-500 text-gray-700 cursor-pointer"
            >
              {transactionCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>

            {/* Date Range Filter */}
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-2 text-xs font-semibold bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-amber-500 text-gray-700 cursor-pointer"
            >
              <option value="all">Semua Waktu</option>
              <option value="this_month">Bulan Ini (Sep 2026)</option>
              <option value="30days">30 Hari Terakhir</option>
              <option value="7days">7 Hari Terakhir</option>
            </select>

            {(searchQuery || selectedCategory !== 'all' || dateRange !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setDateRange('all');
                }}
                className="px-2.5 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
              >
                Reset Filter
              </button>
            )}
          </div>
        </div>

        {/* Transactions Content */}
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-gray-400 mb-3">
              <FileText size={28} />
            </div>
            <h3 className="text-base font-bold text-gray-800">Tidak ada transaksi ditemukan</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
              Tidak ada data yang cocok dengan kriteria filter saat ini. Silakan ubah kata kunci atau reset filter.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/80 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    <th className="py-3 px-4">No. Transaksi / Waktu</th>
                    <th className="py-3 px-4">Kategori & Keterangan</th>
                    <th className="py-3 px-4">Referensi Pesanan</th>
                    <th className="py-3 px-4">Metode Bayar</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Nominal</th>
                    <th className="py-3 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150 text-xs">
                  {filteredTransactions.map((tx) => {
                    const isIncome = tx.type === 'income';
                    const isPending = tx.status === 'pending';

                    return (
                      <tr key={tx.id} className="hover:bg-gray-50/80 transition-colors">
                        {/* No. Transaksi & Waktu */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-gray-900 font-mono text-[11px]">
                            {tx.transaction_number}
                          </div>
                          <div className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                            <Calendar size={11} />
                            {new Date(tx.created_at).toLocaleDateString('id-ID', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })}{' '}
                            •{' '}
                            {new Date(tx.created_at).toLocaleTimeString('id-ID', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </td>

                        {/* Kategori & Keterangan */}
                        <td className="py-3.5 px-4 max-w-xs">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span
                              className={`inline-block w-1.5 h-1.5 rounded-full ${
                                isIncome ? 'bg-emerald-500' : 'bg-rose-500'
                              }`}
                            ></span>
                            <span className="font-bold text-gray-800 text-[11px]">
                              {tx.category_label || tx.category}
                            </span>
                          </div>
                          <p className="text-gray-600 line-clamp-2 leading-relaxed">
                            {tx.description}
                          </p>
                        </td>

                        {/* Referensi Pesanan */}
                        <td className="py-3.5 px-4">
                          {tx.order_number ? (
                            <button
                              type="button"
                              onClick={() => onViewOrderDetail({ order_number: tx.order_number, id: tx.order_id })}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 font-mono text-[11px] font-bold transition-colors cursor-pointer"
                              title="Buka detail pesanan ini"
                            >
                              <span>{tx.order_number}</span>
                              <ExternalLink size={10} />
                            </button>
                          ) : (
                            <span className="text-gray-400 italic text-[11px]">Non-pesanan</span>
                          )}
                        </td>

                        {/* Metode Bayar */}
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-gray-800 flex items-center gap-1">
                            <CreditCard size={12} className="text-gray-400" />
                            <span>{tx.payment_method || '-'}</span>
                          </div>
                          {tx.customer_name && (
                            <div className="text-[10px] text-gray-500 mt-0.5">
                              Oleh: {tx.customer_name}
                            </div>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 text-center">
                          {isPending ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              <Clock size={10} />
                              Pending
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 size={10} />
                              Selesai
                            </span>
                          )}
                        </td>

                        {/* Nominal */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div
                            className={`font-black text-sm ${
                              isIncome ? 'text-emerald-600' : 'text-rose-600'
                            }`}
                          >
                            {isIncome ? '+' : '-'}
                            {formatRupiah(tx.amount)}
                          </div>
                          <div className="text-[10px] text-gray-400 uppercase font-semibold">
                            {isIncome ? 'Kas Masuk' : 'Kas Keluar'}
                          </div>
                        </td>

                        {/* Aksi */}
                        <td className="py-3.5 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => setReceiptModalTx(tx)}
                            className="p-1.5 text-gray-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                            title="Lihat Kuitansi / Bukti Kas"
                          >
                            <Printer size={15} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card-Based Listing (< md) */}
            <div className="md:hidden divide-y divide-gray-150">
              {filteredTransactions.map((tx) => {
                const isIncome = tx.type === 'income';
                const isPending = tx.status === 'pending';

                return (
                  <div key={tx.id} className="p-4 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-mono text-[11px] font-bold text-gray-800">
                        {tx.transaction_number}
                      </div>
                      {isPending ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock size={10} />
                          Pending
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 size={10} />
                          Selesai
                        </span>
                      )}
                    </div>

                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-xs font-bold text-gray-900">
                          {tx.category_label || tx.category}
                        </div>
                        <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">
                          {tx.description}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <div
                          className={`font-black text-sm ${
                            isIncome ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {isIncome ? '+' : '-'}
                          {formatRupiah(tx.amount)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1 border-t border-gray-100">
                      <div className="flex items-center gap-1.5">
                        <CreditCard size={12} />
                        <span>{tx.payment_method}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {tx.order_number && (
                          <button
                            type="button"
                            onClick={() => onViewOrderDetail({ order_number: tx.order_number, id: tx.order_id })}
                            className="text-amber-700 font-bold hover:underline"
                          >
                            {tx.order_number}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setReceiptModalTx(tx)}
                          className="text-gray-700 font-semibold p-1 hover:text-amber-600"
                          title="Lihat Kuitansi"
                        >
                          <Printer size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Table Footer / Summary Bar */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-600">
          <div>
            Menampilkan <span className="font-bold text-gray-900">{filteredTransactions.length}</span> dari{' '}
            <span className="font-bold text-gray-900">{transactions.length}</span> catatan keuangan.
          </div>
          <div className="flex items-center gap-3">
            <span className="font-medium">
              Subtotal Baris Tampil:
            </span>
            <span className="font-bold text-emerald-700">
              +{formatRupiah(filteredTransactions.filter(t => t.type === 'income' && t.status === 'settled').reduce((s, i) => s + i.amount, 0))}
            </span>
            <span>/</span>
            <span className="font-bold text-rose-700">
              -{formatRupiah(filteredTransactions.filter(t => t.type === 'expense' && t.status === 'settled').reduce((s, i) => s + i.amount, 0))}
            </span>
          </div>
        </div>
      </div>

      {/* MODAL: Catat Transaksi Baru Manual */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-150 bg-neutral-900 text-white">
              <div className="flex items-center gap-2">
                <PlusCircle className="text-amber-400" size={18} />
                <h3 className="font-bold text-sm sm:text-base">Catat Transaksi Kas Baru</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-neutral-400 hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddTransaction} className="p-4 sm:p-5 space-y-4 text-xs sm:text-sm">
              {formSuccessMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                  <span>{formSuccessMessage}</span>
                </div>
              )}

              {/* Tipe Transaksi (Income / Expense) */}
              <div>
                <label className="block font-bold text-gray-700 mb-1.5">Jenis Transaksi</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFormType('income');
                      setFormCategory('order_payment');
                    }}
                    className={`py-2.5 px-3 rounded-xl font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                      formType === 'income'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300 ring-2 ring-emerald-500/20'
                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <ArrowDownLeft size={16} className="text-emerald-600" />
                    <span>Uang Masuk (Income)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormType('expense');
                      setFormCategory('operational');
                    }}
                    className={`py-2.5 px-3 rounded-xl font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                      formType === 'expense'
                        ? 'bg-rose-50 text-rose-700 border-rose-300 ring-2 ring-rose-500/20'
                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <ArrowUpRight size={16} className="text-rose-600" />
                    <span>Uang Keluar (Expense)</span>
                  </button>
                </div>
              </div>

              {/* Kategori */}
              <div>
                <label className="block font-bold text-gray-700 mb-1.5">Kategori Transaksi</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:border-amber-500 font-medium text-gray-800"
                >
                  {formType === 'income' ? (
                    <>
                      <option value="order_payment">Pembayaran Pesanan</option>
                      <option value="capital_deposit">Modal / Setoran Kas</option>
                      <option value="other_income">Pendapatan Lainnya</option>
                    </>
                  ) : (
                    <>
                      <option value="operational">Operasional & Kemasan</option>
                      <option value="shipping_fee">Ongkos Kirim Kurir</option>
                      <option value="gateway_fee">Biaya Payment Gateway (Midtrans)</option>
                      <option value="restock">Pengadaan Stok Produk</option>
                      <option value="refund">Pengembalian Dana (Refund)</option>
                    </>
                  )}
                </select>
              </div>

              {/* Nominal (Rp) */}
              <div>
                <label className="block font-bold text-gray-700 mb-1.5">Nominal (Rp)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 font-bold text-gray-400">Rp</span>
                  <input
                    type="number"
                    min="1"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    placeholder="Contoh: 150000"
                    required
                    className="w-full pl-10 pr-3 py-2.5 bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-amber-500 font-bold text-gray-900"
                  />
                </div>
              </div>

              {/* Keterangan / Deskripsi */}
              <div>
                <label className="block font-bold text-gray-700 mb-1.5">Deskripsi / Catatan</label>
                <textarea
                  rows="2"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Tuliskan keterangan detail transaksi..."
                  required
                  className="w-full p-2.5 bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-amber-500 text-gray-900"
                ></textarea>
              </div>

              {/* Metode Pembayaran / Akun Kas */}
              <div>
                <label className="block font-bold text-gray-700 mb-1.5">Metode / Akun Kas</label>
                <select
                  value={formPaymentMethod}
                  onChange={(e) => setFormPaymentMethod(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:border-amber-500 font-medium text-gray-800"
                >
                  <option value="Kas Toko / Tunai">Kas Toko / Tunai</option>
                  <option value="Kas Toko / QRIS">Kas Toko / QRIS</option>
                  <option value="BCA Bisnis Transfer">BCA Bisnis Transfer</option>
                  <option value="Bank Mandiri Transfer">Bank Mandiri Transfer</option>
                  <option value="Saldo Ekspedisi SiCepat">Saldo Ekspedisi SiCepat</option>
                  <option value="Midtrans Settlement Fee">Midtrans Settlement Fee</option>
                </select>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-extrabold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Simpan Catatan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Kuitansi / Bukti Digital Transaksi */}
      {receiptModalTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 bg-neutral-900 text-white">
              <div className="flex items-center gap-2">
                <FileText className="text-amber-400" size={18} />
                <span className="font-bold text-xs uppercase tracking-wider">Kuitansi Kas Toko</span>
              </div>
              <button
                type="button"
                onClick={() => setReceiptModalTx(null)}
                className="text-neutral-400 hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Receipt Body */}
            <div className="p-6 space-y-4 text-xs font-sans">
              <div className="text-center pb-3 border-b border-dashed border-gray-300">
                <div className="text-lg font-black tracking-tight text-neutral-900">
                  TUSKO OFFICIAL STORE
                </div>
                <div className="text-[11px] text-gray-500 mt-0.5">
                  Bukti Pencatatan Arus Kas Keuangan Resmi
                </div>
                <div className="text-[11px] font-mono text-gray-700 font-bold mt-1">
                  {receiptModalTx.transaction_number}
                </div>
              </div>

              {/* Rincian Baris */}
              <div className="space-y-2 text-gray-700">
                <div className="flex justify-between">
                  <span className="text-gray-500">Tanggal & Waktu</span>
                  <span className="font-medium text-gray-900">
                    {new Date(receiptModalTx.created_at).toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Jenis Transaksi</span>
                  <span
                    className={`font-bold uppercase ${
                      receiptModalTx.type === 'income' ? 'text-emerald-700' : 'text-rose-700'
                    }`}
                  >
                    {receiptModalTx.type === 'income' ? 'Uang Masuk (+)' : 'Uang Keluar (-)'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Kategori</span>
                  <span className="font-semibold text-gray-900">
                    {receiptModalTx.category_label || receiptModalTx.category}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Metode / Akun</span>
                  <span className="font-medium text-gray-900">{receiptModalTx.payment_method}</span>
                </div>
                {receiptModalTx.order_number && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">No. Referensi Pesanan</span>
                    <span className="font-mono font-bold text-amber-800">
                      {receiptModalTx.order_number}
                    </span>
                  </div>
                )}
                {receiptModalTx.customer_name && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Pihak Terkait</span>
                    <span className="font-medium text-gray-900">{receiptModalTx.customer_name}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-gray-200">
                  <span className="text-gray-500 block mb-1">Catatan / Uraian:</span>
                  <p className="p-2.5 bg-gray-50 rounded-xl text-gray-800 italic leading-relaxed border border-gray-200">
                    "{receiptModalTx.description}"
                  </p>
                </div>
              </div>

              {/* Total Box */}
              <div className="p-3.5 bg-neutral-900 text-white rounded-xl flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                  Jumlah Bersih
                </span>
                <span
                  className={`text-base font-black ${
                    receiptModalTx.type === 'income' ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {receiptModalTx.type === 'income' ? '+' : '-'}
                  {formatRupiah(receiptModalTx.amount)}
                </span>
              </div>

              <div className="text-center text-[10px] text-gray-400 pt-1">
                Tercatat otomatis dan tersinkronisasi dengan database Toko Online.
              </div>
            </div>

            {/* Receipt Modal Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setReceiptModalTx(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Printer size={14} />
                <span>Cetak Bukti</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
