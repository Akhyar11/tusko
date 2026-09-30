/**
 * Service: Order Management API Client
 * Handles fetching, filtering, pagination, and status management for orders.
 */
import { apiClient, getStoredToken } from './apiClient';
import { getCartSessionId } from './cartService';

export const orderService = {
  /**
   * Fetch orders from server with dynamic filters, pagination, and sorting.
   */
  async fetchOrders(params = {}) {
    try {
      const searchParams = new URLSearchParams();
      const status = params.status || params.activeTab;
      if (status && status !== 'all') searchParams.append('status', status);

      const search = params.search || params.searchKeyword;
      if (search) searchParams.append('search', search);

      const expedition = params.expedition || params.expeditionFilter;
      if (expedition && expedition !== 'all') searchParams.append('expedition', expedition);

      const dateRange = params.date_range || params.dateFilter;
      if (dateRange && dateRange !== 'all') searchParams.append('date_range', dateRange);

      const sortBy = params.sort_by || params.sortBy;
      if (sortBy) searchParams.append('sort_by', sortBy);

      const page = params.page || 1;
      searchParams.append('page', page);

      const perPage = params.per_page || params.limit || 10;
      searchParams.append('per_page', perPage);

      const queryString = searchParams.toString();
      const url = queryString ? `/api/orders?${queryString}` : '/api/orders';
      const res = await apiClient.get(url);

      const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);

      return {
        data: list,
        total: res.meta?.total !== undefined ? res.meta.total : list.length,
        status_counts: res.status_counts || null,
        meta: res.meta || {
          current_page: page,
          last_page: Math.max(1, Math.ceil(list.length / perPage)),
          per_page: perPage,
          total: list.length
        }
      };
    } catch (err) {
      // Tanpa fallback mock/local: tampilkan daftar kosong agar admin tidak
      // melihat data pesanan palsu saat API gagal.
      console.warn('orderService.fetchOrders: gagal memuat pesanan.', err.message);

      return {
        data: [],
        total: 0,
        status_counts: null,
        meta: { current_page: 1, last_page: 1, per_page: params.per_page || params.limit || 10, total: 0 }
      };
    }
  },

  async getOrder(idOrOrderNumber) {
    const res = await apiClient.get(`/api/orders/${idOrOrderNumber}`);
    return res.data || res;
  },

  /**
   * T39.4 — daftar pesanan MILIK pelanggan (user login / sesi tamu).
   * Tanpa fallback data mock; error diteruskan ke pemanggil agar dapat ditampilkan.
   */
  async fetchMyOrders(params = {}) {
    const searchParams = new URLSearchParams();
    if (params.status && params.status !== 'all') searchParams.append('status', params.status);
    if (params.search) searchParams.append('search', params.search);
    if (params.page) searchParams.append('page', params.page);
    if (params.per_page) searchParams.append('per_page', params.per_page);

    // session_id HANYA untuk tamu. Bila login, biarkan backend scope by user_id
    // (mengirim session_id saat login membuat backend memakai scoping guest).
    if (!getStoredToken()) {
      const sessionId = getCartSessionId();
      if (sessionId) searchParams.append('session_id', sessionId);
    }

    const qs = searchParams.toString();
    const res = await apiClient.get(`/api/orders${qs ? `?${qs}` : ''}`);

    const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);

    return {
      data: list,
      status_counts: res.status_counts || null,
      meta: res.meta || {
        current_page: 1,
        last_page: 1,
        per_page: list.length,
        total: list.length,
      },
    };
  },

  async updateOrderStatus(idOrOrderNumber, statusOrPayload) {
    const payload = typeof statusOrPayload === 'string'
      ? { status: statusOrPayload }
      : (statusOrPayload || {});
    const res = await apiClient.patch(`/api/orders/${idOrOrderNumber}/status`, payload);
    return res.data || res;
  },

  async cancelOrder(idOrOrderNumber, cancellationReason = null) {
    const res = await apiClient.post(`/api/orders/${idOrOrderNumber}/cancel`, { cancellation_reason: cancellationReason });
    return res.data || res;
  },

  async completeOrder(idOrOrderNumber) {
    const res = await apiClient.post(`/api/orders/${idOrOrderNumber}/complete`);
    return res.data || res;
  },

  async generateReceipt(idOrOrderNumber) {
    const res = await apiClient.post(`/api/orders/${idOrOrderNumber}/generate-receipt`);
    return res.data || res;
  },

  async bookPickup(idOrOrderNumber) {
    const res = await apiClient.post(`/api/orders/${idOrOrderNumber}/book-pickup`);
    return res.data || res;
  },

  async getReceipt(idOrOrderNumber) {
    const res = await apiClient.get(`/api/orders/${idOrOrderNumber}/receipt`);
    return res.data || res;
  }
};
