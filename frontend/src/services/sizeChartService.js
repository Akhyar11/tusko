import { apiClient } from './apiClient';

/**
 * Service: Master Panduan Ukuran (size chart) — per kategori + default.
 */
export const sizeChartService = {
  async getForCategory(categoryId) {
    try {
      const query = categoryId ? `?category_id=${encodeURIComponent(categoryId)}` : '';
      const res = await apiClient.get(`/api/store/size-chart${query}`);
      return res.data || { rows: [] };
    } catch {
      return { rows: [] };
    }
  },

  async fetchCharts(params = {}) {
    const qs = new URLSearchParams();
    if (params.search) qs.append('search', params.search);
    if (params.category_id && params.category_id !== 'all') qs.append('category_id', params.category_id);
    if (params.status && params.status !== 'all') qs.append('status', params.status);
    if (params.sort_by) qs.append('sort_by', params.sort_by);
    if (params.sort_direction) qs.append('sort_direction', params.sort_direction);
    qs.append('page', params.page || 1);
    qs.append('per_page', params.per_page || params.limit || 10);
    const res = await apiClient.get(`/api/admin/size-charts?${qs.toString()}`);
    return res;
  },

  async getChart(id) {
    const res = await apiClient.get(`/api/admin/size-charts/${id}`);
    return res.data;
  },

  async createChart(payload) {
    const res = await apiClient.post('/api/admin/size-charts', payload);
    return res;
  },

  async updateChart(id, payload) {
    const res = await apiClient.put(`/api/admin/size-charts/${id}`, payload);
    return res;
  },

  async deleteChart(id) {
    const res = await apiClient.delete(`/api/admin/size-charts/${id}`);
    return res;
  },
};
