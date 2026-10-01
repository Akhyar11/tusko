import { createTableStore } from './createTableStore';
import { sizeChartService } from '../services/sizeChartService';

/**
 * Zustand Table Store untuk Master Panduan Ukuran (server-side).
 */
export const useSizeChartTableStore = createTableStore({
  name: 'SizeChartTable',
  fetchFn: async (params) => await sizeChartService.fetchCharts(params),
  initialFilters: {
    search: '',
    category_id: 'all',
    status: 'all',
  },
  defaultSortBy: 'sort_order',
  defaultSortDir: 'asc',
  defaultLimit: 10,
});
