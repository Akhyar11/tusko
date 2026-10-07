import { apiClient } from './apiClient';

export const bankService = {
  /**
   * Mengambil daftar bank dari server dengan filter, sorting, dan pagination.
   */
  async getBanks(params = {}) {
    const query = new URLSearchParams();

    if (params.search && params.search.trim()) {
      query.append('search', params.search.trim());
    }

    if (params.is_active !== undefined && params.is_active !== 'all' && params.is_active !== '') {
      query.append('is_active', params.is_active ? '1' : '0');
    }

    if (params.sort_by) {
      query.append('sort_by', params.sort_by);
    }

    if (params.sort_dir) {
      query.append('sort_dir', params.sort_dir);
    }

    if (params.all) {
      query.append('all', '1');
    } else {
      if (params.page) query.append('page', params.page);
      if (params.per_page || params.limit) query.append('per_page', params.per_page || params.limit);
    }

    const qs = query.toString();
    const url = qs ? `/api/banks?${qs}` : '/api/banks';
    const res = await apiClient.get(url);

    return {
      data: Array.isArray(res.data) ? res.data : [],
      summary: res.summary || {
        total_count: 0,
        active_count: 0,
        inactive_count: 0,
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
   * Mengambil detail satu bank.
   */
  async getBank(id) {
    const res = await apiClient.get(`/api/banks/${encodeURIComponent(id)}`);
    return res.data || null;
  },

  /**
   * Menambah master bank baru.
   */
  async createBank(payload) {
    const res = await apiClient.post('/api/banks', payload);
    return res.data || null;
  },

  /**
   * Memperbarui data master bank.
   */
  async updateBank(id, payload) {
    const res = await apiClient.put(`/api/banks/${encodeURIComponent(id)}`, payload);
    return res.data || null;
  },

  /**
   * Menghapus master bank.
   */
  async deleteBank(id) {
    const res = await apiClient.delete(`/api/banks/${encodeURIComponent(id)}`);
    return res.data || null;
  },

  /**
   * Toggle status aktif master bank.
   */
  async toggleBankStatus(id) {
    const res = await apiClient.post(`/api/banks/${encodeURIComponent(id)}/toggle-status`);
    return res.data || null;
  },
};
