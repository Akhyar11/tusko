import { createTableStore } from './createTableStore';
import { returnService } from '../services/returnService';

/**
 * Zustand Table Store untuk pengelolaan Retur & Refund admin (T29.4).
 * Filter, pagination, limit, dan sorting dieksekusi 100% Server-Side.
 */
export const useReturnTableStore = createTableStore({
  name: 'ReturnTable',
  fetchFn: (params) => returnService.fetchReturns(params),
  initialFilters: {
    searchQuery: '',
    statusFilter: 'all',
    userSearchQuery: '',
    requestedFrom: '',
    requestedTo: '',
    itemsMin: '',
    itemsMax: '',
    refundAmountMin: '',
    refundAmountMax: ''
  },
  defaultSortBy: 'created_at',
  defaultSortDir: 'desc',
  defaultLimit: 15
});
