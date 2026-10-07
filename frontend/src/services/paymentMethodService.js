import { apiClient } from './apiClient';

export const paymentMethodService = {
  /**
   * Daftar master metode pembayaran (admin, paginated).
   */
  async getMethods(params = {}) {
    const query = new URLSearchParams();

    if (params.search && params.search.trim()) {
      query.append('search', params.search.trim());
    }
    if (params.type && params.type !== 'all' && params.type !== '') {
      query.append('type', params.type);
    }
    if (params.is_active !== undefined && params.is_active !== 'all' && params.is_active !== '') {
      query.append('is_active', params.is_active ? '1' : '0');
    }
    if (params.sort_by) query.append('sort_by', params.sort_by);
    if (params.sort_dir) query.append('sort_dir', params.sort_dir);
    if (params.page) query.append('page', params.page);
    if (params.per_page || params.limit) query.append('per_page', params.per_page || params.limit);

    const qs = query.toString();
    const url = qs ? `/api/admin/payment-methods?${qs}` : '/api/admin/payment-methods';
    const res = await apiClient.get(url);

    return {
      data: Array.isArray(res.data) ? res.data : [],
      summary: res.summary || {
        total_count: 0,
        active_count: 0,
        midtrans_count: 0,
        manual_count: 0,
      },
      meta: res.meta || {
        current_page: 1,
        last_page: 1,
        per_page: 25,
        total: Array.isArray(res.data) ? res.data.length : 0,
      },
    };
  },

  /**
   * Detail satu metode pembayaran.
   */
  async getMethod(id) {
    const res = await apiClient.get(`/api/admin/payment-methods/${encodeURIComponent(id)}`);
    return res.data || null;
  },

  /**
   * Tambah metode pembayaran baru.
   */
  async createMethod(payload) {
    const res = await apiClient.post('/api/admin/payment-methods', payload);
    return res.data || null;
  },

  /**
   * Perbarui metode pembayaran.
   */
  async updateMethod(id, payload) {
    const res = await apiClient.put(`/api/admin/payment-methods/${encodeURIComponent(id)}`, payload);
    return res.data || null;
  },

  /**
   * Hapus metode pembayaran.
   */
  async deleteMethod(id) {
    const res = await apiClient.delete(`/api/admin/payment-methods/${encodeURIComponent(id)}`);
    return res.data || null;
  },

  /**
   * Toggle status aktif.
   */
  async toggleMethodStatus(id) {
    const res = await apiClient.post(`/api/admin/payment-methods/${encodeURIComponent(id)}/toggle-status`);
    return res.data || null;
  },
};
