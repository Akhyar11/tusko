import { createTableStore } from './createTableStore';
import { inventoryService } from '../services/inventoryService';

/**
 * Zustand Table Store untuk Manajemen Stok Gudang Admin
 * Mengelola filter status stok, gudang, pagination, dan sorting dengan eksekusi 100% Server-Side.
 */
export const useInventoryTableStore = createTableStore({
  name: 'InventoryTable',
  fetchFn: async (params) => {
    return await inventoryService.fetchInventory(params);
  },
  initialFilters: {
    searchName: '',
    searchSku: '',
    stockFilter: 'all',
    categoryFilter: 'all',
    selectedWarehouseCode: 'all'
  },
  defaultSortBy: 'name',
  defaultSortDir: 'asc',
  defaultLimit: 10
});
