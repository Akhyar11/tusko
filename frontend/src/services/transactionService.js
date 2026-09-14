/**
 * Service: Financial Transactions API Client
 * Manages financial transactions, cashbook reporting, and cashflow summary.
 */
import { apiClient } from './apiClient';
import { mockTransactions } from '../data/mockTransactions';

const STORAGE_KEY = 'tusko_transactions_cache';

function getStoredTransactions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return mockTransactions;
}

function setStoredTransactions(txs) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(txs));
  } catch {
    // ignore
  }
}

export const transactionService = {
  /**
   * Fetch transactions with dynamic filters, pagination, and sorting.
   */
  async fetchTransactions(params = {}) {
    try {
      const searchParams = new URLSearchParams();
      const tab = params.tab || params.cashbookFilter;
      if (tab && tab !== 'all') searchParams.append('tab', tab);

      const type = params.type;
      if (type && type !== 'all') searchParams.append('type', type);

      const status = params.status;
      if (status && status !== 'all') searchParams.append('status', status);

      const category = params.category || params.selectedCategory;
      if (category && category !== 'all') searchParams.append('category', category);

      const dateRange = params.date_range || params.dateRange;
      if (dateRange && dateRange !== 'all') searchParams.append('date_range', dateRange);

      const search = params.search || params.searchQuery;
      if (search) searchParams.append('search', search);

      const sortBy = params.sort_by || params.sortBy;
      if (sortBy) searchParams.append('sort_by', sortBy);

      const sortDir = params.sort_direction || params.sortDirection;
      if (sortDir) searchParams.append('sort_direction', sortDir);

      const page = params.page || 1;
      searchParams.append('page', page);

      const perPage = params.per_page || params.limit || 10;
      searchParams.append('per_page', perPage);

      const queryString = searchParams.toString();
      const url = queryString ? `/api/transactions?${queryString}` : '/api/transactions';
      const res = await apiClient.get(url);

      const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      if (list.length > 0) {
        setStoredTransactions(list);
      }

      return {
        data: list,
        total: res.meta?.total !== undefined ? res.meta.total : list.length,
        summary: res.stats || res.summary || null,
        meta: res.meta || {
          current_page: page,
          last_page: Math.max(1, Math.ceil(list.length / perPage)),
          per_page: perPage,
          total: list.length
        }
      };
    } catch (err) {
      console.warn('transactionService.fetchTransactions: fallback to local/mock data.', err.message);
      let list = getStoredTransactions();
      const search = params.search || params.searchQuery;
      if (search && search.trim()) {
        const q = search.toLowerCase();
        list = list.filter(t => 
          (t.transaction_number && t.transaction_number.toLowerCase().includes(q)) ||
          (t.description && t.description.toLowerCase().includes(q))
        );
      }
      return {
        data: list,
        total: list.length,
        summary: null,
        meta: { current_page: 1, last_page: 1, per_page: list.length, total: list.length }
      };
    }
  },

  async createTransaction(data) {
    const res = await apiClient.post('/api/transactions', data);
    return res.data || res;
  },

  async getTransaction(idOrNumber) {
    const res = await apiClient.get(`/api/transactions/${idOrNumber}`);
    return res.data || res;
  }
};
