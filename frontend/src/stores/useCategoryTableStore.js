import { createTableStore } from './createTableStore';
import { categoryService } from '../services/categoryService';

/**
 * Zustand Table Store untuk Master Kategori Admin
 * Mengelola filter, pagination, limit, dan sorting dengan eksekusi 100% Server-Side.
 */
export const useCategoryTableStore = createTableStore({
  name: 'CategoryTable',
  fetchFn: async (params) => {
    return await categoryService.fetchCategories(params);
  },
  initialFilters: {
    searchQuery: '',
    searchSlug: '',
    searchDescription: '',
    productStatusFilter: 'all',
    iconFilter: 'all'
  },
  defaultSortBy: 'name',
  defaultSortDir: 'asc',
  defaultLimit: 10
});
