import { apiClient } from './apiClient';

export const financialAccountService = {
  /**
   * Mengambil daftar akun kas & bank dari server dengan filter, sorting, dan pagination.
   */
  async getAccounts(params = {}) {
    const query = new URLSearchParams();

    if (params.type && params.type !== 'all') {
      query.append('type', params.type);
    }

    if (params.is_active !== undefined && params.is_active !== 'all' && params.is_active !== '') {
      query.append('is_active', params.is_active ? '1' : '0');
    }

    if (params.search && params.search.trim()) {
      query.append('search', params.search.trim());
    }

    if (params.chart_of_account_id && params.chart_of_account_id !== 'all') {
      query.append('chart_of_account_id', params.chart_of_account_id);
    }

    if (params.sort) {
      query.append('sort', params.sort);
    }

    if (params.all) {
      query.append('all', '1');
    } else {
      if (params.page) query.append('page', params.page);
      if (params.per_page || params.limit) query.append('per_page', params.per_page || params.limit);
    }

    const qs = query.toString();
    const url = qs ? `/api/financial-accounts?${qs}` : '/api/financial-accounts';
    const res = await apiClient.get(url);

    return {
      data: Array.isArray(res.data) ? res.data : [],
      stats: res.stats || {
        total_balance: 0,
        active_count: 0,
        inactive_count: 0,
        total_count: 0,
      },
      meta: res.meta || {
        current_page: 1,
        last_page: 1,
        per_page: 15,
        total: Array.isArray(res.data) ? res.data.length : 0,
      },
    };
  },

  /**
   * Mengambil detail satu akun beserta riwayat transaksi terakhir.
   */
  async getAccount(id) {
    const res = await apiClient.get(`/api/financial-accounts/${encodeURIComponent(id)}`);
    return res.data || null;
  },

  /**
   * Membuat akun kas atau bank baru.
   */
  async createAccount(payload) {
    const res = await apiClient.post('/api/financial-accounts', payload);
    return res.data || null;
  },

  /**
   * Memperbarui informasi akun.
   */
  async updateAccount(id, payload) {
    const res = await apiClient.put(`/api/financial-accounts/${encodeURIComponent(id)}`, payload);
    return res.data || null;
  },

  /**
   * Menghapus akun (hanya diperbolehkan jika belum ada riwayat mutasi/pembayaran).
   */
  async deleteAccount(id) {
    const res = await apiClient.delete(`/api/financial-accounts/${encodeURIComponent(id)}`);
    return res.data || null;
  },

  /**
   * Mengaktifkan atau menonaktifkan akun.
   */
  async toggleAccountStatus(id) {
    const res = await apiClient.post(`/api/financial-accounts/${encodeURIComponent(id)}/toggle-status`);
    return res.data || null;
  },

  /**
   * Melakukan transfer saldo antar akun secara atomik.
   */
  async transfer(payload) {
    const res = await apiClient.post('/api/financial-accounts/transfer', payload);
    return res.data || null;
  },

  /**
   * Menyetor modal pemilik langsung ke rekening tertentu.
   */
  async depositCapital(id, payload) {
    const res = await apiClient.post(`/api/financial-accounts/${encodeURIComponent(id)}/deposit-capital`, payload);
    return res.data || null;
  },
};
