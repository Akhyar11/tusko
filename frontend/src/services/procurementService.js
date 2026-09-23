/**
 * Procurement Service
 * Mengelola data Purchase Orders (PO), Goods Receiving Notes (GRN), dan Vendor Bills
 * melalui REST API backend (Laravel) dengan fallback cache localStorage (mode offline).
 */
import { apiClient } from './apiClient';
import {
  initialPurchaseOrders,
  initialGoodsReceivingNotes,
  initialVendorBills
} from '../data/mockProcurementData';

const STORAGE_KEYS = {
  POS: 'tusko_procurement_pos',
  GRNS: 'tusko_procurement_grns',
  BILLS: 'tusko_procurement_bills'
};

const listeners = new Set();

const notifyListeners = () => {
  listeners.forEach((fn) => {
    try {
      fn();
    } catch (err) {
      console.error('Error in procurement listener:', err);
    }
  });
};

function readCache(key, fallback) {
  try {
    const stored = localStorage.getItem(key);
    if (stored) return JSON.parse(stored);
  } catch (e) {
    console.error(`Failed to parse stored ${key}:`, e);
  }
  return fallback;
}

function writeCache(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Failed to save ${key}:`, e);
  }
}

/**
 * Bangun query string dari params filter (hanya key yang relevan).
 */
function buildQuery(params = {}, keys = []) {
  const sp = new URLSearchParams();
  const set = (k, v) => {
    if (v !== undefined && v !== null && v !== '') sp.append(k, v);
  };

  set('page', params.page);
  set('per_page', params.per_page || params.limit);
  set('sort_by', params.sort_by || params.sortBy);
  set('sort_dir', params.sort_dir || params.sort_direction || params.sortDirection);

  keys.forEach((k) => set(k, params[k]));

  const qs = sp.toString();
  return qs ? `?${qs}` : '';
}

const PO_FILTER_KEYS = [
  'search', 'searchQuery', 'vendor_id', 'vendorSearchQuery', 'status', 'statusFilter',
  'warehouse_id', 'warehouseFilter', 'orderDateStart', 'orderDateEnd',
  'deliveryDateStart', 'deliveryDateEnd', 'minAmount', 'maxAmount'
];

const GRN_FILTER_KEYS = [
  'search', 'searchQuery', 'poSearchQuery', 'deliveryOrderQuery', 'receiverQuery',
  'vendorFilter', 'statusFilter', 'receivedDateStart', 'receivedDateEnd', 'minUnits', 'maxUnits'
];

const BILL_FILTER_KEYS = [
  'search', 'searchQuery', 'poSearchQuery', 'vendorSearchQuery', 'statusFilter',
  'billDateStart', 'billDateEnd', 'dueDateStart', 'dueDateEnd', 'minAmount', 'maxAmount'
];

export const procurementService = {
  subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },

  // ==========================================================================
  // SYNC CACHE GETTERS (fallback offline & data KPI lokal)
  // ==========================================================================
  getPurchaseOrders() {
    return readCache(STORAGE_KEYS.POS, initialPurchaseOrders);
  },

  getGoodsReceivingNotes() {
    return readCache(STORAGE_KEYS.GRNS, initialGoodsReceivingNotes);
  },

  getVendorBills() {
    return readCache(STORAGE_KEYS.BILLS, initialVendorBills);
  },

  // ==========================================================================
  // ASYNC API FETCHERS (server-side filter, sort, pagination)
  // ==========================================================================
  async fetchPurchaseOrders(params = {}) {
    const res = await apiClient.get(`/api/purchase-orders${buildQuery(params, PO_FILTER_KEYS)}`);
    const list = Array.isArray(res.data) ? res.data : [];
    const perPage = Number(params.per_page || params.limit || 0);
    if (perPage >= 100 && Number(params.page || 1) === 1) {
      writeCache(STORAGE_KEYS.POS, list);
    }
    return {
      data: list,
      total: res.meta?.total ?? list.length,
      meta: res.meta || { current_page: 1, last_page: 1, per_page: perPage || list.length, total: list.length }
    };
  },

  async fetchGoodsReceivingNotes(params = {}) {
    const res = await apiClient.get(`/api/goods-receiving-notes${buildQuery(params, GRN_FILTER_KEYS)}`);
    const list = Array.isArray(res.data) ? res.data : [];
    const perPage = Number(params.per_page || params.limit || 0);
    if (perPage >= 100 && Number(params.page || 1) === 1) {
      writeCache(STORAGE_KEYS.GRNS, list);
    }
    return {
      data: list,
      total: res.meta?.total ?? list.length,
      meta: res.meta || { current_page: 1, last_page: 1, per_page: perPage || list.length, total: list.length }
    };
  },

  async fetchVendorBills(params = {}) {
    const res = await apiClient.get(`/api/vendor-bills${buildQuery(params, BILL_FILTER_KEYS)}`);
    const list = Array.isArray(res.data) ? res.data : [];
    const perPage = Number(params.per_page || params.limit || 0);
    if (perPage >= 100 && Number(params.page || 1) === 1) {
      writeCache(STORAGE_KEYS.BILLS, list);
    }
    return {
      data: list,
      total: res.meta?.total ?? list.length,
      meta: res.meta || { current_page: 1, last_page: 1, per_page: perPage || list.length, total: list.length }
    };
  },

  async getPurchaseOrderById(poIdOrNumber) {
    try {
      const res = await apiClient.get(`/api/purchase-orders/${encodeURIComponent(poIdOrNumber)}`);
      return res.data || null;
    } catch (err) {
      if (!err.isNetworkError) throw err;
      const pos = this.getPurchaseOrders();
      return pos.find((p) => String(p.id) === String(poIdOrNumber) || p.po_number === poIdOrNumber) || null;
    }
  },

  // ==========================================================================
  // MUTATIONS (API-first, fallback lokal saat backend offline)
  // ==========================================================================
  async createPurchaseOrder(poData) {
    try {
      const payload = {
        vendor_id: poData.vendor_id,
        warehouse_id: poData.warehouse_id,
        status: poData.status || 'approved',
        expected_delivery_date: poData.expected_delivery_date || null,
        notes: poData.notes || null,
        items: (poData.items || []).map((it) => ({
          product_id: it.product_id,
          product_variant_id: it.variant_id ?? it.product_variant_id ?? null,
          ordered_quantity: Number(it.ordered_quantity) || 0,
          unit_price: Number(it.unit_price) || 0
        }))
      };
      const res = await apiClient.post('/api/purchase-orders', payload);
      notifyListeners();
      return res.data || res;
    } catch (err) {
      if (!err.isNetworkError) throw err;
      return this._createPurchaseOrderLocal(poData);
    }
  },

  async approvePurchaseOrder(poId, approverName = 'Admin Tusko') {
    try {
      const res = await apiClient.post(`/api/purchase-orders/${encodeURIComponent(poId)}/approve`);
      notifyListeners();
      return res.data || null;
    } catch (err) {
      if (!err.isNetworkError) throw err;
      return this._approvePurchaseOrderLocal(poId, approverName);
    }
  },

  async cancelPurchaseOrder(poId) {
    try {
      const res = await apiClient.post(`/api/purchase-orders/${encodeURIComponent(poId)}/cancel`);
      notifyListeners();
      return res.data || null;
    } catch (err) {
      if (!err.isNetworkError) throw err;
      return this._cancelPurchaseOrderLocal(poId);
    }
  },

  async receivePurchaseOrder(poId, receiveFormData = {}) {
    try {
      const res = await apiClient.post(`/api/purchase-orders/${encodeURIComponent(poId)}/receive`, {
        delivery_order_number: receiveFormData.delivery_order_number,
        notes: receiveFormData.notes,
        accepted_quantities: receiveFormData.accepted_quantities,
        rejected_quantities: receiveFormData.rejected_quantities,
        rejection_reasons: receiveFormData.rejection_reasons
      });
      const data = res.data || {};
      notifyListeners();
      return {
        po: data.purchase_order || null,
        grn: data.grn || null,
        bill: data.bill || null
      };
    } catch (err) {
      if (!err.isNetworkError) throw err;
      return this._receivePurchaseOrderLocal(poId, receiveFormData);
    }
  },

  async payVendorBill(billId) {
    try {
      const res = await apiClient.post(`/api/vendor-bills/${encodeURIComponent(billId)}/pay`);
      notifyListeners();
      return res.data || null;
    } catch (err) {
      if (!err.isNetworkError) throw err;
      return this._payVendorBillLocal(billId);
    }
  },

  // ==========================================================================
  // FALLBACK LOKAL (dipakai hanya saat backend tidak dapat dihubungi)
  // ==========================================================================
  _createPurchaseOrderLocal(poData) {
    const currentPOs = this.getPurchaseOrders();
    const dateStr = new Date().toISOString().slice(0, 7).replace('-', '');
    const countStr = String(currentPOs.length + 1).padStart(3, '0');
    const newPO = {
      id: Date.now(),
      po_number: `PO-${dateStr}-${countStr}`,
      status: poData.status || 'approved',
      order_date: new Date().toISOString().split('T')[0],
      ...poData
    };
    const updated = [newPO, ...currentPOs];
    writeCache(STORAGE_KEYS.POS, updated);
    notifyListeners();
    return newPO;
  },

  _approvePurchaseOrderLocal(poId, approverName = 'Admin Tusko') {
    const currentPOs = this.getPurchaseOrders();
    let targetApprovedPO = null;
    const updated = currentPOs.map((po) => {
      if (po.id === poId || po.po_number === poId) {
        targetApprovedPO = {
          ...po,
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: approverName
        };
        return targetApprovedPO;
      }
      return po;
    });
    writeCache(STORAGE_KEYS.POS, updated);
    notifyListeners();
    return targetApprovedPO;
  },

  _cancelPurchaseOrderLocal(poId) {
    const currentPOs = this.getPurchaseOrders();
    const updated = currentPOs.map((po) => {
      if (po.id === poId) {
        return { ...po, status: 'cancelled' };
      }
      return po;
    });
    writeCache(STORAGE_KEYS.POS, updated);
    notifyListeners();
  },

  _receivePurchaseOrderLocal(poId, receiveFormData = {}) {
    const currentPOs = this.getPurchaseOrders();
    const targetPO = currentPOs.find((p) => p.id === poId);
    if (!targetPO) throw new Error('Purchase Order tidak ditemukan');

    const currentGRNs = this.getGoodsReceivingNotes();
    const currentBills = this.getVendorBills();

    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const grnNumber = `GRN-${yearMonth}-${String(currentGRNs.length + 1).padStart(3, '0')}`;

    const grnRecord = {
      id: Date.now(),
      grn_number: grnNumber,
      po_number: targetPO.po_number,
      vendor_name: targetPO.vendor_name,
      warehouse_name: targetPO.warehouse_name,
      received_date: now.toISOString().split('T')[0],
      delivery_order_number: receiveFormData.delivery_order_number || `DO-${Date.now().toString().slice(-6)}`,
      received_by: receiveFormData.received_by || '',
      status: 'verified',
      items: (targetPO.items || []).map((it) => {
        const remaining = Math.max(0, (Number(it.ordered_quantity) || 0) - (Number(it.received_quantity) || 0));
        const accepted = receiveFormData.accepted_quantities?.[it.id] !== undefined
          ? Number(receiveFormData.accepted_quantities[it.id])
          : remaining;
        const rejected = receiveFormData.rejected_quantities?.[it.id] !== undefined
          ? Number(receiveFormData.rejected_quantities[it.id])
          : 0;
        return {
          id: it.id,
          sku: it.sku,
          product_name: `${it.product_name} (${it.variant_name || ''})`,
          accepted_quantity: accepted,
          rejected_quantity: rejected,
          rejection_reason: rejected > 0 ? (receiveFormData.rejection_reasons?.[it.id] || null) : null,
          unit_cost: it.unit_price,
          notes: receiveFormData.notes || ''
        };
      })
    };

    let hasRejection = false;
    let allReceived = true;
    let totalBillAmount = 0;

    const updatedPOs = currentPOs.map((po) => {
      if (po.id !== poId) return po;
      const updatedItems = (po.items || []).map((it) => {
        const remaining = Math.max(0, (Number(it.ordered_quantity) || 0) - (Number(it.received_quantity) || 0));
        const accepted = receiveFormData.accepted_quantities?.[it.id] !== undefined
          ? Number(receiveFormData.accepted_quantities[it.id])
          : remaining;
        const rejected = receiveFormData.rejected_quantities?.[it.id] !== undefined
          ? Number(receiveFormData.rejected_quantities[it.id])
          : 0;
        if (rejected > 0) hasRejection = true;
        if (accepted < remaining) allReceived = false;
        totalBillAmount += accepted * (Number(it.unit_price) || 0);
        return { ...it, received_quantity: (Number(it.received_quantity) || 0) + accepted };
      });
      return {
        ...po,
        status: allReceived ? 'received' : 'partially_received',
        items: updatedItems
      };
    });

    if (hasRejection) {
      grnRecord.status = 'discrepancy';
    }

    const billNumber = `BILL-${yearMonth}-${String(currentBills.length + 1).padStart(3, '0')}`;
    const billRecord = {
      id: Date.now() + 1,
      bill_number: billNumber,
      po_number: targetPO.po_number,
      grn_number: grnNumber,
      vendor_name: targetPO.vendor_name,
      amount: totalBillAmount,
      paid_amount: 0,
      status: 'unpaid',
      bill_date: now.toISOString().split('T')[0],
      due_date: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
    };

    writeCache(STORAGE_KEYS.POS, updatedPOs);
    writeCache(STORAGE_KEYS.GRNS, [grnRecord, ...currentGRNs]);
    writeCache(STORAGE_KEYS.BILLS, [billRecord, ...currentBills]);
    notifyListeners();

    const updatedTargetPO = updatedPOs.find((po) => po.id === poId) || targetPO;
    return { po: updatedTargetPO, grn: grnRecord, bill: billRecord };
  },

  _payVendorBillLocal(billId) {
    const currentBills = this.getVendorBills();
    const updated = currentBills.map((b) => {
      if (b.id === billId) {
        return { ...b, paid_amount: b.amount, status: 'paid' };
      }
      return b;
    });
    writeCache(STORAGE_KEYS.BILLS, updated);
    notifyListeners();
    return updated.find((b) => b.id === billId) || null;
  }
};
