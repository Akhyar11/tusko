import React, { useState, useMemo, useEffect } from 'react';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Landmark,
  Plus,
  ArrowRightLeft,
  SlidersHorizontal,
  Printer,
  ExternalLink,
  MoreVertical,
  X,
  CheckCircle2,
  FileText
} from 'lucide-react';
import IconButton from './atoms/IconButton';
import ServerSideTable from './ServerSideTable';
import FinancialFilterDrawer from './organisms/FinancialFilterDrawer';
import { formatRupiah } from '../utils/formatters';
import { 
  mockTransactions, 
  transactionCategories,
  mockFinancialAccounts 
} from '../data/mockTransactions';
import { useTransactionTableStore } from '../stores/useTransactionTableStore';

export default function FinancialTransactionsPage({
  transactions: initialTransactions = mockTransactions,
  onBackToShopping = () => {},
  onViewOrders = () => {},
  onViewOrderDetail = () => {},
  onShowToast = () => {}
}) {
  const [transactions, setTransactions] = useState(initialTransactions);
  const [financialAccounts, setFinancialAccounts] = useState(mockFinancialAccounts);

  // Centralized Zustand Table Store (100% Server-Side Data Operations)
  const {
    page,
    limit,
    sortBy,
    sortDirection,
    filters,
    data: storeTransactions,
    total: totalTransactionsCount,
    isLoading,
    setPage,
    setLimit,
    setSort,
    setFilter,
    resetFilters,
    fetchData,
  } = useTransactionTableStore();

  useEffect(() => {
    fetchData();
  }, []);

  // Filter drawer & selection
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [selectedTxIds, setSelectedTxIds] = useState([]);
  const [activeActionMenuId, setActiveActionMenuId] = useState(null);

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

  // Internal transfer form state
  const [transferFrom, setTransferFrom] = useState(1);
  const [transferTo, setTransferTo] = useState(3);
  const [transferAmount, setTransferAmount] = useState('');
  const [transferNotes, setTransferNotes] = useState('');

  // Close action popup when clicking outside
  useEffect(() => {
    const handleGlobalClick = () => setActiveActionMenuId(null);
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  // Paginated records directly from server-side store
  const paginatedTransactions = storeTransactions.length > 0 || totalTransactionsCount === 0 ? storeTransactions : transactions;
  const totalFiltered = totalTransactionsCount > 0 || storeTransactions.length > 0 ? totalTransactionsCount : transactions.length;

  // Hitung KPI Keuangan Global
  const stats = useMemo(() => {
    let totalIncome = 0;
    let totalExpense = 0;
    let totalPending = 0;
    let settledCount = 0;

    paginatedTransactions.forEach((tx) => {
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
      totalCount: totalFiltered,
      totalLiquidBalance
    };
  }, [paginatedTransactions, financialAccounts, totalFiltered]);

  // Active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.cashbookFilter && filters.cashbookFilter !== 'all') count++;
    if (filters.selectedCategory && filters.selectedCategory !== 'all') count++;
    if (filters.dateRange && filters.dateRange !== 'all') count++;
    if (filters.searchQuery && filters.searchQuery.trim() !== '') count++;
    return count;
  }, [filters]);

  const handleResetFilters = () => {
    resetFilters();
  };

  // Selection handlers
  const handleSelectRow = (id) => {
    setSelectedTxIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    const currentPageIds = paginatedTransactions.map(tx => tx.id);
    const allSelected = currentPageIds.every(id => selectedTxIds.includes(id));

    if (allSelected) {
      setSelectedTxIds(prev => prev.filter(id => !currentPageIds.includes(id)));
    } else {
      const merged = new Set([...selectedTxIds, ...currentPageIds]);
      setSelectedTxIds(Array.from(merged));
    }
  };

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
    setIsAddModalOpen(false);
    setFormAmount('');
    setFormDescription('');
    onShowToast(`Berhasil mencatat transaksi ${newTx.transaction_number}!`);
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
    onShowToast(`Transfer internal ${formatRupiah(amt)} berhasil dicatat.`);
  };

  // Table Columns Definition
  const tableColumns = useMemo(() => [
    {
      key: 'transaction_number',
      label: 'No. Transaksi & Waktu',
      sortable: true,
      width: 'min-w-[220px]',
      render: (_, tx) => {
        return (
          <div>
            <div className="font-mono font-black text-neutral-950 text-xs">{tx.transaction_number}</div>
            <div className="text-[10px] text-neutral-500 font-mono mt-0.5">
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
                className="text-[10px] font-mono text-amber-700 hover:underline flex items-center gap-1 mt-0.5 cursor-pointer"
              >
                <span>Ref: {tx.order_number}</span>
                <ExternalLink size={10} />
              </button>
            )}
          </div>
        );
      }
    },
    {
      key: 'category',
      label: 'Kategori & Keterangan',
      width: 'min-w-[240px]',
      render: (_, tx) => {
        return (
          <div>
            <div className="font-bold text-neutral-900 text-xs font-sport uppercase tracking-tight">
              {tx.category_label}
            </div>
            <div className="text-[11px] text-neutral-600 line-clamp-1 max-w-sm mt-0.5">
              {tx.description}
            </div>
            {tx.customer_name && (
              <div className="text-[10px] text-neutral-400 font-mono mt-0.5">
                Entitas: {tx.customer_name}
              </div>
            )}
          </div>
        );
      }
    },
    {
      key: 'payment_method',
      label: 'Metode Bayar / Rekening',
      width: 'w-44',
      render: (method) => (
        <span className="text-xs font-semibold text-neutral-800">
          {method}
        </span>
      )
    },
    {
      key: 'amount',
      label: 'Nominal (Rp)',
      sortable: true,
      align: 'right',
      width: 'w-36',
      render: (amount, tx) => {
        const isIncome = tx.type === 'income';
        return (
          <div className={`font-mono font-black text-sm ${isIncome ? 'text-emerald-700' : 'text-rose-700'}`}>
            {isIncome ? '+' : '-'} {formatRupiah(amount)}
          </div>
        );
      }
    },
    {
      key: 'status',
      label: 'Status',
      align: 'center',
      width: 'w-32',
      render: (status) => {
        const isSettled = status === 'settled';
        return (
          <span className={`inline-block px-2.5 py-1 text-[10px] font-sport font-black uppercase rounded-none border tracking-wider ${
            isSettled
              ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
              : 'bg-amber-50 text-amber-900 border-amber-300'
          }`}>
            {isSettled ? 'Berhasil' : 'Pending'}
          </span>
        );
      }
    },
    {
      key: 'actions',
      label: 'Aksi',
      sortable: false,
      align: 'right',
      width: 'w-24',
      render: (_, tx, rowIdx) => {
        const isOpen = activeActionMenuId === tx.id;
        const isNearBottom = rowIdx >= paginatedTransactions.length - 2 && paginatedTransactions.length > 3;

        return (
          <div className="relative inline-block text-left" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setActiveActionMenuId(isOpen ? null : tx.id)}
              className={`p-1.5 rounded-none border transition-colors cursor-pointer ${
                isOpen 
                  ? 'bg-neutral-950 text-white border-neutral-950 shadow-xs' 
                  : 'text-neutral-700 hover:text-black hover:bg-neutral-100 border-neutral-300 bg-white shadow-2xs'
              }`}
              title="Menu Aksi Transaksi"
            >
              <MoreVertical size={16} />
            </button>

            {isOpen && (
              <div 
                className={`absolute right-0 ${
                  isNearBottom ? 'bottom-full mb-1' : 'top-full mt-1'
                } w-48 bg-white border border-neutral-300 rounded-none shadow-xl z-50 py-1 text-left animate-in fade-in zoom-in-95 duration-100`}
              >
                {/* 1. Cetak Kuitansi */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveActionMenuId(null);
                    setReceiptModalTx(tx);
                  }}
                  className="w-full px-3.5 py-2 text-xs font-bold text-neutral-700 hover:bg-neutral-50 hover:text-neutral-950 flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <Printer size={14} className="text-neutral-500" />
                  <span>Cetak Bukti Kuitansi</span>
                </button>

                {/* 2. Referensi Pesanan */}
                {tx.order_number && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveActionMenuId(null);
                      onViewOrderDetail({ order_number: tx.order_number });
                    }}
                    className="w-full px-3.5 py-2 text-xs font-bold text-neutral-700 hover:bg-neutral-50 hover:text-neutral-950 flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <ExternalLink size={14} className="text-neutral-500" />
                    <span>Buka Ref Pesanan</span>
                  </button>
                )}
              </div>
            )}
          </div>
        );
      }
    }
  ], [paginatedTransactions, activeActionMenuId]);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      
      {/* 1. Header Bar Bersih (Icon-only Controls, 1 Halaman 1 Entitas) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-none border border-neutral-300 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-none bg-neutral-950 text-amber-400 flex items-center justify-center font-black shrink-0">
            <Wallet size={22} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-neutral-950 font-sport tracking-tight uppercase">
              Buku Kas &amp; Jurnal Mutasi
            </h1>
            <p className="text-xs text-neutral-600 mt-0.5">
              Pencatatan arus kas masuk, pengeluaran operasional toko, dan saldo konsolidasi kas &amp; bank.
            </p>
          </div>
        </div>

        {/* Action Controls: [Catat Transaksi] -> [Transfer Rekening] -> [Filter] */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <IconButton
            icon={Plus}
            onClick={() => setIsAddModalOpen(true)}
            tooltip="Catat Transaksi Kas Baru"
            variant="primary"
          />
          <IconButton
            icon={ArrowRightLeft}
            onClick={() => setIsTransferModalOpen(true)}
            tooltip="Transfer Antar Rekening Kas & Bank"
            variant="secondary"
          />
          <IconButton
            icon={SlidersHorizontal}
            onClick={() => setIsFilterDrawerOpen(true)}
            tooltip="Buka Filter Buku Kas"
            variant={activeFilterCount > 0 ? 'dark' : 'secondary'}
            badge={activeFilterCount > 0 ? activeFilterCount : null}
          />
        </div>
      </div>

      {/* 2. 4 Kartu KPI Ringkasan Kas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Net Cashflow */}
        <div className="bg-neutral-950 text-white p-4 sm:p-5 rounded-none border border-neutral-800 relative overflow-hidden shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-sport font-black uppercase tracking-wider text-neutral-400">
              Arus Kas Bersih (Net)
            </span>
            <Wallet size={16} className="text-amber-400" />
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-black font-mono text-amber-400 truncate">
            {formatRupiah(stats.netCashflow)}
          </div>
          <p className="text-[10px] text-neutral-400 mt-1 truncate">
            Penerimaan kas vs beban pengeluaran
          </p>
        </div>

        {/* Total Income */}
        <div className="bg-white p-4 sm:p-5 rounded-none border border-neutral-300 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-sport font-black uppercase tracking-wider text-neutral-500">
              Total Pemasukan Kas
            </span>
            <TrendingUp size={16} className="text-emerald-600" />
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-black font-mono text-emerald-700 truncate">
            {formatRupiah(stats.totalIncome)}
          </div>
          <p className="text-[10px] text-neutral-500 mt-1">Order terbayar &amp; modal toko</p>
        </div>

        {/* Total Expense */}
        <div className="bg-white p-4 sm:p-5 rounded-none border border-neutral-300 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-sport font-black uppercase tracking-wider text-neutral-500">
              Total Pengeluaran Kas
            </span>
            <TrendingDown size={16} className="text-rose-600" />
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-black font-mono text-rose-700 truncate">
            {formatRupiah(stats.totalExpense)}
          </div>
          <p className="text-[10px] text-neutral-500 mt-1">Restock, pengadaan &amp; operasional</p>
        </div>

        {/* Total Liquid Bank Balances */}
        <div className="bg-white p-4 sm:p-5 rounded-none border border-neutral-300 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-sport font-black uppercase tracking-wider text-neutral-500">
              Saldo Kas &amp; Bank Riil
            </span>
            <Landmark size={16} className="text-blue-600" />
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-black font-mono text-neutral-950 truncate">
            {formatRupiah(stats.totalLiquidBalance)}
          </div>
          <p className="text-[10px] text-neutral-500 mt-1">Konsolidasi 4 rekening aktif</p>
        </div>
      </div>

      {/* 3. Main Data Table: Single Table View Only */}
      <ServerSideTable
        columns={tableColumns}
        data={paginatedTransactions}
        total={totalFiltered}
        page={page}
        limit={limit}
        limitOptions={[10, 25, 50, 100]}
        onPageChange={setPage}
        onLimitChange={(newLimit) => {
          setLimit(newLimit);
          setPage(1);
        }}
        sortBy={sortBy}
        sortDirection={sortDirection}
        onSortChange={({ sortBy: newSortBy, sortDirection: newDir }) => {
          setSort(newSortBy, newDir);
        }}
        isLoading={isLoading}
        selectable={true}
        selectedIds={selectedTxIds}
        onSelectRow={handleSelectRow}
        onSelectAll={handleSelectAll}
        idKey="id"
        emptyMessage="Tidak Ada Mutasi Kas Ditemukan"
        emptyDescription="Sesuaikan kata kunci pencarian atau ubah filter periode transaksi."
      />

      {/* 4. Centralized Filter Sidebar Organism */}
      <FinancialFilterDrawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        activeFilterCount={activeFilterCount}
        totalFiltered={totalFiltered}
        totalTransactions={totalFiltered}
        searchQuery={filters.searchQuery || ''}
        onSearchChange={(val) => setFilter('searchQuery', val)}
        cashbookFilter={filters.cashbookFilter || 'all'}
        onCashbookFilterChange={(val) => setFilter('cashbookFilter', val)}
        selectedCategory={filters.selectedCategory || 'all'}
        onCategoryChange={(val) => setFilter('selectedCategory', val)}
        categories={transactionCategories}
        dateRange={filters.dateRange || 'all'}
        onDateRangeChange={(val) => setFilter('dateRange', val)}
        onResetFilters={handleResetFilters}
      />

      {/* 5. Modal Tambah Transaksi Manual */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-[2px] animate-in fade-in duration-150">
          <div className="bg-white border border-neutral-300 w-full max-w-lg rounded-none shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
              <h3 className="font-sport font-black text-base uppercase text-neutral-950">
                Catat Transaksi Kas Baru
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-neutral-400 hover:text-black cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveTransaction} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase font-sport tracking-wider text-neutral-700 mb-1">
                  Arah Aliran Kas
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormType('income')}
                    className={`py-2 text-xs font-sport font-black uppercase rounded-none border cursor-pointer transition-colors ${
                      formType === 'income'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-neutral-50 text-neutral-700 border-neutral-300'
                    }`}
                  >
                    + Kas Masuk (Income)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormType('expense')}
                    className={`py-2 text-xs font-sport font-black uppercase rounded-none border cursor-pointer transition-colors ${
                      formType === 'expense'
                        ? 'bg-rose-600 text-white border-rose-600'
                        : 'bg-neutral-50 text-neutral-700 border-neutral-300'
                    }`}
                  >
                    - Kas Keluar (Expense)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase font-sport tracking-wider text-neutral-700 mb-1">
                  Kategori Transaksi
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-300 rounded-none font-medium focus:outline-none focus:border-black"
                >
                  {transactionCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-black uppercase font-sport tracking-wider text-neutral-700 mb-1">
                  Nominal Transaksi (Rp)
                </label>
                <input
                  type="number"
                  required
                  min="1000"
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  placeholder="Contoh: 150000"
                  className="w-full px-3 py-2 text-xs font-mono font-bold bg-neutral-50 border border-neutral-300 rounded-none focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase font-sport tracking-wider text-neutral-700 mb-1">
                  Keterangan / Memo Transaksi
                </label>
                <textarea
                  rows="2"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Rincian catatan transaksi..."
                  className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-300 rounded-none focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase font-sport tracking-wider text-neutral-700 mb-1">
                  Rekening Pembayaran / Sumber Kas
                </label>
                <select
                  value={formPaymentMethod}
                  onChange={(e) => setFormPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-300 rounded-none font-medium focus:outline-none focus:border-black"
                >
                  {financialAccounts.map((acc) => (
                    <option key={acc.id} value={acc.name}>
                      {acc.name} ({acc.account_number}) - Saldo {formatRupiah(acc.balance)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-sport font-black uppercase text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-none cursor-pointer transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-sport font-black uppercase text-white bg-neutral-950 hover:bg-neutral-900 rounded-none cursor-pointer transition-colors"
                >
                  Simpan Transaksi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Modal Transfer Antar Rekening */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-[2px] animate-in fade-in duration-150">
          <div className="bg-white border border-neutral-300 w-full max-w-lg rounded-none shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
              <h3 className="font-sport font-black text-base uppercase text-neutral-950">
                Pindah Dana / Transfer Antar Rekening
              </h3>
              <button
                type="button"
                onClick={() => setIsTransferModalOpen(false)}
                className="text-neutral-400 hover:text-black cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleTransfer} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black uppercase font-sport tracking-wider text-neutral-700 mb-1">
                    Dari Rekening
                  </label>
                  <select
                    value={transferFrom}
                    onChange={(e) => setTransferFrom(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-300 rounded-none font-medium focus:outline-none focus:border-black"
                  >
                    {financialAccounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} ({formatRupiah(acc.balance)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase font-sport tracking-wider text-neutral-700 mb-1">
                    Ke Rekening
                  </label>
                  <select
                    value={transferTo}
                    onChange={(e) => setTransferTo(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-300 rounded-none font-medium focus:outline-none focus:border-black"
                  >
                    {financialAccounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} ({formatRupiah(acc.balance)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase font-sport tracking-wider text-neutral-700 mb-1">
                  Nominal Transfer (Rp)
                </label>
                <input
                  type="number"
                  required
                  min="1000"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  placeholder="Contoh: 500000"
                  className="w-full px-3 py-2 text-xs font-mono font-bold bg-neutral-50 border border-neutral-300 rounded-none focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase font-sport tracking-wider text-neutral-700 mb-1">
                  Catatan Transfer
                </label>
                <input
                  type="text"
                  value={transferNotes}
                  onChange={(e) => setTransferNotes(e.target.value)}
                  placeholder="Tujuan pemindahan saldo dana..."
                  className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-300 rounded-none focus:outline-none focus:border-black"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="px-4 py-2 text-xs font-sport font-black uppercase text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-none cursor-pointer transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-sport font-black uppercase text-white bg-neutral-950 hover:bg-neutral-900 rounded-none cursor-pointer transition-colors"
                >
                  Konfirmasi Pindah Dana
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Modal Kuitansi Transaksi */}
      {receiptModalTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-[2px] animate-in fade-in duration-150">
          <div className="bg-white border border-neutral-300 w-full max-w-md rounded-none shadow-2xl p-6 space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
              <span className="font-sport font-black text-sm uppercase text-neutral-950">
                Bukti Transaksi Kas Tusko
              </span>
              <button
                type="button"
                onClick={() => setReceiptModalTx(null)}
                className="text-neutral-400 hover:text-black cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2 py-2 border-b border-neutral-200">
              <div className="flex justify-between">
                <span className="text-neutral-500">No. TRX:</span>
                <span className="font-bold text-neutral-950">{receiptModalTx.transaction_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Waktu:</span>
                <span>{new Date(receiptModalTx.created_at).toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Tipe / Kategori:</span>
                <span className="uppercase font-bold">{receiptModalTx.type} • {receiptModalTx.category_label}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Rekening:</span>
                <span>{receiptModalTx.payment_method}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Nominal:</span>
                <span className="text-sm font-black text-neutral-950">{formatRupiah(receiptModalTx.amount)}</span>
              </div>
            </div>

            <p className="text-[11px] text-neutral-600 italic">
              {receiptModalTx.description}
            </p>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setReceiptModalTx(null)}
                className="px-4 py-2 font-sport font-black uppercase text-xs text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-none cursor-pointer"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 font-sport font-black uppercase text-xs text-white bg-neutral-950 hover:bg-neutral-900 rounded-none cursor-pointer flex items-center gap-1.5"
              >
                <Printer size={13} />
                <span>Cetak</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
