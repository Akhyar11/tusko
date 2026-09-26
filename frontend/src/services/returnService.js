import { apiClient } from './apiClient';

/**
 * Service: Retur & Refund (T29.4) — pengajuan pelanggan + pengelolaan admin.
 */
function buildQuery(params = {}) {
  const qs = new URLSearchParams();

  const search = params.search ?? params.searchQuery;
  if (search) qs.append('search', search);

  const status = params.status ?? params.statusFilter;
  if (status && status !== 'all') qs.append('status', status);

  const userSearch = params.userSearch ?? params.userSearchQuery;
  if (userSearch) qs.append('userSearch', userSearch);

  const from = params.requested_from ?? params.requestedFrom;
  if (from) qs.append('requested_from', from);

  const to = params.requested_to ?? params.requestedTo;
  if (to) qs.append('requested_to', to);

  [['items_min', params.items_min ?? params.itemsMin], ['items_max', params.items_max ?? params.itemsMax],
   ['refund_amount_min', params.refund_amount_min ?? params.refundAmountMin],
   ['refund_amount_max', params.refund_amount_max ?? params.refundAmountMax]]
    .forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') qs.append(key, value);
    });

  const sortBy = params.sort_by ?? params.sortBy;
  if (sortBy) qs.append('sort_by', sortBy);

  const sortDir = params.sort_dir ?? params.sortDirection ?? params.order;
  if (sortDir) qs.append('sort_dir', sortDir);

  qs.append('page', params.page || 1);
  qs.append('per_page', params.per_page || params.limit || 15);

  return qs.toString();
}

export const returnService = {
  async fetchReturns(params = {}) {
    const res = await apiClient.get(`/api/returns?${buildQuery(params)}`);
    const list = Array.isArray(res.data) ? res.data : [];
    return {
      data: list,
      total: res.total !== undefined ? res.total : list.length,
      meta: {
        current_page: res.current_page || params.page || 1,
        last_page: res.last_page || 1,
        per_page: res.per_page || params.limit || 15,
        total: res.total !== undefined ? res.total : list.length
      }
    };
  },

  async getReturn(id) {
    const res = await apiClient.get(`/api/returns/${id}`);
    return res?.data || null;
  },

  async createReturn(payload) {
    const res = await apiClient.post('/api/returns', payload);
    return res?.data || null;
  },

  async approveReturn(id) {
    const res = await apiClient.post(`/api/returns/${id}/approve`);
    return res?.data || null;
  },

  async rejectReturn(id, rejectionReason) {
    const res = await apiClient.post(`/api/returns/${id}/reject`, { rejection_reason: rejectionReason });
    return res?.data || null;
  },

  async refundReturn(id, refundMethod, refundReference) {
    const res = await apiClient.post(`/api/returns/${id}/refund`, {
      refund_method: refundMethod,
      refund_reference: refundReference || null
    });
    return res?.data || null;
  }
};
