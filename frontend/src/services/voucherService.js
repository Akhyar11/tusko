/**
 * Service: Voucher & Promo Admin
 * Wrapper CRUD server-side untuk `/api/admin/vouchers` (T15.3).
 */
import { apiClient } from './apiClient';

function buildQuery(params = {}) {
  const urlParams = new URLSearchParams();

  const append = (key, value) => {
    if (value === undefined || value === null || value === '') return;
    urlParams.append(key, value);
  };

  append('code', params.codeSearchQuery ?? params.code);
  append('title', params.titleSearchQuery ?? params.title);

  if (params.discountTypeFilter && params.discountTypeFilter !== 'all') {
    append('discount_type', params.discountTypeFilter);
  }

  if (params.statusFilter === 'active') append('is_active', '1');
  else if (params.statusFilter === 'inactive') append('is_active', '0');

  append('discount_value_min', params.discountValueMin);
  append('discount_value_max', params.discountValueMax);
  append('min_purchase_min', params.minPurchaseMin);
  append('min_purchase_max', params.minPurchaseMax);
  append('quota_min', params.quotaMin);
  append('quota_max', params.quotaMax);
  append('expires_from', params.expiresFrom);
  append('expires_to', params.expiresTo);

  append('sort_by', params.sort_by || params.sortBy);
  append('sort_dir', params.sort_dir || params.sortDirection || params.order);
  append('page', params.page || 1);
  append('per_page', params.per_page || params.limit || 10);

  return urlParams.toString();
}

export const voucherService = {
  async fetchVouchers(params = {}) {
    const query = buildQuery(params);
    const res = await apiClient.get(query ? `/api/admin/vouchers?${query}` : '/api/admin/vouchers');

    const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);

    return {
      data: list,
      total: res?.total !== undefined ? res.total : (res?.meta?.total !== undefined ? res.meta.total : list.length),
      meta: res?.meta || {
        current_page: res?.current_page || params.page || 1,
        last_page: res?.last_page || 1,
        per_page: res?.per_page || params.limit || 10,
        total: res?.total !== undefined ? res.total : list.length,
      },
    };
  },

  async getVoucher(id) {
    const res = await apiClient.get(`/api/admin/vouchers/${id}`);
    return res?.data ?? null;
  },

  async createVoucher(payload) {
    const res = await apiClient.post('/api/admin/vouchers', payload);
    return res?.data ?? null;
  },

  async updateVoucher(id, payload) {
    const res = await apiClient.put(`/api/admin/vouchers/${id}`, payload);
    return res?.data ?? null;
  },

  async deleteVoucher(id) {
    return apiClient.delete(`/api/admin/vouchers/${id}`);
  },

  async toggleStatus(voucher) {
    return this.updateVoucher(voucher.id, { is_active: !voucher.is_active });
  },
};
