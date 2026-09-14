import { createTableStore } from './createTableStore';
import { procurementService } from '../services/procurementService';

/**
 * Zustand Table Store untuk Purchase Orders (PO)
 */
export const usePOTableStore = createTableStore({
  name: 'PurchaseOrderTable',
  fetchFn: async (params = {}) => {
    let list = procurementService.getPurchaseOrders();
    const search = params.searchQuery || params.search || '';
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(po => 
        (po.po_number && po.po_number.toLowerCase().includes(q)) ||
        (po.vendor_name && po.vendor_name.toLowerCase().includes(q))
      );
    }
    const status = params.statusFilter || params.status;
    if (status && status !== 'all') {
      list = list.filter(po => po.status === status);
    }

    const sortBy = params.sortBy || params.sort_by || 'created_at';
    const sortDir = params.sortDirection || params.sort_dir || 'desc';
    list = [...list].sort((a, b) => {
      const valA = a[sortBy] ?? '';
      const valB = b[sortBy] ?? '';
      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    const page = params.page || 1;
    const limit = params.limit || params.per_page || 10;
    const start = (page - 1) * limit;
    const paginated = list.slice(start, start + limit);

    return {
      data: paginated,
      total: list.length,
      meta: { current_page: page, last_page: Math.max(1, Math.ceil(list.length / limit)), per_page: limit, total: list.length }
    };
  },
  initialFilters: {
    searchQuery: '',
    statusFilter: 'all'
  },
  defaultSortBy: 'created_at',
  defaultSortDir: 'desc',
  defaultLimit: 10
});

/**
 * Zustand Table Store untuk Penerimaan Barang (GRN)
 */
export const useGRNTableStore = createTableStore({
  name: 'GoodsReceiptTable',
  fetchFn: async (params = {}) => {
    let list = procurementService.getGoodsReceivingNotes();
    const search = params.searchQuery || params.search || '';
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(grn => 
        (grn.grn_number && grn.grn_number.toLowerCase().includes(q)) ||
        (grn.po_number && grn.po_number.toLowerCase().includes(q)) ||
        (grn.vendor_name && grn.vendor_name.toLowerCase().includes(q))
      );
    }
    const status = params.statusFilter || params.status;
    if (status && status !== 'all') {
      list = list.filter(grn => grn.status === status);
    }

    const page = params.page || 1;
    const limit = params.limit || params.per_page || 10;
    const start = (page - 1) * limit;
    const paginated = list.slice(start, start + limit);

    return {
      data: paginated,
      total: list.length,
      meta: { current_page: page, last_page: Math.max(1, Math.ceil(list.length / limit)), per_page: limit, total: list.length }
    };
  },
  initialFilters: {
    searchQuery: '',
    statusFilter: 'all'
  },
  defaultSortBy: 'received_date',
  defaultSortDir: 'desc',
  defaultLimit: 10
});

/**
 * Zustand Table Store untuk Tagihan Vendor (Vendor Bills)
 */
export const useBillTableStore = createTableStore({
  name: 'VendorBillTable',
  fetchFn: async (params = {}) => {
    let list = procurementService.getVendorBills();
    const search = params.searchQuery || params.search || '';
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(b => 
        (b.bill_number && b.bill_number.toLowerCase().includes(q)) ||
        (b.vendor_name && b.vendor_name.toLowerCase().includes(q)) ||
        (b.po_number && b.po_number.toLowerCase().includes(q))
      );
    }
    const status = params.statusFilter || params.status;
    if (status && status !== 'all') {
      list = list.filter(b => b.status === status);
    }

    const page = params.page || 1;
    const limit = params.limit || params.per_page || 10;
    const start = (page - 1) * limit;
    const paginated = list.slice(start, start + limit);

    return {
      data: paginated,
      total: list.length,
      meta: { current_page: page, last_page: Math.max(1, Math.ceil(list.length / limit)), per_page: limit, total: list.length }
    };
  },
  initialFilters: {
    searchQuery: '',
    statusFilter: 'all'
  },
  defaultSortBy: 'due_date',
  defaultSortDir: 'asc',
  defaultLimit: 10
});
