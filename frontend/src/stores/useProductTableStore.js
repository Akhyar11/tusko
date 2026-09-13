import { createTableStore } from './createTableStore';
import { productService } from '../services/productService';

/**
 * Zustand Table Store untuk Katalog Produk Admin
 * Mengelola filter, pagination, limit, dan sorting terpusat dengan 100% eksekusi Server-Side.
 */
export const useProductTableStore = createTableStore({
  name: 'ProductTable',
  fetchFn: async (params) => {
    return await productService.fetchProducts(params);
  },
  initialFilters: {
    searchName: '',
    searchSku: '',
    category_id: 'all',
    status: 'all',
    stockCondition: 'all',
    minPrice: '',
    maxPrice: '',
    include_inactive: '1'
  },
  defaultSortBy: 'created_at',
  defaultSortDir: 'desc',
  defaultLimit: 10
});
