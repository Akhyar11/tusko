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
  Boxes,
  PieChart,
  BookOpen,
  ArrowRightLeft,
  Landmark,
  Layers
} from 'lucide-react';
import { formatRupiah } from '../utils/formatters';
import { 
  mockTransactions, 
  transactionCategories,
  mockFinancialAccounts,
  mockChartOfAccounts,
  mockCogsAnalytics
} from '../data/mockTransactions';

export default function FinancialTransactionsPage({
  transactions: initialTransactions = mockTransactions,
  onBackToShopping = () => {},
  onViewOrders = () => {},
  onViewOrderDetail = () => {},
  onOpenStock = () => {}
}) {
  const [transactions, setTransactions] = useState(initialTransactions);
  const [financialAccounts, setFinancialAccounts] = useState(mockFinancialAccounts);
  const [chartOfAccounts] = useState(mockChartOfAccounts);
  const [cogsAnalytics] = useState(mockCogsAnalytics);

  // Active Main Tab: 'cashbook' | 'accounts' | 'coa' | 'cogs'
  const [activeMainTab, setActiveMainTab] = useState('cashbook');

  // Sub-filter for cashbook: 'all' | 'income' | 'expense' | 'pending'
  const [cashbookFilter, setCashbookFilter] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [dateRange, setDateRange] = useState('all'); // 'all' | 'this_month' | '30days' | '7days'
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [receiptModalTx, setReceiptModalTx] = useState(null);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  // New transaction form state
  const [formType, setFormType] = useState('expense');
  const [formCategory, setFormCategory] = useState('operational');
  const [formAmount, setFormAmount] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPaymentMethod, setFormPaymentMethod] = useState('BCA Bisnis Transfer');
  const [formSuccessMessage, setFormSuccessMessage] = useState('');

  // Internal transfer form state
  const [transferFrom, setTransferFrom] = useState(1);
  const [transferTo, setTransferTo] = useState(3);
  const [transferAmount, setTransferAmount] = useState('');
  const [transferNotes, setTransferNotes] = useState('');

  // Hitung KPI Keuangan Global
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
    const totalLiquidBalance = financialAccounts.reduce((sum, acc) => sum + Number(acc.balance), 0);

    return {
      totalIncome,
      totalExpense,
      totalPending,
      netCashflow,
      settledCount,
      totalCount: transactions.length,
      totalLiquidBalance
    };
  }, [transactions, financialAccounts]);

  // Filtered transactions for cashbook
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // 1. Tab filter
      if (cashbookFilter === 'income' && tx.type !== 'income') return false;
      if (cashbookFilter === 'expense' && tx.type !== 'expense') return false;
      if (cashbookFilter === 'pending' && tx.status !== 'pending') return false;

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
        const matchCategory = tx.category_label?.toLowerCase().includes(q);
        return matchNumber || matchOrder || matchDesc || matchCustomer || matchCategory;
      }

      return true;
    });
  }, [transactions, cashbookFilter, selectedCategory, dateRange, searchQuery]);

  // Simpan Transaksi Baru Manual
  const handleSaveTransaction = (e) => {
    e.preventDefault();
    if (!formAmount || isNaN(formAmount) || Number(formAmount) <= 0) return;

    const matchedCat = transactionCategories.find((c) => c.id === formCategory);
    const newTx = {
      id: Date.now(),
      transaction_number: `TRX/${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}/${formType === 'income' ? 'IN' : 'EX'}-${Math.floor(1000 + Math.random() * 9000)}`,
      order_id: null,
      order_number: null,
      type: formType,
      category: formCategory,
      category_label: matchedCat?.label || 'Manual Record',
      amount: Number(formAmount),
      description: formDescription || `Catatan manual ${matchedCat?.label || ''}`,
      payment_method: formPaymentMethod,
      status: 'settled',
      created_at: new Date().toISOString(),
      customer_name: formType === 'income' ? 'Pelanggan Walk-In / Tunai' : 'Pengeluaran Toko'
    };

    setTransactions((prev) => [newTx, ...prev]);
    setFormSuccessMessage(`Berhasil mencatat transaksi ${newTx.transaction_number}!`);

    setTimeout(() => {
      setFormSuccessMessage('');
      setIsAddModalOpen(false);
      setFormAmount('');
      setFormDescription('');
    }, 1200);
  };

  // Transfer Antar Rekening
  const handleTransfer = (e) => {
    e.preventDefault();
    const amt = Number(transferAmount);
    if (isNaN(amt) || amt <= 0) return;
    if (transferFrom === transferTo) return;

    setFinancialAccounts(prev => prev.map(acc => {
      if (acc.id === Number(transferFrom)) {
        return { ...acc, balance: acc.balance - amt };
      }
      if (acc.id === Number(transferTo)) {
        return { ...acc, balance: acc.balance + amt };
      }
      return acc;
    }));

    const fromAcc = financialAccounts.find(a => a.id === Number(transferFrom));
    const toAcc = financialAccounts.find(a => a.id === Number(transferTo));

    const transferTx = {
      id: Date.now(),
      transaction_number: `TRX/${new Date().toISOString().slice(0, 10).replace(/-/g, '')}/TRF-${Math.floor(100 + Math.random() * 900)}`,
      order_id: null,
      order_number: null,
      type: 'expense',
      category: 'operational',
      category_label: 'Transfer Antar Rekening',
      amount: amt,
      description: `Transfer internal: dari ${fromAcc?.name} ke ${toAcc?.name}. ${transferNotes || ''}`.trim(),
      payment_method: fromAcc?.name || 'Bank Transfer',
      status: 'settled',
      created_at: new Date().toISOString(),
      customer_name: 'Internal Toko'
    };
    setTransactions(prev => [transferTx, ...prev]);

    setIsTransferModalOpen(false);
    setTransferAmount('');
    setTransferNotes('');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 border border-gray-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-neutral-950 tracking-tight">
            Buku Kas, Akun & Laporan Keuangan
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Pencatatan arus kas, rekening bank, bagan akun (COA), dan analisis margin laba kotor toko olahraga.
          </p>
        </div>

        {/* Top Header Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setIsTransferModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <ArrowRightLeft size={14} className="text-gray-600" />
            <span>Transfer Rekening</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-extrabold text-neutral-950 bg-amber-400 hover:bg-amber-300 border border-amber-500 shadow-xs transition-all cursor-pointer"
          >
            <PlusCircle size={15} />
            <span>+ Catat Transaksi Baru</span>
          </button>
        </div>
      </div>

      {/* 4 KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Net Cashflow */}
        <div className="bg-neutral-900 text-white p-5 border border-neutral-800 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              Arus Kas Bersih (Net)
            </span>
            <Wallet size={18} className="text-amber-400" />
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-black font-mono text-amber-400 truncate">
            {formatRupiah(stats.netCashflow)}
          </div>
          <p className="text-[11px] text-neutral-400 mt-1 truncate">
            Selisih penerimaan vs pengeluaran kas
          </p>
        </div>

        {/* Total Income */}
        <div className="bg-white p-5 border border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Total Pemasukan Kas
            </span>
            <TrendingUp size={18} className="text-emerald-600" />
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-black font-mono text-emerald-700 truncate">
            {formatRupiah(stats.totalIncome)}
          </div>
          <p className="text-[11px] text-gray-500 mt-1">Pembayaran order & setoran modal</p>
        </div>

        {/* Total Expense */}
        <div className="bg-white p-5 border border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Total Pengeluaran Kas
            </span>
            <TrendingDown size={18} className="text-rose-600" />
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-black font-mono text-rose-700 truncate">
            {formatRupiah(stats.totalExpense)}
          </div>
          <p className="text-[11px] text-gray-500 mt-1">Restock, ongkir, gateway & ops</p>
        </div>

        {/* Total Liquid Bank Balances */}
        <div className="bg-neutral-50 p-5 border border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-700">
              Saldo Bank & Kas Riil
            </span>
            <Landmark size={18} className="text-blue-600" />
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-black font-mono text-neutral-950 truncate">
            {formatRupiah(stats.totalLiquidBalance)}
          </div>
          <p className="text-[11px] text-gray-500 mt-1">Konsolidasi 4 rekening aktif</p>
        </div>
      </div>

      {/* Main Tabs Container */}
      <div className="bg-white border border-gray-200 overflow-hidden">
        {/* Tab Headers */}
        <div className="flex items-center border-b border-gray-200 overflow-x-auto bg-gray-50">
          <button
            type="button"
            onClick={() => setActiveMainTab('cashbook')}
            className={`px-5 py-3.5 text-xs font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer border-b-2 transition-all shrink-0 ${
              activeMainTab === 'cashbook'
                ? 'bg-white text-neutral-950 border-neutral-950 shadow-xs'
                : 'text-gray-500 border-transparent hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Wallet size={16} />
            <span>Buku Kas & Jurnal Mutasi ({filteredTransactions.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMainTab('accounts')}
            className={`px-5 py-3.5 text-xs font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer border-b-2 transition-all shrink-0 ${
              activeMainTab === 'accounts'
                ? 'bg-white text-neutral-950 border-neutral-950 shadow-xs'
                : 'text-gray-500 border-transparent hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Landmark size={16} />
            <span>Rekening Kas & Bank ({financialAccounts.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMainTab('coa')}
            className={`px-5 py-3.5 text-xs font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer border-b-2 transition-all shrink-0 ${
              activeMainTab === 'coa'
                ? 'bg-white text-neutral-950 border-neutral-950 shadow-xs'
                : 'text-gray-500 border-transparent hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <BookOpen size={16} />
            <span>Bagan Akun (Chart of Accounts) ({chartOfAccounts.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMainTab('cogs')}
            className={`px-5 py-3.5 text-xs font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer border-b-2 transition-all shrink-0 ${
              activeMainTab === 'cogs'
                ? 'bg-white text-neutral-950 border-neutral-950 shadow-xs'
                : 'text-gray-500 border-transparent hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <PieChart size={16} />
            <span>Analisis HPP & Margin Kotor</span>
          </button>
        </div>

        {/* Tab 1: Cashbook & Transactions */}
        {activeMainTab === 'cashbook' && (
          <div>
            {/* Filter Bar */}
            <div className="p-4 sm:p-5 border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white">
              {/* Search input */}
              <div className="relative flex-1 max-w-md">
                <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nomor TRX, invoice, keterangan, atau pelanggan..."
                  className="w-full pl-9 pr-8 py-2 text-xs bg-white border border-gray-300 focus:outline-none focus:border-amber-500 text-gray-900"
                />
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

              {/* Controls */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Cashbook Sub-Filter */}
                <select
                  value={cashbookFilter}
                  onChange={(e) => setCashbookFilter(e.target.value)}
                  className="px-3 py-2 text-xs font-semibold bg-white border border-gray-300 focus:outline-none focus:border-amber-500 text-gray-700 cursor-pointer"
                >
                  <option value="all">Semua Tipe Kas</option>
                  <option value="income">Kas Masuk (Income)</option>
                  <option value="expense">Kas Keluar (Expense)</option>
                  <option value="pending">Menunggu Pembayaran (Pending)</option>
                </select>

                {/* Category Filter */}
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 text-xs font-semibold bg-white border border-gray-300 focus:outline-none focus:border-amber-500 text-gray-700 cursor-pointer"
                >
                  {transactionCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>

                {/* Date Filter */}
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="px-3 py-2 text-xs font-semibold bg-white border border-gray-300 focus:outline-none focus:border-amber-500 text-gray-700 cursor-pointer"
                >
                  <option value="all">Semua Tanggal</option>
                  <option value="this_month">Bulan Ini</option>
                  <option value="30days">30 Hari Terakhir</option>
                  <option value="7days">7 Hari Terakhir</option>
                </select>

                {(cashbookFilter !== 'all' || selectedCategory !== 'all' || dateRange !== 'all' || searchQuery) && (
                  <button
                    type="button"
                    onClick={() => {
                      setCashbookFilter('all');
                      setSelectedCategory('all');
                      setDateRange('all');
                      setSearchQuery('');
                    }}
                    className="px-2.5 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer border border-rose-200"
                  >
                    Reset Filter
                  </button>
                )}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-600">
                <thead className="bg-neutral-900 text-white uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">No. Transaksi & Waktu</th>
                    <th className="py-3 px-4">Kategori & Keterangan</th>
                    <th className="py-3 px-4">Metode Bayar / Rekening</th>
                    <th className="py-3 px-4 text-right">Nominal (Rp)</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Bukti / Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-gray-500">
                        Tidak ada transaksi yang cocok dengan filter yang dipilih.
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((tx) => {
                      const isIncome = tx.type === 'income';
                      const isSettled = tx.status === 'settled';

                      return (
                        <tr key={tx.id} className="hover:bg-neutral-50 transition-colors">
                          {/* No TRX & Waktu */}
                          <td className="py-3.5 px-4">
                            <div className="font-mono font-bold text-gray-900">{tx.transaction_number}</div>
                            <div className="text-[11px] text-gray-500">
                              {new Date(tx.created_at).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                            {tx.order_number && (
                              <button
                                type="button"
                                onClick={() => onViewOrderDetail({ order_number: tx.order_number })}
                                className="text-[10px] font-mono text-blue-700 hover:underline flex items-center gap-0.5 mt-0.5"
                              >
                                <span>Ref: {tx.order_number}</span>
                                <ExternalLink size={10} />
                              </button>
                            )}
                          </td>

                          {/* Kategori & Deskripsi */}
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-gray-900">{tx.category_label}</div>
                            <div className="text-[11px] text-gray-600 line-clamp-1 max-w-sm">
                              {tx.description}
                            </div>
                            {tx.customer_name && (
                              <div className="text-[10px] text-gray-400 mt-0.5">Oleh: {tx.customer_name}</div>
                            )}
                          </td>

                          {/* Metode Pembayaran */}
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-gray-800">{tx.payment_method}</div>
                          </td>

                          {/* Nominal */}
                          <td className="py-3.5 px-4 text-right font-mono font-black text-sm">
                            <span className={isIncome ? 'text-emerald-700' : 'text-rose-700'}>
                              {isIncome ? '+' : '-'} {formatRupiah(tx.amount)}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4 text-center">
                            {isSettled ? (
                              <span className="px-2 py-0.5 text-[10px] font-black uppercase bg-emerald-100 text-emerald-900 border border-emerald-300">
                                Berhasil
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 text-[10px] font-black uppercase bg-amber-100 text-amber-900 border border-amber-300">
                                Pending
                              </span>
                            )}
                          </td>

                          {/* Aksi */}
                          <td className="py-3.5 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => setReceiptModalTx(tx)}
                              className="p-1.5 text-gray-600 hover:text-neutral-950 hover:bg-gray-100 border border-gray-300 transition-colors cursor-pointer"
                              title="Cetak Kuitansi / Bukti Kas"
                            >
                              <Printer size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Rekening Kas & Bank */}
        {activeMainTab === 'accounts' && (
          <div className="p-5 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-neutral-50 p-4 border border-gray-200">
              <div>
                <h3 className="text-sm font-black text-neutral-950 uppercase tracking-wide">
                  Daftar Rekening Kas & Rekening Bank Toko
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Saldo riil tersimpan pada rekening koran dan gateway yang siap digunakan untuk operasional.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsTransferModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-neutral-900 text-amber-400 hover:bg-neutral-800 font-extrabold text-xs transition-colors cursor-pointer shrink-0"
              >
                <ArrowRightLeft size={14} />
                <span>Pindah Dana / Transfer</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {financialAccounts.map((acc) => (
                <div key={acc.id} className="bg-white border border-gray-300 p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-neutral-900 text-amber-400">
                        <Landmark size={18} />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-neutral-950">{acc.name}</h4>
                        <div className="text-[11px] font-mono text-gray-500">{acc.bank_name}</div>
                      </div>
                    </div>
                    {acc.is_default_payout && (
                      <span className="px-2 py-0.5 text-[10px] font-black uppercase bg-amber-100 text-amber-900 border border-amber-300">
                        Utama Payout
                      </span>
                    )}
                  </div>

                  <div className="p-3 bg-neutral-50 border border-gray-200 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase font-semibold">No. Rekening / ID:</span>
                      <div className="font-mono font-bold text-gray-900 text-xs">{acc.account_number}</div>
                      <div className="text-[10px] text-gray-500">a.n {acc.account_holder}</div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-gray-400 uppercase font-semibold">Saldo Likuid:</span>
                      <div className="font-mono font-black text-lg text-emerald-700">{formatRupiah(acc.balance)}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-gray-500 pt-2 border-t border-gray-150">
                    <span>Status Rekening: <span className="font-bold text-emerald-700 uppercase">Aktif & Siap Pakai</span></span>
                    <button
                      type="button"
                      onClick={() => {
                        setTransferFrom(acc.id);
                        setIsTransferModalOpen(true);
                      }}
                      className="text-neutral-900 font-bold hover:underline cursor-pointer"
                    >
                      Kirim Dana &rarr;
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Chart of Accounts (COA) */}
        {activeMainTab === 'coa' && (
          <div className="p-5 space-y-5">
            <div className="bg-neutral-50 p-4 border border-gray-200">
              <h3 className="text-sm font-black text-neutral-950 uppercase tracking-wide">
                Bagan Akun Standar (Standard Chart of Accounts)
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Struktur klasifikasi buku besar akuntansi ganda (*double-entry*) untuk menyusun Neraca dan Laporan Laba Rugi toko.
              </p>
            </div>

            <div className="border border-gray-200 overflow-x-auto">
              <table className="w-full text-xs text-left text-gray-600">
                <thead className="bg-neutral-900 text-white uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Kode Akun</th>
                    <th className="py-3 px-4">Nama Akun Buku Besar</th>
                    <th className="py-3 px-4">Kelompok Laporan</th>
                    <th className="py-3 px-4 text-center">Posisi Normal</th>
                    <th className="py-3 px-4 text-right">Saldo Terakhir</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {chartOfAccounts.map((coa, idx) => (
                    <tr key={idx} className="hover:bg-neutral-50">
                      <td className="py-3 px-4 font-mono font-bold text-neutral-950">{coa.code}</td>
                      <td className="py-3 px-4 font-semibold text-gray-900">{coa.name}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-gray-100 text-gray-800 border border-gray-300">
                          {coa.group}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {coa.type === 'debit' ? (
                          <span className="px-2 py-0.5 text-[10px] font-mono font-bold text-blue-800 bg-blue-50 border border-blue-200">
                            DEBIT
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 text-[10px] font-mono font-bold text-purple-800 bg-purple-50 border border-purple-200">
                            KREDIT
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-black text-gray-900">
                        {formatRupiah(coa.balance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: Analisis HPP & Margin Laba Kotor */}
        {activeMainTab === 'cogs' && (
          <div className="p-5 space-y-6">
            <div className="bg-neutral-50 p-4 border border-gray-200">
              <h3 className="text-sm font-black text-neutral-950 uppercase tracking-wide">
                Analisis Laba Kotor & Biaya Pokok Penjualan (COGS / HPP)
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Perhitungan keuntungan kotor toko setelah memperhitungkan modal pembelian produk olahraga dari pabrik/vendor.
              </p>
            </div>

            {/* 3 Metric Cards for COGS */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-5 border border-gray-200">
                <span className="text-[11px] font-bold text-gray-500 uppercase">Total Omset Penjualan</span>
                <div className="text-2xl font-black font-mono text-neutral-950 mt-1">
                  {formatRupiah(cogsAnalytics.grossRevenue)}
                </div>
                <p className="text-[10px] text-gray-500 mt-0.5">Nilai transaksi produk terjual</p>
              </div>

              <div className="bg-white p-5 border border-gray-200">
                <span className="text-[11px] font-bold text-rose-700 uppercase">Beban Pokok Penjualan (HPP)</span>
                <div className="text-2xl font-black font-mono text-rose-700 mt-1">
                  {formatRupiah(cogsAnalytics.totalCogs)}
                </div>
                <p className="text-[10px] text-gray-500 mt-0.5">Modal beli produk dari vendor</p>
              </div>

              <div className="bg-neutral-900 text-white p-5 border border-neutral-800">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-amber-400 uppercase">Laba Kotor (Gross Profit)</span>
                  <span className="px-2 py-0.5 text-[10px] font-black uppercase bg-emerald-500 text-white">
                    {cogsAnalytics.grossMarginPct}% Margin
                  </span>
                </div>
                <div className="text-2xl font-black font-mono text-amber-400 mt-1">
                  {formatRupiah(cogsAnalytics.grossProfit)}
                </div>
                <p className="text-[10px] text-neutral-400 mt-0.5">Omset dikurangi HPP modal</p>
              </div>
            </div>

            {/* Category Performance Table */}
            <div className="border border-gray-200 overflow-x-auto">
              <table className="w-full text-xs text-left text-gray-600">
                <thead className="bg-neutral-900 text-white uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Kategori Produk</th>
                    <th className="py-3 px-4 text-right">Unit Terjual</th>
                    <th className="py-3 px-4 text-right">Omset Penjualan</th>
                    <th className="py-3 px-4 text-right">Beban Pokok (HPP)</th>
                    <th className="py-3 px-4 text-right">Laba Kotor (Profit)</th>
                    <th className="py-3 px-4 text-center">Margin %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {cogsAnalytics.categoryBreakdown.map((cat, idx) => (
                    <tr key={idx} className="hover:bg-neutral-50">
                      <td className="py-3.5 px-4 font-bold text-gray-900">{cat.category_name}</td>
                      <td className="py-3.5 px-4 text-right font-mono">{cat.units_sold} unit</td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-neutral-950">
                        {formatRupiah(cat.revenue)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-rose-700">
                        {formatRupiah(cat.cogs)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-black text-emerald-700">
                        {formatRupiah(cat.gross_profit)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2 py-0.5 text-[10px] font-black uppercase bg-emerald-100 text-emerald-900 border border-emerald-300">
                          {cat.margin_pct}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Tambah Transaksi Manual */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg border border-gray-300 shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <h3 className="font-black text-sm uppercase tracking-wide text-neutral-950">
                Pencatatan Transaksi Manual
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {formSuccessMessage && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600" />
                <span>{formSuccessMessage}</span>
              </div>
            )}

            <form onSubmit={handleSaveTransaction} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Tipe Transaksi</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormType('income')}
                    className={`py-2 text-center font-bold border transition-colors cursor-pointer ${
                      formType === 'income' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white border-gray-300 text-gray-700'
                    }`}
                  >
                    + Pemasukan (Income)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormType('expense')}
                    className={`py-2 text-center font-bold border transition-colors cursor-pointer ${
                      formType === 'expense' ? 'bg-rose-600 text-white border-rose-600' : 'bg-white border-gray-300 text-gray-700'
                    }`}
                  >
                    - Pengeluaran (Expense)
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Kategori Transaksi</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full p-2.5 bg-white border border-gray-300 focus:outline-none focus:border-amber-500 font-semibold text-gray-900"
                >
                  {transactionCategories.filter(c => c.id !== 'all').map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Nominal (Rp)</label>
                <input
                  type="number"
                  min="1"
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  placeholder="Contoh: 150000"
                  required
                  className="w-full p-2.5 bg-white border border-gray-300 focus:outline-none focus:border-amber-500 font-black text-gray-900"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Rekening / Kas Sumber</label>
                <select
                  value={formPaymentMethod}
                  onChange={(e) => setFormPaymentMethod(e.target.value)}
                  className="w-full p-2.5 bg-white border border-gray-300 focus:outline-none focus:border-amber-500 text-gray-900"
                >
                  <option value="BCA Bisnis Transfer">BCA Bisnis Giro Operasional</option>
                  <option value="Mandiri Transfer">Mandiri Utama Settlement Gateway</option>
                  <option value="Kas Toko / Tunai">Kas Kecil Kasir Toko & Gudang</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Keterangan Transaksi</label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Jelaskan kebutuhan pengeluaran/pemasukan..."
                  required
                  className="w-full p-2.5 bg-white border border-gray-300 focus:outline-none focus:border-amber-500 text-gray-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 font-bold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-extrabold bg-neutral-900 text-amber-400 hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  Simpan Transaksi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Transfer Antar Rekening */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md border border-gray-300 shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <h3 className="font-black text-sm uppercase tracking-wide text-neutral-950">
                Transfer Antar Rekening Internal
              </h3>
              <button
                type="button"
                onClick={() => setIsTransferModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleTransfer} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Dari Rekening Asal</label>
                <select
                  value={transferFrom}
                  onChange={(e) => setTransferFrom(e.target.value)}
                  className="w-full p-2.5 bg-white border border-gray-300 focus:outline-none focus:border-amber-500 font-semibold text-gray-900"
                >
                  {financialAccounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} (Saldo: {formatRupiah(acc.balance)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Ke Rekening Tujuan</label>
                <select
                  value={transferTo}
                  onChange={(e) => setTransferTo(e.target.value)}
                  className="w-full p-2.5 bg-white border border-gray-300 focus:outline-none focus:border-amber-500 font-semibold text-gray-900"
                >
                  {financialAccounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} (Saldo: {formatRupiah(acc.balance)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Jumlah Nominal Transfer (Rp)</label>
                <input
                  type="number"
                  min="1000"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  placeholder="Contoh: 5000000"
                  required
                  className="w-full p-2.5 bg-white border border-gray-300 focus:outline-none focus:border-amber-500 font-black text-gray-900"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Catatan Mutasi Internal</label>
                <input
                  type="text"
                  value={transferNotes}
                  onChange={(e) => setTransferNotes(e.target.value)}
                  placeholder="Contoh: Isi kas kecil toko Cakung"
                  className="w-full p-2.5 bg-white border border-gray-300 focus:outline-none focus:border-amber-500 text-gray-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="px-4 py-2 font-bold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-extrabold bg-neutral-900 text-amber-400 hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  Konfirmasi Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Cetak Bukti Kas / Kuitansi */}
      {receiptModalTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md border border-gray-300 shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <div>
                <span className="font-black text-xs uppercase tracking-widest text-neutral-900">TUSKO ATHLETICS</span>
                <h3 className="font-bold text-sm text-gray-700 mt-0.5">Bukti Transaksi Kas Masuk/Keluar</h3>
              </div>
              <button
                type="button"
                onClick={() => setReceiptModalTx(null)}
                className="text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="bg-neutral-50 p-4 border border-gray-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Nomor Transaksi:</span>
                <span className="font-mono font-bold text-gray-900">{receiptModalTx.transaction_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Tanggal:</span>
                <span className="font-mono text-gray-800">{new Date(receiptModalTx.created_at).toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Tipe / Kategori:</span>
                <span className="font-bold text-gray-900">{receiptModalTx.category_label}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Keterangan:</span>
                <span className="text-gray-800 text-right max-w-[200px]">{receiptModalTx.description}</span>
              </div>
              <div className="pt-2 border-t border-gray-200 flex justify-between items-center text-sm font-black">
                <span>Total Nominal:</span>
                <span className="text-amber-950 font-mono">{formatRupiah(receiptModalTx.amount)}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setReceiptModalTx(null)}
                className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="px-4 py-2 text-xs font-extrabold bg-neutral-900 text-amber-400 hover:bg-neutral-800 transition-colors cursor-pointer flex items-center gap-1.5"
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
