import { apiClient } from './apiClient';

/**
 * Service: Ulasan Produk (T32.3) — list publik, submit pembeli, moderasi admin.
 */
function buildAdminQuery(params = {}) {
  const qs = new URLSearchParams();

  const search = params.search ?? params.searchQuery;
  if (search) qs.append('search', search);

  const userSearch = params.userSearch ?? params.userSearchQuery;
  if (userSearch) qs.append('userSearch', userSearch);

  const createdFrom = params.created_from ?? params.createdFrom;
  if (createdFrom) qs.append('created_from', createdFrom);

  const createdTo = params.created_to ?? params.createdTo;
  if (createdTo) qs.append('created_to', createdTo);

  const productId = params.product_id ?? params.productFilter;
  if (productId && productId !== 'all') qs.append('product_id', productId);

  const rating = params.rating ?? params.ratingFilter;
  if (rating && rating !== 'all') qs.append('rating', rating);

  const approved = params.is_approved ?? params.statusFilter;
  if (approved !== undefined && approved !== null && approved !== '' && approved !== 'all') {
    const isApproved = approved === true || approved === 'approved' || approved === '1' || approved === 1;
    qs.append('is_approved', isApproved ? '1' : '0');
  }

  const sortBy = params.sort_by ?? params.sortBy;
  if (sortBy) qs.append('sort_by', sortBy);

  const sortDir = params.sort_dir ?? params.sortDirection ?? params.order;
  if (sortDir) qs.append('sort_dir', sortDir);

  qs.append('page', params.page || 1);
  qs.append('per_page', params.per_page || params.limit || 15);

  return qs.toString();
}

export const reviewService = {
  async fetchProductReviews(productIdOrSlug, params = {}) {
    const qs = new URLSearchParams();
    qs.append('per_page', params.per_page || params.limit || 10);
    qs.append('page', params.page || 1);
    const res = await apiClient.get(`/api/products/${productIdOrSlug}/reviews?${qs.toString()}`);
    return {
      data: Array.isArray(res?.data) ? res.data : [],
      meta: res?.meta || {},
      aggregate: res?.aggregate || { count: 0, average: 0, distribution: {} }
    };
  },

  async submitReview(payload) {
    const res = await apiClient.post('/api/reviews', payload);
    return res?.data || null;
  },

  async fetchAdminReviews(params = {}) {
    const res = await apiClient.get(`/api/admin/reviews?${buildAdminQuery(params)}`);
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

  async moderateReview(id, isApproved) {
    const res = await apiClient.put(`/api/admin/reviews/${id}/moderate`, { is_approved: isApproved });
    return res?.data || null;
  },

  async deleteReview(id) {
    return await apiClient.delete(`/api/admin/reviews/${id}`);
  }
};
