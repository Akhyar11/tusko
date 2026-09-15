/**
 * Service: Warehouse / Gudang Master Data Service
 * Mengelola operasi CRUD data master gudang dengan integrasi REST API backend Laravel
 * dan dukungan penyimpanan lokal persisten (localStorage) sebagai fallback.
 */
import { apiClient } from './apiClient';
import { initialWarehouses } from '../data/mockStockData';

const STORAGE_KEY = 'tusko_warehouses';

const defaultWarehouses = initialWarehouses.map((w, idx) => ({
  ...w,
  city: w.city || (idx === 0 ? 'Jakarta Timur' : idx === 1 ? 'Surabaya' : 'Medan'),
  province: w.province || (idx === 0 ? 'DKI Jakarta' : idx === 1 ? 'Jawa Timur' : 'Sumatera Utara'),
  postal_code: w.postal_code || (idx === 0 ? '13930' : idx === 1 ? '60293' : '20241'),
  is_active: w.is_active !== undefined ? w.is_active : true,
}));

function getStoredWarehouses() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore
  }
  return defaultWarehouses;
}

function setStoredWarehouses(warehouses) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(warehouses));
  } catch {
    // ignore
  }
}

export const warehouseService = {
  /**
   * Fetch warehouses with search, filters, pagination, and sorting.
   */
  async fetchWarehouses(params = {}) {
    try {
      const urlParams = new URLSearchParams();
      const search = params.search || params.searchQuery;
      if (search) urlParams.append('search', search);

      const code = params.code || params.codeSearchQuery;
      if (code) urlParams.append('code', code);

      const city = params.city || params.citySearchQuery;
      if (city) urlParams.append('city', city);

      const status = params.status || params.statusFilter;
      if (status && status !== 'all') {
        urlParams.append('is_active', status === 'active' ? '1' : '0');
      }

      const type = params.type || params.typeFilter;
      if (type && type !== 'all') {
        urlParams.append('is_primary', type === 'primary' ? '1' : '0');
      }

      const sortBy = params.sort_by || params.sortBy;
      if (sortBy) urlParams.append('sort_by', sortBy);

      const sortDir = params.sort_dir || params.sortDirection || params.order;
      if (sortDir) urlParams.append('sort_dir', sortDir);

      if (params.all && !params.page && !params.limit && !params.per_page) {
        urlParams.append('all', '1');
      } else {
        const page = params.page || 1;
        const perPage = params.per_page || params.limit || 10;
        urlParams.append('page', page);
        urlParams.append('per_page', perPage);
      }

      const queryString = urlParams.toString();
      const res = await apiClient.get(queryString ? `/api/warehouses?${queryString}` : '/api/warehouses');
      const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);

      if (list.length > 0) {
        setStoredWarehouses(list);
      }

      return {
        data: list,
        total: res.total !== undefined ? res.total : (res.meta?.total !== undefined ? res.meta.total : list.length),
        meta: res.meta || {
          current_page: res.current_page || params.page || 1,
          last_page: res.last_page || 1,
          per_page: res.per_page || params.limit || 10,
          total: res.total !== undefined ? res.total : list.length
        }
      };
    } catch (err) {
      console.warn('warehouseService.fetchWarehouses: fallback to local data.', err.message);
      let list = getStoredWarehouses();

      const search = params.search || params.searchQuery;
      if (search && search.trim()) {
        const q = search.toLowerCase();
        list = list.filter(w =>
          (w.name && w.name.toLowerCase().includes(q)) ||
          (w.code && w.code.toLowerCase().includes(q)) ||
          (w.city && w.city.toLowerCase().includes(q)) ||
          (w.province && w.province.toLowerCase().includes(q)) ||
          (w.address && w.address.toLowerCase().includes(q))
        );
      }

      const code = params.code || params.codeSearchQuery;
      if (code && code.trim()) {
        const cq = code.toLowerCase();
        list = list.filter(w => w.code && w.code.toLowerCase().includes(cq));
      }

      const city = params.city || params.citySearchQuery;
      if (city && city.trim()) {
        const ctq = city.toLowerCase();
        list = list.filter(w => w.city && w.city.toLowerCase().includes(ctq));
      }

      const status = params.status || params.statusFilter;
      if (status && status !== 'all') {
        const isActive = status === 'active';
        list = list.filter(w => Boolean(w.is_active) === isActive);
      }

      const type = params.type || params.typeFilter;
      if (type && type !== 'all') {
        const isPrimary = type === 'primary';
        list = list.filter(w => Boolean(w.is_primary) === isPrimary);
      }

      const page = params.page || 1;
      const perPage = params.limit || params.per_page || 10;
      const start = (page - 1) * perPage;
      const paginatedList = params.all ? list : list.slice(start, start + perPage);

      return {
        data: paginatedList,
        total: list.length,
        meta: {
          current_page: page,
          last_page: Math.ceil(list.length / perPage) || 1,
          per_page: perPage,
          total: list.length
        }
      };
    }
  },

  /**
   * Get warehouse by ID.
   */
  async getWarehouseById(id) {
    try {
      const res = await apiClient.get(`/api/warehouses/${id}`);
      if (res?.data) return res.data;
    } catch {
      // ignore
    }
    const list = getStoredWarehouses();
    return list.find(w => String(w.id) === String(id) || w.code === id) || null;
  },

  /**
   * Create new warehouse.
   */
  async createWarehouse(payload) {
    const list = getStoredWarehouses();
    let code = payload.code ? payload.code.trim().toUpperCase() : '';
    if (!code) {
      const nextNum = list.length + 1;
      code = `WH-${String(nextNum).padStart(3, '0')}`;
      let counter = 1;
      while (list.some(w => w.code === code)) {
        counter++;
        code = `WH-${String(nextNum + counter).padStart(3, '0')}`;
      }
    }

    const newWarehouse = {
      id: Date.now(),
      code,
      name: payload.name.trim(),
      address: payload.address.trim(),
      city: payload.city.trim(),
      province: payload.province.trim(),
      postal_code: payload.postal_code?.trim() || null,
      is_primary: Boolean(payload.is_primary),
      is_active: payload.is_active !== undefined ? Boolean(payload.is_active) : true,
      created_at: new Date().toISOString()
    };

    try {
      const res = await apiClient.post('/api/warehouses', newWarehouse);
      if (res?.data) {
        const saved = res.data;
        let updated = [saved, ...list];
        if (saved.is_primary) {
          updated = updated.map(w => w.id === saved.id ? w : { ...w, is_primary: false });
        }
        setStoredWarehouses(updated);
        return saved;
      }
    } catch {
      // Fallback local save
    }

    let updated = [newWarehouse, ...list];
    if (newWarehouse.is_primary) {
      updated = updated.map(w => w.id === newWarehouse.id ? w : { ...w, is_primary: false });
    }
    setStoredWarehouses(updated);
    return newWarehouse;
  },

  /**
   * Update existing warehouse.
   */
  async updateWarehouse(id, payload) {
    try {
      const res = await apiClient.put(`/api/warehouses/${id}`, payload);
      if (res?.data) {
        const saved = res.data;
        const list = getStoredWarehouses();
        let updated = list.map(w => String(w.id) === String(id) ? saved : w);
        if (saved.is_primary) {
          updated = updated.map(w => String(w.id) === String(id) ? w : { ...w, is_primary: false });
        }
        setStoredWarehouses(updated);
        return saved;
      }
    } catch {
      // ignore
    }

    const list = getStoredWarehouses();
    let updated = list.map(w => {
      if (String(w.id) === String(id)) {
        return { ...w, ...payload };
      }
      return w;
    });
    if (payload.is_primary) {
      updated = updated.map(w => String(w.id) === String(id) ? w : { ...w, is_primary: false });
    }
    setStoredWarehouses(updated);
    return updated.find(w => String(w.id) === String(id));
  },

  /**
   * Toggle active status.
   */
  async toggleStatus(id) {
    try {
      const res = await apiClient.post(`/api/warehouses/${id}/toggle-status`);
      if (res?.data) {
        const updatedWarehouse = res.data;
        const list = getStoredWarehouses();
        const updated = list.map(w => String(w.id) === String(id) ? updatedWarehouse : w);
        setStoredWarehouses(updated);
        return updatedWarehouse;
      }
    } catch {
      // ignore
    }

    const list = getStoredWarehouses();
    let target = null;
    const updated = list.map(w => {
      if (String(w.id) === String(id)) {
        target = { ...w, is_active: !w.is_active };
        return target;
      }
      return w;
    });
    setStoredWarehouses(updated);
    return target;
  },

  /**
   * Delete warehouse.
   */
  async deleteWarehouse(id) {
    try {
      await apiClient.delete(`/api/warehouses/${id}`);
    } catch (err) {
      // If error from backend, rethrow message
      if (err.response?.data?.message) {
        throw new Error(err.response.data.message);
      }
    }

    const list = getStoredWarehouses();
    const updated = list.filter(w => String(w.id) !== String(id));
    setStoredWarehouses(updated);
    return true;
  }
};
