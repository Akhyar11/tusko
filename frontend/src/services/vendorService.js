/**
 * Service: Vendor / Supplier Master Data Service
 * Manages vendor CRUD operations with server-side API integration and persistent localStorage caching.
 */
import { apiClient } from './apiClient';
import { initialVendors } from '../data/mockProcurementData';

const STORAGE_KEY = 'tusko_vendors';

function getStoredVendors() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore
  }
  return initialVendors;
}

function setStoredVendors(vendors) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(vendors));
  } catch {
    // ignore
  }
}

export const vendorService = {
  /**
   * Fetch all vendors with optional search, category, and status filtering.
   */
  async fetchVendors({ search = '', status = 'all', category = 'all', page = 1, perPage = 20 } = {}) {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (status !== 'all') params.append('is_active', status === 'active' ? '1' : '0');
      params.append('all', '1');

      const res = await apiClient.get(`/api/vendors?${params.toString()}`);
      const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      
      if (list.length > 0) {
        setStoredVendors(list);
        return { data: list, total: list.length };
      }
    } catch (err) {
      // Fallback to local storage
    }

    let list = getStoredVendors();

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(v => 
        (v.company_name && v.company_name.toLowerCase().includes(q)) ||
        (v.code && v.code.toLowerCase().includes(q)) ||
        (v.contact_person && v.contact_person.toLowerCase().includes(q)) ||
        (v.email && v.email.toLowerCase().includes(q)) ||
        (v.phone && v.phone.includes(q))
      );
    }

    if (status !== 'all') {
      const isActive = status === 'active';
      list = list.filter(v => Boolean(v.is_active) === isActive);
    }

    if (category !== 'all') {
      list = list.filter(v => Array.isArray(v.categories) && v.categories.includes(category));
    }

    return {
      data: list,
      total: list.length
    };
  },

  /**
   * Get single vendor by ID.
   */
  async getVendorById(id) {
    try {
      const res = await apiClient.get(`/api/vendors/${id}`);
      if (res?.data) return res.data;
    } catch {
      // ignore
    }
    const list = getStoredVendors();
    return list.find(v => String(v.id) === String(id)) || null;
  },

  /**
   * Create a new vendor.
   */
  async createVendor(payload) {
    const list = getStoredVendors();
    let code = payload.code ? payload.code.trim().toUpperCase() : '';
    if (!code) {
      const nextNum = list.length + 1;
      code = `VND-${String(nextNum).padStart(3, '0')}`;
      let counter = 1;
      while (list.some(v => v.code === code)) {
        counter++;
        code = `VND-${String(nextNum + counter).padStart(3, '0')}`;
      }
    }

    const newVendor = {
      id: Date.now(),
      code,
      company_name: payload.company_name.trim(),
      contact_person: payload.contact_person.trim(),
      email: payload.email?.trim() || '',
      phone: payload.phone.trim(),
      address: payload.address?.trim() || '',
      payment_terms_days: Number(payload.payment_terms_days) || 30,
      bank_account_info: payload.bank_account_info?.trim() || '',
      categories: Array.isArray(payload.categories) ? payload.categories : (payload.categories ? [payload.categories] : ['Apparel']),
      is_active: payload.is_active !== undefined ? payload.is_active : true,
      rating: 5.0,
      created_at: new Date().toISOString()
    };

    try {
      const res = await apiClient.post('/api/vendors', newVendor);
      if (res?.data) {
        const saved = res.data;
        const updated = [saved, ...list];
        setStoredVendors(updated);
        return saved;
      }
    } catch {
      // Save locally
    }

    const updated = [newVendor, ...list];
    setStoredVendors(updated);
    return newVendor;
  },

  /**
   * Update existing vendor.
   */
  async updateVendor(id, payload) {
    try {
      await apiClient.put(`/api/vendors/${id}`, payload);
    } catch {
      // ignore
    }

    const list = getStoredVendors();
    const updated = list.map(v => {
      if (String(v.id) === String(id)) {
        return { ...v, ...payload };
      }
      return v;
    });

    setStoredVendors(updated);
    return updated.find(v => String(v.id) === String(id));
  },

  /**
   * Toggle active/inactive status.
   */
  async toggleStatus(id) {
    try {
      await apiClient.post(`/api/vendors/${id}/toggle-status`);
    } catch {
      // ignore
    }

    const list = getStoredVendors();
    const updated = list.map(v => {
      if (String(v.id) === String(id)) {
        return { ...v, is_active: !v.is_active };
      }
      return v;
    });

    setStoredVendors(updated);
    return updated.find(v => String(v.id) === String(id));
  },

  /**
   * Delete vendor.
   */
  async deleteVendor(id) {
    try {
      await apiClient.delete(`/api/vendors/${id}`);
    } catch {
      // ignore
    }

    const list = getStoredVendors();
    const filtered = list.filter(v => String(v.id) !== String(id));
    setStoredVendors(filtered);
    return true;
  },

  /**
   * Load options for ServerSideSelect with search and pagination support.
   * @param {string} searchQuery
   * @param {number} pageNum
   * @returns {Promise<{ options: Array, hasMore: boolean }>}
   */
  async loadOptions(searchQuery = '', pageNum = 1) {
    const { data } = await this.fetchVendors({
      search: searchQuery,
      status: 'active'
    });

    const pageSize = 15;
    const startIndex = (pageNum - 1) * pageSize;
    const sliced = data.slice(startIndex, startIndex + pageSize);
    const hasMore = startIndex + pageSize < data.length;

    return {
      options: sliced.map(v => ({
        value: v.id,
        label: v.code ? `[${v.code}] ${v.company_name}` : v.company_name,
        code: v.code,
        company_name: v.company_name,
        payment_terms_days: v.payment_terms_days
      })),
      hasMore
    };
  }
};
