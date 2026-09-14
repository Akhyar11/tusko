/**
 * Service: Inventory & Warehouse Stock API Client
 * Manages fetching, adjusting, and tracking product stock on the server.
 */
import { apiClient } from './apiClient';
import { initialInventory } from '../data/mockStockData';

const STORAGE_KEY = 'tusko_inventory_cache';

function getStoredInventory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return initialInventory;
}

function setStoredInventory(items) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore
  }
}

export const inventoryService = {
  /**
   * Fetch inventory items with dynamic search, stock filter, pagination, and sorting.
   */
  async fetchInventory(params = {}) {
    try {
      const searchParams = new URLSearchParams();
      const search = params.search || params.searchName || params.searchSku;
      if (search) searchParams.append('search', search);

      const stockStatus = params.stock_status || params.stockFilter;
      if (stockStatus && stockStatus !== 'all') searchParams.append('stock_status', stockStatus);

      const catId = params.category_id || params.categoryFilter;
      if (catId && catId !== 'all') searchParams.append('category_id', catId);

      const sortBy = params.sort || params.sortBy;
      if (sortBy) searchParams.append('sort', sortBy);

      const page = params.page || 1;
      searchParams.append('page', page);

      const perPage = params.per_page || params.limit || 10;
      searchParams.append('per_page', perPage);

      const queryString = searchParams.toString();
      const url = queryString ? `/api/inventory?${queryString}` : '/api/inventory';
      const res = await apiClient.get(url);

      const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      if (list.length > 0) {
        setStoredInventory(list);
      }

      return {
        data: list,
        total: res.meta?.total !== undefined ? res.meta.total : list.length,
        summary: res.summary || null,
        meta: res.meta || {
          current_page: page,
          last_page: Math.max(1, Math.ceil(list.length / perPage)),
          per_page: perPage,
          total: list.length
        }
      };
    } catch (err) {
      console.warn('inventoryService.fetchInventory: fallback to local/mock data.', err.message);
      let list = getStoredInventory();
      const search = params.search || params.searchName || params.searchSku;
      if (search && search.trim()) {
        const q = search.toLowerCase();
        list = list.filter(i => (i.name && i.name.toLowerCase().includes(q)) || (i.sku && i.sku.toLowerCase().includes(q)));
      }
      return {
        data: list,
        total: list.length,
        summary: null,
        meta: { current_page: 1, last_page: 1, per_page: list.length, total: list.length }
      };
    }
  },

  async addStock(idOrSku, data) {
    const res = await apiClient.post(`/api/inventory/${idOrSku}/add-stock`, data);
    return res.data || res;
  },

  async reduceStock(idOrSku, data) {
    const res = await apiClient.post(`/api/inventory/${idOrSku}/reduce-stock`, data);
    return res.data || res;
  },

  async getMutations(idOrSku, params = {}) {
    const url = idOrSku ? `/api/inventory/${idOrSku}/mutations` : '/api/inventory/mutations';
    const res = await apiClient.get(url);
    return res.data || res;
  }
};
