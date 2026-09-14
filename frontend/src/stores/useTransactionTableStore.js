import { createTableStore } from './createTableStore';
import { transactionService } from '../services/transactionService';

/**
 * Zustand Table Store untuk Buku Kas & Transaksi Keuangan Admin
 * Mengelola filter tab cashflow, rentang tanggal, kategori, pagination, dan sorting dengan eksekusi 100% Server-Side.
 */
export const useTransactionTableStore = createTableStore({
  name: 'TransactionTable',
  fetchFn: async (params) => {
    return await transactionService.fetchTransactions(params);
  },
  initialFilters: {
    cashbookFilter: 'all',
    selectedCategory: 'all',
    dateRange: 'all',
    searchQuery: ''
  },
  defaultSortBy: 'created_at',
  defaultSortDir: 'desc',
  defaultLimit: 10
});
