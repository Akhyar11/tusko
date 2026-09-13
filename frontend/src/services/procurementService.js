/**
 * Procurement Service
 * Mengelola data Purchase Orders (PO), Goods Receiving Notes (GRN), dan Vendor Bills
 * Mendukung penyimpanan persisten localStorage dengan prefix tusko_
 */
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
  listeners.forEach(fn => {
    try {
      fn();
    } catch (err) {
      console.error('Error in procurement listener:', err);
    }
  });
};

export const procurementService = {
  subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },

  getPurchaseOrders() {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.POS);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error('Failed to parse stored POs:', e);
    }
    return initialPurchaseOrders;
  },

  savePurchaseOrders(pos) {
    try {
      localStorage.setItem(STORAGE_KEYS.POS, JSON.stringify(pos));
      notifyListeners();
    } catch (e) {
      console.error('Failed to save POs:', e);
    }
  },

  getGoodsReceivingNotes() {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.GRNS);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error('Failed to parse stored GRNs:', e);
    }
    return initialGoodsReceivingNotes;
  },

  saveGoodsReceivingNotes(grns) {
    try {
      localStorage.setItem(STORAGE_KEYS.GRNS, JSON.stringify(grns));
      notifyListeners();
    } catch (e) {
      console.error('Failed to save GRNs:', e);
    }
  },

  getVendorBills() {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.BILLS);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error('Failed to parse stored Bills:', e);
    }
    return initialVendorBills;
  },

  saveVendorBills(bills) {
    try {
      localStorage.setItem(STORAGE_KEYS.BILLS, JSON.stringify(bills));
      notifyListeners();
    } catch (e) {
      console.error('Failed to save Bills:', e);
    }
  },

  createPurchaseOrder(poData) {
    const currentPOs = this.getPurchaseOrders();
    const dateStr = new Date().toISOString().slice(0, 7).replace('-', '');
    const countStr = String(currentPOs.length + 1).padStart(3, '0');
    const newPO = {
      id: Date.now(),
      po_number: `PO-${dateStr}-${countStr}`,
      status: 'approved',
      order_date: new Date().toISOString().split('T')[0],
      ...poData
    };
    const updated = [newPO, ...currentPOs];
    this.savePurchaseOrders(updated);
    return newPO;
  },

  cancelPurchaseOrder(poId) {
    const currentPOs = this.getPurchaseOrders();
    const updated = currentPOs.map(po => {
      if (po.id === poId) {
        return { ...po, status: 'cancelled' };
      }
      return po;
    });
    this.savePurchaseOrders(updated);
  },

  receivePurchaseOrder(poId, receiveFormData) {
    const currentPOs = this.getPurchaseOrders();
    const targetPO = currentPOs.find(p => p.id === poId);
    if (!targetPO) throw new Error('Purchase Order tidak ditemukan');

    const currentGRNs = this.getGoodsReceivingNotes();
    const currentBills = this.getVendorBills();

    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const grnNumber = `GRN-${yearMonth}-${String(currentGRNs.length + 1).padStart(3, '0')}`;

    // 1. Buat Dokumen GRN
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
      items: targetPO.items.map(it => {
        const accepted = receiveFormData.accepted_quantities?.[it.id] !== undefined
          ? Number(receiveFormData.accepted_quantities[it.id])
          : it.ordered_quantity;
        return {
          id: it.id,
          sku: it.sku,
          product_name: `${it.product_name} (${it.variant_name || ''})`,
          accepted_quantity: accepted,
          rejected_quantity: 0,
          unit_cost: it.unit_price,
          notes: receiveFormData.notes || ''
        };
      })
    };

    // 2. Perbarui status PO menjadi 'received'
    const updatedPOs = currentPOs.map(po => {
      if (po.id === poId) {
        return {
          ...po,
          status: 'received',
          items: po.items.map(it => ({
            ...it,
            received_quantity: it.ordered_quantity
          }))
        };
      }
      return po;
    });

    // 3. Buat Dokumen Bill Tagihan
    const billNumber = `BILL-${yearMonth}-${String(currentBills.length + 1).padStart(3, '0')}`;
    const billRecord = {
      id: Date.now() + 1,
      bill_number: billNumber,
      po_number: targetPO.po_number,
      grn_number: grnNumber,
      vendor_name: targetPO.vendor_name,
      amount: targetPO.total_amount,
      paid_amount: 0,
      status: 'unpaid',
      bill_date: now.toISOString().split('T')[0],
      due_date: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
    };

    // Simpan semua pembaruan
    this.savePurchaseOrders(updatedPOs);
    this.saveGoodsReceivingNotes([grnRecord, ...currentGRNs]);
    this.saveVendorBills([billRecord, ...currentBills]);

    return { po: targetPO, grn: grnRecord, bill: billRecord };
  },

  payVendorBill(billId) {
    const currentBills = this.getVendorBills();
    const updated = currentBills.map(b => {
      if (b.id === billId) {
        return {
          ...b,
          paid_amount: b.amount,
          status: 'paid'
        };
      }
      return b;
    });
    this.saveVendorBills(updated);
  }
};
