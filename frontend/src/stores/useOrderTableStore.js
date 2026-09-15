import { createTableStore } from './createTableStore';
import { orderService } from '../services/orderService';

/**
 * Zustand Table Store untuk Daftar Pesanan Admin
 * Mengelola filter status, tanggal, kurir ekspedisi, pagination, dan sorting dengan eksekusi 100% Server-Side.
 */
export const useOrderTableStore = createTableStore({
  name: 'OrderTable',
  fetchFn: async (params) => {
    return await orderService.fetchOrders(params);
  },
  initialFilters: {
    activeTab: 'all',
    searchKeyword: '',
    searchProduct: '',
    dateFilter: 'all',
    startDate: '',
    endDate: '',
    expeditionFilter: 'all',
    minTotal: '',
    maxTotal: ''
  },
  defaultSortBy: 'created_at',
  defaultSortDir: 'desc',
  defaultLimit: 10
});
