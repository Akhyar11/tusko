import { createTableStore } from './createTableStore';
import { vendorService } from '../services/vendorService';

/**
 * Zustand Table Store untuk Master Supplier/Vendor Admin
 * Mengelola filter status aktif, kategori, pencarian kode/nama, pagination, dan sorting dengan eksekusi 100% Server-Side.
 */
export const useSupplierTableStore = createTableStore({
  name: 'SupplierTable',
  fetchFn: async (params) => {
    return await vendorService.fetchVendors(params);
  },
  initialFilters: {
    searchQuery: '',
    codeSearchQuery: '',
    statusFilter: 'all',
    categoryFilter: 'all'
  },
  defaultSortBy: 'company_name',
  defaultSortDir: 'asc',
  defaultLimit: 10
});
