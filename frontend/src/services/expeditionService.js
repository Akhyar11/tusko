/**
 * Service: Expedition & Courier Settings API Client
 * Manages logistics courier partners, tariffs, and default delivery channels.
 */
import { apiClient } from './apiClient';
import { initialExpeditions } from '../data/mockExpeditionSettings';

const STORAGE_KEY = 'tusko_expeditions_cache';

function getStoredExpeditions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return initialExpeditions;
}

function setStoredExpeditions(expeditions) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(expeditions));
  } catch {
    // ignore
  }
}

export const expeditionService = {
  /**
   * Fetch expeditions with dynamic search, category, pagination, and sorting.
   */
  async fetchExpeditions(params = {}) {
    try {
      const searchParams = new URLSearchParams();
      const search = params.search || params.searchQuery;
      if (search) searchParams.append('search', search);

      const category = params.category || params.selectedCategory;
      if (category && category !== 'all' && category !== 'Semua') searchParams.append('category', category);

      const status = params.status || params.statusFilter;
      if (status && status !== 'all') searchParams.append('is_active', status === 'active' ? '1' : '0');

      const sortBy = params.sort_by || params.sortBy;
      if (sortBy) searchParams.append('sort_by', sortBy);

      const sortDir = params.sort_direction || params.sortDirection;
      if (sortDir) searchParams.append('sort_direction', sortDir);

      if (params.include_inactive !== undefined) {
        searchParams.append('include_inactive', params.include_inactive ? '1' : '0');
      } else {
        searchParams.append('include_inactive', '1');
      }

      if (params.all && !params.page && !params.limit && !params.per_page) {
        searchParams.append('all', '1');
      } else {
        const page = params.page || 1;
        const perPage = params.per_page || params.limit || 10;
        searchParams.append('page', page);
        searchParams.append('per_page', perPage);
      }

      const queryString = searchParams.toString();
      const url = queryString ? `/api/expeditions?${queryString}` : '/api/expeditions';
      const res = await apiClient.get(url);

      const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      if (list.length > 0) {
        setStoredExpeditions(list);
      }

      return {
        data: list,
        total: res.meta?.total !== undefined ? res.meta.total : list.length,
        meta: res.meta || {
          current_page: params.page || 1,
          last_page: 1,
          per_page: params.limit || 10,
          total: list.length
        }
      };
    } catch (err) {
      console.warn('expeditionService.fetchExpeditions: fallback to local/mock data.', err.message);
      let list = getStoredExpeditions();
      const search = params.search || params.searchQuery;
      if (search && search.trim()) {
        const q = search.toLowerCase();
        list = list.filter(e => 
          (e.name && e.name.toLowerCase().includes(q)) ||
          (e.service && e.service.toLowerCase().includes(q)) ||
          (e.code && e.code.toLowerCase().includes(q))
        );
      }
      return {
        data: list,
        total: list.length,
        meta: { current_page: 1, last_page: 1, per_page: list.length, total: list.length }
      };
    }
  },

  async createExpedition(data) {
    const res = await apiClient.post('/api/expeditions', data);
    return res.data || res;
  },

  async updateExpedition(id, data) {
    const res = await apiClient.put(`/api/expeditions/${id}`, data);
    return res.data || res;
  },

  async deleteExpedition(id) {
    const res = await apiClient.delete(`/api/expeditions/${id}`);
    return res.data || res;
  },

  async setDefault(id) {
    const res = await apiClient.post(`/api/expeditions/${id}/set-default`);
    return res.data || res;
  },

  async syncExpeditions() {
    const res = await apiClient.post('/api/admin/expeditions/sync');
    return res.data || res;
  }
};
