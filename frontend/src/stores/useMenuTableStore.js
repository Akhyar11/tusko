import { createTableStore } from './createTableStore';
import { menuService } from '../services/menuService';

/**
 * Zustand Table Store untuk Master Menu & Akses Role Admin (T37.6).
 * Mengelola filter, pagination, limit, dan sorting dengan eksekusi 100% Server-Side.
 */
export const useMenuTableStore = createTableStore({
  name: 'MenuTable',
  fetchFn: (params) => menuService.fetchMenus(params),
  initialFilters: {
    searchQuery: '',
    pathSearchQuery: '',
    viewSearchQuery: '',
    sectionSearchQuery: '',
    environmentFilter: 'all',
    roleFilter: 'all',
    statusFilter: 'all',
    featureFlagFilter: 'all',
    sortOrderMin: '',
    sortOrderMax: ''
  },
  defaultSortBy: 'sort_order',
  defaultSortDir: 'asc',
  defaultLimit: 10
});
