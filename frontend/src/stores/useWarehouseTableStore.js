import { createTableStore } from './createTableStore';
import { warehouseService } from '../services/warehouseService';

/**
 * Zustand Table Store untuk Master Gudang / Warehouse Admin
 * Mengelola filter status aktif, tipe fasilitas (primary/cabang), pencarian kode/nama/kota,
 * pagination, dan sorting dengan eksekusi 100% Server-Side.
 */
export const useWarehouseTableStore = createTableStore({
  name: 'WarehouseTable',
  fetchFn: async (params) => {
    return await warehouseService.fetchWarehouses(params);
  },
  initialFilters: {
    searchQuery: '',
    codeSearchQuery: '',
    citySearchQuery: '',
    statusFilter: 'all',
    typeFilter: 'all'
  },
  defaultSortBy: 'name',
  defaultSortDir: 'asc',
  defaultLimit: 10
});
