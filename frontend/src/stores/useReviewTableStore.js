import { createTableStore } from './createTableStore';
import { reviewService } from '../services/reviewService';

/**
 * Zustand Table Store untuk moderasi Ulasan Produk admin (T32.3).
 * Filter, pagination, limit, dan sorting dieksekusi 100% Server-Side.
 */
export const useReviewTableStore = createTableStore({
  name: 'ReviewTable',
  fetchFn: (params) => reviewService.fetchAdminReviews(params),
  initialFilters: {
    searchQuery: '',
    userSearchQuery: '',
    createdFrom: '',
    createdTo: '',
    productFilter: 'all',
    ratingFilter: 'all',
    statusFilter: 'all'
  },
  defaultSortBy: 'created_at',
  defaultSortDir: 'desc',
  defaultLimit: 15
});
