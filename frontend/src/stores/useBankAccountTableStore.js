import { createTableStore } from './createTableStore';
import { financialAccountService } from '../services/financialAccountService';

/**
 * Zustand Table Store untuk Master Rekening Bank Admin
 * Mengelola filter pencarian, status aktif, COA, pagination, dan sorting 100% Server-Side.
 */
export const useBankAccountTableStore = createTableStore({
  name: 'BankAccountTable',
  fetchFn: async (params) => {
    const apiParams = {
      type: 'bank',
      page: params.page,
      limit: params.limit,
      per_page: params.limit,
      search: params.filters?.searchQuery || '',
      is_active: params.filters?.statusFilter,
      chart_of_account_id: params.filters?.coaFilter,
      sort: params.sortBy === 'account_name'
        ? (params.sortDirection === 'asc' ? 'name_asc' : 'name_desc')
        : (params.sortBy === 'current_balance'
          ? (params.sortDirection === 'asc' ? 'balance_asc' : 'balance_desc')
          : (params.sortDirection === 'asc' ? 'oldest' : 'latest'))
    };

    const res = await financialAccountService.getAccounts(apiParams);

    return {
      data: res.data,
      total: res.meta?.total ?? res.data.length,
      meta: res.meta,
      summary: res.stats
    };
  },
  initialFilters: {
    searchQuery: '',
    statusFilter: 'all',
    coaFilter: 'all'
  },
  defaultSortBy: 'account_name',
  defaultSortDir: 'asc',
  defaultLimit: 10
});
