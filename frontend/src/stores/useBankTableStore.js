import { createTableStore } from './createTableStore';
import { bankService } from '../services/bankService';

/**
 * Zustand Table Store untuk Master Bank Admin.
 * Mengelola filter pencarian, status aktif, pagination, dan sorting 100% Server-Side.
 */
export const useBankTableStore = createTableStore({
  name: 'BankTable',
  fetchFn: async (params) => {
    const apiParams = {
      page: params.page,
      limit: params.limit,
      per_page: params.limit,
      search: params.filters?.searchQuery || '',
      is_active: params.filters?.statusFilter,
      sort_by: params.sortBy || 'name',
      sort_dir: params.sortDirection || 'asc',
    };

    const res = await bankService.getBanks(apiParams);

    return {
      data: res.data,
      total: res.meta?.total ?? res.data.length,
      meta: res.meta,
      summary: res.summary,
    };
  },
  initialFilters: {
    searchQuery: '',
    statusFilter: 'all',
  },
  defaultSortBy: 'name',
  defaultSortDir: 'asc',
  defaultLimit: 25,
});
