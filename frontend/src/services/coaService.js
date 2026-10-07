import { apiClient } from './apiClient';

export const coaService = {
  /**
   * Mengambil daftar COA dari server dengan filter, sorting, dan pagination.
   */
  async getAccounts(params = {}) {
    const query = new URLSearchParams();

    if (params.search && params.search.trim()) {
      query.append('search', params.search.trim());
    }

    if (params.account_type && params.account_type !== 'all') {
      query.append('account_type', params.account_type);
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
    const url = qs ? `/api/chart-of-accounts?${qs}` : '/api/chart-of-accounts';
    const res = await apiClient.get(url);

    return {
      data: Array.isArray(res.data) ? res.data : [],
      summary: res.summary || {
        total_count: 0,
        active_count: 0,
        asset_count: 0,
        liability_count: 0,
        equity_count: 0,
        revenue_count: 0,
        expense_count: 0,
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
   * Mengambil detail satu akun COA.
   */
  async getAccount(id) {
    const res = await apiClient.get(`/api/chart-of-accounts/${encodeURIComponent(id)}`);
    return res.data || null;
  },

  /**
   * Membuat akun COA baru.
   */
  async createAccount(payload) {
    const res = await apiClient.post('/api/chart-of-accounts', payload);
    return res.data || null;
  },

  /**
   * Memperbarui akun COA.
   */
  async updateAccount(id, payload) {
    const res = await apiClient.put(`/api/chart-of-accounts/${encodeURIComponent(id)}`, payload);
    return res.data || null;
  },

  /**
   * Menghapus akun COA.
   */
  async deleteAccount(id) {
    const res = await apiClient.delete(`/api/chart-of-accounts/${encodeURIComponent(id)}`);
    return res.data || null;
  },

  /**
   * Toggle status aktif akun COA.
   */
  async toggleAccountStatus(id) {
    const res = await apiClient.post(`/api/chart-of-accounts/${encodeURIComponent(id)}/toggle-status`);
    return res.data || null;
  },
};
