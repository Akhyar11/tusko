/**
 * Service: Vendor / Supplier Master Data Service
 * Manages vendor CRUD operations with server-side API integration and persistent localStorage caching.
 */
import { apiClient } from './apiClient';

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
  return [];
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
  async fetchVendors(params = {}) {
    try {
      const urlParams = new URLSearchParams();
      const search = params.search || params.searchQuery || params.codeSearchQuery;
      if (search) urlParams.append('search', search);

      const status = params.status || params.statusFilter;
      if (status && status !== 'all') urlParams.append('is_active', status === 'active' ? '1' : '0');

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
      const res = await apiClient.get(queryString ? `/api/vendors?${queryString}` : '/api/vendors');
      const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      
      if (list.length > 0) {
        setStoredVendors(list);
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
      // Fallback to local storage
      console.warn('vendorService.fetchVendors: fallback to local/mock data.', err.message);
      let list = getStoredVendors();
      const search = params.search || params.searchQuery;
      if (search && search.trim()) {
        const q = search.toLowerCase();
        list = list.filter(v => 
          (v.company_name && v.company_name.toLowerCase().includes(q)) ||
          (v.code && v.code.toLowerCase().includes(q)) ||
          (v.contact_person && v.contact_person.toLowerCase().includes(q)) ||
          (v.email && v.email.toLowerCase().includes(q)) ||
          (v.phone && v.phone.includes(q))
        );
      }

      const status = params.status || params.statusFilter;
      if (status && status !== 'all') {
        const isActive = status === 'active';
        list = list.filter(v => Boolean(v.is_active) === isActive);
      }

      const category = params.category || params.categoryFilter;
      if (category && category !== 'all') {
        list = list.filter(v => Array.isArray(v.categories) && v.categories.includes(category));
      }

      return {
        data: list,
        total: list.length,
        meta: { current_page: 1, last_page: 1, per_page: list.length, total: list.length }
      };
    }
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
    const body = {
      company_name: payload.company_name?.trim(),
      contact_person: payload.contact_person?.trim(),
      phone: payload.phone?.trim(),
      address: payload.address?.trim() || '',
      email: payload.email?.trim() || null,
      bank_account_info: payload.bank_account_info?.trim() || null,
      payment_terms_days: Number(payload.payment_terms_days) || 30,
      is_active: payload.is_active !== undefined ? payload.is_active : true
    };
    if (payload.code?.trim()) {
      body.code = payload.code.trim().toUpperCase();
    }

    const res = await apiClient.post('/api/vendors', body);
    const saved = res.data || res;

    const list = getStoredVendors();
    const updated = [saved, ...list.filter(v => v.id !== saved.id)];
    setStoredVendors(updated);
    return saved;
  },

  /**
   * Update existing vendor.
   */
  async updateVendor(id, payload) {
    const body = {
      company_name: payload.company_name?.trim(),
      contact_person: payload.contact_person?.trim(),
      phone: payload.phone?.trim(),
      address: payload.address?.trim() || '',
      email: payload.email?.trim() || null,
      bank_account_info: payload.bank_account_info?.trim() || null,
      payment_terms_days: Number(payload.payment_terms_days) || 30,
      is_active: payload.is_active !== undefined ? payload.is_active : true
    };
    if (payload.code?.trim()) {
      body.code = payload.code.trim().toUpperCase();
    }

    const res = await apiClient.put(`/api/vendors/${id}`, body);
    const saved = res.data || res;

    const list = getStoredVendors();
    const updated = list.map(v => (String(v.id) === String(id) ? { ...v, ...saved } : v));
    setStoredVendors(updated);
    return saved;
  },

  /**
   * Toggle active/inactive status.
   */
  async toggleStatus(id) {
    const res = await apiClient.post(`/api/vendors/${id}/toggle-status`);
    const saved = res.data || res;

    const list = getStoredVendors();
    const updated = list.map(v => {
      if (String(v.id) === String(id)) {
        return { ...v, is_active: !v.is_active };
      }
      return v;
    });

    setStoredVendors(updated);
    return saved;
  },

  /**
   * Delete vendor.
   */
  async deleteVendor(id) {
    await apiClient.delete(`/api/vendors/${id}`);

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
