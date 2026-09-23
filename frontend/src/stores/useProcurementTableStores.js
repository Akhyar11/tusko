import { createTableStore } from './createTableStore';
import { procurementService } from '../services/procurementService';

/**
 * Helper fallback: filter + sort + paginate data lokal (dipakai hanya saat API offline).
 */
function localPaginate(list, params, sortable = true) {
  const sortBy = params.sortBy || params.sort_by || 'created_at';
  const sortDir = params.sortDirection || params.sort_dir || params.sort_direction || 'desc';
  let sorted = list;
  if (sortable) {
    sorted = [...list].sort((a, b) => {
      const valA = a[sortBy] ?? '';
      const valB = b[sortBy] ?? '';
      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }
  const page = params.page || 1;
  const limit = params.limit || params.per_page || 10;
  const start = (page - 1) * limit;
  const paginated = sorted.slice(start, start + limit);
  return {
    data: paginated,
    total: sorted.length,
    meta: {
      current_page: page,
      last_page: Math.max(1, Math.ceil(sorted.length / limit)),
      per_page: limit,
      total: sorted.length
    }
  };
}

/**
 * Zustand Table Store untuk Purchase Orders (PO)
 */
export const usePOTableStore = createTableStore({
  name: 'PurchaseOrderTable',
  fetchFn: async (params = {}) => {
    try {
      return await procurementService.fetchPurchaseOrders(params);
    } catch (err) {
      console.warn('[PurchaseOrderTableStore] API fallback ke cache lokal:', err.message);
    }

    let list = procurementService.getPurchaseOrders();
    const search = params.searchQuery || params.search || '';
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(po => (po.po_number && po.po_number.toLowerCase().includes(q)));
    }
    const vendorSearch = params.vendorSearchQuery || '';
    if (vendorSearch.trim()) {
      const q = vendorSearch.toLowerCase();
      list = list.filter(po => po.vendor_name && po.vendor_name.toLowerCase().includes(q));
    }
    const status = params.statusFilter || params.status;
    if (status && status !== 'all') {
      list = list.filter(po => po.status === status);
    }
    const warehouse = params.warehouseFilter;
    if (warehouse && warehouse !== 'all') {
      list = list.filter(po => po.warehouse_id === warehouse || po.warehouse_name === warehouse);
    }
    if (params.orderDateStart) {
      list = list.filter(po => po.order_date && po.order_date >= params.orderDateStart);
    }
    if (params.orderDateEnd) {
      list = list.filter(po => po.order_date && po.order_date <= params.orderDateEnd);
    }
    if (params.deliveryDateStart) {
      list = list.filter(po => po.expected_delivery_date && po.expected_delivery_date >= params.deliveryDateStart);
    }
    if (params.deliveryDateEnd) {
      list = list.filter(po => po.expected_delivery_date && po.expected_delivery_date <= params.deliveryDateEnd);
    }
    if (params.minAmount !== undefined && params.minAmount !== '') {
      list = list.filter(po => Number(po.total_amount || 0) >= Number(params.minAmount));
    }
    if (params.maxAmount !== undefined && params.maxAmount !== '') {
      list = list.filter(po => Number(po.total_amount || 0) <= Number(params.maxAmount));
    }

    return localPaginate(list, params);
  },
  initialFilters: {
    searchQuery: '',
    vendorSearchQuery: '',
    statusFilter: 'all',
    warehouseFilter: 'all',
    orderDateStart: '',
    orderDateEnd: '',
    deliveryDateStart: '',
    deliveryDateEnd: '',
    minAmount: '',
    maxAmount: ''
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
    try {
      return await procurementService.fetchGoodsReceivingNotes(params);
    } catch (err) {
      console.warn('[GoodsReceiptTableStore] API fallback ke cache lokal:', err.message);
    }

    let list = procurementService.getGoodsReceivingNotes();
    const search = params.searchQuery || params.search || '';
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(grn => (grn.grn_number && grn.grn_number.toLowerCase().includes(q)));
    }
    const poSearch = params.poSearchQuery || '';
    if (poSearch.trim()) {
      const q = poSearch.toLowerCase();
      list = list.filter(grn => grn.po_number && grn.po_number.toLowerCase().includes(q));
    }
    const doQuery = params.deliveryOrderQuery || '';
    if (doQuery.trim()) {
      const q = doQuery.toLowerCase();
      list = list.filter(grn => grn.delivery_order_number && grn.delivery_order_number.toLowerCase().includes(q));
    }
    const receiver = params.receiverQuery || '';
    if (receiver.trim()) {
      const q = receiver.toLowerCase();
      list = list.filter(grn => grn.received_by && grn.received_by.toLowerCase().includes(q));
    }
    const vendor = params.vendorFilter;
    if (vendor && vendor !== 'all') {
      list = list.filter(grn => grn.vendor_id === vendor || grn.vendor_name === vendor);
    }
    const status = params.statusFilter || params.status;
    if (status && status !== 'all') {
      list = list.filter(grn => grn.status === status);
    }
    if (params.receivedDateStart) {
      list = list.filter(grn => grn.received_date && grn.received_date >= params.receivedDateStart);
    }
    if (params.receivedDateEnd) {
      list = list.filter(grn => grn.received_date && grn.received_date <= params.receivedDateEnd);
    }
    if (params.minUnits !== undefined && params.minUnits !== '') {
      list = list.filter(grn => {
        const units = (grn.items || []).reduce((s, it) => s + (Number(it.accepted_quantity) || 0), 0);
        return units >= Number(params.minUnits);
      });
    }
    if (params.maxUnits !== undefined && params.maxUnits !== '') {
      list = list.filter(grn => {
        const units = (grn.items || []).reduce((s, it) => s + (Number(it.accepted_quantity) || 0), 0);
        return units <= Number(params.maxUnits);
      });
    }

    return localPaginate(list, params);
  },
  initialFilters: {
    searchQuery: '',
    poSearchQuery: '',
    deliveryOrderQuery: '',
    receiverQuery: '',
    vendorFilter: 'all',
    statusFilter: 'all',
    receivedDateStart: '',
    receivedDateEnd: '',
    minUnits: '',
    maxUnits: ''
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
    try {
      return await procurementService.fetchVendorBills(params);
    } catch (err) {
      console.warn('[VendorBillTableStore] API fallback ke cache lokal:', err.message);
    }

    let list = procurementService.getVendorBills();
    const search = params.searchQuery || params.search || '';
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(b => (b.bill_number && b.bill_number.toLowerCase().includes(q)));
    }
    const poSearch = params.poSearchQuery || '';
    if (poSearch.trim()) {
      const q = poSearch.toLowerCase();
      list = list.filter(b => b.po_number && b.po_number.toLowerCase().includes(q));
    }
    const vendorSearch = params.vendorSearchQuery || '';
    if (vendorSearch.trim()) {
      const q = vendorSearch.toLowerCase();
      list = list.filter(b => b.vendor_name && b.vendor_name.toLowerCase().includes(q));
    }
    const status = params.statusFilter || params.status;
    if (status && status !== 'all') {
      list = list.filter(b => b.status === status);
    }
    if (params.billDateStart) {
      list = list.filter(b => b.bill_date && b.bill_date >= params.billDateStart);
    }
    if (params.billDateEnd) {
      list = list.filter(b => b.bill_date && b.bill_date <= params.billDateEnd);
    }
    if (params.dueDateStart) {
      list = list.filter(b => b.due_date && b.due_date >= params.dueDateStart);
    }
    if (params.dueDateEnd) {
      list = list.filter(b => b.due_date && b.due_date <= params.dueDateEnd);
    }
    if (params.minAmount !== undefined && params.minAmount !== '') {
      list = list.filter(b => Number(b.amount || 0) >= Number(params.minAmount));
    }
    if (params.maxAmount !== undefined && params.maxAmount !== '') {
      list = list.filter(b => Number(b.amount || 0) <= Number(params.maxAmount));
    }

    return localPaginate(list, params);
  },
  initialFilters: {
    searchQuery: '',
    poSearchQuery: '',
    vendorSearchQuery: '',
    statusFilter: 'all',
    billDateStart: '',
    billDateEnd: '',
    dueDateStart: '',
    dueDateEnd: '',
    minAmount: '',
    maxAmount: ''
  },
  defaultSortBy: 'due_date',
  defaultSortDir: 'asc',
  defaultLimit: 10
});
