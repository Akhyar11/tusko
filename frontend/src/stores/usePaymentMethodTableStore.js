import { createTableStore } from './createTableStore';
import { paymentMethodService } from '../services/paymentMethodService';

/**
 * Zustand Table Store untuk Master Metode Pembayaran (T07.12).
 * Filter pencarian, tipe, status aktif, pagination, dan sorting 100% Server-Side.
 */
export const usePaymentMethodTableStore = createTableStore({
  name: 'PaymentMethodTable',
  fetchFn: async (params) => {
    const apiParams = {
      page: params.page,
      limit: params.limit,
      per_page: params.limit,
      search: params.filters?.searchQuery || '',
      type: params.filters?.typeFilter || 'all',
      is_active: params.filters?.statusFilter,
      sort_by: params.sortBy || 'sort_order',
      sort_dir: params.sortDirection || 'asc',
    };

    const res = await paymentMethodService.getMethods(apiParams);

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
  defaultSortBy: 'sort_order',
  defaultSortDir: 'asc',
  defaultLimit: 25,
});
