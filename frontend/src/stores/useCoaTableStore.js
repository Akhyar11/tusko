import { createTableStore } from './createTableStore';
import { coaService } from '../services/coaService';

/**
 * Zustand Table Store untuk Master Chart of Accounts (COA) Admin.
 * Mengelola filter pencarian, tipe akun, status aktif, pagination, dan sorting 100% Server-Side.
 */
export const useCoaTableStore = createTableStore({
  name: 'CoaTable',
  fetchFn: async (params) => {
    const apiParams = {
      page: params.page,
      limit: params.limit,
      per_page: params.limit,
      search: params.filters?.searchQuery || '',
      account_type: params.filters?.typeFilter,
      is_active: params.filters?.statusFilter,
      sort_by: params.sortBy || 'account_code',
      sort_dir: params.sortDirection || 'asc',
    };

    const res = await coaService.getAccounts(apiParams);

    return {
      data: res.data,
      total: res.meta?.total ?? res.data.length,
      meta: res.meta,
      summary: res.summary,
    };
  },
  initialFilters: {
    searchQuery: '',
    typeFilter: 'all',
    statusFilter: 'all',
  },
  defaultSortBy: 'account_code',
  defaultSortDir: 'asc',
  defaultLimit: 25,
});
