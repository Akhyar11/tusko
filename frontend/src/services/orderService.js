/**
 * Service: Order Management API Client
 * Handles fetching, filtering, pagination, and status management for orders.
 */
import { apiClient } from './apiClient';
import { mockOrders } from '../data/mockOrders';

const STORAGE_KEY = 'tusko_orders_cache';

function getStoredOrders() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return mockOrders;
}

function setStoredOrders(orders) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  } catch {
    // ignore
  }
}

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
      if (list.length > 0) {
        setStoredOrders(list);
      }

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
      console.warn('orderService.fetchOrders: fallback to local/mock data.', err.message);
      let list = getStoredOrders();
      const status = params.status || params.activeTab;
      if (status && status !== 'all') {
        list = list.filter(o => o.status === status);
      }
      const search = params.search || params.searchKeyword;
      if (search && search.trim()) {
        const q = search.toLowerCase();
        list = list.filter(o =>
          (o.order_number && o.order_number.toLowerCase().includes(q)) ||
          (o.recipient_name && o.recipient_name.toLowerCase().includes(q)) ||
          (o.tracking_number && o.tracking_number.toLowerCase().includes(q))
        );
      }
      return {
        data: list,
        total: list.length,
        status_counts: null,
        meta: { current_page: 1, last_page: 1, per_page: list.length, total: list.length }
      };
    }
  },

  async getOrder(idOrOrderNumber) {
    const res = await apiClient.get(`/api/orders/${idOrOrderNumber}`);
    return res.data || res;
  },

  async updateOrderStatus(idOrOrderNumber, statusOrPayload) {
    const payload = typeof statusOrPayload === 'string'
      ? { status: statusOrPayload }
      : (statusOrPayload || {});
    const res = await apiClient.patch(`/api/orders/${idOrOrderNumber}/status`, payload);
    return res.data || res;
  },

  async generateReceipt(idOrOrderNumber) {
    const res = await apiClient.post(`/api/orders/${idOrOrderNumber}/generate-receipt`);
    return res.data || res;
  },

  async getReceipt(idOrOrderNumber) {
    const res = await apiClient.get(`/api/orders/${idOrOrderNumber}/receipt`);
    return res.data || res;
  }
};
