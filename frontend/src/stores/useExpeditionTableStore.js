import { createTableStore } from './createTableStore';
import { expeditionService } from '../services/expeditionService';

/**
 * Zustand Table Store untuk Pengaturan Ekspedisi Admin
 * Mengelola filter kategori kurir, status, pencarian, pagination, dan sorting dengan eksekusi 100% Server-Side.
 */
export const useExpeditionTableStore = createTableStore({
  name: 'ExpeditionTable',
  fetchFn: async (params) => {
    return await expeditionService.fetchExpeditions(params);
  },
  initialFilters: {
    searchQuery: '',
    selectedCategory: 'all',
    statusFilter: 'all'
  },
  defaultSortBy: 'id',
  defaultSortDir: 'asc',
  defaultLimit: 10
});
