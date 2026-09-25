import { apiClient } from './apiClient';

/**
 * Service: Stock Opname (T25.2/T25.3) — sesi opname fisik + approve.
 */
function buildQuery(params = {}) {
  const qs = new URLSearchParams();

  const search = params.search ?? params.searchQuery;
  if (search) qs.append('search', search);

  const warehouseId = params.warehouse_id ?? params.warehouseFilter;
  if (warehouseId && warehouseId !== 'all') qs.append('warehouse_id', warehouseId);

  const status = params.status ?? params.statusFilter;
  if (status && status !== 'all') qs.append('status', status);

  [['conducted_from', params.conducted_from ?? params.conductedFrom],
   ['conducted_to', params.conducted_to ?? params.conductedTo],
   ['items_min', params.items_min ?? params.itemsMin],
   ['items_max', params.items_max ?? params.itemsMax]]
    .forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') qs.append(key, value);
    });

  const sort = params.sort ?? params.sortFilter;
  if (sort) qs.append('sort', sort);

  qs.append('page', params.page || 1);
  qs.append('per_page', params.per_page || params.limit || 15);

  return qs.toString();
}

export const stockOpnameService = {
  async fetchOpnames(params = {}) {
    const res = await apiClient.get(`/api/stock-opnames?${buildQuery(params)}`);
    const list = Array.isArray(res.data) ? res.data : [];
    const meta = res.meta || {};

    return {
      data: list,
      total: meta.total !== undefined ? meta.total : list.length,
      meta: {
        current_page: meta.current_page || params.page || 1,
        last_page: meta.last_page || 1,
        per_page: meta.per_page || params.limit || 15,
        total: meta.total !== undefined ? meta.total : list.length
      }
    };
  },

  async getOpname(id) {
    const res = await apiClient.get(`/api/stock-opnames/${id}`);
    return res?.data || null;
  },

  async createOpname(payload) {
    const res = await apiClient.post('/api/stock-opnames', payload);
    return res?.data || null;
  },

  async submitOpname(id) {
    const res = await apiClient.post(`/api/stock-opnames/${id}/submit`);
    return res?.data || null;
  },

  async approveOpname(id) {
    const res = await apiClient.post(`/api/stock-opnames/${id}/approve`);
    return res?.data || null;
  }
};
