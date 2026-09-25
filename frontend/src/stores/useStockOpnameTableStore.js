import { createTableStore } from './createTableStore';
import { stockOpnameService } from '../services/stockOpnameService';

/**
 * Zustand Table Store untuk sesi Stock Opname admin (T25.2).
 * Filter, pagination, limit, dan sorting dieksekusi 100% Server-Side.
 */
export const useStockOpnameTableStore = createTableStore({
  name: 'StockOpnameTable',
  fetchFn: (params) => stockOpnameService.fetchOpnames(params),
  initialFilters: {
    searchQuery: '',
    warehouseFilter: 'all',
    statusFilter: 'all',
    conductedFrom: '',
    conductedTo: '',
    itemsMin: '',
    itemsMax: '',
    sortFilter: 'latest'
  },
  defaultSortBy: 'created_at',
  defaultSortDir: 'desc',
  defaultLimit: 15
});
