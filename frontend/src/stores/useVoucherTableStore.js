import { createTableStore } from './createTableStore';
import { voucherService } from '../services/voucherService';

/**
 * Zustand Table Store untuk Voucher & Promo Admin (T15.3).
 * Seluruh filter/pagination/sorting dieksekusi 100% server-side.
 */
export const useVoucherTableStore = createTableStore({
  name: 'VoucherTable',
  fetchFn: async (params) => voucherService.fetchVouchers(params),
  initialFilters: {
    codeSearchQuery: '',
    titleSearchQuery: '',
    discountTypeFilter: 'all',
    statusFilter: 'all',
    discountValueMin: '',
    discountValueMax: '',
    minPurchaseMin: '',
    minPurchaseMax: '',
    quotaMin: '',
    quotaMax: '',
    expiresFrom: '',
    expiresTo: '',
  },
  defaultSortBy: 'id',
  defaultSortDir: 'desc',
  defaultLimit: 10,
});
